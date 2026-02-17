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

function normalizeSlug(input: string) {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s;
}

async function ensureUniqueSlug(coll: mongoose.mongo.Collection, desired: string) {
  const base = normalizeSlug(desired);
  if (!base) return "";
  const existing = await coll.findOne({ slug: base }, { projection: { _id: 1 } });
  if (!existing) return base;
  for (let i = 2; i <= 200; i++) {
    const candidate = `${base}-${i}`;
    const hit = await coll.findOne({ slug: candidate }, { projection: { _id: 1 } });
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

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const page = clampInt(url.searchParams.get("page"), 1, 1, 10_000);
    const limit = clampInt(url.searchParams.get("limit"), 10, 1, 100);
    const search = String(url.searchParams.get("search") || "").trim();

    const coll = mongoose.connection.collection("store_products");

    const totalDocs = await coll.countDocuments({});
    if (totalDocs === 0) {
      const defaults = [
        {
          slug: "vetquark-box",
          name: "VetQuark Box",
          description: "Box with 100 units of reagent strips",
          price: 135,
          stock: 0,
          image: "/store image 1.png",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          slug: "svovmi",
          name: "SVOFMI",
          description: "Reagent strips pack",
          price: 75,
          stock: 0,
          image: "/store image 2.png",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          slug: "amoxylife-la",
          name: "Amoxylife-LA",
          description: "Long-acting antibiotic",
          price: 110,
          stock: 0,
          image: "/store image 3.png",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          slug: "vetquark-kits",
          name: "VetQuark Kits",
          description: "Starter kits for clinic use",
          price: 250,
          stock: 0,
          image: "/store image 4.png",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      await coll.insertMany(defaults);
    }

    const filter: any = {};
    if (search) {
      const q = escapeRegex(search);
      const rx = new RegExp(q, "i");
      filter.$or = [{ name: { $regex: rx } }, { slug: { $regex: rx } }];
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
    }

    const skip = (page - 1) * limit;
    const [total, docs] = await Promise.all([
      coll.countDocuments(filter),
      coll
        .find(filter)
        .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const data = (docs as any[]).map((d) => {
      const updatedAt = d?.updatedAt ? new Date(d.updatedAt) : d?.createdAt ? new Date(d.createdAt) : null;
      const priceNumber = Number(d?.price);
      const stockNumber = Number(d?.stock);
      return {
        id: String(d?._id),
        slug: typeof d?.slug === "string" ? d.slug : "",
        name: typeof d?.name === "string" ? d.name : "",
        description: typeof d?.description === "string" ? d.description : "",
        image: typeof d?.image === "string" ? d.image : "",
        active: d?.active === false ? false : true,
        createdAt: d?.createdAt ? new Date(d.createdAt).toISOString() : null,
        updatedAt: d?.updatedAt ? new Date(d.updatedAt).toISOString() : null,
        unitPrice: Number.isFinite(priceNumber) ? priceNumber : 0,
        price: Number.isFinite(priceNumber) ? priceNumber : 0,
        stock: Number.isFinite(stockNumber) ? stockNumber : 0,
        status: d?.active === false ? "inactive" : "active",
        lastUpdated: updatedAt ? updatedAt.toISOString() : null,
      };
    });

    return NextResponse.json(
      {
        data,
        pagination: {
          total: total,
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

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => null);

    const name = typeof (body as any)?.name === "string" ? String((body as any).name).trim() : "";
    const description =
      typeof (body as any)?.description === "string" ? String((body as any).description).trim() : "";
    const image = typeof (body as any)?.image === "string" ? String((body as any).image).trim() : "";
    const slugInput = typeof (body as any)?.slug === "string" ? String((body as any).slug).trim() : "";
    const active = typeof (body as any)?.active === "boolean" ? Boolean((body as any).active) : true;

    const price = Number((body as any)?.price);
    const stock = Number((body as any)?.stock);

    const safePrice = Number.isFinite(price) ? price : NaN;
    const safeStock = Number.isFinite(stock) ? Math.trunc(stock) : NaN;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!Number.isFinite(safePrice) || safePrice < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    if (!Number.isFinite(safeStock) || safeStock < 0) {
      return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    }

    const coll = mongoose.connection.collection("store_products");
    const uniqueSlug = await ensureUniqueSlug(coll, slugInput || name);
    if (!uniqueSlug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

    const now = new Date();
    const doc = {
      slug: uniqueSlug,
      name,
      description,
      price: safePrice,
      stock: safeStock,
      image,
      active,
      createdAt: now,
      updatedAt: now,
    };

    const result = await coll.insertOne(doc);

    return NextResponse.json({ ok: true, id: String(result.insertedId) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
