import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findById(userId).select("_id passwordHash").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, String((user as any).passwordHash || ""));
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { passwordHash });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

