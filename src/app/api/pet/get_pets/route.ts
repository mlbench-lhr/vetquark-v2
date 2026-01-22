import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";
import { parsePagination, toPaginationMeta } from "@/lib/utils";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const guardianId = req.headers.get("x-user-id");
    if (!guardianId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!mongoose.Types.ObjectId.isValid(guardianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const { page, pageSize, skip, limit } = parsePagination(url.searchParams, {
      defaultPageSize: 50,
      maxPageSize: 100,
    });

    await connectMongo();

    const guardian = await User.findById(guardianId).select("_id role").lean();
    if (!guardian || guardian.role !== "Guardian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter = { guardian: guardianId };
    const [total, docs] = await Promise.all([
      Patient.countDocuments(filter),
      Patient.find(filter)
        .populate("veterinarian", "fullName tradeName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const items = docs.map((p: any) => ({
      id: String(p._id),
      name: p.animalName,
      owner: p.veterinarian?.tradeName ?? p.veterinarian?.fullName ?? "N/A",
      image: p.photo,
    }));

    return NextResponse.json(
      { items, pagination: toPaginationMeta({ page, pageSize, total }) },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
