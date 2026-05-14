import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Reading from "@/lib/models/Reading";
import ReadingCapturedImage from "@/lib/models/ReadingCapturedImage";

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

type CapturedImageInput = {
  atSeconds: number;
  dataUrl: string;
  capturedAt: Date | null;
};

function normalizeDraftCapturedImages(value: unknown): { images: CapturedImageInput[]; error: string | null } {
  if (value == null || !Array.isArray(value)) return { images: [], error: "capturedImages must be a non-empty array" };
  if (value.length === 0) return { images: [], error: "capturedImages must contain at least 1 image" };
  if (value.length > 4) return { images: [], error: "capturedImages cannot contain more than 4 images" };

  const parsed: CapturedImageInput[] = [];
  for (const item of value) {
    const atSecondsRaw = (item as any)?.atSeconds;
    const atSeconds = typeof atSecondsRaw === "number" && Number.isFinite(atSecondsRaw) ? atSecondsRaw : NaN;
    const dataUrl = String((item as any)?.dataUrl || "").trim();
    const capturedAtRaw = String((item as any)?.capturedAt || "").trim();
    const capturedAt = capturedAtRaw ? (() => { const d = new Date(capturedAtRaw); return Number.isNaN(d.getTime()) ? null : d; })() : null;

    if (Number.isNaN(atSeconds) || atSeconds < 0) {
      return { images: [], error: "capturedImages.atSeconds must be a non-negative number" };
    }
    if (!dataUrl || !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(dataUrl)) {
      return { images: [], error: "capturedImages.dataUrl must be a valid image data URL" };
    }
    if (dataUrl.length > 7_000_000) {
      return { images: [], error: "capturedImages item is too large" };
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

async function uploadImageToCloudinary(args: {
  imageDataUrl: string;
  folder: string;
  publicId: string;
}): Promise<{ secureUrl: string }> {
  const cloudName = String(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = buildCloudinarySignature(
    { folder: args.folder, public_id: args.publicId, timestamp },
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
  if (!secureUrl) throw new Error("Cloudinary did not return secure URL");
  return { secureUrl };
}

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

    const draftId = String((body as any).draftId || "").trim();
    if (!draftId || !mongoose.Types.ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: "Invalid draftId" }, { status: 400 });
    }

    const normalized = normalizeDraftCapturedImages((body as any).capturedImages);
    if (normalized.error) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }
    const capturedImages = normalized.images;

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reading = await Reading.findOne({
      _id: draftId,
      veterinarian: veterinarianId,
      $or: [{ signedAt: { $exists: false } }, { signedAt: null }],
    })
      .select("_id patient guardian veterinarian")
      .lean();

    if (!reading) {
      return NextResponse.json({ error: "Draft reading not found" }, { status: 404 });
    }

    const patientId = String((reading as any).patient || "");
    const guardianId = String((reading as any).guardian || "");

    const folder = `reading_captures/${draftId}`;
    const uploaded = await Promise.all(
      capturedImages.map(async (img, idx) => {
        const publicId = `sec_${String(img.atSeconds)}_${Date.now()}_${idx + 1}`;
        const { secureUrl } = await uploadImageToCloudinary({
          imageDataUrl: img.dataUrl,
          folder,
          publicId,
        });
        return { img, secureUrl };
      })
    );

    const imagesData = uploaded.map(({ img, secureUrl }) => ({
      cloudinaryUrl: secureUrl,
      captureSecond: img.atSeconds,
      capturedAt: img.capturedAt,
    }));

    await ReadingCapturedImage.deleteMany({ reading: draftId });
    await ReadingCapturedImage.create({
      patient: patientId,
      guardian: guardianId,
      veterinarian: veterinarianId,
      reading: draftId,
      images: imagesData,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("save_draft_images error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
