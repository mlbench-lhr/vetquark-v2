import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { enabled } = await req.json().catch(() => ({ enabled: undefined }));
    const value = typeof enabled === "boolean" ? enabled : null;
    if (value === null) {
      return NextResponse.json({ error: "enabled boolean is required" }, { status: 400 });
    }

    await connectMongo();

    await User.updateOne({ _id: userId }, { $set: { twoFactorEnabled: value } });

    return NextResponse.json({ enabled: value }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
