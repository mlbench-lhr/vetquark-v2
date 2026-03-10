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
            grossSplit: [
              { $match: { type: "credit" } },
              {
                $lookup: {
                  from: "paymentlinks",
                  localField: "paymentLink",
                  foreignField: "_id",
                  as: "linkArr",
                },
              },
              { $addFields: { link: { $first: "$linkArr" } } },
              { $project: { linkArr: 0 } },
              {
                $addFields: {
                  kind: {
                    $cond: [
                      { $eq: ["$link.kind", "upgrade"] },
                      "upgrade",
                      "reading_payment",
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: "$kind",
                  gross: { $sum: { $ifNull: ["$amountGross", 0] } },
                  count: { $sum: 1 },
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

    const out = (resultArr && resultArr[0]) || { summary: [], grossSplit: [], avgChargePerTestPerVet: [] };
    const summaryDoc = Array.isArray((out as any).summary) ? (out as any).summary[0] : null;
    const splitDocs = Array.isArray((out as any).grossSplit) ? (out as any).grossSplit : [];
    const avgDoc = Array.isArray((out as any).avgChargePerTestPerVet) ? (out as any).avgChargePerTestPerVet[0] : null;

    const totalGross = Number.isFinite(Number(summaryDoc?.totalGross)) ? Number(summaryDoc.totalGross) : 0;
    const feesCollected = Number.isFinite(Number(summaryDoc?.feesCollected)) ? Number(summaryDoc.feesCollected) : 0;
    const netPayouts = Number.isFinite(Number(summaryDoc?.netPayouts)) ? Number(summaryDoc.netPayouts) : 0;
    const avgChargePerTestPerVet = Number.isFinite(Number(avgDoc?.value)) ? Number(avgDoc.value) : 0;

    let examsGross = 0;
    let examsCount = 0;
    let upgradesGross = 0;
    let upgradesCount = 0;
    for (const d of splitDocs as any[]) {
      const kind = String(d?._id || "");
      const gross = Number.isFinite(Number(d?.gross)) ? Number(d.gross) : 0;
      const count = Number.isFinite(Number(d?.count)) ? Number(d.count) : 0;
      if (kind === "upgrade") {
        upgradesGross += gross;
        upgradesCount += count;
      } else {
        examsGross += gross;
        examsCount += count;
      }
    }

    return NextResponse.json(
      {
        totalGross,
        feesCollected,
        netPayouts,
        avgChargePerTestPerVet,
        grossSplit: {
          exams: { gross: examsGross, count: examsCount },
          upgrades: { gross: upgradesGross, count: upgradesCount },
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
