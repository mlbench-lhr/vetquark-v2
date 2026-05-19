import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const authSecret = process.env.AUTH_SECRET;
  if (!token) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!authSecret) {
    return { ok: false as const, res: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }) };
  }

  let adminId: string | null = null;
  let role: string | null = null;
  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object") {
      adminId = typeof (decoded as any).sub === "string" ? String((decoded as any).sub) : null;
      role = typeof (decoded as any).role === "string" ? String((decoded as any).role) : null;
    }
  } catch {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!adminId || role !== "Admin" || !mongoose.Types.ObjectId.isValid(adminId)) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  await connectMongo();
  const admin = await Admin.findById(adminId).select("_id").lean();
  if (!admin) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true as const, adminId };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const search = String(url.searchParams.get("search") || "").trim();
    const tab = url.searchParams.get("tab") === "incomplete" ? "incomplete" : "completed";

    await connectMongo();

    const coll = mongoose.connection.collection("readings");
    const baseMatch: any =
      tab === "incomplete"
        ? { isDraft: true, $or: [{ signedAt: { $exists: false } }, { signedAt: null }] }
        : { signedAt: { $ne: null }, isDraft: { $ne: true } };

    const matchSearch: any = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      const or: any[] = [
        { productCode: { $regex: rx } },
        { unlockedProductCodes: { $regex: rx } },
        { paymentStatus: { $regex: rx } },
        { "patient.animalName": { $regex: rx } },
        { "guardian.fullName": { $regex: rx } },
        { "guardian.email": { $regex: rx } },
        { "veterinarian.fullName": { $regex: rx } },
        { "veterinarian.tradeName": { $regex: rx } },
        { "veterinarian.email": { $regex: rx } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
      matchSearch.$or = or;
    }

    const pipeline: any[] = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patientArr",
        },
      },
      { $addFields: { patient: { $first: "$patientArr" } } },
      { $project: { patientArr: 0 } },
      {
        $lookup: {
          from: "users",
          localField: "guardian",
          foreignField: "_id",
          as: "guardianArr",
        },
      },
      { $addFields: { guardian: { $first: "$guardianArr" } } },
      { $project: { guardianArr: 0 } },
      {
        $lookup: {
          from: "users",
          localField: "veterinarian",
          foreignField: "_id",
          as: "veterinarianArr",
        },
      },
      { $addFields: { veterinarian: { $first: "$veterinarianArr" } } },
      { $project: { veterinarianArr: 0 } },
      ...(Object.keys(matchSearch).length ? [{ $match: matchSearch }] : []),
      { $sort: { signedAt: -1, createdAt: -1, _id: -1 } },
    ];

    const docs = await coll.aggregate(pipeline).toArray();

    const data = (docs as any[]).map((d) => {
      const signedAt = d?.signedAt ? new Date(d.signedAt) : null;
      const createdAt = d?.createdAt ? new Date(d.createdAt) : null;

      const petName = typeof d?.patient?.animalName === "string" ? d.patient.animalName : "—";
      const species = typeof d?.patient?.species === "string" ? d.patient.species : "";
      const breed = typeof d?.patient?.breed === "string" ? d.patient.breed : "";

      const guardianName = typeof d?.guardian?.fullName === "string" ? d.guardian.fullName : "—";
      const guardianEmail = typeof d?.guardian?.email === "string" ? d.guardian.email : "";
      const guardianPhone = typeof d?.guardian?.phone === "string" ? d.guardian.phone : "";

      const veterinarianName =
        typeof d?.veterinarian?.tradeName === "string" && d.veterinarian.tradeName.trim()
          ? d.veterinarian.tradeName.trim()
          : typeof d?.veterinarian?.fullName === "string"
            ? d.veterinarian.fullName
            : "—";
      const veterinarianEmail = typeof d?.veterinarian?.email === "string" ? d.veterinarian.email : "";
      const crmv = typeof d?.veterinarian?.crmv === "string" ? d.veterinarian.crmv : "";
      const crmvState = typeof d?.veterinarian?.crmvState === "string" ? d.veterinarian.crmvState : "";

      const paymentStatus = typeof d?.paymentStatus === "string" ? d.paymentStatus : "";
      const productCode = typeof d?.productCode === "string" ? d.productCode : "VETQ_MASTER_360";
      const unlockedProductCodes = Array.isArray(d?.unlockedProductCodes)
        ? d.unlockedProductCodes.map((c: any) => String(c || "").trim()).filter(Boolean).join(", ")
        : "";

      const wizardStep = typeof d?.wizardStep === "string" ? d.wizardStep : "";
      const isDraft = typeof d?.isDraft === "boolean" ? d.isDraft : true;

      return {
        id: String(d?._id),
        petName,
        species,
        breed,
        guardianName,
        guardianEmail,
        guardianPhone,
        veterinarianName,
        veterinarianEmail,
        crmv,
        crmvState,
        productCode,
        unlockedProductCodes,
        signedAt: signedAt && !Number.isNaN(signedAt.getTime()) ? signedAt.toISOString() : "",
        createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : "",
        paymentStatus,
        wizardStep,
        isDraft: isDraft ? "Yes" : "No",
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
