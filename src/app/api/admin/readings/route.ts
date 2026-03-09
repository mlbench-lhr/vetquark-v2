import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

function clampInt(raw: unknown, fallback: number, min: number, max: number) {
  const n = typeof raw === "string" && raw.trim() ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.min(max, Math.max(min, i));
}

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
    const page = clampInt(url.searchParams.get("page"), 1, 1, 10_000);
    const limit = clampInt(url.searchParams.get("limit"), 10, 1, 100);
    const search = String(url.searchParams.get("search") || "").trim();

    await connectMongo();

    const coll = mongoose.connection.collection("readings");
    const baseMatch: any = { signedAt: { $ne: null }, isDraft: { $ne: true } };

    const matchSearch: any = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      const or: any[] = [
        { productCode: { $regex: rx } },
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

    const skip = (page - 1) * limit;
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
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: "total" }],
        },
      },
    ];

    const out = await coll.aggregate(pipeline).toArray();
    const facet = (out && out[0]) || { data: [], meta: [] };
    const docs = Array.isArray(facet.data) ? facet.data : [];
    const total = Array.isArray(facet.meta) && facet.meta[0]?.total ? Number(facet.meta[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const data = (docs as any[]).map((d) => {
      const signedAt = d?.signedAt ? new Date(d.signedAt) : null;
      const createdAt = d?.createdAt ? new Date(d.createdAt) : null;

      const petName = typeof d?.patient?.animalName === "string" ? d.patient.animalName : "—";

      const guardianName = typeof d?.guardian?.fullName === "string" ? d.guardian.fullName : "—";
      const guardianEmail = typeof d?.guardian?.email === "string" ? d.guardian.email : "";

      const veterinarianName =
        typeof d?.veterinarian?.tradeName === "string" && d.veterinarian.tradeName.trim()
          ? d.veterinarian.tradeName.trim()
          : typeof d?.veterinarian?.fullName === "string"
            ? d.veterinarian.fullName
            : "—";
      const veterinarianEmail = typeof d?.veterinarian?.email === "string" ? d.veterinarian.email : "";

      const paymentStatus = typeof d?.paymentStatus === "string" ? d.paymentStatus : null;
      const productCode = typeof d?.productCode === "string" ? d.productCode : "VETQ_MASTER_360";

      return {
        id: String(d?._id),
        petName,
        veterinarianName,
        veterinarianEmail,
        guardianName,
        guardianEmail,
        productCode,
        signedAt: signedAt && !Number.isNaN(signedAt.getTime()) ? signedAt.toISOString() : null,
        createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : null,
        paymentStatus,
      };
    });

    return NextResponse.json(
      {
        data,
        pagination: {
          total,
          totalPages,
          page,
          limit,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

