import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

type LeanUser = {
  _id: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  taxId?: unknown;
  dateOfBirth?: unknown;
  address?: unknown;
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
  clinicLogoUrl?: unknown;
  tradeName?: unknown;
  cnpjIe?: unknown;
  reportHeaderAddress?: unknown;
  reportFooter?: unknown;
  profileImageUrl?: unknown;
  preferredLanguage?: unknown;
  baseExamPrice?: unknown;
  notificationSettings?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toSafeProfile(user: LeanUser) {
  return {
    id: String(user._id),
    fullName: typeof user.fullName === "string" ? user.fullName : "",
    email: typeof user.email === "string" ? user.email : "",
    phone: typeof user.phone === "string" ? user.phone : undefined,
    taxId: typeof user.taxId === "string" ? user.taxId : undefined,
    dateOfBirth: typeof user.dateOfBirth === "string" ? user.dateOfBirth : undefined,
    address: typeof user.address === "string" ? user.address : undefined,
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
    notificationSettings: user.notificationSettings && typeof user.notificationSettings === "object" ? user.notificationSettings : undefined,
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

function asTrimmedString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function isAllowedCloudinaryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return url.hostname.endsWith("res.cloudinary.com");
  } catch {
    return false;
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const $set: Record<string, any> = {};
    const $unset: Record<string, any> = {};

    const fullName = asTrimmedString(body?.fullName);
    if (fullName !== null) $set.fullName = fullName;

    const emailRaw = asTrimmedString(body?.email);
    if (emailRaw !== null) $set.email = emailRaw.toLowerCase();

    const phone = asTrimmedString(body?.phone);
    if (phone !== null) $set.phone = phone;

    const taxId = asTrimmedString(body?.taxId);
    if (taxId !== null) $set.taxId = taxId;

    const dateOfBirth = asTrimmedString(body?.dateOfBirth);
    if (dateOfBirth !== null) $set.dateOfBirth = dateOfBirth;

    const address = asTrimmedString(body?.address);
    if (address !== null) $set.address = address;

    const city = asTrimmedString(body?.city);
    if (city !== null) $set.city = city;

    const state = asTrimmedString(body?.state);
    if (state !== null) $set.state = state;

    const postalCode = asTrimmedString(body?.postalCode);
    if (postalCode !== null) $set.postalCode = postalCode;

    const crmv = asTrimmedString(body?.crmv);
    if (crmv !== null) $set.crmv = crmv;

    const crmvState = asTrimmedString(body?.crmvState);
    if (crmvState !== null) $set.crmvState = crmvState;

    if (body?.mapaRegistration !== undefined) {
      const mapaRegistration = asTrimmedString(body?.mapaRegistration);
      if (mapaRegistration === null) $unset.mapaRegistration = 1;
      else $set.mapaRegistration = mapaRegistration;
    }

    const operateHow = asTrimmedString(body?.operateHow);
    if (operateHow !== null) $set.operateHow = operateHow;

    if (Array.isArray(body?.expertise)) {
      $set.expertise = body.expertise.filter((v: any) => typeof v === "string" && v.trim()).map((v: string) => v.trim());
    }

    const clinicLogoUrl = asTrimmedString(body?.clinicLogoUrl);
    if (clinicLogoUrl !== null) $set.clinicLogoUrl = clinicLogoUrl;

    const tradeName = asTrimmedString(body?.tradeName);
    if (tradeName !== null) $set.tradeName = tradeName;

    if (body?.cnpjIe !== undefined) {
      const cnpjIe = asTrimmedString(body?.cnpjIe);
      if (cnpjIe === null) $unset.cnpjIe = 1;
      else $set.cnpjIe = cnpjIe;
    }

    const reportHeaderAddress = asTrimmedString(body?.reportHeaderAddress);
    if (reportHeaderAddress !== null) $set.reportHeaderAddress = reportHeaderAddress;

    const reportFooter = asTrimmedString(body?.reportFooter);
    if (reportFooter !== null) $set.reportFooter = reportFooter;

    const profileImageUrl = asTrimmedString(body?.profileImageUrl);
    if (profileImageUrl !== null) {
      if (!isAllowedCloudinaryUrl(profileImageUrl)) return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      $set.profileImageUrl = profileImageUrl;
    }

    const preferredLanguage = asTrimmedString(body?.preferredLanguage);
    if (preferredLanguage !== null) {
      if (preferredLanguage === "en" || preferredLanguage === "pt") $set.preferredLanguage = preferredLanguage;
      else return NextResponse.json({ error: "Invalid preferredLanguage" }, { status: 400 });
    }

    if (body?.baseExamPrice !== undefined) {
      const n = typeof body.baseExamPrice === "number" ? body.baseExamPrice : Number(body.baseExamPrice);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Invalid baseExamPrice" }, { status: 400 });
      $set.baseExamPrice = n;
    }

    if (body?.notificationSettings !== undefined) {
      if (!body.notificationSettings || typeof body.notificationSettings !== "object") {
        return NextResponse.json({ error: "Invalid notificationSettings" }, { status: 400 });
      }
      $set.notificationSettings = body.notificationSettings;
    }

    if (!$set.fullName && body?.fullName !== undefined) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    if (!$set.email && body?.email !== undefined) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongo();

    if ($set.email) {
      const existing = await User.findOne({ email: $set.email, _id: { $ne: userId } }).select("_id").lean();
      if (existing?._id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    const update: Record<string, any> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;
    if (!Object.keys(update).length) {
      const current = await User.findById(userId).lean();
      if (!current) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({ profile: toSafeProfile(current as unknown as LeanUser) }, { status: 200 });
    }

    const updated = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ profile: toSafeProfile(updated as unknown as LeanUser) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
