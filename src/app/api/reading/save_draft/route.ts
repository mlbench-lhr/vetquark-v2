import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import Reading from "@/lib/models/Reading";
import PaymentLink from "@/lib/models/PaymentLink";

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

function toDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function asWizardStep(value: unknown): "identification" | "timer" | "review" | "report" | null {
  if (value === "identification" || value === "timer" || value === "review" || value === "report") return value;
  return null;
}

function asCollectionMethod(value: unknown): "free_catch" | "cystocentesis" | "catheter" | null {
  if (value === "free_catch" || value === "cystocentesis" || value === "catheter") return value;
  return null;
}

async function computePaymentStatusForLink(args: {
  veterinarianId: string;
  patientId: string;
  paymentLinkId: string;
}): Promise<{
  paymentStatus: "pending" | "paid" | "expired" | null;
  linkProductCode: string | null;
  linkPanelVersion: number | null;
  linkReadingId: string | null;
}> {
  const link = await PaymentLink.findOne({
    _id: args.paymentLinkId,
    veterinarian: args.veterinarianId,
    patient: args.patientId,
  })
    .select("_id status reading expiresAt createdAt productCode panelVersion")
    .lean();
  if (!link) {
    throw new Error("PAYMENT_LINK_NOT_FOUND");
  }

  const linkProductCode = typeof (link as any).productCode === "string" ? String((link as any).productCode || "").trim() : null;
  const linkPanelVersion = Number.isFinite(Number((link as any).panelVersion)) ? Number((link as any).panelVersion) : null;

  const now = new Date();
  const createdAt = (link as any).createdAt ? new Date((link as any).createdAt) : null;
  const expiresAt = (link as any).expiresAt ? new Date((link as any).expiresAt) : null;
  const fallbackExpired = !expiresAt && createdAt ? now.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000 : false;
  const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : fallbackExpired;

  let paymentStatus: "pending" | "paid" | "expired" | null = null;
  if ((link as any).status === "pending" && isExpired) {
    await PaymentLink.updateOne(
      { _id: args.paymentLinkId, status: "pending" },
      { $set: { status: "expired", expiresAt: expiresAt ?? createdAt } },
    );
    paymentStatus = "expired";
  } else {
    paymentStatus = (link as any).status === "paid" ? "paid" : "pending";
  }

  const linkReadingId = (link as any).reading ? String((link as any).reading) : null;
  return { paymentStatus, linkProductCode, linkPanelVersion, linkReadingId };
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

    const draftIdRaw = String((body as any).draftId || "").trim();
    const draftId = draftIdRaw && mongoose.Types.ObjectId.isValid(draftIdRaw) ? draftIdRaw : "";

    const patientIdRaw = String((body as any).patientId || "").trim();
    const patientId = patientIdRaw && mongoose.Types.ObjectId.isValid(patientIdRaw) ? patientIdRaw : "";

    const paymentLinkIdRaw = String((body as any).paymentLinkId || "").trim();
    const paymentLinkId = paymentLinkIdRaw && mongoose.Types.ObjectId.isValid(paymentLinkIdRaw) ? paymentLinkIdRaw : "";

    const wizardStep = asWizardStep((body as any).wizardStep) ?? "identification";
    const productCode = String((body as any).productCode || "VETQ_MASTER_360").trim() || "VETQ_MASTER_360";

    const identification = (body as any).identification || {};
    const collectionMethod = asCollectionMethod(identification.collectionMethod);
    const stripLot = typeof identification.stripLot === "string" ? identification.stripLot : undefined;
    const collectionAt = toDateOrNull(identification.collectionAt);
    const stripExpiry = toDateOrNull(identification.stripExpiry);

    const timer = (body as any).timer || {};
    const selectedSeconds =
      typeof timer.selectedSeconds === "number" && Number.isFinite(timer.selectedSeconds) ? timer.selectedSeconds : undefined;
    const analyzedAt = toDateOrNull(timer.analyzedAt);
    const analysis = timer.analysis && typeof timer.analysis === "object" ? timer.analysis : null;

    const resultsRaw = Array.isArray((body as any).results) ? (body as any).results : undefined;
    const report = (body as any).report && typeof (body as any).report === "object" ? (body as any).report : undefined;
    const signatureImageUrl = typeof (body as any).signatureImageUrl === "string" ? (body as any).signatureImageUrl : undefined;

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let resolvedPatientId = patientId;
    if (!resolvedPatientId && draftId) {
      const existing = await Reading.findOne({ _id: draftId, veterinarian: veterinarianId }).select("_id patient signedAt").lean();
      if (existing?.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });
      resolvedPatientId = String((existing as any)?.patient || "").trim();
    }
    if (!resolvedPatientId || !mongoose.Types.ObjectId.isValid(resolvedPatientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }

    const patient = await Patient.findOne({ _id: resolvedPatientId, veterinarian: veterinarianId })
      .select("_id guardian")
      .lean();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    let paymentStatus: "pending" | "paid" | "expired" | null = null;
    let linkProductCode: string | null = null;
    let linkPanelVersion: number | null = null;
    let linkReadingId: string | null = null;

    if (paymentLinkId) {
      try {
        const linkInfo = await computePaymentStatusForLink({ veterinarianId, patientId: resolvedPatientId, paymentLinkId });
        paymentStatus = linkInfo.paymentStatus;
        linkProductCode = linkInfo.linkProductCode;
        linkPanelVersion = linkInfo.linkPanelVersion;
        linkReadingId = linkInfo.linkReadingId;
      } catch (e) {
        if (e instanceof Error && e.message === "PAYMENT_LINK_NOT_FOUND") {
          return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
        }
        throw e;
      }

      if (linkReadingId && mongoose.Types.ObjectId.isValid(linkReadingId)) {
        const existingReading = await Reading.findOne({ _id: linkReadingId, veterinarian: veterinarianId }).select("_id signedAt").lean();
        if (existingReading?.signedAt) {
          return NextResponse.json({ error: "Payment link already used" }, { status: 409 });
        }
      }
    }

    const targetId = (() => {
      if (draftId) return draftId;
      if (paymentLinkId && linkReadingId && mongoose.Types.ObjectId.isValid(linkReadingId)) return linkReadingId;
      return "";
    })();

    const update: any = {
      veterinarian: veterinarianId,
      guardian: (patient as any).guardian,
      patient: resolvedPatientId,
      isDraft: true,
      wizardStep,
      testType: "urine",
      productCode: linkProductCode || productCode || "VETQ_MASTER_360",
      panelVersion: linkPanelVersion || 1,
    };

    if (paymentLinkId) {
      update.paymentLink = paymentLinkId;
      update.paymentStatus = paymentStatus;
    }

    update.identification = {
      collectionMethod,
      collectionAt,
      stripLot: stripLot ?? "",
      stripExpiry,
    };

    if (selectedSeconds !== undefined || analyzedAt || analysis) {
      update.timer = {
        selectedSeconds,
        analyzedAt: analyzedAt ?? undefined,
        analysis: analysis ?? undefined,
      };
    }
    if (resultsRaw) update.results = resultsRaw;
    if (report) update.report = report;
    if (signatureImageUrl !== undefined) update.signatureImageUrl = signatureImageUrl;

    let saved: any = null;
    if (targetId) {
      saved = await Reading.findOneAndUpdate(
        { _id: targetId, veterinarian: veterinarianId, $or: [{ signedAt: { $exists: false } }, { signedAt: null }] },
        { $set: update },
        { new: true, upsert: false }
      ).lean();
      if (!saved) return NextResponse.json({ error: "Not found" }, { status: 404 });
    } else {
      saved = await Reading.create({
        ...update,
        signedAt: null,
      });
    }

    if (paymentLinkId) {
      await PaymentLink.updateOne(
        { _id: paymentLinkId, veterinarian: veterinarianId, patient: resolvedPatientId, $or: [{ reading: null }, { reading: saved._id }] },
        { $set: { reading: saved._id } },
      );
    }

    return NextResponse.json({ id: String(saved._id) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
