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
        name: typeof d?.name === "string" ? d.name : "",
        unitPrice: Number.isFinite(priceNumber) ? priceNumber : 0,
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

