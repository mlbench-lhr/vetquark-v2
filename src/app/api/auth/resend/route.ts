import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 409 });
    }

    const now = Date.now();
    const last = user.verificationOtpLastSentAt ? new Date(user.verificationOtpLastSentAt).getTime() : 0;
    const cooldownMs = 35 * 1000;

    if (now - last < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - last)) / 1000);
      return NextResponse.json({ error: `Please wait ${remaining}s before resending` }, { status: 429 });
    }

    const otp = String(Math.floor(10000 + Math.random() * 90000)); // 5-digit OTP
    const expiresAt = new Date(now + 10 * 60 * 1000);

    await User.updateOne(
      { email },
      {
        $set: {
          verificationOtp: otp,
          verificationOtpExpiresAt: expiresAt,
          verificationOtpLastSentAt: new Date(),
          verificationOtpAttempts: 0,
          emailVerified: false,
        },
      }
    );

    const userLang = user.preferredLanguage === "pt" ? "pt" : "en";
    try {
      await sendVerificationEmail(email, otp, userLang);
    } catch (e) {
      return NextResponse.json({ message: "OTP generated, email send failed" }, { status: 202 });
    }

    return NextResponse.json({ message: "OTP resent" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}