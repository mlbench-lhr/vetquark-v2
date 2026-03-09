import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

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

    await connectMongo();
    const coll = mongoose.connection.collection("wallettransactions");

    const resultArr = await coll
      .aggregate([
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalGross: {
                    $sum: {
                      $cond: [{ $eq: ["$type", "credit"] }, { $ifNull: ["$amountGross", 0] }, 0],
                    },
                  },
                  feesCollected: {
                    $sum: {
                      $cond: [{ $eq: ["$type", "credit"] }, { $ifNull: ["$platformFee", 0] }, 0],
                    },
                  },
                  netPayouts: {
                    $sum: {
                      $cond: [{ $eq: ["$type", "withdrawal"] }, { $ifNull: ["$amountNet", 0] }, 0],
                    },
                  },
                },
              },
            ],
            avgChargePerTestPerVet: [
              { $match: { type: "credit" } },
              {
                $group: {
                  _id: "$user",
                  avgCharge: { $avg: { $ifNull: ["$amountGross", 0] } },
                },
              },
              {
                $group: {
                  _id: null,
                  value: { $avg: "$avgCharge" },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const out = (resultArr && resultArr[0]) || { summary: [], avgChargePerTestPerVet: [] };
    const summaryDoc = Array.isArray((out as any).summary) ? (out as any).summary[0] : null;
    const avgDoc = Array.isArray((out as any).avgChargePerTestPerVet) ? (out as any).avgChargePerTestPerVet[0] : null;

    const totalGross = Number.isFinite(Number(summaryDoc?.totalGross)) ? Number(summaryDoc.totalGross) : 0;
    const feesCollected = Number.isFinite(Number(summaryDoc?.feesCollected)) ? Number(summaryDoc.feesCollected) : 0;
    const netPayouts = Number.isFinite(Number(summaryDoc?.netPayouts)) ? Number(summaryDoc.netPayouts) : 0;
    const avgChargePerTestPerVet = Number.isFinite(Number(avgDoc?.value)) ? Number(avgDoc.value) : 0;

    return NextResponse.json(
      {
        totalGross,
        feesCollected,
        netPayouts,
        avgChargePerTestPerVet,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
