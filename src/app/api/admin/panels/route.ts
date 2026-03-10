import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import Panel from "@/lib/models/Panel";

function clampInt(raw: unknown, fallback: number, min: number, max: number) {
  const n = typeof raw === "string" && raw.trim() ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.min(max, Math.max(min, i));
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePriceMaybe(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeVisibleKeys(value: unknown): string[] | null {
  if (value === null) return null;
  if (value === undefined) return null;
  if (!Array.isArray(value)) return null;
  const keys = value.map((k) => String(k || "").trim()).filter(Boolean);
  return keys.length ? keys : null;
}

function normalizePanelCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function isValidPanelCode(code: string) {
  if (!code) return false;
  if (!code.startsWith("VETQ_")) return false;
  return /^[A-Z0-9_]+$/.test(code);
}

function normalizeReferenceRanges(value: unknown) {
  if (!Array.isArray(value)) return [];
  const out: any[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const key = String((raw as any).key || "").trim();
    const label = String((raw as any).label || "").trim();
    const ruleRaw = (raw as any).rule;
    if (!key || !label || !ruleRaw || typeof ruleRaw !== "object") continue;
    const type = String((ruleRaw as any).type || "").trim();
    if (!["range", "exact", "negative", "lt", "gt"].includes(type)) continue;
    const low = parsePriceMaybe((ruleRaw as any).low);
    const high = parsePriceMaybe((ruleRaw as any).high);
    const valueN = parsePriceMaybe((ruleRaw as any).value);
    if (type === "range" && (low === null || high === null)) continue;
    if ((type === "exact" || type === "lt" || type === "gt") && valueN === null) continue;
    const rule =
      type === "negative"
        ? { type: "negative" as const }
        : type === "range"
          ? { type: "range" as const, low: low as number, high: high as number }
          : type === "exact"
            ? { type: "exact" as const, value: valueN as number }
            : type === "lt"
              ? { type: "lt" as const, value: valueN as number }
              : { type: "gt" as const, value: valueN as number };
    out.push({ key, label, rule });
  }
  return out;
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

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const page = clampInt(url.searchParams.get("page"), 1, 1, 10_000);
    const limit = clampInt(url.searchParams.get("limit"), 10, 1, 100);
    const search = String(url.searchParams.get("search") || "").trim();

    const match: any = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      match.$or = [{ code: { $regex: rx } }, { title: { $regex: rx } }];
    }

    await connectMongo();

    const skip = (page - 1) * limit;
    const [total, docs] = await Promise.all([
      Panel.countDocuments(match),
      Panel.find(match).sort({ sortOrder: 1, title: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const data = (docs as any[]).map((d) => ({
      id: String(d?._id),
      code: typeof d?.code === "string" ? d.code : "",
      title: typeof d?.title === "string" ? d.title : "",
      active: d?.active === false ? false : true,
      sortOrder: Number.isFinite(Number(d?.sortOrder)) ? Number(d.sortOrder) : 0,
      suggestedPriceBRL: Number.isFinite(Number(d?.suggestedPriceBRL)) ? Number(d.suggestedPriceBRL) : 0,
      commissionPriceBRL: Number.isFinite(Number(d?.commissionPriceBRL)) ? Number(d.commissionPriceBRL) : null,
      createdAt: d?.createdAt ? new Date(d.createdAt).toISOString() : null,
      updatedAt: d?.updatedAt ? new Date(d.updatedAt).toISOString() : null,
      lastUpdated: d?.updatedAt ? new Date(d.updatedAt).toISOString() : d?.createdAt ? new Date(d.createdAt).toISOString() : null,
      status: d?.active === false ? "Inactive" : "Active",
    }));

    return NextResponse.json(
      {
        data,
        pagination: { total, totalPages, page, limit },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => null);
    const code = normalizePanelCode((body as any)?.code);
    const title = String((body as any)?.title || "").trim();
    const subtitle = String((body as any)?.subtitle || "").trim();
    const description = String((body as any)?.description || "").trim();
    const params = String((body as any)?.params || "").trim();
    const active = (body as any)?.active === false ? false : true;
    const sortOrder = clampInt((body as any)?.sortOrder, 0, -1_000_000, 1_000_000);
    const suggestedPriceBRL = parsePriceMaybe((body as any)?.suggestedPriceBRL);
    const commissionPriceBRL = parsePriceMaybe((body as any)?.commissionPriceBRL);
    const visibleKeys = normalizeVisibleKeys((body as any)?.visibleKeys);
    const referenceRanges = normalizeReferenceRanges((body as any)?.referenceRanges);

    if (!isValidPanelCode(code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (suggestedPriceBRL === null || suggestedPriceBRL < 0) {
      return NextResponse.json({ error: "Invalid suggested price" }, { status: 400 });
    }
    if (commissionPriceBRL !== null && commissionPriceBRL < 0) {
      return NextResponse.json({ error: "Invalid commission price" }, { status: 400 });
    }

    await connectMongo();

    const existing = await Panel.findOne({ code }).select("_id").lean();
    if (existing) return NextResponse.json({ error: "Code already exists" }, { status: 409 });

    const created = await Panel.create({
      code,
      title,
      subtitle,
      description,
      params,
      visibleKeys,
      suggestedPriceBRL,
      commissionPriceBRL,
      active,
      sortOrder,
      referenceRanges,
    });

    return NextResponse.json({ ok: true, id: String(created._id) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

