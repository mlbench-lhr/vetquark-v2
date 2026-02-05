import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    console.log("EncryptionKey db connected");
    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role !== "Guardian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.log("EncryptionKey user ok", JSON.stringify({ userId, role: (user as any).role }));

    const key = String(process.env.PAGARME_ENCRYPTION_KEY || "").trim();
    if (!key) return NextResponse.json({ error: "Missing PAGARME_ENCRYPTION_KEY" }, { status: 500 });

    return NextResponse.json({ key }, { status: 200 });
  } catch (e) {
    console.error("EncryptionKey fatal", e);
    return NextResponse.json({ error: "Internal server error", reason: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
