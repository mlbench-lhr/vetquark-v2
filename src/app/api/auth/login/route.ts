import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendTwoFactorEmail } from "@/lib/email";
import UserSession from "@/lib/models/UserSession";
import crypto from "crypto";

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
    panelPrices: panelPrices && Object.keys(panelPrices).length ? panelPrices : undefined,
    notificationSettings: user.notificationSettings && typeof user.notificationSettings === "object" ? user.notificationSettings : undefined,
    payoutMethod: user.payoutMethod && typeof user.payoutMethod === "object" ? user.payoutMethod : undefined,
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

function normalizeRole(value: unknown): "Veterinarian" | "Guardian" | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (v === "veterinarian" || v === "vet") return "Veterinarian";
  if (v === "guardian" || v === "tutor") return "Guardian";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, role, profileType } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "Email not verified" }, { status: 403 });
    }

    const requestedRole = normalizeRole(role ?? profileType);
    if (requestedRole && user.role !== requestedRole) {
      return NextResponse.json(
        { error: `This account is ${user.role === "Veterinarian" ? "a Veterinarian" : "a Guardian"}. Please use the correct login type.` },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.twoFactorEnabled) {
      const now = Date.now();
      const last = user.twoFactorOtpLastSentAt ? new Date(user.twoFactorOtpLastSentAt).getTime() : 0;
      const cooldownMs = 35 * 1000;
      if (now - last < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - (now - last)) / 1000);
        return NextResponse.json({ error: `Please wait ${remaining}s before requesting code` }, { status: 429 });
      }
      const otp = String(Math.floor(10000 + Math.random() * 90000));
      const expiresAt = new Date(now + 10 * 60 * 1000);
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            twoFactorOtp: otp,
            twoFactorOtpExpiresAt: expiresAt,
            twoFactorOtpLastSentAt: new Date(),
            twoFactorOtpAttempts: 0,
          },
        }
      );
      try {
        await sendTwoFactorEmail(String(user.email), otp);
      } catch {
      }
      return NextResponse.json({ twoFactorRequired: true }, { status: 200 });
    }

    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      return NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 });
    }

    const sessionId = crypto.randomUUID();
    const ua = String(req.headers.get("user-agent") || "");
    const lower = ua.toLowerCase();
    let deviceType: "ios" | "android" = lower.includes("android") ? "android" : "ios";
    let deviceModel = deviceType === "android" ? "Android" : (lower.includes("ipad") ? "iPad" : "iPhone");
    try {
      await UserSession.create({ user: user._id as any, sessionId, deviceType, deviceModel });
    } catch {}

    const token = jwt.sign(
      { sub: String(user._id), role: user.role, email: user.email, jti: sessionId },
      authSecret,
      { algorithm: "HS256", expiresIn: "7d" }
    );

    const profile = toSafeProfile(user as unknown as LeanUser);
    const res = NextResponse.json(
      {
        message: "Logged in",
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        profileType: profile.profileType,
        role: profile.role,
        profile,
      },
      { status: 200 }
    );

    res.cookies.set("session_id", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res;
  } catch (e) {
    console.log(e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
