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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const params = await ctx.params;
    const id = String(params?.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectMongo();

    const doc = await Panel.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(
      {
        panel: {
          id: String((doc as any)._id),
          code: typeof (doc as any).code === "string" ? String((doc as any).code) : "",
          title: typeof (doc as any).title === "string" ? String((doc as any).title) : "",
          subtitle: typeof (doc as any).subtitle === "string" ? String((doc as any).subtitle) : "",
          description: typeof (doc as any).description === "string" ? String((doc as any).description) : "",
          params: typeof (doc as any).params === "string" ? String((doc as any).params) : "",
          visibleKeys: Array.isArray((doc as any).visibleKeys) ? (doc as any).visibleKeys : null,
          suggestedPriceBRL: Number.isFinite(Number((doc as any).suggestedPriceBRL)) ? Number((doc as any).suggestedPriceBRL) : 0,
          commissionPriceBRL: Number.isFinite(Number((doc as any).commissionPriceBRL)) ? Number((doc as any).commissionPriceBRL) : null,
          active: (doc as any).active === false ? false : true,
          sortOrder: Number.isFinite(Number((doc as any).sortOrder)) ? Number((doc as any).sortOrder) : 0,
          referenceRanges: Array.isArray((doc as any).referenceRanges) ? (doc as any).referenceRanges : [],
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const params = await ctx.params;
    const id = String(params?.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const title = typeof (body as any)?.title === "string" ? String((body as any).title).trim() : undefined;
    const subtitle = typeof (body as any)?.subtitle === "string" ? String((body as any).subtitle).trim() : undefined;
    const description = typeof (body as any)?.description === "string" ? String((body as any).description).trim() : undefined;
    const paramsLabel = typeof (body as any)?.params === "string" ? String((body as any).params).trim() : undefined;
    const active = typeof (body as any)?.active === "boolean" ? (body as any).active : undefined;
    const sortOrder = (body as any)?.sortOrder === undefined ? undefined : clampInt((body as any).sortOrder, 0, -1_000_000, 1_000_000);
    const suggestedPriceBRL = (body as any)?.suggestedPriceBRL === undefined ? undefined : parsePriceMaybe((body as any)?.suggestedPriceBRL);
    const commissionPriceBRL = (body as any)?.commissionPriceBRL === undefined ? undefined : parsePriceMaybe((body as any)?.commissionPriceBRL);
    const visibleKeys = (body as any)?.visibleKeys === undefined ? undefined : normalizeVisibleKeys((body as any)?.visibleKeys);
    const referenceRanges = (body as any)?.referenceRanges === undefined ? undefined : normalizeReferenceRanges((body as any)?.referenceRanges);

    if (title !== undefined && !title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (suggestedPriceBRL !== undefined && (suggestedPriceBRL === null || suggestedPriceBRL < 0)) {
      return NextResponse.json({ error: "Invalid suggested price" }, { status: 400 });
    }
    if (commissionPriceBRL !== undefined && commissionPriceBRL !== null && commissionPriceBRL < 0) {
      return NextResponse.json({ error: "Invalid commission price" }, { status: 400 });
    }

    await connectMongo();

    const panel = await Panel.findById(id).select("_id").lean();
    if (!panel) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const $set: any = {};
    if (title !== undefined) $set.title = title;
    if (subtitle !== undefined) $set.subtitle = subtitle;
    if (description !== undefined) $set.description = description;
    if (paramsLabel !== undefined) $set.params = paramsLabel;
    if (active !== undefined) $set.active = active;
    if (sortOrder !== undefined) $set.sortOrder = sortOrder;
    if (suggestedPriceBRL !== undefined) $set.suggestedPriceBRL = suggestedPriceBRL;
    if (commissionPriceBRL !== undefined) $set.commissionPriceBRL = commissionPriceBRL;
    if (visibleKeys !== undefined) $set.visibleKeys = visibleKeys;
    if (referenceRanges !== undefined) $set.referenceRanges = referenceRanges;

    if (!Object.keys($set).length) return NextResponse.json({ ok: true }, { status: 200 });

    await Panel.updateOne({ _id: id }, { $set });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const params = await ctx.params;
    const id = String(params?.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectMongo();

    const panel = await Panel.findById(id).select("_id").lean();
    if (!panel) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await Panel.deleteOne({ _id: id });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
