import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

function isAllowedCloudinaryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return url.hostname.endsWith("res.cloudinary.com");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    const profileImageUrl = String(body?.profileImageUrl || "").trim();

    if (!userId || !profileImageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!isAllowedCloudinaryUrl(profileImageUrl)) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    await connectMongo();

    const updated = await User.findByIdAndUpdate(
      userId,
      { profileImageUrl },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
