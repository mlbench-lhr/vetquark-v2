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

export async function POST(req: NextRequest) {
  try {
    const { userId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const itemsRaw = (body as any).items;
    const totalRaw = (body as any).total;
    const addressRaw = (body as any).address;

    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const total = Number(totalRaw);
    if (!Number.isFinite(total) || total < 0) {
      return NextResponse.json({ error: "Invalid total" }, { status: 400 });
    }

    const items = itemsRaw
      .map((i: any) => ({
        productId: typeof i?.productId === "string" ? i.productId.trim() : "",
        name: typeof i?.name === "string" ? i.name.trim() : "",
        price: Number(i?.price),
        quantity: Number(i?.quantity),
      }))
      .filter((i: any) => i.productId && i.name && Number.isFinite(i.price) && i.price >= 0 && Number.isFinite(i.quantity) && i.quantity > 0);

    if (items.length === 0) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    const address =
      addressRaw && typeof addressRaw === "object"
        ? {
            id: typeof (addressRaw as any).id === "string" ? (addressRaw as any).id : null,
            name: typeof (addressRaw as any).name === "string" ? (addressRaw as any).name : "",
            phone: typeof (addressRaw as any).phone === "string" ? (addressRaw as any).phone : "",
            location: typeof (addressRaw as any).location === "string" ? (addressRaw as any).location : "",
            addressLine: typeof (addressRaw as any).addressLine === "string" ? (addressRaw as any).addressLine : "",
            city: typeof (addressRaw as any).city === "string" ? (addressRaw as any).city : "",
            state: typeof (addressRaw as any).state === "string" ? (addressRaw as any).state : "",
            postalCode: typeof (addressRaw as any).postalCode === "string" ? (addressRaw as any).postalCode : "",
          }
        : null;

    await connectMongo();

    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const doc = {
      veterinarian: new mongoose.Types.ObjectId(userId),
      status: "created",
      items,
      total,
      address,
      createdAt: now,
      updatedAt: now,
    };

    const result = await mongoose.connection.collection("store_orders").insertOne(doc);
    return NextResponse.json({ order: { id: String(result.insertedId) } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

