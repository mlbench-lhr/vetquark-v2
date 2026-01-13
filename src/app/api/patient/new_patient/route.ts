import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const veterinarianId = req.headers.get("x-user-id");
    if (!veterinarianId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      guardianId,
      photo,
      animalName,
      microchip,
      species,
      breed,
      sex,
      dateOfBirth,
      temperament,
      size,
      coat,
      neutered,
      rga,
      planName,
      cardNumber,
      cardValidity,
      allergies,
      chronicDiseases,
      otherInformation,
      internalNotes,
      isAlive,
    } = body || {};

    if (!guardianId || !animalName) {
      return NextResponse.json({ error: "guardianId and animalName are required" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Veterinarian not found" }, { status: 404 });
    }

    const guardian = await User.findById(guardianId).lean();
    if (!guardian || guardian.role !== "Guardian") {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
    }

    const doc = await Patient.create({
      guardian: guardianId,
      veterinarian: veterinarianId,
      photo: photo ?? null,
      animalName,
      microchip,
      species,
      breed,
      sex,
      dateOfBirth,
      temperament,
      size,
      coat,
      neutered,
      rga,
      planName,
      cardNumber,
      cardValidity,
      allergies,
      chronicDiseases,
      otherInformation,
      internalNotes,
      isAlive: typeof isAlive === "boolean" ? isAlive : true,
    });

    return NextResponse.json({ id: doc._id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}