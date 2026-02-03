import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

function getUserIdFromRequest(req: NextRequest): { userId: string | null; error: NextResponse | null } {
  const headerId = req.headers.get("x-user-id");
  if (headerId?.trim()) return { userId: headerId.trim(), error: null };

  const token = req.cookies.get("session_id")?.value || req.cookies.get("auth_token")?.value;
  if (!token) return { userId: null, error: null };

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }),
    };
  }

  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object" && "sub" in decoded) {
      const sub = (decoded as { sub?: unknown }).sub;
      if (typeof sub === "string" && sub.trim()) return { userId: sub.trim(), error: null };
    }
    return { userId: null, error: null };
  } catch {
    return { userId: null, error: null };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const coll = mongoose.connection.collection("store_products");
    const existing = await coll.find({ active: { $ne: false } }).sort({ name: 1, _id: -1 }).toArray();

    if (!existing.length) {
      const defaults = [
        {
          slug: "vetquark-box",
          name: "VetQuark Box",
          description: "Box with 100 units of reagent strips",
          price: 135,
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
          image: "/store image 4.png",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await coll.insertMany(defaults);
    }

    const docs = await coll.find({ active: { $ne: false } }).sort({ name: 1, _id: -1 }).toArray();
    const products = docs.map((d: any) => ({
      id: typeof d.slug === "string" ? d.slug : String(d._id),
      name: typeof d.name === "string" ? d.name : "",
      description: typeof d.description === "string" ? d.description : "",
      price: Number.isFinite(Number(d.price)) ? Number(d.price) : 0,
      image: typeof d.image === "string" ? d.image : "",
    }));

    return NextResponse.json({ products }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
