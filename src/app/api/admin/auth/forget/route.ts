import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import { sendResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongo();

    const normalizedEmail = String(email).toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail }).lean();
    if (!admin) {
      return NextResponse.json({ message: "If this email exists, a reset code has been sent" }, { status: 200 });
    }

    const otp = String(Math.floor(10000 + Math.random() * 90000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Admin.updateOne(
      { _id: (admin as any)._id },
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
      await sendResetEmail(normalizedEmail, otp);
    } catch {
      return NextResponse.json({ message: "Reset code generated, but email sending failed" }, { status: 202 });
    }

    return NextResponse.json({ message: "If this email exists, a reset code has been sent" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
