import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

export async function POST(req: NextRequest) {
  try {
    const { email, password, remember } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectMongo();

    const admin = await Admin.findOne({ email: String(email).toLowerCase() }).lean();
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(String(password), String((admin as any).passwordHash || ""));
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      return NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 });
    }

    const persist30d = remember === true;
    const expiresIn = persist30d ? "30d" : "7d";
    const token = jwt.sign(
      { sub: String((admin as any)._id), role: "Admin", email: (admin as any).email },
      authSecret,
      { algorithm: "HS256", expiresIn }
    );

    const res = NextResponse.json(
      {
        message: "Logged in",
        profile: {
          id: String((admin as any)._id),
          fullName: typeof (admin as any).fullName === "string" ? (admin as any).fullName : "",
          email: typeof (admin as any).email === "string" ? (admin as any).email : "",
          role: "Admin",
        },
      },
      { status: 200 }
    );

    res.cookies.set("admin_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: persist30d ? 60 * 60 * 24 * 30 : undefined,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
