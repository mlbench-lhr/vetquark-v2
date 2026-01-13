import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const folder = url.searchParams.get("folder") || "patients";
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiSecret) {
      return NextResponse.json({ error: "CLOUDINARY_API_SECRET missing" }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    // Params should be alphabetically sorted when building the signature string.
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    return NextResponse.json({ timestamp, signature }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}