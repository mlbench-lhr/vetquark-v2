import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

export async function POST(req: NextRequest) {
  try {
    const { email, reset_token, new_password } = await req.json();

    if (!email || !new_password || !reset_token) {
      return NextResponse.json({ error: "Email, reset token, and new password are required" }, { status: 400 });
    }

    await connectMongo();

    const normalizedEmail = String(email).toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail }).lean();
    if (!admin) {
      return NextResponse.json({ error: "Invalid reset request" }, { status: 400 });
    }

    if (!(admin as any).resetTokenHash || !(admin as any).resetTokenExpiresAt) {
      return NextResponse.json({ error: "Invalid reset request" }, { status: 400 });
    }

    const now = Date.now();
    const expiresAt = new Date((admin as any).resetTokenExpiresAt).getTime();
    if (expiresAt && now > expiresAt) {
      return NextResponse.json({ error: "Reset token expired" }, { status: 410 });
    }

    const providedHash = crypto.createHash("sha256").update(String(reset_token)).digest("hex");
    if (providedHash !== String((admin as any).resetTokenHash)) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(String(new_password), 10);

    await Admin.updateOne(
      { _id: (admin as any)._id },
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
    );

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
