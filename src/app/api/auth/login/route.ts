import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "Email not verified" }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      return NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 });
    }

    const token = jwt.sign(
      { sub: String(user._id), role: user.role, email: user.email },
      authSecret,
      { algorithm: "HS256", expiresIn: "7d" }
    );

    const res = NextResponse.json(
      {
        message: "Logged in",
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileType: user.profileType,
        role: user.role,
      },
      { status: 200 }
    );

    res.cookies.set("session_id", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res;
  } catch (e) {
    console.log(e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}