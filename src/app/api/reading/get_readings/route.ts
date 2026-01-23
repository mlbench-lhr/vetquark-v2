import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import Reading from "@/lib/models/Reading";
import { parsePagination, toPaginationMeta } from "@/lib/utils";

function getUserIdFromRequest(req: NextRequest): { userId: string | null; error: NextResponse | null } {
  const headerId = req.headers.get("x-user-id");
  if (headerId?.trim()) return { userId: headerId.trim(), error: null };

  const token = req.cookies.get("session_id")?.value || req.cookies.get("auth_token")?.value;
  if (!token) return { userId: null, error: null };

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }),
    };
  }

  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object" && "sub" in decoded) {
      const sub = (decoded as { sub?: unknown }).sub;
      if (typeof sub === "string" && sub.trim()) return { userId: sub.trim(), error: null };
    }
    return { userId: null, error: null };
  } catch {
    return { userId: null, error: null };
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDateParam(raw: string | null) {
  const v = (raw || "").trim();
  if (!v) return null;
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const { userId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const patientId = (url.searchParams.get("patientId") || "").trim();
    if (patientId && !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }
    const q = (url.searchParams.get("q") || "").trim();
    const from = parseDateParam(url.searchParams.get("from"));
    const to = parseDateParam(url.searchParams.get("to"));
    const status = (url.searchParams.get("status") || "").trim();
    if ((url.searchParams.get("from") || "").trim() && !from) {
      return NextResponse.json({ error: "Invalid from" }, { status: 400 });
    }
    if ((url.searchParams.get("to") || "").trim() && !to) {
      return NextResponse.json({ error: "Invalid to" }, { status: 400 });
    }
    if (from && to && from.getTime() >= to.getTime()) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }
    if (status && status !== "signed" && status !== "pending") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const { page, pageSize, skip, limit } = parsePagination(url.searchParams, {
      defaultPageSize: 100,
      maxPageSize: 500,
    });

    await connectMongo();

    const user = await User.findById(userId).select("_id role fullName").lean();
    if (!user || (user.role !== "Veterinarian" && user.role !== "Guardian")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const baseFilter: any = user.role === "Veterinarian" ? { veterinarian: userId } : { guardian: userId };
    if (patientId) baseFilter.patient = patientId;

    const andClauses: any[] = [baseFilter];

    if (from || to) {
      const createdAt: any = {};
      if (from) createdAt.$gte = from;
      if (to) createdAt.$lt = to;
      andClauses.push({ createdAt });
    }

    if (status === "signed") {
      andClauses.push({ signedAt: { $ne: null } });
    } else if (status === "pending") {
      andClauses.push({ $or: [{ signedAt: null }, { signedAt: { $exists: false } }] });
    }

    if (q) {
      const regex = new RegExp(escapeRegExp(q), "i");
      const patientScopeFilter: any =
        user.role === "Veterinarian" ? { veterinarian: userId } : { guardian: userId };
      const [patientDocs, guardianDocs] = await Promise.all([
        Patient.find({ ...patientScopeFilter, animalName: regex }).select("_id").lean(),
        user.role === "Veterinarian"
          ? User.find({ role: "Guardian", fullName: regex }).select("_id").lean()
          : Promise.resolve([] as any[]),
      ]);

      const patientIds = patientDocs.map((p: any) => p._id);
      const guardianIds = guardianDocs.map((g: any) => g._id);
      const orClauses: any[] = [];
      if (patientIds.length) orClauses.push({ patient: { $in: patientIds } });
      if (guardianIds.length) orClauses.push({ guardian: { $in: guardianIds } });
      if (!orClauses.length) {
        return NextResponse.json(
          { items: [], pagination: toPaginationMeta({ page, pageSize, total: 0 }) },
          { status: 200 },
        );
      }
      andClauses.push({ $or: orClauses });
    }

    const filter = andClauses.length === 1 ? andClauses[0] : { $and: andClauses };
    const [total, docs] = await Promise.all([
      Reading.countDocuments(filter),
      Reading.find(filter)
        .populate("patient", "animalName photo")
        .populate("guardian", "fullName")
        .populate("veterinarian", "fullName tradeName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const items = docs.map((r: any) => ({
      id: String(r._id),
      patientId: String(r.patient?._id ?? r.patient ?? ""),
      patientName: r.patient?.animalName ?? "N/A",
      guardianName: r.guardian?.fullName ?? "N/A",
      veterinarianName: r.veterinarian?.tradeName ?? r.veterinarian?.fullName ?? "N/A",
      date: (r.signedAt ?? r.createdAt ?? new Date()).toISOString?.() ?? String(r.signedAt ?? r.createdAt ?? ""),
      status: r.signedAt ? "signed" : "pending",
      avatarSrc: r.patient?.photo || "/images/product/product-01.jpg",
      paymentStatus: typeof r.paymentStatus === "string" ? r.paymentStatus : null,
      paymentLinkId: r.paymentLink ? String(r.paymentLink) : "",
    }));

    return NextResponse.json(
      { items, pagination: toPaginationMeta({ page, pageSize, total }) },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
