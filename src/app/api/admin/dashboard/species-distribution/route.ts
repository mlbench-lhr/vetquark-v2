import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import Patient from "@/lib/models/Patient";

function round1(n: number) {
  return Math.round(n * 10) / 10;
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

    const rows = await Patient.aggregate([
      { $match: { species: { $exists: true, $ne: null } } },
      { $project: { speciesLower: { $toLower: { $trim: { input: "$species" } } } } },
      {
        $project: {
          bucket: {
            $cond: [
              { $regexMatch: { input: "$speciesLower", regex: "dog" } },
              "dogs",
              {
                $cond: [
                  { $regexMatch: { input: "$speciesLower", regex: "cat" } },
                  "cats",
                  "others",
                ],
              },
            ],
          },
        },
      },
      { $group: { _id: "$bucket", count: { $sum: 1 } } },
    ]);

    let dogs = 0;
    let cats = 0;
    let others = 0;
    for (const r of rows as any[]) {
      const key = String(r?._id || "");
      const count = Number(r?.count || 0);
      if (!Number.isFinite(count) || count < 0) continue;
      if (key === "dogs") dogs = count;
      else if (key === "cats") cats = count;
      else if (key === "others") others = count;
    }

    const total = dogs + cats + others;
    const dogsPct = total ? (dogs / total) * 100 : 0;
    const catsPct = total ? (cats / total) * 100 : 0;
    let othersPct = total ? (others / total) * 100 : 0;

    const roundedDogs = round1(dogsPct);
    const roundedCats = round1(catsPct);
    othersPct = Math.max(0, 100 - (roundedDogs + roundedCats));

    return NextResponse.json(
      {
        totalPatients: total,
        milestoneOverview: {
          inProgress: roundedDogs,
          completed: roundedCats,
          overdue: round1(othersPct),
        },
        counts: { dogs, cats, others },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

