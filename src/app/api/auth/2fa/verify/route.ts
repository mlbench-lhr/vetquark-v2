import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import UserSession from "@/lib/models/UserSession";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }
    if (typeof otp !== "string" || otp.length !== 5) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: "Two-factor authentication not enabled" }, { status: 400 });
    }
    if (!user.twoFactorOtp) {
      return NextResponse.json({ error: "No OTP to verify" }, { status: 400 });
    }

    const now = Date.now();
    const expiresAt = user.twoFactorOtpExpiresAt ? new Date(user.twoFactorOtpExpiresAt).getTime() : 0;
    if (expiresAt && now > expiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 410 });
    }

    if (user.twoFactorOtp !== String(otp)) {
      const attempts = (user.twoFactorOtpAttempts || 0) + 1;
      await User.updateOne({ _id: user._id }, { $set: { twoFactorOtpAttempts: attempts } });
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
    }

    await User.updateOne(
      { _id: user._id },
      { $unset: { twoFactorOtp: "", twoFactorOtpExpiresAt: "", twoFactorOtpLastSentAt: "" }, $set: { twoFactorOtpAttempts: 0 } }
    );

    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      return NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 });
    }

    const sessionId = crypto.randomUUID();
    const ua = String(req.headers.get("user-agent") || "");
    const lower = ua.toLowerCase();
    let deviceType: "ios" | "android" = lower.includes("android") ? "android" : "ios";
    let deviceModel = deviceType === "android" ? "Android" : (lower.includes("ipad") ? "iPad" : "iPhone");
    try {
      await UserSession.create({ user: user._id as any, sessionId, deviceType, deviceModel });
    } catch {}

    const token = jwt.sign(
      { sub: String(user._id), role: user.role, email: user.email, jti: sessionId },
      authSecret,
      { algorithm: "HS256", expiresIn: "7d" }
    );

    const res = NextResponse.json(
      {
        message: "Logged in",
        profile: {
          id: String(user._id),
          fullName: typeof user.fullName === "string" ? user.fullName : "",
          email: typeof user.email === "string" ? user.email : "",
          role: user.role === "Veterinarian" || user.role === "Guardian" ? user.role : undefined,
        },
      },
      { status: 200 }
    );

    const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
    res.cookies.set("session_id", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionMaxAgeSeconds,
      expires: new Date(Date.now() + sessionMaxAgeSeconds * 1000),
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
