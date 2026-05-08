import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, purpose } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }
    if (typeof otp !== "string" || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
    }

    await connectMongo();

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (purpose === "reset") {
      if (!user.resetOtp) {
        return NextResponse.json({ error: "No OTP to verify" }, { status: 400 });
      }

      const now = Date.now();
      const expiresAt = user.resetOtpExpiresAt ? new Date(user.resetOtpExpiresAt).getTime() : 0;
      if (expiresAt && now > expiresAt) {
        return NextResponse.json({ error: "OTP expired" }, { status: 410 });
      }

      if (user.resetOtp !== String(otp)) {
        const attempts = (user.resetOtpAttempts || 0) + 1;
        await User.updateOne({ _id: user._id }, { $set: { resetOtpAttempts: attempts } });
        return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      const resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetTokenHash,
            resetTokenExpiresAt,
            passwordResetRequestedAt: new Date(),
          },
        }
      );

      return NextResponse.json({ message: "OTP verified", reset_token: resetToken }, { status: 200 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 409 });
    }
    if (!user.verificationOtp) {
      return NextResponse.json({ error: "No OTP to verify" }, { status: 400 });
    }

    const now = Date.now();
    const expiresAt = user.verificationOtpExpiresAt ? new Date(user.verificationOtpExpiresAt).getTime() : 0;
    if (expiresAt && now > expiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 410 });
    }

    if (user.verificationOtp !== otp) {
      const attempts = (user.verificationOtpAttempts || 0) + 1;
      await User.updateOne({ email: normalizedEmail }, { $set: { verificationOtpAttempts: attempts } });
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
    }

    await User.updateOne(
      { email: normalizedEmail },
      {
        $set: { emailVerified: true, emailVerifiedAt: new Date() },
        $unset: {
          verificationOtp: "",
          verificationOtpExpiresAt: "",
          verificationOtpAttempts: "",
          verificationOtpLastSentAt: "",
        },
      }
    );

    return NextResponse.json({ message: "Email verified" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}