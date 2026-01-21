import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import { parsePagination, toPaginationMeta } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const { page, pageSize, skip, limit } = parsePagination(url.searchParams, {
      defaultPageSize: 50,
      maxPageSize: 100,
    });

    await connectMongo();

    const filter: any = { role: "Guardian" };
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { taxId: { $regex: q, $options: "i" } },
      ];
    }

    const [total, items] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("_id fullName taxId email")
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      { items, pagination: toPaginationMeta({ page, pageSize, total }) },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
