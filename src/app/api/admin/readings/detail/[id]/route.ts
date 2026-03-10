import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import Reading from "@/lib/models/Reading";
import { getActivePanels, getPanelVisibleKeys, normalizePanelCode } from "@/lib/panels";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const authSecret = process.env.AUTH_SECRET;
  if (!token) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!authSecret) {
    return { ok: false as const, res: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }) };
  }

  let adminId: string | null = null;
  let role: string | null = null;
  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object") {
      adminId = typeof (decoded as any).sub === "string" ? String((decoded as any).sub) : null;
      role = typeof (decoded as any).role === "string" ? String((decoded as any).role) : null;
    }
  } catch {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!adminId || role !== "Admin" || !mongoose.Types.ObjectId.isValid(adminId)) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  await connectMongo();
  const admin = await Admin.findById(adminId).select("_id").lean();
  if (!admin) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true as const, adminId };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const resolvedParams = await Promise.resolve(ctx.params);
    const readingId = String(resolvedParams?.id || "").trim();
    if (!readingId || !mongoose.Types.ObjectId.isValid(readingId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectMongo();

    const doc = await Reading.findById(readingId)
      .populate("patient", "animalName photo")
      .populate("guardian", "fullName email")
      .populate("veterinarian", "fullName email crmv crmvState tradeName clinicLogoUrl reportHeaderAddress reportFooter")
      .lean();

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const paymentStatus = typeof (doc as any).paymentStatus === "string" ? String((doc as any).paymentStatus) : "";
    const paymentLinkId = (doc as any).paymentLink ? String((doc as any).paymentLink) : "";
    const patientId = String((doc as any).patient?._id ?? (doc as any).patient ?? "");

    const panels = await getActivePanels();
    const visibleKeysByCode = new Map<string, string[] | null>();
    for (const p of panels) {
      visibleKeysByCode.set(normalizePanelCode(p.code), Array.isArray(p.visibleKeys) ? p.visibleKeys : null);
    }
    const visibleKeyPromises = new Map<string, Promise<string[] | null>>();
    const visibleKeysForProductCode = (productCode?: string | null): Promise<string[] | null> => {
      const code = normalizePanelCode(productCode);
      if (visibleKeysByCode.has(code)) return Promise.resolve(visibleKeysByCode.get(code) ?? null);
      const existing = visibleKeyPromises.get(code);
      if (existing) return existing;
      const p = getPanelVisibleKeys(code);
      visibleKeyPromises.set(code, p);
      return p;
    };
    const visibleKeysForAccess = async (productCode?: string | null, unlockedProductCodes?: unknown): Promise<string[] | null> => {
      const unlocked = Array.isArray(unlockedProductCodes)
        ? unlockedProductCodes.map((c) => normalizePanelCode(c)).filter(Boolean)
        : [];
      const codes = [normalizePanelCode(productCode), ...unlocked];
      const keysByCode = await Promise.all(codes.map((c) => visibleKeysForProductCode(c)));
      if (keysByCode.some((k) => k === null)) return null;
      const set = new Set<string>();
      for (const keys of keysByCode) {
        if (Array.isArray(keys)) keys.forEach((k) => set.add(k));
      }
      return [...set];
    };
    const allResults = Array.isArray((doc as any).results) ? (doc as any).results : [];
    const keys = await visibleKeysForAccess((doc as any).productCode, (doc as any).unlockedProductCodes);
    const results = keys ? allResults.filter((r: any) => keys.includes(String(r?.key || ""))) : allResults;

    const reading = {
      id: String((doc as any)._id),
      testType: (doc as any).testType ?? "urine",
      productCode: (doc as any).productCode ?? "VETQ_MASTER_360",
      panelVersion: (doc as any).panelVersion ?? 1,
      unlockedProductCodes: Array.isArray((doc as any).unlockedProductCodes) ? (doc as any).unlockedProductCodes : [],
      isDraft: typeof (doc as any).isDraft === "boolean" ? (doc as any).isDraft : !(doc as any).signedAt,
      wizardStep:
        (doc as any).wizardStep === "identification" ||
        (doc as any).wizardStep === "timer" ||
        (doc as any).wizardStep === "review" ||
        (doc as any).wizardStep === "report"
          ? (doc as any).wizardStep
          : "identification",
      signedAt: (doc as any).signedAt ?? null,
      createdAt: (doc as any).createdAt ?? null,
      signatureImageUrl: (doc as any).signatureImageUrl ?? null,
      paymentStatus: paymentStatus || null,
      paymentLinkId,
      identification: (doc as any).identification ?? null,
      timer: (doc as any).timer ?? null,
      results,
      report: (doc as any).report ?? null,
      patient: {
        id: patientId,
        name: (doc as any).patient?.animalName ?? "N/A",
        photo: (doc as any).patient?.photo ?? null,
      },
      guardian: {
        id: String((doc as any).guardian?._id ?? ""),
        fullName: (doc as any).guardian?.fullName ?? "N/A",
      },
      veterinarian: {
        id: String((doc as any).veterinarian?._id ?? ""),
        fullName: (doc as any).veterinarian?.fullName ?? "N/A",
        crmv: (doc as any).veterinarian?.crmv ?? null,
        crmvState: (doc as any).veterinarian?.crmvState ?? null,
        tradeName: (doc as any).veterinarian?.tradeName ?? null,
        clinicLogoUrl: (doc as any).veterinarian?.clinicLogoUrl ?? null,
        reportHeaderAddress: (doc as any).veterinarian?.reportHeaderAddress ?? null,
        reportFooter: (doc as any).veterinarian?.reportFooter ?? null,
      },
    };

    return NextResponse.json({ reading }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
