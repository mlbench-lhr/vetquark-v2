import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

function normalizeSlug(input: string) {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s;
}

async function ensureUniqueSlug(
  coll: mongoose.mongo.Collection,
  desired: string,
  excludeId: mongoose.Types.ObjectId
) {
  const base = normalizeSlug(desired);
  if (!base) return "";
  const existing = await coll.findOne({ slug: base, _id: { $ne: excludeId } }, { projection: { _id: 1 } });
  if (!existing) return base;
  for (let i = 2; i <= 200; i++) {
    const candidate = `${base}-${i}`;
    const hit = await coll.findOne({ slug: candidate, _id: { $ne: excludeId } }, { projection: { _id: 1 } });
    if (!hit) return candidate;
  }
  return "";
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

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const resolved = await Promise.resolve(ctx.params);
    const id = String((resolved as any)?.id || "").trim();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const coll = mongoose.connection.collection("store_products");
    const result = await coll.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { active: false, updatedAt: new Date() } }
    );

    if (!result.matchedCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const resolved = await Promise.resolve(ctx.params);
    const id = String((resolved as any)?.id || "").trim();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);

    const name = typeof (body as any)?.name === "string" ? String((body as any).name).trim() : undefined;
    const description =
      typeof (body as any)?.description === "string" ? String((body as any).description).trim() : undefined;
    const image = typeof (body as any)?.image === "string" ? String((body as any).image).trim() : undefined;
    const slugInput = typeof (body as any)?.slug === "string" ? String((body as any).slug).trim() : undefined;
    const active = typeof (body as any)?.active === "boolean" ? Boolean((body as any).active) : undefined;

    const priceRaw = (body as any)?.price;
    const stockRaw = (body as any)?.stock;

    const price = priceRaw === undefined ? undefined : Number(priceRaw);
    const stock = stockRaw === undefined ? undefined : Number(stockRaw);

    if (name !== undefined && !name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    if (stock !== undefined && (!Number.isFinite(stock) || Math.trunc(stock) < 0)) {
      return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    }

    const coll = mongoose.connection.collection("store_products");
    const objectId = new mongoose.Types.ObjectId(id);

    const $set: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) $set.name = name;
    if (description !== undefined) $set.description = description;
    if (image !== undefined) $set.image = image;
    if (active !== undefined) $set.active = active;
    if (price !== undefined) $set.price = price;
    if (stock !== undefined) $set.stock = Math.trunc(stock);

    if (slugInput !== undefined) {
      const uniqueSlug = await ensureUniqueSlug(coll, slugInput || name || "", objectId);
      if (!uniqueSlug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
      $set.slug = uniqueSlug;
    }

    const result = await coll.updateOne({ _id: objectId }, { $set });
    if (!result.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
