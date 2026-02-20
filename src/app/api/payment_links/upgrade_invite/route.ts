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

function panelTitleForProductCode(productCode?: string | null) {
  const code = (productCode || "").trim() || "VETQ_MASTER_360";
  if (code === "VETQ_U_START") return "U-Start";
  if (code === "VETQ_METABOLIC_CHECK") return "Metabolic Check";
  if (code === "VETQ_RENAL_EXPRESS") return "Renal Express";
  if (code === "VETQ_RENAL_ADVANCED") return "Renal Advanced";
  if (code === "VETQ_HEPATOSCREEN") return "HepatoScreen";
  if (code === "VETQ_GERIATRIC_CARE") return "Geriatric Care";
  return "Master 360";
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
  if (code === "VETQ_RENAL_EXPRESS") return ["glucose", "ketone-bodies", "protein", "microalbumin", "ph", "specific-gravity"];
  if (code === "VETQ_RENAL_ADVANCED") {
    return ["glucose", "ketone-bodies", "protein", "microalbumin", "creatine", "calcium", "magnesium", "ph", "specific-gravity"];
  }
  if (code === "VETQ_HEPATOSCREEN") return ["bilirubin", "urobilinogen", "ph", "specific-gravity"];
  if (code === "VETQ_GERIATRIC_CARE") {
    return [
      "glucose",
      "ketone-bodies",
      "protein",
      "microalbumin",
      "creatine",
      "calcium",
      "magnesium",
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

function accessKeysForReading(productCode: string, unlockedProductCodes: unknown): string[] | null {
  const unlocked = Array.isArray(unlockedProductCodes)
    ? unlockedProductCodes.map((c) => String(c || "").trim()).filter(Boolean)
    : [];
  const codes = [(productCode || "").trim() || "VETQ_MASTER_360", ...unlocked];
  for (const c of codes) {
    if (keysForProductCode(c) === null) return null;
  }
  const set = new Set<string>();
  for (const c of codes) {
    const keys = keysForProductCode(c);
    if (Array.isArray(keys)) keys.forEach((k) => set.add(k));
  }
  return [...set];
}

function doesTargetAddNewKeys(currentKeys: string[] | null, targetProductCode: string) {
  if (currentKeys === null) return false;
  const targetKeys = keysForProductCode(targetProductCode);
  if (targetKeys === null) return true;
  const currentSet = new Set(currentKeys);
  return targetKeys.some((k) => !currentSet.has(k));
}

function parsePriceMaybe(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
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
      .select("_id patient guardian signedAt paymentStatus productCode panelVersion unlockedProductCodes")
      .lean();
    if (!reading) return NextResponse.json({ error: "Reading not found" }, { status: 404 });
    if (!reading.signedAt) return NextResponse.json({ error: "Reading not signed" }, { status: 409 });
    if (String(reading.paymentStatus) !== "paid") return NextResponse.json({ error: "Reading payment not completed" }, { status: 409 });

    const currentProductCode = String(reading.productCode || "VETQ_MASTER_360");
    const unlocked = Array.isArray(reading.unlockedProductCodes) ? reading.unlockedProductCodes.map((c: any) => String(c || "").trim()).filter(Boolean) : [];
    if (productCode === currentProductCode || unlocked.includes(productCode)) {
      return NextResponse.json({ error: "Upgrade already applied" }, { status: 409 });
    }
    const currentAccessKeys = accessKeysForReading(currentProductCode, unlocked);
    if (!doesTargetAddNewKeys(currentAccessKeys, productCode)) {
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
      productCode === "VETQ_MASTER_360"
        ? null
        : rawPanelPrices && Object.prototype.hasOwnProperty.call(rawPanelPrices, productCode)
          ? parsePriceMaybe(rawPanelPrices[productCode])
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
    const panelTitle = panelTitleForProductCode(productCode);

    const title = "Upgrade available";
    const message = `${vetName} sent an upgrade link for ${petName} (${panelTitle}).`;

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
