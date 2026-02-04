import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import PaymentLink from "@/lib/models/PaymentLink";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const apiKey = String(process.env.PAGARME_SECRET_KEY || "").trim();
    if (!apiKey) return NextResponse.json({ error: "Missing PAGARME_SECRET_KEY" }, { status: 500 });

    const resolved = await Promise.resolve(ctx.params);
    const idRaw = String(resolved?.id || "").trim();
    if (!idRaw) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const link = mongoose.Types.ObjectId.isValid(idRaw)
      ? await PaymentLink.findById(idRaw).select("_id providerTransactionId status").lean()
      : null;
    const txId = link ? String((link as any).providerTransactionId || "") : idRaw;
    const idNum = Number(txId);
    if (!Number.isFinite(idNum)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me").replace(/\/+$/, "");
    const url = `${base}/1/transactions/${encodeURIComponent(String(idNum))}?api_key=${encodeURIComponent(apiKey)}`;
    const origin = new URL(req.url).origin;
    const r = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        origin,
        referer: origin,
      },
    });
    const ct = String(r.headers.get("content-type") || "");
    const cfRay = r.headers.get("cf-ray") || r.headers.get("CF-Ray") || "";
    const server = r.headers.get("server") || "";
    const statusCode = r.status;
    if (!ct.includes("application/json")) {
      const text = await r.text().catch(() => "");
      const snippet = typeof text === "string" ? text.slice(0, 300) : "";
      console.error(
        "PagarmeStatus blocked",
        JSON.stringify({
          statusCode,
          contentType: ct,
          cfRay,
          server,
          url,
          bodySnippet: snippet,
        }),
      );
      return NextResponse.json({ error: "providerBlocked" }, { status: 502 });
    }
    if (statusCode >= 400) {
      const errJson = await r.json().catch(() => ({}));
      console.error(
        "PagarmeStatus error",
        JSON.stringify({
          statusCode,
          contentType: ct,
          cfRay,
          server,
          url,
          error: errJson,
        }),
      );
    } else {
      console.log(
        "PagarmeStatus ok",
        JSON.stringify({
          statusCode,
          contentType: ct,
          cfRay,
          server,
          url,
        }),
      );
    }
    const tx = await r.json();

    const status = String((tx as any)?.status || "");
    return NextResponse.json({ id: txId, status }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
