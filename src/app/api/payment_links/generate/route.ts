import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import PaymentLink from "@/lib/models/PaymentLink";
import Reading from "@/lib/models/Reading";

function formatBRL(amount: number) {
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

export async function POST(req: NextRequest) {
  try {
    const veterinarianId = String(req.headers.get("x-user-id") || "").trim();
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const patientId = String(body?.patientId || "").trim();
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role baseExamPrice tradeName fullName").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patient = await Patient.findOne({ _id: patientId, veterinarian: veterinarianId })
      .select("_id guardian animalName")
      .populate("guardian", "_id fullName")
      .lean();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const now = new Date();
    const candidates = await PaymentLink.find({
      veterinarian: veterinarianId,
      patient: patientId,
      status: { $in: ["pending", "paid"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    let existing: any = null;
    for (const link of candidates) {
      const createdAt = link.createdAt ? new Date(link.createdAt as any) : null;
      const expiresAt = link.expiresAt ? new Date(link.expiresAt as any) : null;
      const fallbackExpired = !expiresAt && createdAt ? now.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000 : false;
      const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : fallbackExpired;

      if (link.status === "pending" && isExpired) {
        await PaymentLink.updateOne({ _id: link._id, status: "pending" }, { $set: { status: "expired", expiresAt: expiresAt ?? createdAt } });
        continue;
      }
      if (isExpired) continue;

      const readingId = link.reading ? String(link.reading) : "";
      if (!readingId) {
        existing = link;
        break;
      }
      if (!mongoose.Types.ObjectId.isValid(readingId)) continue;
      const reading = await Reading.findById(readingId).select("_id signedAt").lean();
      if (!reading) continue;
      if (!reading.signedAt) {
        existing = link;
        break;
      }
    }

    if (existing) {
      return NextResponse.json(
        {
          id: String(existing._id),
          amount: existing.amount,
          amountLabel: formatBRL(existing.amount),
          url: `/Guardian/payment/${encodeURIComponent(String(existing._id))}`,
          existing: true,
        },
        { status: 200 }
      );
    }

    const amount = typeof veterinarian.baseExamPrice === "number" && Number.isFinite(veterinarian.baseExamPrice) ? veterinarian.baseExamPrice : 89.9;
    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + 24);
    const created = await PaymentLink.create({
      veterinarian: veterinarianId,
      guardian: (patient as any).guardian?._id ?? (patient as any).guardian,
      patient: patientId,
      amount,
      currency: "BRL",
      status: "pending",
      expiresAt,
    });

    return NextResponse.json(
      {
        id: String(created._id),
        amount,
        amountLabel: formatBRL(amount),
        url: `/Guardian/payment/${encodeURIComponent(String(created._id))}`,
        existing: false,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
