import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";
import mongoose from "mongoose";

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

export async function PUT(req: NextRequest) {
  try {
    const veterinarianId = req.headers.get("x-user-id");
    if (!veterinarianId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      patientId,
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

    if (!patientId || typeof patientId !== "string" || !patientId.trim()) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }
    const resolvedPatientId = patientId.trim();
    if (!mongoose.Types.ObjectId.isValid(resolvedPatientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }
    if (!animalName || typeof animalName !== "string" || !animalName.trim()) {
      return NextResponse.json({ error: "animalName is required" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update: Record<string, any> = {
      photo: photo ?? null,
      animalName: animalName.trim(),
      microchip: microchip ?? "",
      species: species ?? "",
      breed: breed ?? "",
      sex: sex ?? "",
      dateOfBirth: dateOfBirth ?? "",
      temperament: temperament ?? "",
      size: size ?? "",
      coat: coat ?? "",
      neutered: neutered ?? "",
      rga: rga ?? "",
      planName: planName ?? "",
      cardNumber: cardNumber ?? "",
      cardValidity: cardValidity ?? "",
      allergies: allergies ?? "",
      chronicDiseases: chronicDiseases ?? "",
      otherInformation: otherInformation ?? "",
      internalNotes: internalNotes ?? "",
      isAlive: typeof isAlive === "boolean" ? isAlive : true,
    };

    const updated = await Patient.findOneAndUpdate(
      { _id: resolvedPatientId, veterinarian: veterinarianId },
      { $set: update },
      { new: true }
    ).lean();

    if (!updated?._id) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ id: String(updated._id) }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
