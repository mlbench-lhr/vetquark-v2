import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import Reading, { CollectionMethod, ReadingResultStatus } from "@/lib/models/Reading";
import PaymentLink from "@/lib/models/PaymentLink";
import Notification from "@/lib/models/Notification";
import ReadingCapturedImage from "@/lib/models/ReadingCapturedImage";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";
import { isPushEnabledForUser } from "@/lib/utils";

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

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return isValidDate(d) ? d : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function isCollectionMethod(value: unknown): value is CollectionMethod {
  return value === "free_catch" || value === "cystocentesis" || value === "catheter";
}

function isResultStatus(value: unknown): value is ReadingResultStatus {
  return value === "Normal" || value === "Abnormal";
}

function isAllowedCloudinaryUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return url.hostname.endsWith("res.cloudinary.com");
  } catch {
    return false;
  }
}

type CapturedImageInput = {
  atSeconds: number;
  dataUrl: string;
  capturedAt: Date | null;
};

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  assetId: string;
  version: number | null;
};

function normalizeCapturedImages(value: unknown): { images: CapturedImageInput[]; error: string | null } {
  if (value == null) return { images: [], error: null };
  if (!Array.isArray(value)) return { images: [], error: "capturedImages must be an array" };
  if (value.length === 0) return { images: [], error: null };
  if (value.length !== 4) return { images: [], error: "capturedImages must contain exactly 4 images" };

  const parsed: CapturedImageInput[] = [];
  for (const item of value) {
    const atSeconds = toFiniteNumber((item as any)?.atSeconds);
    const dataUrl = String((item as any)?.dataUrl || "").trim();
    const capturedAtRaw = String((item as any)?.capturedAt || "").trim();
    const capturedAt = capturedAtRaw ? toDate(capturedAtRaw) : null;

    if (atSeconds === null || atSeconds < 0) {
      return { images: [], error: "capturedImages.atSeconds must be a non-negative number" };
    }
    if (!dataUrl || !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(dataUrl)) {
      return { images: [], error: "capturedImages.dataUrl must be a valid image data URL" };
    }
    if (dataUrl.length > 7_000_000) {
      return { images: [], error: "capturedImages item is too large" };
    }
    if (capturedAtRaw && !capturedAt) {
      return { images: [], error: "capturedImages.capturedAt must be a valid date" };
    }

    parsed.push({ atSeconds, dataUrl, capturedAt });
  }

  const secondsSet = new Set(parsed.map((p) => p.atSeconds));
  if (secondsSet.size !== parsed.length) {
    return { images: [], error: "capturedImages contains duplicate atSeconds values" };
  }

  parsed.sort((a, b) => a.atSeconds - b.atSeconds);
  return { images: parsed, error: null };
}

