import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Reading from "@/lib/models/Reading";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";

function getUserIdFromRequest(req: NextRequest): { userId: string | null; error: NextResponse | null } {
  const headerId = req.headers.get("x-user-id");
  if (headerId?.trim()) return { userId: headerId.trim(), error: null };

  const token = req.cookies.get("session_id")?.value || req.cookies.get("auth_token")?.value;
  if (!token) return { userId: null, error: null };

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }),
    };
  }

  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object" && "sub" in decoded) {
      const sub = (decoded as { sub?: unknown }).sub;
      if (typeof sub === "string" && sub.trim()) return { userId: sub.trim(), error: null };
    }
    return { userId: null, error: null };
  } catch {
    return { userId: null, error: null };
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { userId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(ctx.params);
    const readingId = String(resolvedParams?.id || "").trim();
    if (!readingId || !mongoose.Types.ObjectId.isValid(readingId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findById(userId).select("_id role").lean();
    if (!user || (user.role !== "Veterinarian" && user.role !== "Guardian")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter =
      user.role === "Veterinarian"
        ? { _id: readingId, veterinarian: userId }
        : { _id: readingId, guardian: userId };

    const doc = await Reading.findOne(filter)
      .populate("patient", "animalName photo")
      .populate("guardian", "fullName")
      .populate("veterinarian", "fullName crmv crmvState tradeName clinicLogoUrl reportHeaderAddress reportFooter")
      .lean();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const paymentStatus = typeof (doc as any).paymentStatus === "string" ? String((doc as any).paymentStatus) : "";
    const paymentLinkId = (doc as any).paymentLink ? String((doc as any).paymentLink) : "";
    const patientId = String((doc as any).patient?._id ?? (doc as any).patient ?? "");

    if (paymentStatus === "pending") {
      return NextResponse.json(
        { error: "Payment required", paymentStatus, paymentLinkId, patientId },
        { status: 402 },
      );
    }

    if (user.role === "Guardian" && !(doc as any).viewedAt && (doc as any).veterinarian) {
      await Reading.updateOne({ _id: doc._id }, { $set: { viewedAt: new Date() } });

      const vetId = String((doc as any).veterinarian._id || (doc as any).veterinarian);
      if (mongoose.Types.ObjectId.isValid(vetId)) {
        const patientName = (doc as any).patient?.animalName || "a patient";
        const title = "Reading viewed";
        const message = `Guardian viewed the reading for ${patientName}.`;
        const url = `/Veterinarian/history/detail/${encodeURIComponent(String(doc._id))}`;

        const notification = await Notification.create({
          user: vetId,
          type: "reading_viewed",
          title,
          message,
          url,
          readAt: null,
        });

        const pusher = getPusherServer();
        await pusher.trigger(notificationsChannelForUser(vetId), "notification:new", {
          id: String(notification._id),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          url: notification.url,
          createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
        });
      }
    }

    const reading = {
      id: String((doc as any)._id),
      testType: (doc as any).testType ?? "urine",
      signedAt: (doc as any).signedAt ?? null,
      createdAt: (doc as any).createdAt ?? null,
      paymentStatus: paymentStatus || null,
      paymentLinkId,
      identification: (doc as any).identification ?? null,
      timer: (doc as any).timer ?? null,
      results: Array.isArray((doc as any).results) ? (doc as any).results : [],
      report: (doc as any).report ?? null,
      patient: {
        id: patientId,
        name: (doc as any).patient?.animalName ?? "N/A",
        photo: (doc as any).patient?.photo ?? null,
      },
      guardian: {
        id: String((doc as any).guardian?._id ?? ""),
        fullName: (doc as any).guardian?.fullName ?? "N/A",
      },
      veterinarian: {
        id: String((doc as any).veterinarian?._id ?? ""),
        fullName: (doc as any).veterinarian?.fullName ?? "N/A",
        crmv: (doc as any).veterinarian?.crmv ?? null,
        crmvState: (doc as any).veterinarian?.crmvState ?? null,
        tradeName: (doc as any).veterinarian?.tradeName ?? null,
        clinicLogoUrl: (doc as any).veterinarian?.clinicLogoUrl ?? null,
        reportHeaderAddress: (doc as any).veterinarian?.reportHeaderAddress ?? null,
        reportFooter: (doc as any).veterinarian?.reportFooter ?? null,
      },
    };

    return NextResponse.json({ reading }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
