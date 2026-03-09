import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Reading from "@/lib/models/Reading";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";
import { isPushEnabledForUser } from "@/lib/utils";

function visibleKeysForProductCode(productCode?: string | null): string[] | null {
  const code = (productCode || "").trim() || "VETQ_MASTER_360";
  if (code === "VETQ_MASTER_360") return null;
  if (code === "VETQ_U_START") return ["leukocytes", "nitrite", "blood", "ph", "specific-gravity"];
  if (code === "VETQ_METABOLIC_CHECK") return ["glucose", "ketone-bodies", "ph", "specific-gravity"];
  if (code === "VETQ_RENAL_EXPRESS") return ["glucose", "ketone-bodies", "protein", "microalbumin", "ph", "specific-gravity"];
  if (code === "VETQ_RENAL_ADVANCED") {
    return ["glucose", "ketone-bodies", "protein", "microalbumin", "creatine", "calcium", "magnesium", "ph", "specific-gravity"];
  }
  if (code === "VETQ_HEPATOSCREEN") return ["bilirubin", "urobilinogen", "ph", "specific-gravity"];
  if (code === "VETQ_GERIATRIC_CARE") {
    return [
      "glucose",
      "ketone-bodies",
      "protein",
      "microalbumin",
      "creatine",
      "calcium",
      "magnesium",
      "bilirubin",
      "urobilinogen",
      "leukocytes",
      "nitrite",
      "blood",
      "ph",
      "specific-gravity",
    ];
  }
  return null;
}

function visibleKeysForAccess(productCode?: string | null, unlockedProductCodes?: unknown): string[] | null {
  const unlocked = Array.isArray(unlockedProductCodes)
    ? unlockedProductCodes.map((c) => String(c || "").trim()).filter(Boolean)
    : [];
  const codes = [(productCode || "").trim() || "VETQ_MASTER_360", ...unlocked];
  for (const c of codes) {
    if (visibleKeysForProductCode(c) === null) return null;
  }
  const set = new Set<string>();
  for (const c of codes) {
    const keys = visibleKeysForProductCode(c);
    if (Array.isArray(keys)) keys.forEach((k) => set.add(k));
  }
  return [...set];
}

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

    if (user.role === "Guardian" && (doc as any).isDraft === true) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const paymentStatus = typeof (doc as any).paymentStatus === "string" ? String((doc as any).paymentStatus) : "";
    const paymentLinkId = (doc as any).paymentLink ? String((doc as any).paymentLink) : "";
    const patientId = String((doc as any).patient?._id ?? (doc as any).patient ?? "");

    if (user.role === "Guardian" && (paymentStatus === "pending" || paymentStatus === "expired")) {
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

        const vetUser = await User.findById(vetId).select("_id role notificationSettings").lean();
        const canNotifyVet = isPushEnabledForUser(vetUser, "reading_viewed");
        const notification = canNotifyVet
          ? await Notification.create({
              user: vetId,
              type: "reading_viewed",
              title,
              message,
              url,
              readAt: null,
            })
          : null;

        if (notification) {
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
    }

    const reading = {
      id: String((doc as any)._id),
      testType: (doc as any).testType ?? "urine",
      productCode: (doc as any).productCode ?? "VETQ_MASTER_360",
      panelVersion: (doc as any).panelVersion ?? 1,
      unlockedProductCodes: Array.isArray((doc as any).unlockedProductCodes) ? (doc as any).unlockedProductCodes : [],
      isDraft: typeof (doc as any).isDraft === "boolean" ? (doc as any).isDraft : !(doc as any).signedAt,
      wizardStep:
        (doc as any).wizardStep === "identification" ||
        (doc as any).wizardStep === "timer" ||
        (doc as any).wizardStep === "review" ||
        (doc as any).wizardStep === "report"
          ? (doc as any).wizardStep
          : "identification",
      signedAt: (doc as any).signedAt ?? null,
      createdAt: (doc as any).createdAt ?? null,
      signatureImageUrl: (doc as any).signatureImageUrl ?? null,
      paymentStatus: paymentStatus || null,
      paymentLinkId,
      identification: (doc as any).identification ?? null,
      timer: (doc as any).timer ?? null,
      results: (() => {
        const all = Array.isArray((doc as any).results) ? (doc as any).results : [];
        const keys = visibleKeysForAccess((doc as any).productCode, (doc as any).unlockedProductCodes);
        return keys ? all.filter((r: any) => keys.includes(String(r?.key || ""))) : all;
      })(),
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
