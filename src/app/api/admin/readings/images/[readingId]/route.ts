import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import ReadingCapturedImage from "@/lib/models/ReadingCapturedImage";
import Reading from "@/lib/models/Reading";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const authSecret = process.env.AUTH_SECRET;
  if (!token) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!authSecret) {
    return { ok: false as const, res: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }) };
  }

  let adminId: string | null = null;
  let role: string | null = null;
  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object") {
      adminId = typeof (decoded as any).sub === "string" ? String((decoded as any).sub) : null;
      role = typeof (decoded as any).role === "string" ? String((decoded as any).role) : null;
    }
  } catch {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!adminId || role !== "Admin" || !mongoose.Types.ObjectId.isValid(adminId)) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  await connectMongo();
  const admin = await Admin.findById(adminId).select("_id").lean();
  if (!admin) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true as const, adminId };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ readingId: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { readingId } = await params;
    if (!readingId || !mongoose.Types.ObjectId.isValid(readingId)) {
      return NextResponse.json({ error: "Invalid reading ID" }, { status: 400 });
    }

    await connectMongo();
    
    const capturedImages = await ReadingCapturedImage.findOne({ reading: readingId })
      .populate('reading', 'id')
      .lean();

    if (!capturedImages) {
      return NextResponse.json({ images: [] });
    }

    return NextResponse.json({ 
      images: capturedImages.images || [],
      readingId: capturedImages.reading
    });

  } catch (error) {
    console.error("Error fetching reading images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
