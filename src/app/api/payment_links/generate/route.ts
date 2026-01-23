import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import PaymentLink from "@/lib/models/PaymentLink";

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

    const amount = typeof veterinarian.baseExamPrice === "number" && Number.isFinite(veterinarian.baseExamPrice) ? veterinarian.baseExamPrice : 89.9;
    const created = await PaymentLink.create({
      veterinarian: veterinarianId,
      guardian: (patient as any).guardian?._id ?? (patient as any).guardian,
      patient: patientId,
      amount,
      currency: "BRL",
      status: "pending",
    });

    return NextResponse.json(
      {
        id: String(created._id),
        amount,
        amountLabel: formatBRL(amount),
        url: `/Guardian/payment/${encodeURIComponent(String(created._id))}`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

