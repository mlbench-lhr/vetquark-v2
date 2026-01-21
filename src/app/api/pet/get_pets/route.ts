import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    const guardianId = req.headers.get("x-user-id");
    if (!guardianId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const guardian = await User.findById(guardianId).select("_id role").lean();
    // if (!guardian || guardian.role !== "Guardian") {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    // const docs = await Patient.find({ guardian: guardianId })
    const docs = await Patient.find()
      .populate("veterinarian", "fullName tradeName")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const items = docs.map((p: any) => ({
      id: String(p._id),
      name: p.animalName,
      owner: p.veterinarian?.tradeName ?? p.veterinarian?.fullName ?? "N/A",
      image: p.photo,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

