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
    const user = await User.findById(userId).lean();
    if (!user || user.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const coll = mongoose.connection.collection("store_addresses");
    const vetId = new mongoose.Types.ObjectId(userId);
    const docs = await coll.find({ veterinarian: vetId }).sort({ createdAt: -1, _id: -1 }).toArray();

    if (!docs.length) {
      const name = typeof user.tradeName === "string" && user.tradeName.trim()
        ? user.tradeName.trim()
        : `${(user.fullName || "Clinic").toString().split(" ")[0]} Clinic`;
      const city = typeof user.city === "string" && user.city.trim() ? user.city.trim() : "Recife";
      const state = typeof user.state === "string" && user.state.trim() ? user.state.trim() : "PE";
      const location = `${city}, ${state}`;
      const addressLine = typeof user.address === "string" && user.address.trim() ? user.address.trim() : "Av. Paulista, 1000";
      const phone = typeof user.phone === "string" && user.phone.trim() ? user.phone.trim() : "(81) 99999-9999";
      const postalCode = typeof user.postalCode === "string" && user.postalCode.trim() ? user.postalCode.trim() : "50000-000";

      await coll.insertOne({
        veterinarian: vetId,
        name,
        phone,
        location,
        addressLine,
        city,
        state,
        postalCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const refreshed = await coll.find({ veterinarian: vetId }).sort({ createdAt: -1, _id: -1 }).toArray();
    const addresses = refreshed.map((d: any) => ({
      id: String(d._id),
      name: typeof d.name === "string" ? d.name : "",
      phone: typeof d.phone === "string" ? d.phone : "",
      location: typeof d.location === "string" ? d.location : "",
      addressLine: typeof d.addressLine === "string" ? d.addressLine : "",
      city: typeof d.city === "string" ? d.city : "",
      state: typeof d.state === "string" ? d.state : "",
      postalCode: typeof d.postalCode === "string" ? d.postalCode : "",
    }));

    return NextResponse.json({ addresses }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const name = typeof (body as any).name === "string" ? (body as any).name.trim() : "";
    const phone = typeof (body as any).phone === "string" ? (body as any).phone.trim() : "";
    const addressLine = typeof (body as any).addressLine === "string" ? (body as any).addressLine.trim() : "";
    const city = typeof (body as any).city === "string" ? (body as any).city.trim() : "";
    const state = typeof (body as any).state === "string" ? (body as any).state.trim() : "";
    const postalCode = typeof (body as any).postalCode === "string" ? (body as any).postalCode.trim() : "";

    if (!name || !phone || !addressLine || !city || !state || !postalCode) {
      return NextResponse.json({ error: "Please fill all address fields" }, { status: 400 });
    }

    await connectMongo();
    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const coll = mongoose.connection.collection("store_addresses");
    const vetId = new mongoose.Types.ObjectId(userId);
    const location = `${city}, ${state}`;
    const now = new Date();
    const result = await coll.insertOne({
      veterinarian: vetId,
      name,
      phone,
      location,
      addressLine,
      city,
      state,
      postalCode,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        address: {
          id: String(result.insertedId),
          name,
          phone,
          location,
          addressLine,
          city,
          state,
          postalCode,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
