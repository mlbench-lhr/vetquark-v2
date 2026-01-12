import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, new_password } = await req.json();

    if (!email || !otp || !new_password) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    await connectMongo();

    const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (!user || !user.resetOtp) {
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
        },
      }
    );

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}