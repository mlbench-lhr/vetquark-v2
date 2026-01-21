import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";

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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET(req: NextRequest) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const now = new Date();
    const yearParam = (url.searchParams.get("year") || "").trim();
    const year = yearParam ? Number(yearParam) : now.getFullYear();
    if (!Number.isFinite(year) || year < 1970 || year > 3000) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await Patient.aggregate([
      {
        $match: {
          veterinarian: new mongoose.Types.ObjectId(veterinarianId),
          createdAt: { $gte: start, $lt: end },
          species: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          speciesLower: { $toLower: "$species" },
        },
      },
      {
        $addFields: {
          speciesKey: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: "$speciesLower", regex: "dog" } }, then: "dog" },
                { case: { $regexMatch: { input: "$speciesLower", regex: "cat" } }, then: "cat" },
              ],
              default: null,
            },
          },
        },
      },
      { $match: { speciesKey: { $ne: null } } },
      {
        $group: {
          _id: { month: "$month", speciesKey: "$speciesKey" },
          count: { $sum: 1 },
        },
      },
    ]);

    const dogs = Array(12).fill(0) as number[];
    const cats = Array(12).fill(0) as number[];

    for (const row of rows) {
      const month = row?._id?.month;
      const speciesKey = row?._id?.speciesKey;
      const count = row?.count;
      if (typeof month !== "number" || month < 1 || month > 12) continue;
      if (typeof count !== "number") continue;
      const idx = month - 1;
      if (speciesKey === "dog") dogs[idx] = count;
      if (speciesKey === "cat") cats[idx] = count;
    }

    return NextResponse.json({ months: MONTHS, dogs, cats, year }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

