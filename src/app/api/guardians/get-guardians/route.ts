import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    await connectMongo();

    const filter: any = { role: "Guardian" };
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { taxId: { $regex: q, $options: "i" } },
      ];
    }

    const items = await User.find(filter)
      .select("_id fullName taxId email")
      .sort({ fullName: 1 })
      .limit(50)
      .lean();

    return NextResponse.json({ items }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}