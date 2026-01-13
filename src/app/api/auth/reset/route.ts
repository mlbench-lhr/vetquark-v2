import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, reset_token, new_password } = await req.json();

    if (!email || !new_password || (!otp && !reset_token)) {
      return NextResponse.json(
        { error: "Email, new password, and reset token are required" },
        { status: 400 }
      );
    }

    await connectMongo();

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid reset request" }, { status: 400 });
    }

    if (reset_token) {
      if (!user.resetTokenHash || !user.resetTokenExpiresAt) {
        return NextResponse.json({ error: "Invalid reset request" }, { status: 400 });
      }

      const now = Date.now();
      const expiresAt = new Date(user.resetTokenExpiresAt).getTime();
      if (expiresAt && now > expiresAt) {
        return NextResponse.json({ error: "Reset token expired" }, { status: 410 });
      }

      const providedHash = crypto.createHash("sha256").update(String(reset_token)).digest("hex");
      if (providedHash !== user.resetTokenHash) {
        return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
      }
    } else {
      if (!user.resetOtp) {
        return NextResponse.json({ error: "Invalid reset request" }, { status: 400 });
      }

      const now = Date.now();
      const expiresAt = user.resetOtpExpiresAt ? new Date(user.resetOtpExpiresAt).getTime() : 0;
      if (expiresAt && now > expiresAt) {
        return NextResponse.json({ error: "Reset code expired" }, { status: 410 });
      }

      if (user.resetOtp !== String(otp)) {
        const attempts = (user.resetOtpAttempts || 0) + 1;
        await User.updateOne({ _id: user._id }, { $set: { resetOtpAttempts: attempts } });
        return NextResponse.json({ error: "Incorrect reset code" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          passwordResetCompletedAt: new Date(),
        },
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