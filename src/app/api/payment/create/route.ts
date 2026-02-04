import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentLink from "@/lib/models/PaymentLink";

type Method = "credit_card" | "boleto" | "pix";

export async function POST(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const paymentLinkId = String(body?.paymentLinkId || "").trim();
    const methodRaw = String(body?.method || "").trim().toLowerCase();
    const method: Method = methodRaw === "credit_card" || methodRaw === "boleto" || methodRaw === "pix" ? (methodRaw as Method) : null as any;
    const cardHash = String(body?.cardHash || "").trim();

    if (!paymentLinkId || !mongoose.Types.ObjectId.isValid(paymentLinkId)) {
      return NextResponse.json({ error: "Invalid paymentLinkId" }, { status: 400 });
    }
    if (!method) return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    if (method === "credit_card" && !cardHash) {
      return NextResponse.json({ error: "Missing cardHash" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findById(userId).select("_id role fullName email").lean();
    if (!user || user.role !== "Guardian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const link: any = await PaymentLink.findOne({ _id: paymentLinkId, guardian: userId })
      .select("_id amount currency status veterinarian patient")
      .lean();
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (String(link.status) !== "pending") {
      return NextResponse.json({ error: "Payment link not pending" }, { status: 409 });
    }

    const apiKey = String(process.env.PAGARME_SECRET_KEY || "").trim();
    const webhookUrl = String(process.env.PAGARME_WEBHOOK_URL || "").trim();
    if (!apiKey) return NextResponse.json({ error: "Missing PAGARME_SECRET_KEY" }, { status: 500 });
    if (!webhookUrl) return NextResponse.json({ error: "Missing PAGARME_WEBHOOK_URL" }, { status: 500 });

    const amountCents = Math.round(Number(link.amount) * 100);
    const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me").replace(/\/+$/, "");
    const url = `${base}/1/transactions`;
    const origin = new URL(req.url).origin;
    console.log(
      "PagarmeCreate start",
      JSON.stringify({
        method,
        amountCents,
        url,
        origin,
        hasCardHash: method === "credit_card" ? !!cardHash : undefined,
        webhookUrl,
      }),
    );
    const payload: any =
      method === "credit_card"
        ? {
            api_key: apiKey,
            amount: amountCents,
            payment_method: "credit_card",
            card_hash: cardHash,
            postback_url: webhookUrl,
            metadata: { paymentLinkId: String(link._id) },
            customer: { name: String((user as any).fullName || ""), email: String((user as any).email || "") },
          }
        : {
            api_key: apiKey,
            amount: amountCents,
            payment_method: method,
            postback_url: webhookUrl,
            metadata: { paymentLinkId: String(link._id) },
          };
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        origin,
        referer: origin,
      },
      body: JSON.stringify(payload),
    });
    const ct = String(r.headers.get("content-type") || "");
    const cfRay = r.headers.get("cf-ray") || r.headers.get("CF-Ray") || "";
    const server = r.headers.get("server") || "";
    const statusCode = r.status;
    if (!ct.includes("application/json")) {
      const text = await r.text().catch(() => "");
      const snippet = typeof text === "string" ? text.slice(0, 300) : "";
      console.error(
        "PagarmeCreate blocked",
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
        "PagarmeCreate error",
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
        "PagarmeCreate ok",
        JSON.stringify({
          statusCode,
          contentType: ct,
          cfRay,
          server,
          url,
        }),
      );
    }
    const created = await r.json();

    const txId = String(created?.id || "");
    const status = String(created?.status || "");

    await PaymentLink.updateOne(
      { _id: link._id },
      {
        $set: {
          paymentMethod: method,
          provider: "pagarme",
          providerTransactionId: txId || null,
        },
      },
    );

    const response: any = { transactionId: txId, status };
    if (method === "pix") {
      response.pixQrCode = created?.pix_qr_code || null;
      response.pixQrCodeUrl = created?.pix_qr_code_url || null;
    }
    if (method === "boleto") {
      response.boletoUrl = created?.boleto_url || null;
      response.boletoBarcode = created?.boleto_barcode || null;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
