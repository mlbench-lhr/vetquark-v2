import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendTwoFactorEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: "Two-factor authentication not enabled" }, { status: 400 });
    }

    const now = Date.now();
    const last = user.twoFactorOtpLastSentAt ? new Date(user.twoFactorOtpLastSentAt).getTime() : 0;
    const cooldownMs = 35 * 1000;

    if (now - last < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - last)) / 1000);
      return NextResponse.json({ error: `Please wait ${remaining}s before resending` }, { status: 429 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(now + 10 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          twoFactorOtp: otp,
          twoFactorOtpExpiresAt: expiresAt,
          twoFactorOtpLastSentAt: new Date(),
          twoFactorOtpAttempts: 0,
        },
      }
    );

    const userLang = user.preferredLanguage === "pt" ? "pt" : "en";
    try {
      await sendTwoFactorEmail(String(user.email), otp, userLang);
    } catch {
      return NextResponse.json({ message: "OTP generated, email send failed" }, { status: 202 });
    }

    return NextResponse.json({ message: "OTP resent" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
