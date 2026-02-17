import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import PaymentLink from "@/lib/models/PaymentLink";

function percentChange(current: number, previous: number) {
  if (!Number.isFinite(current) || current < 0) current = 0;
  if (!Number.isFinite(previous) || previous < 0) previous = 0;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function clampInt(raw: unknown, fallback: number, min: number, max: number) {
  const n = typeof raw === "string" && raw.trim() ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.min(max, Math.max(min, i));
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
    const periodDays = clampInt(url.searchParams.get("periodDays"), 30, 7, 365);
    const now = new Date();
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    const currentStart = new Date(now.getTime() - periodMs);
    const previousStart = new Date(now.getTime() - periodMs * 2);

    const [totalVets, totalGuardians, totalPatients] = await Promise.all([
      User.countDocuments({ role: "Veterinarian" }),
      User.countDocuments({ role: "Guardian" }),
      Patient.countDocuments({}),
    ]);

    const [currentNewVets, previousNewVets, currentNewGuardians, previousNewGuardians, currentNewPatients, previousNewPatients] =
      await Promise.all([
        User.countDocuments({ role: "Veterinarian", createdAt: { $gte: currentStart, $lt: now } }),
        User.countDocuments({ role: "Veterinarian", createdAt: { $gte: previousStart, $lt: currentStart } }),
        User.countDocuments({ role: "Guardian", createdAt: { $gte: currentStart, $lt: now } }),
        User.countDocuments({ role: "Guardian", createdAt: { $gte: previousStart, $lt: currentStart } }),
        Patient.countDocuments({ createdAt: { $gte: currentStart, $lt: now } }),
        Patient.countDocuments({ createdAt: { $gte: previousStart, $lt: currentStart } }),
      ]);

    const [revenueAll, revenueCurrent, revenuePrevious] = await Promise.all([
      Promise.all([
        PaymentLink.aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        mongoose.connection.collection("store_orders").aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]).toArray(),
      ]),
      Promise.all([
        PaymentLink.aggregate([
          { $match: { status: "paid", createdAt: { $gte: currentStart, $lt: now } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        mongoose.connection.collection("store_orders").aggregate([
          { $match: { status: "paid", createdAt: { $gte: currentStart, $lt: now } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]).toArray(),
      ]),
      Promise.all([
        PaymentLink.aggregate([
          { $match: { status: "paid", createdAt: { $gte: previousStart, $lt: currentStart } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        mongoose.connection.collection("store_orders").aggregate([
          { $match: { status: "paid", createdAt: { $gte: previousStart, $lt: currentStart } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]).toArray(),
      ]),
    ]);

    const linksAll = revenueAll[0];
    const ordersAll = revenueAll[1];
    const linksCurrent = revenueCurrent[0];
    const ordersCurrent = revenueCurrent[1];
    const linksPrevious = revenuePrevious[0];
    const ordersPrevious = revenuePrevious[1];

    const totalLinksAll = Number(linksAll?.[0]?.total || 0);
    const totalOrdersAll = Number(ordersAll?.[0]?.total || 0);
    const totalRevenue = (Number.isFinite(totalLinksAll) ? totalLinksAll : 0) + (Number.isFinite(totalOrdersAll) ? totalOrdersAll : 0);

    const totalLinksCurrent = Number(linksCurrent?.[0]?.total || 0);
    const totalOrdersCurrent = Number(ordersCurrent?.[0]?.total || 0);
    const revenueThisPeriod =
      (Number.isFinite(totalLinksCurrent) ? totalLinksCurrent : 0) + (Number.isFinite(totalOrdersCurrent) ? totalOrdersCurrent : 0);

    const totalLinksPrevious = Number(linksPrevious?.[0]?.total || 0);
    const totalOrdersPrevious = Number(ordersPrevious?.[0]?.total || 0);
    const revenuePreviousPeriod =
      (Number.isFinite(totalLinksPrevious) ? totalLinksPrevious : 0) + (Number.isFinite(totalOrdersPrevious) ? totalOrdersPrevious : 0);

    const vetsChange = percentChange(currentNewVets, previousNewVets);
    const guardiansChange = percentChange(currentNewGuardians, previousNewGuardians);
    const patientsChange = percentChange(currentNewPatients, previousNewPatients);
    const revenueChange = percentChange(revenueThisPeriod, revenuePreviousPeriod);

    return NextResponse.json(
      {
        totals: {
          veterinarians: totalVets,
          guardians: totalGuardians,
          patients: totalPatients,
          revenue: {
            amount: totalRevenue,
            currency: "USD",
          },
        },
        trends: {
          veterinarians: { value: Math.round(Math.abs(vetsChange) * 10) / 10, isPositive: vetsChange >= 0 },
          guardians: { value: Math.round(Math.abs(guardiansChange) * 10) / 10, isPositive: guardiansChange >= 0 },
          patients: { value: Math.round(Math.abs(patientsChange) * 10) / 10, isPositive: patientsChange >= 0 },
          revenue: { value: Math.round(Math.abs(revenueChange) * 10) / 10, isPositive: revenueChange >= 0 },
        },
        periodDays,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

