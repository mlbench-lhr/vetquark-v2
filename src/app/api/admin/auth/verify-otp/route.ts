import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }
    if (typeof otp !== "string" || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
    }

    await connectMongo();

    const normalizedEmail = String(email).toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail }).lean();
    if (!admin) {
      return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
    }

    if (!(admin as any).resetOtp) {
      return NextResponse.json({ error: "No OTP to verify" }, { status: 400 });
    }

    const now = Date.now();
    const expiresAt = (admin as any).resetOtpExpiresAt ? new Date((admin as any).resetOtpExpiresAt).getTime() : 0;
    if (expiresAt && now > expiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 410 });
    }

    if (String((admin as any).resetOtp) !== String(otp)) {
      const attempts = ((admin as any).resetOtpAttempts || 0) + 1;
      await Admin.updateOne({ _id: (admin as any)._id }, { $set: { resetOtpAttempts: attempts } });
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Admin.updateOne(
      { _id: (admin as any)._id },
      {
        $set: { resetTokenHash, resetTokenExpiresAt, passwordResetRequestedAt: new Date() },
      }
    );

    return NextResponse.json({ message: "OTP verified", reset_token: resetToken }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
