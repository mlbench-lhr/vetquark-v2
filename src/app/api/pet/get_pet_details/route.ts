import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    const guardianId = req.headers.get("x-user-id");
    if (!guardianId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const petId = (url.searchParams.get("petId") || "").trim();
    if (!petId) {
      return NextResponse.json({ error: "petId is required" }, { status: 400 });
    }

    await connectMongo();

    const guardian = await User.findById(guardianId).select("_id role").lean();
    // if (!guardian || guardian.role !== "Guardian") {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    // const doc = await Patient.findOne({ _id: petId, guardian: guardianId })
    const doc = await Patient.findOne({ _id: petId })
      .populate("veterinarian", "fullName tradeName email")
      .lean();

    if (!doc) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
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
      veterinarian: doc.veterinarian
        ? {
            id: String((doc.veterinarian as any)._id),
            fullName: (doc.veterinarian as any).fullName ?? "",
            tradeName: (doc.veterinarian as any).tradeName ?? "",
            email: (doc.veterinarian as any).email ?? "",
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

