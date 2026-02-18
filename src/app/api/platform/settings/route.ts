import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import PlatformSettings from "@/lib/models/PlatformSettings";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "@/lib/models/Admin";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();

    const envFee = Number.parseFloat(String(process.env.PLATFORM_FEE_BRL || "").trim());
    const envMin = Number.parseFloat(String(process.env.PRICING_SUGGESTED_MIN_BRL || "").trim());
    const envMax = Number.parseFloat(String(process.env.PRICING_SUGGESTED_MAX_BRL || "").trim());
    const envMinWithdrawal = Number.parseFloat(String(process.env.MIN_WITHDRAWAL_BRL || "").trim());

    let doc = await PlatformSettings.findOne({}).lean();
    if (!doc) {
      doc = await PlatformSettings.create({
        platformFeeBRL: Number.isFinite(envFee) ? envFee : undefined,
        pricingSuggestedMinBRL: Number.isFinite(envMin) ? envMin : undefined,
        pricingSuggestedMaxBRL: Number.isFinite(envMax) ? envMax : undefined,
        minWithdrawalBRL: Number.isFinite(envMinWithdrawal) ? envMinWithdrawal : undefined,
      }).then((d) => d.toObject());
    }

    const platformFee = Number.isFinite(Number((doc as any).platformFeeBRL))
      ? Number((doc as any).platformFeeBRL)
      : 33.0;
    const minSuggested = Number.isFinite(Number((doc as any).pricingSuggestedMinBRL))
      ? Number((doc as any).pricingSuggestedMinBRL)
      : 59.0;
    const maxSuggested = Number.isFinite(Number((doc as any).pricingSuggestedMaxBRL))
      ? Number((doc as any).pricingSuggestedMaxBRL)
      : 119.0;
    const minWithdrawal = Number.isFinite(Number((doc as any).minWithdrawalBRL))
      ? Number((doc as any).minWithdrawalBRL)
      : 20.0;

    return NextResponse.json(
      {
        currency: "BRL",
        platformFee,
        minSuggested,
        maxSuggested,
        minWithdrawal,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => null);
    const platformFeeRaw = (body as any)?.platformFee;
    const minSuggestedRaw = (body as any)?.minSuggested;
    const maxSuggestedRaw = (body as any)?.maxSuggested;
    const minWithdrawalRaw = (body as any)?.minWithdrawal;

    const updates: Record<string, number> = {};
    if (platformFeeRaw !== undefined) {
      const n = Number(platformFeeRaw);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Invalid platformFee" }, { status: 400 });
      updates.platformFeeBRL = n;
    }
    if (minSuggestedRaw !== undefined) {
      const n = Number(minSuggestedRaw);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Invalid minSuggested" }, { status: 400 });
      updates.pricingSuggestedMinBRL = n;
    }
    if (maxSuggestedRaw !== undefined) {
      const n = Number(maxSuggestedRaw);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Invalid maxSuggested" }, { status: 400 });
      updates.pricingSuggestedMaxBRL = n;
    }
    if (minWithdrawalRaw !== undefined) {
      const n = Number(minWithdrawalRaw);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Invalid minWithdrawal" }, { status: 400 });
      updates.minWithdrawalBRL = n;
    }

    await connectMongo();
    let doc = await PlatformSettings.findOne({}).lean();
    if (!doc) {
      doc = await PlatformSettings.create({}).then((d) => d.toObject());
    }
    await PlatformSettings.updateOne({ _id: (doc as any)._id }, { $set: updates });
    const updated = await PlatformSettings.findById((doc as any)._id).lean();

    const payload = {
      platformFee: Number((updated as any)?.platformFeeBRL) || 33.0,
      minSuggested: Number((updated as any)?.pricingSuggestedMinBRL) || 59.0,
      maxSuggested: Number((updated as any)?.pricingSuggestedMaxBRL) || 119.0,
      minWithdrawal: Number((updated as any)?.minWithdrawalBRL) || 20.0,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
