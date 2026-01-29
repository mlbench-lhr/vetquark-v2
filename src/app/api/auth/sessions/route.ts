import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import UserSession from "@/lib/models/UserSession";

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

export async function GET(req: NextRequest) {
  try {
    const { userId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    const user = await User.findById(userId).select("_id role").lean();
    if (!user || (user.role !== "Guardian" && user.role !== "Veterinarian")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ua = String(req.headers.get("user-agent") || "");
    const lower = ua.toLowerCase();
    const currentType: "ios" | "android" = lower.includes("android") ? "android" : "ios";
    const currentModel = currentType === "android" ? "Android" : (lower.includes("ipad") ? "iPad" : "iPhone");

    const docs = await UserSession.find({ user: userId, revokedAt: null }).sort({ createdAt: -1 }).limit(50).lean();
    const items = docs.map((s: any) => ({
      id: String(s._id),
      model: String(s.deviceModel),
      type: s.deviceType === "android" ? "android" : "ios",
      isCurrent: s.deviceType === currentType && String(s.deviceModel) === currentModel,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
