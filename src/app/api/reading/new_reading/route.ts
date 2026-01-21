import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import Reading, { CollectionMethod, ReadingResultStatus } from "@/lib/models/Reading";

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

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return isValidDate(d) ? d : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function isCollectionMethod(value: unknown): value is CollectionMethod {
  return value === "free_catch" || value === "cystocentesis" || value === "catheter";
}

function isResultStatus(value: unknown): value is ReadingResultStatus {
  return value === "Normal" || value === "Abnormal";
}

export async function POST(req: NextRequest) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const patientId = String((body as any).patientId || "").trim();
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }

    const identification = (body as any).identification || {};
    const collectionMethod = identification.collectionMethod;
    const stripLot = String(identification.stripLot || "").trim();
    const collectionAt = toDate(identification.collectionAt);
    const stripExpiry = toDate(identification.stripExpiry);

    if (!isCollectionMethod(collectionMethod)) {
      return NextResponse.json({ error: "Invalid collectionMethod" }, { status: 400 });
    }
    if (!stripLot) {
      return NextResponse.json({ error: "stripLot is required" }, { status: 400 });
    }
    if (!collectionAt) {
      return NextResponse.json({ error: "Invalid collectionAt" }, { status: 400 });
    }
    if (!stripExpiry) {
      return NextResponse.json({ error: "Invalid stripExpiry" }, { status: 400 });
    }

    const timer = (body as any).timer || {};
    const selectedSeconds = toFiniteNumber(timer.selectedSeconds);
    const analyzedAt = toDate(timer.analyzedAt) ?? new Date();
    const analysis = timer.analysis || {};
    const analysisSummary = String(analysis.summary || "").trim();
    const analysisConfidence = toFiniteNumber(analysis.confidence);
    const analysisFlags = Array.isArray(analysis.flags) ? analysis.flags.map((x: any) => String(x || "").trim()).filter(Boolean) : [];

    if (!selectedSeconds || selectedSeconds <= 0) {
      return NextResponse.json({ error: "Invalid timer.selectedSeconds" }, { status: 400 });
    }
    if (!isValidDate(analyzedAt)) {
      return NextResponse.json({ error: "Invalid timer.analyzedAt" }, { status: 400 });
    }
    if (!analysisSummary) {
      return NextResponse.json({ error: "timer.analysis.summary is required" }, { status: 400 });
    }
    if (analysisConfidence === null || analysisConfidence < 0 || analysisConfidence > 1) {
      return NextResponse.json({ error: "timer.analysis.confidence must be between 0 and 1" }, { status: 400 });
    }

    const resultsRaw = (body as any).results;
    if (!Array.isArray(resultsRaw)) {
      return NextResponse.json({ error: "results must be an array" }, { status: 400 });
    }

    const results = resultsRaw.map((r: any) => {
      const key = String(r?.key || "").trim();
      const label = String(r?.label || "").trim();
      const unit = String(r?.unit || "").trim();
      const status = r?.status;
      const selectedIndex = toFiniteNumber(r?.selectedIndex);
      const valueLabel = String(r?.valueLabel || "").trim();
      const numericValue = r?.numericValue === undefined ? undefined : toFiniteNumber(r?.numericValue);

      return { key, label, unit, status, selectedIndex, valueLabel, numericValue };
    });

    for (const r of results) {
      if (!r.key || !r.label || !r.valueLabel) {
        return NextResponse.json({ error: "Invalid results item" }, { status: 400 });
      }
      if (!isResultStatus(r.status)) {
        return NextResponse.json({ error: "Invalid results status" }, { status: 400 });
      }
      if (r.selectedIndex === null || r.selectedIndex < 0) {
        return NextResponse.json({ error: "Invalid results selectedIndex" }, { status: 400 });
      }
      if (r.numericValue === null) {
        return NextResponse.json({ error: "Invalid results numericValue" }, { status: 400 });
      }
    }

    const report = (body as any).report || {};
    const summaryAndInterpretation = String(report.summaryAndInterpretation || "");
    const otherInformation = String(report.otherInformation || "");
    const veterinarianNotes = String(report.veterinarianNotes || "");

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patient = await Patient.findOne({ _id: patientId, veterinarian: veterinarianId }).select("_id guardian").lean();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const created = await Reading.create({
      veterinarian: veterinarianId,
      guardian: (patient as any).guardian,
      patient: patientId,
      testType: "urine",
      identification: {
        collectionMethod,
        collectionAt,
        stripLot,
        stripExpiry,
      },
      timer: {
        selectedSeconds,
        analyzedAt,
        analysis: {
          summary: analysisSummary,
          confidence: analysisConfidence,
          flags: analysisFlags,
        },
      },
      results,
      report: {
        summaryAndInterpretation,
        otherInformation,
        veterinarianNotes,
      },
      signedAt: new Date(),
    });

    return NextResponse.json({ id: String(created._id) }, { status: 201 });
  } catch (err){
    console.log("err------", err);
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

