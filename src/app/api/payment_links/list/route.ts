import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentLink from "@/lib/models/PaymentLink";

export async function GET(req: NextRequest) {
  try {
    const veterinarianId = String(req.headers.get("x-user-id") || "").trim();
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const patientId = String(url.searchParams.get("patientId") || "").trim();
    if (patientId && !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const filter: any = {
      veterinarian: veterinarianId,
      status: "pending",
      reading: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };
    if (patientId) filter.patient = patientId;

    const docs = await PaymentLink.find(filter)
      .populate("patient", "animalName photo")
      .populate("guardian", "fullName")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const keep: any[] = [];
    for (const it of docs as any[]) {
      const createdAt = it.createdAt ? new Date(it.createdAt as any) : null;
      const expiresAt = it.expiresAt ? new Date(it.expiresAt as any) : null;
      const fallbackExpired = !expiresAt && createdAt ? now.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000 : false;
      const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : fallbackExpired;
      if (isExpired) {
        await PaymentLink.updateOne({ _id: it._id, status: "pending" }, { $set: { status: "expired", expiresAt: expiresAt ?? createdAt } });
        continue;
      }
      keep.push(it);
    }

    const items = keep.map((it: any) => ({
      id: String(it._id),
      patientId: String(it.patient?._id ?? it.patient ?? ""),
      patientName: String(it.patient?.animalName ?? "N/A"),
      guardianName: String(it.guardian?.fullName ?? "N/A"),
      date: (it.createdAt ? new Date(it.createdAt).toISOString() : new Date().toISOString()),
      avatarSrc: String(it.patient?.photo || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
      paymentLinkStatus: String(it.status || "pending"),
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
