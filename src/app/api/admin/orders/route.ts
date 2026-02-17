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

function buildProductsSummary(items: any[]) {
  if (!Array.isArray(items) || items.length === 0) return "—";
  const cleaned = items
    .map((i) => ({
      name: typeof i?.name === "string" ? i.name : "",
      quantity: Number.isFinite(Number(i?.quantity)) ? Number(i.quantity) : 0,
    }))
    .filter((x) => x.name && x.quantity > 0);
  if (cleaned.length === 0) return "—";

  const first = cleaned[0];
  const firstLabel = `${first.name} x${first.quantity}`;
  const rest = cleaned.length - 1;
  return rest > 0 ? `${firstLabel} +${rest}` : firstLabel;
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

    const coll = mongoose.connection.collection("store_orders");

    const match: any = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      const or: any[] = [
        { status: { $regex: rx } },
        { provider: { $regex: rx } },
        { providerTransactionId: { $regex: rx } },
        { "items.name": { $regex: rx } },
        { "vet.fullName": { $regex: rx } },
        { "vet.tradeName": { $regex: rx } },
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
          localField: "veterinarian",
          foreignField: "_id",
          as: "vetArr",
        },
      },
      { $addFields: { vet: { $first: "$vetArr" } } },
      { $project: { vetArr: 0 } },
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
      const createdAt = d?.createdAt ? new Date(d.createdAt) : null;
      const totalNumber = Number(d?.total);
      const amount = Number.isFinite(totalNumber) ? totalNumber : 0;
      const status = typeof d?.status === "string" ? d.status : "created";
      const payment = typeof d?.provider === "string" && d.provider.trim() ? d.provider.trim() : "—";
      const vetName =
        typeof d?.vet?.tradeName === "string" && d.vet.tradeName.trim()
          ? d.vet.tradeName.trim()
          : typeof d?.vet?.fullName === "string"
            ? d.vet.fullName
            : "—";

      return {
        id: String(d?._id),
        orderId: String(d?._id),
        veterinarian: vetName,
        products: buildProductsSummary(d?.items),
        amount,
        payment,
        status,
        date: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : null,
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