function buildCloudinarySignature(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

async function uploadCapturedImageToCloudinary(args: {
  imageDataUrl: string;
  folder: string;
  publicId: string;
}): Promise<CloudinaryUploadResult> {
  const cloudName = String(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = buildCloudinarySignature(
    {
      folder: args.folder,
      public_id: args.publicId,
      timestamp,
    },
    apiSecret
  );

  const form = new FormData();
  form.append("file", args.imageDataUrl);
  form.append("folder", args.folder);
  form.append("public_id", args.publicId);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  const uploadJson = await uploadRes.json().catch(() => null);
  if (!uploadRes.ok) {
    const msg = typeof uploadJson?.error?.message === "string" ? uploadJson.error.message : "Cloudinary upload failed";
    throw new Error(msg);
  }

  const secureUrl = String(uploadJson?.secure_url || uploadJson?.url || "").trim();
  if (!secureUrl) {
    throw new Error("Cloudinary did not return secure URL");
  }

  return {
    secureUrl,
    publicId: String(uploadJson?.public_id || "").trim(),
    assetId: String(uploadJson?.asset_id || "").trim(),
    version: Number.isFinite(Number(uploadJson?.version)) ? Number(uploadJson?.version) : null,
  };
}

async function persistCapturedImages(args: {
  readingId: string;
  veterinarianId: string;
  guardianId: string;
  patientId: string;
  paymentLinkId: string | null;
  results: Array<{ key: string; valueLabel: string; status: ReadingResultStatus; numericValue?: number }>;
  capturedImages: CapturedImageInput[];
}) {
  if (!args.capturedImages.length) return;

  const folder = `reading_captures/${args.readingId}`;
  const uploaded = await Promise.all(
    args.capturedImages.map(async (img, idx) => {
      const publicId = `sec_${String(img.atSeconds)}_${Date.now()}_${idx + 1}`;
      const cloud = await uploadCapturedImageToCloudinary({
        imageDataUrl: img.dataUrl,
        folder,
        publicId,
      });
      return { img, cloud };
    })
  );

  const imagesData = uploaded.map(({ img, cloud }) => ({
    cloudinaryUrl: cloud.secureUrl,
    captureSecond: img.atSeconds,
    capturedAt: img.capturedAt,
  }));

  await ReadingCapturedImage.deleteMany({ reading: args.readingId });
  await ReadingCapturedImage.create({
    patient: args.patientId,
    guardian: args.guardianId,
    veterinarian: args.veterinarianId,
    reading: args.readingId,
    images: imagesData,
  });
}

const REQUIRED_RESULT_KEYS = [
  "leukocytes",
  "nitrite",
  "urobilinogen",
  "protein",
  "ph",
  "blood",
  "specific-gravity",
  "ascorbic-acid",
  "ketone-bodies",
  "bilirubin",
  "glucose",
  "microalbumin",
  "creatine",
  "calcium",
  "magnesium",
  "ammonium-chloride",
] as const;

export async function POST(req: NextRequest) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const patientId = String((body as any).patientId || "").trim();
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }

    const paymentLinkIdRaw = String((body as any).paymentLinkId || "").trim();
    const paymentLinkId = paymentLinkIdRaw ? paymentLinkIdRaw : null;
    if (paymentLinkId && !mongoose.Types.ObjectId.isValid(paymentLinkId)) {
      return NextResponse.json({ error: "Invalid paymentLinkId" }, { status: 400 });
    }

    const draftIdRaw = String((body as any).draftId || "").trim();
    const draftId = draftIdRaw ? draftIdRaw : null;
    if (draftId && !mongoose.Types.ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: "Invalid draftId" }, { status: 400 });
    }

    const identification = (body as any).identification || {};
    const collectionMethod = identification.collectionMethod;
    const stripLot = String(identification.stripLot || "").trim();
    const collectionAt = toDate(identification.collectionAt);
    const stripExpiryRaw = typeof identification.stripExpiry === "string" ? identification.stripExpiry.trim() : "";
    const stripExpiry = stripExpiryRaw ? toDate(stripExpiryRaw) : null;

    if (!isCollectionMethod(collectionMethod)) {
      return NextResponse.json({ error: "Invalid collectionMethod" }, { status: 400 });
    }
    if (!collectionAt) {
      return NextResponse.json({ error: "Invalid collectionAt" }, { status: 400 });
    }
    if (stripExpiryRaw && !stripExpiry) {
      return NextResponse.json({ error: "Invalid stripExpiry" }, { status: 400 });
    }
    if (stripExpiry) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const expiryStr = stripExpiry.toISOString().slice(0, 10);
      if (expiryStr < todayStr) {
        return NextResponse.json({ error: "Strip expiry must be today or a future date" }, { status: 400 });
      }
    }

    const timer = (body as any).timer || {};
    const selectedSeconds = toFiniteNumber(timer.selectedSeconds);
    const analyzedAt = toDate(timer.analyzedAt) ?? new Date();
    const analysis = timer.analysis || {};
    const analysisSummary = String(analysis.summary || "").trim();
    const analysisConfidence = toFiniteNumber(analysis.confidence);
    const analysisFlags = Array.isArray(analysis.flags) ? analysis.flags.map((x: any) => String(x || "").trim()).filter(Boolean) : [];

    if (!selectedSeconds || selectedSeconds <= 0) {
      return NextResponse.json({ error: "Invalid timer.selectedSeconds" }, { status: 400 });
    }
    if (!isValidDate(analyzedAt)) {
      return NextResponse.json({ error: "Invalid timer.analyzedAt" }, { status: 400 });
    }
    if (!analysisSummary) {
      return NextResponse.json({ error: "timer.analysis.summary is required" }, { status: 400 });
    }
    if (analysisConfidence === null || analysisConfidence < 0 || analysisConfidence > 1) {
      return NextResponse.json({ error: "timer.analysis.confidence must be between 0 and 1" }, { status: 400 });
    }

    const resultsRaw = (body as any).results;
    if (!Array.isArray(resultsRaw)) {
      return NextResponse.json({ error: "results must be an array" }, { status: 400 });
    }

    const results = resultsRaw.map((r: any) => {
      const key = String(r?.key || "").trim();
      const label = String(r?.label || "").trim();
      const unit = String(r?.unit || "").trim();
      const status = r?.status;
      const selectedIndex = toFiniteNumber(r?.selectedIndex);
      const valueLabel = String(r?.valueLabel || "").trim();
      const numericValue = r?.numericValue === undefined ? undefined : toFiniteNumber(r?.numericValue);

      return { key, label, unit, status, selectedIndex, valueLabel, numericValue };
    });

    for (const r of results) {
      if (!r.key || !r.label || !r.valueLabel) {
        return NextResponse.json({ error: "Invalid results item" }, { status: 400 });
      }
      if (!isResultStatus(r.status)) {
        return NextResponse.json({ error: "Invalid results status" }, { status: 400 });
      }
      if (r.selectedIndex === null || r.selectedIndex < 0) {
        return NextResponse.json({ error: "Invalid results selectedIndex" }, { status: 400 });
      }
      if (r.numericValue === null) {
        return NextResponse.json({ error: "Invalid results numericValue" }, { status: 400 });
      }
    }

    const keys = results.map((r) => r.key);
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      return NextResponse.json({ error: "Duplicate results key" }, { status: 400 });
    }
    const allowed = new Set<string>(REQUIRED_RESULT_KEYS);
    const extras = keys.filter((k) => !allowed.has(k));
    if (extras.length) {
      return NextResponse.json({ error: "Unexpected results key" }, { status: 400 });
    }
    const missing = REQUIRED_RESULT_KEYS.filter((k) => !uniqueKeys.has(k));
    if (missing.length) {
      return NextResponse.json({ error: "Missing results key" }, { status: 400 });
    }

    const report = (body as any).report || {};
    const summaryAndInterpretation = String(report.summaryAndInterpretation || "");
    const otherInformation = String(report.otherInformation || "");
    const veterinarianNotes = String(report.veterinarianNotes || "");

    const signatureImageUrl = String((body as any).signatureImageUrl || "").trim();
    if (!signatureImageUrl || !isAllowedCloudinaryUrl(signatureImageUrl)) {
      return NextResponse.json({ error: "Invalid signatureImageUrl" }, { status: 400 });
    }
    const normalizedCapturedImages = normalizeCapturedImages((body as any).capturedImages);
    if (normalizedCapturedImages.error) {
      return NextResponse.json({ error: normalizedCapturedImages.error }, { status: 400 });
    }
    const capturedImages = normalizedCapturedImages.images;

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role fullName tradeName").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patient = await Patient.findOne({ _id: patientId, veterinarian: veterinarianId }).select("_id guardian animalName").lean();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    const guardianId = String((patient as any).guardian || "").trim();
    const maybePersistCapturedImages = async (readingId: string) => {
      if (!capturedImages.length) return;
      try {
        await persistCapturedImages({
          readingId,
          veterinarianId,
          guardianId,
          patientId,
          paymentLinkId,
          results: results.map((r) => ({
            key: r.key,
            valueLabel: r.valueLabel,
            status: r.status as ReadingResultStatus,
            numericValue: typeof r.numericValue === "number" ? r.numericValue : undefined,
          })),
          capturedImages,
        });
      } catch (imageErr) {
        console.error("Failed to persist captured reading images", imageErr);
      }
    };

    let paymentStatus: "pending" | "paid" | "expired" | null = null;
    let paymentLinkReadingId: string | null = null;
    let linkProductCode: string | null = null;
    let linkPanelVersion: number | null = null;
    if (paymentLinkId) {
      const link = await PaymentLink.findOne({ _id: paymentLinkId, veterinarian: veterinarianId, patient: patientId })
        .select("_id status reading expiresAt createdAt productCode panelVersion")
        .lean();
      if (!link) {
        return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
      }
      linkProductCode = typeof (link as any).productCode === "string" ? String((link as any).productCode || "").trim() : null;
      linkPanelVersion = Number.isFinite(Number((link as any).panelVersion)) ? Number((link as any).panelVersion) : null;
      const now = new Date();
      const createdAt = (link as any).createdAt ? new Date((link as any).createdAt) : null;
      const expiresAt = (link as any).expiresAt ? new Date((link as any).expiresAt) : null;
      const fallbackExpired = !expiresAt && createdAt ? now.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000 : false;
      const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : fallbackExpired;
      if ((link as any).status === "pending" && isExpired) {
        await PaymentLink.updateOne({ _id: paymentLinkId, status: "pending" }, { $set: { status: "expired", expiresAt: expiresAt ?? createdAt } });
        paymentStatus = "expired";
      } else {
        paymentStatus = (link as any).status === "paid" ? "paid" : "pending";
      }
      paymentLinkReadingId = (link as any).reading ? String((link as any).reading) : null;

      if (paymentLinkReadingId && mongoose.Types.ObjectId.isValid(paymentLinkReadingId)) {
        const existingReading = await Reading.findOne({ _id: paymentLinkReadingId, veterinarian: veterinarianId })
          .select("_id signedAt")
          .lean();
        if (existingReading?.signedAt) {
          return NextResponse.json({ error: "Payment link already used" }, { status: 409 });
        }
      }
    }

    if (paymentLinkId && paymentLinkReadingId && mongoose.Types.ObjectId.isValid(paymentLinkReadingId)) {
      const updatedReading = await Reading.findOneAndUpdate(
        { _id: paymentLinkReadingId, veterinarian: veterinarianId, $or: [{ signedAt: { $exists: false } }, { signedAt: null }] },
        {
          $set: {
            guardian: (patient as any).guardian,
            patient: patientId,
            paymentLink: paymentLinkId,
            paymentStatus,
            productCode: linkProductCode || "VETQ_MASTER_360",
            panelVersion: linkPanelVersion || 1,
            isDraft: false,
            wizardStep: "report",
            identification: {
              collectionMethod,
              collectionAt,
              stripLot,
              stripExpiry,
            },
            timer: {
              selectedSeconds,
              analyzedAt,
              analysis: {
                summary: analysisSummary,
                confidence: analysisConfidence,
                flags: analysisFlags,
              },
            },
            results,
            report: {
              summaryAndInterpretation,
              otherInformation,
              veterinarianNotes,
            },
            signatureImageUrl,
            signedAt: new Date(),
          },
        },
        { new: true }
      ).lean();

      if (updatedReading?._id) {
        await maybePersistCapturedImages(String(updatedReading._id));
        await PaymentLink.updateOne(
          { _id: paymentLinkId, veterinarian: veterinarianId, patient: patientId, $or: [{ reading: null }, { reading: updatedReading._id }] },
          { $set: { reading: updatedReading._id } },
        );
        if (paymentStatus === "paid") {
          const guardianId = String((patient as any).guardian || "");
          const petName = String((patient as any).animalName || "your pet");
          const vetName = String((veterinarian as any).tradeName || (veterinarian as any).fullName || "Veterinarian");
          const title = "New reading available";
          const message = `${vetName} added a new reading for ${petName}.`;
          const url = `/Guardian/history/detail/${encodeURIComponent(String(updatedReading._id))}`;

          const guardianUser = await User.findById(guardianId).select("_id role notificationSettings").lean();
          const canNotifyGuardian = isPushEnabledForUser(guardianUser, "reading_signed");
          const notification = canNotifyGuardian
            ? await Notification.create({
                user: guardianId,
                type: "reading_signed",
                title,
                message,
                url,
                readAt: null,
              })
            : null;

          if (notification) {
            const pusher = getPusherServer();
            await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
              id: String(notification._id),
              type: notification.type,
              title: notification.title,
              message: notification.message,
              url: notification.url,
              createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
            });
          }
        }

        return NextResponse.json({ id: String(updatedReading._id) }, { status: 201 });
      }
    }

    if (draftId) {
      if (paymentLinkId && paymentLinkReadingId && mongoose.Types.ObjectId.isValid(paymentLinkReadingId) && paymentLinkReadingId !== draftId) {
        return NextResponse.json({ error: "draftId does not match payment link reading" }, { status: 409 });
      }

      const updatedReading = await Reading.findOneAndUpdate(
        { _id: draftId, veterinarian: veterinarianId, $or: [{ signedAt: { $exists: false } }, { signedAt: null }] },
        {
          $set: {
            guardian: (patient as any).guardian,
            patient: patientId,
            paymentLink: paymentLinkId,
            paymentStatus,
            productCode: linkProductCode || "VETQ_MASTER_360",
            panelVersion: linkPanelVersion || 1,
            isDraft: false,
            wizardStep: "report",
            identification: {
              collectionMethod,
              collectionAt,
              stripLot,
              stripExpiry,
            },
            timer: {
              selectedSeconds,
              analyzedAt,
              analysis: {
                summary: analysisSummary,
                confidence: analysisConfidence,
                flags: analysisFlags,
              },
            },
            results,
            report: {
              summaryAndInterpretation,
              otherInformation,
              veterinarianNotes,
            },
            signatureImageUrl,
            signedAt: new Date(),
          },
        },
        { new: true }
      ).lean();

      if (!updatedReading?._id) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      }
      await maybePersistCapturedImages(String(updatedReading._id));

      if (paymentLinkId) {
        await PaymentLink.updateOne(
          { _id: paymentLinkId, veterinarian: veterinarianId, patient: patientId, $or: [{ reading: null }, { reading: updatedReading._id }] },
          { $set: { reading: updatedReading._id } },
        );
      }

      if (paymentStatus === "paid") {
        const guardianId = String((patient as any).guardian || "");
        const petName = String((patient as any).animalName || "your pet");
        const vetName = String((veterinarian as any).tradeName || (veterinarian as any).fullName || "Veterinarian");
        const title = "New reading available";
        const message = `${vetName} added a new reading for ${petName}.`;
        const url = `/Guardian/history/detail/${encodeURIComponent(String(updatedReading._id))}`;

        const guardianUser = await User.findById(guardianId).select("_id role notificationSettings").lean();
        const canNotifyGuardian = isPushEnabledForUser(guardianUser, "reading_signed");
        const notification = canNotifyGuardian
          ? await Notification.create({
              user: guardianId,
              type: "reading_signed",
              title,
              message,
              url,
              readAt: null,
            })
          : null;

        if (notification) {
          const pusher = getPusherServer();
          await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
            id: String(notification._id),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            url: notification.url,
            createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
          });
        }
      }

      return NextResponse.json({ id: String(updatedReading._id) }, { status: 201 });
    }

    const readingId = new mongoose.Types.ObjectId();
    const created = await Reading.create({
      _id: readingId,
      veterinarian: veterinarianId,
      guardian: (patient as any).guardian,
      patient: patientId,
      paymentLink: paymentLinkId,
      paymentStatus,
      testType: "urine",
      productCode: linkProductCode || "VETQ_MASTER_360",
      panelVersion: linkPanelVersion || 1,
      isDraft: false,
      wizardStep: "report",
      identification: {
        collectionMethod,
        collectionAt,
        stripLot,
        stripExpiry,
      },
      timer: {
        selectedSeconds,
        analyzedAt,
        analysis: {
          summary: analysisSummary,
          confidence: analysisConfidence,
          flags: analysisFlags,
        },
      },
      results,
      report: {
        summaryAndInterpretation,
        otherInformation,
        veterinarianNotes,
      },
      signatureImageUrl,
      signedAt: new Date(),
    });

    if (paymentLinkId) {
      const updated = await PaymentLink.updateOne(
        { _id: paymentLinkId, veterinarian: veterinarianId, patient: patientId, reading: null },
        { $set: { reading: created._id } },
      );
      if (!updated.modifiedCount) {
        await Reading.deleteOne({ _id: created._id });
        return NextResponse.json({ error: "Payment link already used" }, { status: 409 });
      }
    }
    await maybePersistCapturedImages(String(created._id));

    {
      if (paymentStatus === "paid") {
        const guardianId = String((patient as any).guardian || "");
        const petName = String((patient as any).animalName || "your pet");
        const vetName = String((veterinarian as any).tradeName || (veterinarian as any).fullName || "Veterinarian");
        const title = "New reading available";
        const message = `${vetName} added a new reading for ${petName}.`;
        const url = `/Guardian/history/detail/${encodeURIComponent(String(created._id))}`;

        const guardianUser = await User.findById(guardianId).select("_id role notificationSettings").lean();
        const canNotifyGuardian = isPushEnabledForUser(guardianUser, "reading_signed");
        const notification = canNotifyGuardian
          ? await Notification.create({
              user: guardianId,
              type: "reading_signed",
              title,
              message,
              url,
              readAt: null,
            })
          : null;

        if (notification) {
          const pusher = getPusherServer();
          await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
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

    return NextResponse.json({ id: String(created._id) }, { status: 201 });
  } catch (err){
    console.log("err------", err);
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
