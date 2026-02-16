import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ message: "Logged out" }, { status: 200 });
  res.cookies.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
