import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentLink from "@/lib/models/PaymentLink";
import Reading from "@/lib/models/Reading";
import Patient from "@/lib/models/Patient";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";
import { isPushEnabledForUser } from "@/lib/utils";
import PlatformSettings from "@/lib/models/PlatformSettings";

function formatBRL(amount: number) {
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
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

function keysForProductCode(productCode: string): string[] | null {
  const code = (productCode || "").trim() || "VETQ_MASTER_360";
  if (code === "VETQ_MASTER_360") return null;
  if (code === "VETQ_U_START") return ["leukocytes", "nitrite", "blood", "ph", "specific-gravity"];
  if (code === "VETQ_METABOLIC_CHECK") return ["glucose", "ketone-bodies", "ph", "specific-gravity"];
  if (code === "VETQ_RENAL_EXPRESS") return ["glucose", "ketone-bodies", "ph", "specific-gravity"];
  if (code === "VETQ_RENAL_ADVANCED") return ["protein", "microalbumin", "creatine", "calcium", "magnesium", "ph", "specific-gravity"];
  if (code === "VETQ_HEPATOSCREEN") return ["bilirubin", "urobilinogen", "ph", "specific-gravity"];
  if (code === "VETQ_GERIATRIC_CARE") {
    return [
      "glucose",
      "ketone-bodies",
      "protein",
      "microalbumin",
      "creatine",
      "calcium",
      "bilirubin",
      "urobilinogen",
      "leukocytes",
      "nitrite",
      "blood",
      "ph",
      "specific-gravity",
    ];
  }
  return null;
}

function isStrictSupersetUpgrade(currentProductCode: string, targetProductCode: string) {
  const currentKeys = keysForProductCode(currentProductCode);
  if (currentKeys === null) return false;
  const targetKeys = keysForProductCode(targetProductCode);
  if (targetKeys === null) return (currentProductCode || "").trim() !== "VETQ_MASTER_360";
  if (!Array.isArray(currentKeys) || !Array.isArray(targetKeys)) return false;
  const targetSet = new Set(targetKeys);
  const allIncluded = currentKeys.every((k) => targetSet.has(k));
  return allIncluded && targetKeys.length > currentKeys.length;
}

export async function POST(req: NextRequest) {
  try {
    const veterinarianId = String(req.headers.get("x-user-id") || "").trim();
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const readingId = String(body?.readingId || "").trim();
    const productCode = String(body?.productCode || "").trim();
    if (!readingId || !mongoose.Types.ObjectId.isValid(readingId)) {
      return NextResponse.json({ error: "Invalid readingId" }, { status: 400 });
    }
    if (!productCode || !Object.prototype.hasOwnProperty.call(DEFAULT_PANEL_PRICES, productCode)) {
      return NextResponse.json({ error: "Invalid productCode" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role tradeName fullName panelPrices baseExamPrice").lean();
    if (!veterinarian || (veterinarian as any).role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reading: any = await Reading.findOne({ _id: readingId, veterinarian: veterinarianId })
      .select("_id patient guardian signedAt paymentStatus productCode panelVersion")
      .lean();
    if (!reading) return NextResponse.json({ error: "Reading not found" }, { status: 404 });
    if (!reading.signedAt) return NextResponse.json({ error: "Reading not signed" }, { status: 409 });
    if (String(reading.paymentStatus) !== "paid") return NextResponse.json({ error: "Reading payment not completed" }, { status: 409 });

    const currentProductCode = String(reading.productCode || "VETQ_MASTER_360");
    if (!isStrictSupersetUpgrade(currentProductCode, productCode)) {
      return NextResponse.json({ error: "Invalid upgrade target" }, { status: 400 });
    }

    const settingsDoc = await PlatformSettings.findOne({}).lean();
    const platformFee = settingsDoc && Number.isFinite(Number((settingsDoc as any).platformFeeBRL))
      ? Number((settingsDoc as any).platformFeeBRL)
      : 33.0;

    const rawPanelPrices =
      (veterinarian as any).panelPrices && typeof (veterinarian as any).panelPrices === "object" && !Array.isArray((veterinarian as any).panelPrices)
        ? ((veterinarian as any).panelPrices as any)
        : null;
    const customPanelPrice =
      rawPanelPrices && Object.prototype.hasOwnProperty.call(rawPanelPrices, productCode)
        ? (typeof rawPanelPrices[productCode] === "number" ? rawPanelPrices[productCode] : Number(rawPanelPrices[productCode]))
        : null;
    const fallback =
      productCode === "VETQ_MASTER_360"
        ? (typeof (veterinarian as any).baseExamPrice === "number" && Number.isFinite((veterinarian as any).baseExamPrice) ? (veterinarian as any).baseExamPrice : DEFAULT_PANEL_PRICES.VETQ_MASTER_360)
        : DEFAULT_PANEL_PRICES[productCode] ?? DEFAULT_PANEL_PRICES.VETQ_MASTER_360;
    const amount =
      typeof customPanelPrice === "number" && Number.isFinite(customPanelPrice) && customPanelPrice >= 0
        ? customPanelPrice
        : fallback;
    const amountNet = Math.max(0, amount - platformFee);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + 24);

    const created = await PaymentLink.create({
      veterinarian: veterinarianId,
      guardian: reading.guardian,
      patient: reading.patient,
      reading: reading._id,
      kind: "upgrade",
      productCode,
      panelVersion: 1,
      amount,
      platformFee,
      amountNet,
      currency: "BRL",
      status: "pending",
      expiresAt,
    });

    const patient = await Patient.findById(reading.patient).select("_id animalName").lean();
    const guardianId = String(reading.guardian);
    const url = `/Guardian/payment/${encodeURIComponent(String(created._id))}`;
    const vetName = String((veterinarian as any).tradeName || (veterinarian as any).fullName || "Veterinarian");
    const petName = String((patient as any)?.animalName || "your pet");

    const title = "Upgrade available";
    const message = `${vetName} sent an upgrade link for ${petName}.`;

    const guardianUser = await User.findById(guardianId).select("_id role notificationSettings").lean();
    const canNotify = isPushEnabledForUser(guardianUser, "payment_link");
    const doc = canNotify
      ? await Notification.create({
          user: guardianId,
          type: "payment_link",
          title,
          message,
          url,
          readAt: null,
        })
      : null;

    if (doc) {
      const pusher = getPusherServer();
      await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
        id: String(doc._id),
        type: doc.type,
        title: doc.title,
        message: doc.message,
        url: doc.url,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        id: String(created._id),
        amount,
        amountLabel: formatBRL(amount),
        url,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

