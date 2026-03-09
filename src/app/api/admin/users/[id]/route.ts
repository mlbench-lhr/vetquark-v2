import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import User from "@/lib/models/User";
import UserSession from "@/lib/models/UserSession";
import Patient from "@/lib/models/Patient";
import Reading from "@/lib/models/Reading";
import PaymentLink from "@/lib/models/PaymentLink";
import WalletTransaction from "@/lib/models/WalletTransaction";
import Notification from "@/lib/models/Notification";

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

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const params = await ctx.params;
    const userId = String(params?.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const newPassword =
      typeof (body as any)?.newPassword === "string"
        ? String((body as any).newPassword)
        : typeof (body as any)?.new_password === "string"
          ? String((body as any).new_password)
          : "";

    if (!newPassword.trim()) {
      return NextResponse.json({ error: "newPassword is required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const user = await User.findById(userId).select("_id").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await Promise.all([
      User.updateOne(
        { _id: userId },
        {
          $set: { passwordHash, passwordResetCompletedAt: new Date() },
          $unset: {
            resetOtp: "",
            resetOtpExpiresAt: "",
            resetOtpAttempts: "",
            resetOtpLastSentAt: "",
            resetTokenHash: "",
            resetTokenExpiresAt: "",
            passwordResetRequestedAt: "",
          },
        }
      ),
      UserSession.deleteMany({ user: new mongoose.Types.ObjectId(userId) }),
    ]);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const params = await ctx.params;
    const userId = String(params?.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const user = await User.findById(userId).select("_id role email fullName").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const uid = new mongoose.Types.ObjectId(userId);

    await Promise.all([
      UserSession.deleteMany({ user: uid }),
      Notification.deleteMany({ user: uid }),
      Reading.deleteMany({ $or: [{ veterinarian: uid }, { guardian: uid }] }),
      PaymentLink.deleteMany({ $or: [{ veterinarian: uid }, { guardian: uid }] }),
      WalletTransaction.deleteMany({ $or: [{ user: uid }, { guardian: uid }] }),
      Patient.deleteMany({ $or: [{ veterinarian: uid }, { guardian: uid }] }),
    ]);

    try {
      const storeOrders = mongoose.connection.collection("store_orders");
      const storeAddresses = mongoose.connection.collection("store_addresses");
      await Promise.all([
        storeOrders.deleteMany({ veterinarian: uid }),
        storeAddresses.deleteMany({ veterinarian: uid }),
      ]);
    } catch {
    }

    await User.deleteOne({ _id: uid });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
