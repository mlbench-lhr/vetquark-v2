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
    const coll = mongoose.connection.collection("wallettransactions");

    const match: any = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      const or: any[] = [
        { type: { $regex: rx } },
        { status: { $regex: rx } },
        { currency: { $regex: rx } },
        { "userDoc.fullName": { $regex: rx } },
        { "userDoc.tradeName": { $regex: rx } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
      match.$or = or;
    }

    const skip = (page - 1) * limit;
    const pipeline: any[] = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userArr",
        },
      },
      { $addFields: { userDoc: { $first: "$userArr" } } },
      { $project: { userArr: 0 } },
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $sort: { createdAt: -1, _id: -1 } },
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
      const id = String(d?._id);
      const createdAt = d?.createdAt ? new Date(d.createdAt) : null;
      const type = d?.type === "withdrawal" ? "withdrawal" : "credit";
      const statusRaw = d?.status === "released" ? "completed" : "pending";
      const userName =
        typeof d?.userDoc?.tradeName === "string" && d.userDoc.tradeName.trim()
          ? d.userDoc.tradeName.trim()
          : typeof d?.userDoc?.fullName === "string"
            ? d.userDoc.fullName
            : "—";

      const platformFee = Number(d?.platformFee);
      const amountNet = Number(d?.amountNet);
      const amount =
        type === "withdrawal"
          ? -(Number.isFinite(amountNet) ? amountNet : 0)
          : Number.isFinite(platformFee)
            ? platformFee
            : 0;

      const description =
        type === "withdrawal" ? `Platform Payout – ${userName}` : `Commission Fee – ${userName}`;

      return {
        id,
        // transactionId: `TXN-${id.slice(-6).toUpperCase()}`,
        transactionId: id,
        date: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : null,
        description,
        amount,
        currency: typeof d?.currency === "string" && d.currency ? d.currency : "BRL",
        status: statusRaw,
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

