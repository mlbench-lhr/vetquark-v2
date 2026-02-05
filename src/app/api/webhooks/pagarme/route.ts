import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import pagarme from "pagarme";
import crypto from "crypto";
import connectMongo from "@/lib/mongodb";
import PaymentLink from "@/lib/models/PaymentLink";
import Reading from "@/lib/models/Reading";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";
import { isPushEnabledForUser } from "@/lib/utils";
import WalletTransaction from "@/lib/models/WalletTransaction";

export async function POST(req: NextRequest) {
  try {
    const apiKey = String(process.env.PAGARME_SECRET_KEY || "").trim();
    if (!apiKey) return NextResponse.json({ error: "Missing PAGARME_SECRET_KEY" }, { status: 500 });

    const rawBody = await req.text();
    console.log("WebhookPagarme init", JSON.stringify({ rawLen: rawBody?.length || 0 }));
    const candidates = [
      req.headers.get("x-hub-signature"),
      req.headers.get("x-hook-signature"),
      req.headers.get("x-pagarme-signature"),
      req.headers.get("x-pagarme-signature-1"),
      req.headers.get("x-postback-signature"),
      req.headers.get("x-signature"),
    ].filter(Boolean) as string[];
    const signature = String(candidates[0] || "").trim();
    let valid = false;
    if (signature) {
      try {
        valid = pagarme.postback.verifySignature(apiKey, rawBody, signature);
      } catch {
        valid = false;
      }
      if (!valid) {
        const lower = signature.toLowerCase();
        const algo = lower.startsWith("sha256=") ? "sha256" : "sha1";
        const hex = lower.includes("=") ? lower.split("=")[1] : lower;
        const expected = crypto.createHmac(algo, apiKey).update(rawBody, "utf8").digest("hex");
        const a = Buffer.from(expected, "hex");
        const b = Buffer.from(hex, "hex");
        valid = a.length === b.length && crypto.timingSafeEqual(a, b);
      }
    }
    if (!valid) {
      console.error("WebhookPagarme invalid signature", JSON.stringify({ signaturePresent: !!signature }));
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log("WebhookPagarme payload parsed");

    await connectMongo();

    const txObj = payload?.transaction || payload?.order || payload;
    const orderObj = payload?.order || (Array.isArray(payload?.charges) ? payload : null);
    const firstCharge = Array.isArray(orderObj?.charges) ? orderObj.charges[0] : null;
    const txId = String(
      txObj?.id ||
      payload?.id ||
      orderObj?.id ||
      payload?.data?.id ||
      ""
    ).trim();
    const statusRaw = String(
      txObj?.status ||
      payload?.current_status ||
      payload?.data?.status ||
      orderObj?.status ||
      firstCharge?.status ||
      ""
    )
      .trim()
      .toLowerCase();
    const metaObj = txObj?.metadata || payload?.metadata || payload?.data?.metadata || firstCharge?.metadata || {};
    const linkIdRaw = String(metaObj?.paymentLinkId || "").trim();
    console.log("WebhookPagarme tx", JSON.stringify({ txId, statusRaw, hasLinkId: !!linkIdRaw }));

    let link: any = null;
    if (linkIdRaw && mongoose.Types.ObjectId.isValid(linkIdRaw)) {
      link = await PaymentLink.findById(linkIdRaw).select("_id status veterinarian patient guardian amount currency reading").lean();
    }
    if (!link && txId) {
      link = await PaymentLink.findOne({ provider: "pagarme", providerTransactionId: txId })
        .select("_id status veterinarian patient guardian amount currency reading")
        .lean();
    }
    if (!link) {
      console.log("WebhookPagarme no link matched", JSON.stringify({ txId, linkIdRaw }));
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const wasPaid = String(link.status) === "paid";
    const shouldMarkPaid = statusRaw === "paid" || statusRaw === "authorized" || statusRaw === "captured";
    const shouldMarkExpired = statusRaw === "refused" || statusRaw === "failed" || statusRaw === "chargedback";

    if (!wasPaid && shouldMarkPaid) {
      await PaymentLink.updateOne({ _id: link._id }, { $set: { status: "paid" } });
    } else if (!wasPaid && shouldMarkExpired) {
      await PaymentLink.updateOne({ _id: link._id, status: "pending" }, { $set: { status: "expired" } });
    }

    const readingId = link.reading ? String(link.reading) : "";
    if (readingId && mongoose.Types.ObjectId.isValid(readingId)) {
      await Reading.updateOne(
        { _id: readingId },
        { $set: { paymentStatus: shouldMarkExpired ? "expired" : shouldMarkPaid ? "paid" : String(link.status), paymentLink: link._id } },
      );
      console.log("WebhookPagarme reading updated", JSON.stringify({ readingId, status: shouldMarkExpired ? "expired" : shouldMarkPaid ? "paid" : String(link.status) }));
    }

    if (!wasPaid && shouldMarkPaid) {
      const veterinarianId = String(link.veterinarian || "").trim();
      const patientId = String(link.patient || "").trim();
      const guardianId = String(link.guardian || "").trim();

      if (mongoose.Types.ObjectId.isValid(veterinarianId) && mongoose.Types.ObjectId.isValid(patientId)) {
        const patient = await Patient.findById(patientId).select("_id animalName").lean();
        const petName = String((patient as any)?.animalName || "a patient");

        const guardianTitle = "Payment completed";
        const guardianMessage = `Payment completed for ${petName}. Your veterinarian will finalize the reading soon.`;
        const guardianUrl = `/Guardian/payment/${encodeURIComponent(String(link._id))}`;

        const guardianUser = await User.findById(guardianId).select("_id role notificationSettings").lean();
        const canNotifyGuardian = isPushEnabledForUser(guardianUser, "payment_received");
        const guardianNotification = canNotifyGuardian
          ? await Notification.create({
            user: guardianId,
            type: "payment_received",
            title: guardianTitle,
            message: guardianMessage,
            url: guardianUrl,
            readAt: null,
          })
          : null;

        if (guardianNotification) {
          const pusher = getPusherServer();
          await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
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
        const url = `/Veterinarian/new-reading?patientId=${encodeURIComponent(patientId)}&paymentLinkId=${encodeURIComponent(String(link._id))}&step=timer`;

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

        const PLATFORM_FEE = 33.0;
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

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("WebhookPagarme fatal", e);
    return NextResponse.json({ error: "Internal server error", reason: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
