import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    const authSecret = process.env.AUTH_SECRET;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!authSecret) return NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 });

    let adminId: string | null = null;
    let role: string | null = null;
    try {
      const decoded = jwt.verify(token, authSecret);
      if (decoded && typeof decoded === "object") {
        adminId = typeof (decoded as any).sub === "string" ? String((decoded as any).sub) : null;
        role = typeof (decoded as any).role === "string" ? String((decoded as any).role) : null;
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminId || role !== "Admin" || !mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword =
      typeof (body as any)?.currentPassword === "string"
        ? String((body as any).currentPassword)
        : typeof (body as any)?.oldPassword === "string"
          ? String((body as any).oldPassword)
          : typeof (body as any)?.old_password === "string"
            ? String((body as any).old_password)
            : "";

    const newPassword =
      typeof (body as any)?.newPassword === "string"
        ? String((body as any).newPassword)
        : typeof (body as any)?.new_password === "string"
          ? String((body as any).new_password)
          : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "currentPassword and newPassword are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    await connectMongo();
    const admin = await Admin.findById(adminId).select("_id passwordHash").lean();
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, String((admin as any).passwordHash || ""));
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await Admin.updateOne({ _id: adminId }, { $set: { passwordHash } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
