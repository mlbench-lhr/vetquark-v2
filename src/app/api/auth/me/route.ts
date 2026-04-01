import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

type LeanUser = {
  _id: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  veterinarianCode?: unknown;
  taxId?: unknown;
  dateOfBirth?: unknown;
  address?: unknown;
  country?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
  crmv?: unknown;
  crmvState?: unknown;
  mapaRegistration?: unknown;
  operateHow?: unknown;
  expertise?: unknown;
  acceptTerms?: unknown;
  profileType?: unknown;
  role?: unknown;
  primaryVeterinarian?: unknown;
  clinicLogoUrl?: unknown;
  tradeName?: unknown;
  cnpjIe?: unknown;
  reportHeaderAddress?: unknown;
  reportFooter?: unknown;
  profileImageUrl?: unknown;
  preferredLanguage?: unknown;
  baseExamPrice?: unknown;
  panelPrices?: unknown;
  notificationSettings?: unknown;
  payoutMethod?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toSafeProfile(user: LeanUser) {
  const rawPanelPrices = user.panelPrices && typeof user.panelPrices === "object" && !Array.isArray(user.panelPrices) ? (user.panelPrices as any) : null;
  const panelPrices =
    rawPanelPrices
      ? Object.fromEntries(
          Object.entries(rawPanelPrices).flatMap(([k, v]) => {
            const key = String(k || "").trim();
            const n = typeof v === "number" ? v : Number(v);
            if (!key) return [];
            if (!Number.isFinite(n) || n < 0) return [];
            return [[key, n]];
          })
        )
      : undefined;
  return {
    id: String(user._id),
    fullName: typeof user.fullName === "string" ? user.fullName : "",
    email: typeof user.email === "string" ? user.email : "",
    phone: typeof user.phone === "string" ? user.phone : undefined,
    veterinarianCode: typeof user.veterinarianCode === "string" ? user.veterinarianCode : undefined,
    primaryVeterinarian: user.primaryVeterinarian ? String(user.primaryVeterinarian as any) : undefined,
    taxId: typeof user.taxId === "string" ? user.taxId : undefined,
    dateOfBirth: typeof user.dateOfBirth === "string" ? user.dateOfBirth : undefined,
    address: typeof user.address === "string" ? user.address : undefined,
    country: typeof user.country === "string" ? user.country : undefined,
    city: typeof user.city === "string" ? user.city : undefined,
    state: typeof user.state === "string" ? user.state : undefined,
    postalCode: typeof user.postalCode === "string" ? user.postalCode : undefined,
    crmv: typeof user.crmv === "string" ? user.crmv : undefined,
    crmvState: typeof user.crmvState === "string" ? user.crmvState : undefined,
    mapaRegistration: typeof user.mapaRegistration === "string" ? user.mapaRegistration : undefined,
    operateHow: typeof user.operateHow === "string" ? user.operateHow : undefined,
    expertise: Array.isArray(user.expertise) ? (user.expertise.filter((v) => typeof v === "string") as string[]) : undefined,
    acceptTerms: typeof user.acceptTerms === "boolean" ? user.acceptTerms : undefined,
    profileType: user.profileType === "Veterinarian" || user.profileType === "Guardian" ? user.profileType : undefined,
    role: user.role === "Veterinarian" || user.role === "Guardian" ? user.role : undefined,
    clinicLogoUrl: typeof user.clinicLogoUrl === "string" ? user.clinicLogoUrl : undefined,
    tradeName: typeof user.tradeName === "string" ? user.tradeName : undefined,
    cnpjIe: typeof user.cnpjIe === "string" ? user.cnpjIe : undefined,
    reportHeaderAddress: typeof user.reportHeaderAddress === "string" ? user.reportHeaderAddress : undefined,
    reportFooter: typeof user.reportFooter === "string" ? user.reportFooter : undefined,
    profileImageUrl: typeof user.profileImageUrl === "string" ? user.profileImageUrl : undefined,
    preferredLanguage: user.preferredLanguage === "en" || user.preferredLanguage === "pt" ? user.preferredLanguage : undefined,
    baseExamPrice: typeof user.baseExamPrice === "number" && Number.isFinite(user.baseExamPrice) ? user.baseExamPrice : undefined,
    panelPrices: panelPrices && Object.keys(panelPrices).length ? panelPrices : undefined,
    notificationSettings: user.notificationSettings && typeof user.notificationSettings === "object" ? user.notificationSettings : undefined,
    payoutMethod: user.payoutMethod && typeof user.payoutMethod === "object" ? user.payoutMethod : undefined,
    twoFactorEnabled: typeof (user as any).twoFactorEnabled === "boolean" ? (user as any).twoFactorEnabled : undefined,
    createdAt:
      typeof user.createdAt === "string" || typeof user.createdAt === "number" || user.createdAt instanceof Date
        ? new Date(user.createdAt).toISOString()
        : undefined,
    updatedAt:
      typeof user.updatedAt === "string" || typeof user.updatedAt === "number" || user.updatedAt instanceof Date
        ? new Date(user.updatedAt).toISOString()
        : undefined,
  };
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value || req.cookies.get("session_id")?.value;
  const authSecret = process.env.AUTH_SECRET;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!authSecret) {
    return NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 });
  }

  let userId: string | null = null;
  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object" && "sub" in decoded) {
      const sub = (decoded as { sub?: unknown }).sub;
      if (typeof sub === "string" && sub.trim()) userId = sub;
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();
  let user = await User.findById(userId).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if ((user as any).role === "Veterinarian" && !(user as any).veterinarianCode) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (;;) {
      code = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
      const exists = await User.findOne({ veterinarianCode: code }).select("_id").lean();
      if (!exists?._id) break;
    }
    await User.updateOne({ _id: userId }, { $set: { veterinarianCode: code } });
    user = await User.findById(userId).lean();
  }

  return NextResponse.json({ profile: toSafeProfile(user as unknown as LeanUser) }, { status: 200 });
}
