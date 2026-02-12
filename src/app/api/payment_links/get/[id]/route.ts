import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentLink from "@/lib/models/PaymentLink";
import Reading from "@/lib/models/Reading";
import Patient from "@/lib/models/Patient";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";
import { isPushEnabledForUser } from "@/lib/utils";
import WalletTransaction from "@/lib/models/WalletTransaction";
import PlatformSettings from "@/lib/models/PlatformSettings";

function formatBRL(amount: number) {
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(ctx.params);
    const id = String(resolvedParams?.id || "").trim();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findById(userId).select("_id role").lean();
    if (!user || (user.role !== "Guardian" && user.role !== "Veterinarian")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter = user.role === "Guardian" ? { _id: id, guardian: userId } : { _id: id, veterinarian: userId };
    const link: any = await PaymentLink.findOne(filter)
      .populate("patient", "animalName photo")
      .populate("veterinarian", "fullName tradeName crmv crmvState profileImageUrl")
      .lean();

    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const createdAt = link.createdAt ? new Date(link.createdAt as any) : null;
    const expiresAt = link.expiresAt ? new Date(link.expiresAt as any) : null;
    const fallbackExpired = !expiresAt && createdAt ? now.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000 : false;
    const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : fallbackExpired;

    if (link.status === "pending" && isExpired) {
      await PaymentLink.updateOne({ _id: link._id, status: "pending" }, { $set: { status: "expired", expiresAt: expiresAt ?? createdAt } });
      link.status = "expired";
    }

    const readingId = link.reading ? String(link.reading) : "";
    if (readingId && mongoose.Types.ObjectId.isValid(readingId)) {
      await Reading.updateOne(
        { _id: readingId },
        { $set: { paymentStatus: link.status, paymentLink: link._id } },
      );
    }

    return NextResponse.json(
      {
        item: {
          id: String(link._id),
          amount: link.amount,
          amountLabel: formatBRL(link.amount),
          platformFee: Number.isFinite(Number((link as any).platformFee)) ? Number((link as any).platformFee) : null,
          amountNet: Number.isFinite(Number((link as any).amountNet)) ? Number((link as any).amountNet) : Math.max(0, Number(link.amount || 0) - Number((link as any).platformFee || 33.0)),
          status: link.status,
          createdAt: link.createdAt ? new Date(link.createdAt as any).toISOString() : null,
          patient: {
            id: String((link as any).patient?._id || link.patient),
            name: String((link as any).patient?.animalName || ""),
            photo: (link as any).patient?.photo ?? null,
          },
          veterinarian: {
            id: String((link as any).veterinarian?._id || link.veterinarian),
            name: String((link as any).veterinarian?.tradeName || (link as any).veterinarian?.fullName || ""),
            crmv: (link as any).veterinarian?.crmv ?? null,
            crmvState: (link as any).veterinarian?.crmvState ?? null,
            profileImageUrl: link?.veterinarian?.profileImageUrl
          },
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(ctx.params);
    const id = String(resolvedParams?.id || "").trim();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role !== "Guardian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const link: any = await PaymentLink.findOne({ _id: id, guardian: userId }).select("_id status reading expiresAt createdAt veterinarian patient").lean();
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const wasPaid = link.status === "paid";
    if (!wasPaid) {
      await PaymentLink.updateOne({ _id: id, guardian: userId }, { $set: { status: "paid" } });
    }

    const readingId = link.reading ? String(link.reading) : "";
    if (readingId && mongoose.Types.ObjectId.isValid(readingId)) {
      await Reading.updateOne(
        { _id: readingId },
        { $set: { paymentStatus: "paid", paymentLink: link._id } },
      );
    }

    if (!wasPaid) {
      const veterinarianId = String(link.veterinarian || "").trim();
      const patientId = String(link.patient || "").trim();

      if (mongoose.Types.ObjectId.isValid(veterinarianId) && mongoose.Types.ObjectId.isValid(patientId)) {
        const patient = await Patient.findById(patientId).select("_id animalName").lean();
        const petName = String((patient as any)?.animalName || "a patient");

        const guardianTitle = "Payment completed";
        const guardianMessage = `Payment completed for ${petName}. Your veterinarian will finalize the reading soon.`;
        const guardianUrl = `/Guardian/payment/${encodeURIComponent(id)}`;

        const guardianUser = await User.findById(userId).select("_id role notificationSettings").lean();
        const canNotifyGuardian = isPushEnabledForUser(guardianUser, "payment_received");
        const guardianNotification = canNotifyGuardian
          ? await Notification.create({
            user: userId,
            type: "payment_received",
            title: guardianTitle,
            message: guardianMessage,
            url: guardianUrl,
            readAt: null,
          })
          : null;

        if (guardianNotification) {
          const pusher = getPusherServer();
          await pusher.trigger(notificationsChannelForUser(userId), "notification:new", {
            id: String(guardianNotification._id),
            type: guardianNotification.type,
            title: guardianNotification.title,
            message: guardianNotification.message,
            url: guardianNotification.url,
            createdAt: guardianNotification.createdAt ? new Date(guardianNotification.createdAt).toISOString() : new Date().toISOString(),
          });
        }

        const title = "Payment received";
        const message = `Payment completed for ${petName}. You can now complete the reading.`;
        const url = `/Veterinarian/new-reading?patientId=${encodeURIComponent(patientId)}&paymentLinkId=${encodeURIComponent(id)}&step=timer`;

        const vetUser = await User.findById(veterinarianId).select("_id role notificationSettings").lean();
        const canNotifyVet = isPushEnabledForUser(vetUser, "payment_received");
        const notification = canNotifyVet
          ? await Notification.create({
            user: veterinarianId,
            type: "payment_received",
            title,
            message,
            url,
            readAt: null,
          })
          : null;

        if (notification) {
          const pusher = getPusherServer();
          await pusher.trigger(notificationsChannelForUser(veterinarianId), "notification:new", {
            id: String(notification._id),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            url: notification.url,
            createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
          });
        }

        const settingsDoc = await PlatformSettings.findOne({}).lean();
        const feeFromLink = Number.isFinite(Number((link as any).platformFee)) ? Number((link as any).platformFee) : null;
        const PLATFORM_FEE =
          feeFromLink ??
          (settingsDoc && Number.isFinite(Number((settingsDoc as any).platformFeeBRL))
            ? Number((settingsDoc as any).platformFeeBRL)
            : 33.0);
        const gross = typeof (link as any).amount === "number" && Number.isFinite((link as any).amount) ? Number((link as any).amount) : 0;
        const net = Math.max(0, gross - PLATFORM_FEE);
        const releaseAt = (() => {
          const addBusinessDays = (start: Date, days: number) => {
            const d = new Date(start);
            let added = 0;
            while (added < days) {
              d.setDate(d.getDate() + 1);
              const day = d.getDay();
              if (day !== 0 && day !== 6) added++;
            }
            return d;
          };
          return addBusinessDays(new Date(), 2);
        })();

        const existingTx = await WalletTransaction.findOne({ paymentLink: link._id, type: "credit" })
          .select("_id")
          .lean();
        if (!existingTx) {
          await WalletTransaction.create({
            user: veterinarianId,
            type: "credit",
            amountGross: gross,
            platformFee: PLATFORM_FEE,
            amountNet: net,
            currency: (link as any).currency || "BRL",
            status: "scheduled",
            paymentLink: link._id,
            patient: link.patient,
            guardian: link.guardian,
            releaseAt,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, status: "paid" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
