import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (!user) {
      // Do not leak existence of emails; respond as if OK
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    const otp = String(Math.floor(10000 + Math.random() * 90000)); // 5-digit
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetOtp: otp,
          resetOtpExpiresAt: expiresAt,
          resetOtpAttempts: 0,
          resetOtpLastSentAt: new Date(),
        },
      }
    );

    try {
      await sendResetEmail(user.email, otp);
    } catch {
      return NextResponse.json(
        { message: "Reset code generated, but email sending failed" },
        { status: 202 }
      );
    }

    return NextResponse.json({ message: "Reset code sent to your email" }, { status: 200 });
  } catch (e) {
    console.error("Password reset error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}