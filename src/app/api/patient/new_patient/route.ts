import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";
import { asNonEmptyTrimmedString, asOptionalTrimmedString, isMongoObjectId } from "@/lib/utils";
import jwt from "jsonwebtoken";

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

function asPhotoUrl(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asSex(value: unknown): "Male" | "Female" | "" | null {
  const v = asOptionalTrimmedString(value);
  if (!v) return "";
  if (v === "Male" || v === "Female") return v;
  return null;
}

function asNeutered(value: unknown): "Yes" | "No" | "" | null {
  const v = asOptionalTrimmedString(value);
  if (!v) return "";
  if (v === "Yes" || v === "No") return v;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isMongoObjectId(veterinarianId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const guardianId = asNonEmptyTrimmedString((body as any).guardianId);
    if (!guardianId) return NextResponse.json({ error: "guardianId is required" }, { status: 400 });
    if (!isMongoObjectId(guardianId)) return NextResponse.json({ error: "Invalid guardianId" }, { status: 400 });

    const animalName = asNonEmptyTrimmedString((body as any).animalName);
    if (!animalName) return NextResponse.json({ error: "animalName is required" }, { status: 400 });

    const sex = asSex((body as any).sex);
    if (sex === null) return NextResponse.json({ error: "Invalid sex" }, { status: 400 });

    const neutered = asNeutered((body as any).neutered);
    if (neutered === null) return NextResponse.json({ error: "Invalid neutered" }, { status: 400 });

    const isAlive = (body as any).isAlive;
    if (isAlive !== undefined && typeof isAlive !== "boolean") {
      return NextResponse.json({ error: "Invalid isAlive" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role fullName tradeName").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Veterinarian not found" }, { status: 404 });
    }

    const guardian = await User.findById(guardianId).select("_id role").lean();
    if (!guardian || guardian.role !== "Guardian") {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
    }

    const doc = await Patient.create({
      guardian: guardianId,
      veterinarian: veterinarianId,
      photo: asPhotoUrl((body as any).photo),
      animalName,
      microchip: asOptionalTrimmedString((body as any).microchip),
      species: asOptionalTrimmedString((body as any).species),
      breed: asOptionalTrimmedString((body as any).breed),
      sex,
      dateOfBirth: asOptionalTrimmedString((body as any).dateOfBirth),
      temperament: asOptionalTrimmedString((body as any).temperament),
      size: asOptionalTrimmedString((body as any).size),
      coat: asOptionalTrimmedString((body as any).coat),
      neutered,
      rga: asOptionalTrimmedString((body as any).rga),
      planName: asOptionalTrimmedString((body as any).planName),
      cardNumber: asOptionalTrimmedString((body as any).cardNumber),
      cardValidity: asOptionalTrimmedString((body as any).cardValidity),
      allergies: asOptionalTrimmedString((body as any).allergies),
      chronicDiseases: asOptionalTrimmedString((body as any).chronicDiseases),
      otherInformation: asOptionalTrimmedString((body as any).otherInformation),
      internalNotes: asOptionalTrimmedString((body as any).internalNotes),
      isAlive: typeof isAlive === "boolean" ? isAlive : true,
    });

    const vetName = String((veterinarian as any).tradeName || (veterinarian as any).fullName || "Veterinarian");
    const title = "New patient added";
    const message = `${vetName} added ${animalName} to your pets.`;
    const url = `/Guardian/home/petDetails/${encodeURIComponent(String(doc._id))}`;

    const notification = await Notification.create({
      user: guardianId,
      type: "patient_added",
      title,
      message,
      url,
      readAt: null,
    });

    const pusher = getPusherServer();
    await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
      id: String(notification._id),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      url: notification.url,
      createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
    });

    return NextResponse.json({ id: String(doc._id) }, { status: 201 });
  } catch (e) {
    console.log("e----", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isMongoObjectId(veterinarianId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const patientId = asNonEmptyTrimmedString((body as any).patientId);
    if (!patientId) return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    if (!isMongoObjectId(patientId)) return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    const resolvedPatientId = patientId;

    const animalName = asNonEmptyTrimmedString((body as any).animalName);
    if (!animalName) return NextResponse.json({ error: "animalName is required" }, { status: 400 });

    const sex = asSex((body as any).sex);
    if (sex === null) return NextResponse.json({ error: "Invalid sex" }, { status: 400 });

    const neutered = asNeutered((body as any).neutered);
    if (neutered === null) return NextResponse.json({ error: "Invalid neutered" }, { status: 400 });

    const isAlive = (body as any).isAlive;
    if (isAlive !== undefined && typeof isAlive !== "boolean") {
      return NextResponse.json({ error: "Invalid isAlive" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update: Record<string, any> = {
      photo: asPhotoUrl((body as any).photo),
      animalName,
      microchip: asOptionalTrimmedString((body as any).microchip),
      species: asOptionalTrimmedString((body as any).species),
      breed: asOptionalTrimmedString((body as any).breed),
      sex,
      dateOfBirth: asOptionalTrimmedString((body as any).dateOfBirth),
      temperament: asOptionalTrimmedString((body as any).temperament),
      size: asOptionalTrimmedString((body as any).size),
      coat: asOptionalTrimmedString((body as any).coat),
      neutered,
      rga: asOptionalTrimmedString((body as any).rga),
      planName: asOptionalTrimmedString((body as any).planName),
      cardNumber: asOptionalTrimmedString((body as any).cardNumber),
      cardValidity: asOptionalTrimmedString((body as any).cardValidity),
      allergies: asOptionalTrimmedString((body as any).allergies),
      chronicDiseases: asOptionalTrimmedString((body as any).chronicDiseases),
      otherInformation: asOptionalTrimmedString((body as any).otherInformation),
      internalNotes: asOptionalTrimmedString((body as any).internalNotes),
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

    const guardianId = String(updated.guardian);
    if (isMongoObjectId(guardianId)) {
      const vetName = String((veterinarian as any).tradeName || (veterinarian as any).fullName || "Veterinarian");
      const title = "Patient details updated";
      const message = `${vetName} updated the details for ${animalName}.`;
      const url = `/Guardian/home/petDetails/${encodeURIComponent(String(updated._id))}`;

      const notification = await Notification.create({
        user: guardianId,
        type: "patient_updated",
        title,
        message,
        url,
        readAt: null,
      });

      const pusher = getPusherServer();
      await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
        id: String(notification._id),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        url: notification.url,
        createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
      });
    }

    return NextResponse.json({ id: String(updated._id) }, { status: 200 });
  } catch (e) {
    console.log("e----", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
