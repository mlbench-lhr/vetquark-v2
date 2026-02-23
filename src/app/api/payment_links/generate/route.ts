import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import PaymentLink from "@/lib/models/PaymentLink";
import Reading from "@/lib/models/Reading";
import PlatformSettings from "@/lib/models/PlatformSettings";

function formatBRL(amount: number) {
  return `R$ ${amount.toFixed(2)}`;
}

function parsePriceMaybe(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const DEFAULT_PANEL_PRICES: Record<string, number> = {
  VETQ_U_START: 33.9,
  VETQ_METABOLIC_CHECK: 49.9,
  VETQ_RENAL_EXPRESS: 59.9,
  VETQ_RENAL_ADVANCED: 69.9,
  VETQ_HEPATOSCREEN: 49.9,
  VETQ_GERIATRIC_CARE: 79.9,
  VETQ_MASTER_360: 89.9,
};

function isSupportedProductCode(code: string) {
  return Object.prototype.hasOwnProperty.call(DEFAULT_PANEL_PRICES, code);
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
    const productCodeRaw = String(body?.productCode || "").trim();
    const productCode = productCodeRaw && isSupportedProductCode(productCodeRaw) ? productCodeRaw : "VETQ_MASTER_360";

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role baseExamPrice panelPrices tradeName fullName").lean();
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
    const settingsDoc = await PlatformSettings.findOne({}).lean();
    const platformFee = settingsDoc && Number.isFinite(Number((settingsDoc as any).platformFeeBRL))
      ? Number((settingsDoc as any).platformFeeBRL)
      : 33.0;
    const rawPanelPrices =
      (veterinarian as any).panelPrices && typeof (veterinarian as any).panelPrices === "object" && !Array.isArray((veterinarian as any).panelPrices)
        ? ((veterinarian as any).panelPrices as any)
        : null;
    const customPanelPrice =
      productCode === "VETQ_MASTER_360"
        ? null
        : rawPanelPrices && Object.prototype.hasOwnProperty.call(rawPanelPrices, productCode)
          ? parsePriceMaybe(rawPanelPrices[productCode])
          : null;
    const fallback =
      productCode === "VETQ_MASTER_360"
        ? (typeof veterinarian.baseExamPrice === "number" && Number.isFinite(veterinarian.baseExamPrice) ? veterinarian.baseExamPrice : DEFAULT_PANEL_PRICES.VETQ_MASTER_360)
        : DEFAULT_PANEL_PRICES[productCode] ?? DEFAULT_PANEL_PRICES.VETQ_MASTER_360;
    const amount =
      typeof customPanelPrice === "number" && Number.isFinite(customPanelPrice) && customPanelPrice >= 0
        ? customPanelPrice
        : fallback;
    const amountNet = Math.max(0, amount - platformFee);
    const candidates = await PaymentLink.find({
      veterinarian: veterinarianId,
      patient: patientId,
      status: "pending",
      productCode,
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
        const existingAmount = Number(link.amount || 0);
        const existingFee = Number((link as any).platformFee || platformFee);
        const shouldUpdate =
          !Number.isFinite(existingAmount) ||
          Math.abs(existingAmount - amount) > 0.0001 ||
          !Number.isFinite(existingFee) ||
          Math.abs(existingFee - platformFee) > 0.0001;
        if (shouldUpdate) {
          await PaymentLink.updateOne(
            { _id: link._id, status: "pending" },
            { $set: { amount, platformFee, amountNet, productCode, panelVersion: 1 } },
          );
          link.amount = amount;
          (link as any).platformFee = platformFee;
          (link as any).amountNet = amountNet;
          (link as any).productCode = productCode;
          (link as any).panelVersion = 1;
        }
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

    // amount, platformFee, amountNet already computed above
    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + 24);
    const created = await PaymentLink.create({
      veterinarian: veterinarianId,
      guardian: (patient as any).guardian?._id ?? (patient as any).guardian,
      patient: patientId,
      kind: "reading_payment",
      productCode,
      panelVersion: 1,
      amount,
      platformFee,
      amountNet,
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
