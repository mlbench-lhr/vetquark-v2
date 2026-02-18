import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import User from "@/lib/models/User";
import Reading from "@/lib/models/Reading";

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
    console.log("-----------------------");
    
    const url = new URL(req.url);
    const page = clampInt(url.searchParams.get("page"), 1, 1, 10_000);
    const limit = clampInt(url.searchParams.get("limit"), 10, 1, 100);
    const search = String(url.searchParams.get("search") || "").trim();
    const roleRaw = String(url.searchParams.get("role") || "Veterinarian").trim();
    const role = roleRaw === "Guardian" ? "Guardian" : "Veterinarian";

    const filter: any = { role };
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { fullName: { $regex: rx } },
        { email: { $regex: rx } },
        { phone: { $regex: rx } },
        { taxId: { $regex: rx } },
        { tradeName: { $regex: rx } },
        { crmv: { $regex: rx } },
        { crmvState: { $regex: rx } },
        { state: { $regex: rx } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
    }

    const skip = (page - 1) * limit;
    const [total, docs] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("_id fullName email phone profileImageUrl crmv crmvState state createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const ids = (docs as any[]).map((d) => new mongoose.Types.ObjectId(String(d._id)));
    const examKey = role === "Guardian" ? "guardian" : "veterinarian";

    const examCounts = ids.length
      ? await Reading.aggregate([
          { $match: { [examKey]: { $in: ids } } },
          { $group: { _id: `$${examKey}`, count: { $sum: 1 } } },
        ])
      : [];

    const countById = new Map<string, number>();
    for (const row of examCounts as any[]) {
      countById.set(String(row?._id), Number(row?.count) || 0);
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const data = (docs as any[]).map((u) => {
      const createdAt = u?.createdAt ? new Date(u.createdAt) : null;
      const crmv = typeof u?.crmv === "string" ? u.crmv : "";
      const crmvState = typeof u?.crmvState === "string" ? u.crmvState : "";
      const state = typeof u?.state === "string" ? u.state : "";

      return {
        id: String(u?._id),
        name: typeof u?.fullName === "string" ? u.fullName : "",
        email: typeof u?.email === "string" ? u.email : "",
        profileImageUrl: typeof u?.profileImageUrl === "string" ? u.profileImageUrl : "",
        crmv,
        crmvState,
        state,
        crmvOrStateLabel:
          role === "Veterinarian"
            ? `${crmv || "—"} / ${crmvState || "—"}`
            : state || "—",
        exams: countById.get(String(u?._id)) || 0,
        joined: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : null,
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
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

