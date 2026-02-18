import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

const allowedStatuses = new Set(["created", "paid", "delivered", "cancelled"]);

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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    await connectMongo();

    const coll = mongoose.connection.collection("store_orders");
    const orderId = new mongoose.Types.ObjectId(id);
    const pipeline: any[] = [
      { $match: { _id: orderId } },
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
      { $limit: 1 },
    ];

    const rows = await coll.aggregate(pipeline).toArray();
    const doc: any = rows?.[0] || null;
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = Array.isArray(doc?.items)
      ? doc.items
          .map((i: any) => ({
            productId: typeof i?.productId === "string" ? i.productId : "",
            name: typeof i?.name === "string" ? i.name : "",
            price: Number.isFinite(Number(i?.price)) ? Number(i.price) : 0,
            quantity: Number.isFinite(Number(i?.quantity)) ? Number(i.quantity) : 0,
          }))
          .filter((i: any) => i.name && i.quantity > 0)
      : [];

    const address =
      doc?.address && typeof doc.address === "object"
        ? {
            name: typeof doc.address.name === "string" ? doc.address.name : "",
            phone: typeof doc.address.phone === "string" ? doc.address.phone : "",
            location: typeof doc.address.location === "string" ? doc.address.location : "",
            addressLine: typeof doc.address.addressLine === "string" ? doc.address.addressLine : "",
            city: typeof doc.address.city === "string" ? doc.address.city : "",
            state: typeof doc.address.state === "string" ? doc.address.state : "",
            postalCode: typeof doc.address.postalCode === "string" ? doc.address.postalCode : "",
          }
        : null;

    const vetFullName = typeof doc?.vet?.fullName === "string" ? doc.vet.fullName : "";
    const vetTradeName = typeof doc?.vet?.tradeName === "string" ? doc.vet.tradeName : "";
    const vetId = doc?.veterinarian ? String(doc.veterinarian) : "";

    const status = typeof doc?.status === "string" ? doc.status : "created";
    const total = Number.isFinite(Number(doc?.total)) ? Number(doc.total) : 0;
    const provider = typeof doc?.provider === "string" ? doc.provider : "";
    const providerTransactionId = typeof doc?.providerTransactionId === "string" ? doc.providerTransactionId : "";
    const createdAt = doc?.createdAt ? new Date(doc.createdAt).toISOString() : null;
    const updatedAt = doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null;

    return NextResponse.json(
      {
        order: {
          id: String(doc?._id),
          status,
          total,
          provider,
          providerTransactionId,
          createdAt,
          updatedAt,
          items,
          address,
          veterinarian: {
            id: vetId,
            fullName: vetFullName,
            tradeName: vetTradeName,
          },
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const statusRaw = typeof (body as any)?.status === "string" ? String((body as any).status) : "";
    const status = statusRaw.trim().toLowerCase();
    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await connectMongo();
    const coll = mongoose.connection.collection("store_orders");
    const orderId = new mongoose.Types.ObjectId(id);
    const out = await coll.updateOne(
      { _id: orderId },
      { $set: { status, updatedAt: new Date() } }
    );

    if (!out.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, status }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
