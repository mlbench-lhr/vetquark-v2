import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
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

export async function GET(req: NextRequest) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const { page, pageSize, skip, limit } = parsePagination(url.searchParams, {
      defaultPageSize: 100,
      maxPageSize: 500,
    });

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter: any = { veterinarian: veterinarianId };
    const [total, docs] = await Promise.all([
      Reading.countDocuments(filter),
      Reading.find(filter)
        .populate("patient", "animalName photo")
        .populate("guardian", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const items = docs.map((r: any) => ({
      id: String(r._id),
      patientName: r.patient?.animalName ?? "N/A",
      guardianName: r.guardian?.fullName ?? "N/A",
      date: (r.signedAt ?? r.createdAt ?? new Date()).toISOString?.() ?? String(r.signedAt ?? r.createdAt ?? ""),
      status: r.signedAt ? "signed" : "pending",
      avatarSrc: r.patient?.photo || "/images/product/product-01.jpg",
    }));

    return NextResponse.json(
      { items, pagination: toPaginationMeta({ page, pageSize, total }) },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

