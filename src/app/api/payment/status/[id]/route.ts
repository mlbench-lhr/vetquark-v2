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

    const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me").replace(/\/+$/, "");
    const origin = new URL(req.url).origin;
    console.log("PaymentStatus v5 init", JSON.stringify({ idRaw, resolvedFromLink: !!link, txId }));
    const url = `${base}/core/v5/orders/${encodeURIComponent(txId)}`;
    const basic = Buffer.from(`${apiKey}:`, "utf8").toString("base64");
    console.log("PaymentStatus v5 GET", JSON.stringify({ url }));
    const r = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Basic ${basic}`,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        origin,
        referer: origin,
      },
    });
    const ct = String(r.headers.get("content-type") || "");
    const statusCode = r.status;
    if (!ct.includes("application/json")) {
      const text = await r.text().catch(() => "");
      const snippet = typeof text === "string" ? text.slice(0, 300) : "";
      console.error("PaymentStatus v5 blocked", JSON.stringify({ statusCode, contentType: ct, url, bodySnippet: snippet }));
      return NextResponse.json(
        { error: "providerBlocked", reason: "Non-JSON response from provider", diagnostics: { statusCode, contentType: ct } },
        { status: 502 }
      );
    }
    const ord = await r.json();
    const charge = Array.isArray(ord?.charges) ? ord.charges[0] : null;
    const status = String(ord?.status || charge?.status || "");
    console.log("PaymentStatus v5 ok", JSON.stringify({ id: txId, status }));
    return NextResponse.json({ id: txId, status }, { status: 200 });
  } catch (e) {
    console.error("PaymentStatus fatal", e);
    return NextResponse.json({ error: "Internal server error", reason: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
