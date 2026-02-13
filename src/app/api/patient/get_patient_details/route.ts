import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    const veterinarianId = req.headers.get("x-user-id");
    if (!veterinarianId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const patientId = (url.searchParams.get("patientId") || "").trim();
    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const doc = await Patient.findOne({ _id: patientId, veterinarian: veterinarianId })
      .populate("guardian", "fullName taxId email")
      .lean();

    if (!doc) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const item = {
      id: String(doc._id),
      animalName: doc.animalName,
      photo: doc.photo ?? null,
      microchip: doc.microchip ?? "",
      species: doc.species ?? "",
      breed: doc.breed ?? "",
      sex: doc.sex ?? "",
      dateOfBirth: doc.dateOfBirth ?? "",
      ageYears: typeof (doc as any).ageYears === "number" ? (doc as any).ageYears : null,
      temperament: doc.temperament ?? "",
      size: doc.size ?? "",
      coat: doc.coat ?? "",
      neutered: doc.neutered ?? "",
      rga: doc.rga ?? "",
      planName: doc.planName ?? "",
      cardNumber: doc.cardNumber ?? "",
      cardValidity: doc.cardValidity ?? "",
      allergies: doc.allergies ?? "",
      chronicDiseases: doc.chronicDiseases ?? "",
      otherInformation: doc.otherInformation ?? "",
      internalNotes: doc.internalNotes ?? "",
      isAlive: typeof doc.isAlive === "boolean" ? doc.isAlive : true,
      guardian: doc.guardian
        ? {
            id: String((doc.guardian as any)._id),
            fullName: (doc.guardian as any).fullName ?? "",
            taxId: (doc.guardian as any).taxId ?? "",
            email: (doc.guardian as any).email ?? "",
          }
        : null,
      createdAt: doc.createdAt ?? null,
      updatedAt: doc.updatedAt ?? null,
    };

    return NextResponse.json({ item }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
