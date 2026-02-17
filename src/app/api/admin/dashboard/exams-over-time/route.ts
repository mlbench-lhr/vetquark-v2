import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import Reading from "@/lib/models/Reading";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function clampInt(raw: unknown, fallback: number, min: number, max: number) {
  const n = typeof raw === "string" && raw.trim() ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.min(max, Math.max(min, i));
}

function percentChange(current: number, previous: number) {
  if (!Number.isFinite(current) || current < 0) current = 0;
  if (!Number.isFinite(previous) || previous < 0) previous = 0;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
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
    const now = new Date();
    const year = clampInt(url.searchParams.get("year"), now.getUTCFullYear(), 1970, 3000);

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await Reading.aggregate([
      { $match: { createdAt: { $gte: yearStart, $lt: yearEnd } } },
      { $project: { month: { $month: "$createdAt" } } },
      { $group: { _id: "$month", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const countsByMonth = new Map<number, number>();
    for (const r of rows as any[]) {
      const m = Number(r?._id);
      const c = Number(r?.count);
      if (Number.isFinite(m) && Number.isFinite(c)) countsByMonth.set(m, c);
    }

    const chartData = MONTHS.map((month, idx) => ({
      month,
      amount: countsByMonth.get(idx + 1) ?? 0,
    }));

    const totalExams = chartData.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

    const periodDays = clampInt(url.searchParams.get("periodDays"), 30, 7, 365);
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    const currentStart = new Date(now.getTime() - periodMs);
    const previousStart = new Date(now.getTime() - periodMs * 2);

    const [currentCount, previousCount] = await Promise.all([
      Reading.countDocuments({ createdAt: { $gte: currentStart, $lt: now } }),
      Reading.countDocuments({ createdAt: { $gte: previousStart, $lt: currentStart } }),
    ]);

    const change = percentChange(currentCount, previousCount);

    return NextResponse.json(
      {
        totalRevenue: totalExams,
        percentageChange: Math.round(Math.abs(change) * 10) / 10,
        incremented: change >= 0,
        chartData,
        year,
        periodDays,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

