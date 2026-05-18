import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ readingId: string }> }) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { readingId } = await params;
    if (!readingId || !mongoose.Types.ObjectId.isValid(readingId)) {
      return NextResponse.json({ error: "Invalid reading ID" }, { status: 400 });
    }

    await connectMongo();

    const capturedImages = await ReadingCapturedImage.findOne({
      reading: readingId,
      veterinarian: veterinarianId,
    }).lean();

    if (!capturedImages) {
      return NextResponse.json({ images: [] });
    }

    return NextResponse.json({
      images: (capturedImages.images || []).map((img: any) => ({
        cloudinaryUrl: String(img.cloudinaryUrl || ""),
        captureSecond: Number(img.captureSecond ?? 0),
        capturedAt: img.capturedAt ? new Date(img.capturedAt).toISOString() : null,
      })),
    });
  } catch (err) {
    console.error("get_reading_images error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
