import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentLink from "@/lib/models/PaymentLink";

type Method = "credit_card" | "boleto" | "pix";
type PagarmePixCharge = {
  status?: string;
  payment?: { pix?: { qr_code?: string; qr_code_base64?: string } };
};
type PagarmeOrder = {
  id?: string;
  status?: string;
  charges?: PagarmePixCharge[];
};

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
    console.log("PaymentCreate init", JSON.stringify({ userId, paymentLinkId, method }));

    if (!paymentLinkId || !mongoose.Types.ObjectId.isValid(paymentLinkId)) {
      return NextResponse.json({ error: "Invalid paymentLinkId" }, { status: 400 });
    }
    if (!method) return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    if (method === "credit_card" && !cardHash) {
      return NextResponse.json({ error: "Missing cardHash" }, { status: 400 });
    }

    await connectMongo();
    console.log("PaymentCreate db connected");

    const user = await User.findById(userId).select("_id role fullName email").lean();
    if (!user || user.role !== "Guardian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.log("PaymentCreate user ok", JSON.stringify({ userId, role: (user as any).role }));

    const link: any = await PaymentLink.findOne({ _id: paymentLinkId, guardian: userId })
      .select("_id amount currency status veterinarian patient")
      .lean();
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (String(link.status) !== "pending") {
      return NextResponse.json({ error: "Payment link not pending" }, { status: 409 });
    }
    console.log("PaymentCreate link ok", JSON.stringify({ linkId: String(link._id), amount: link.amount, currency: link.currency, status: link.status }));

    const apiKey = String(process.env.PAGARME_SECRET_KEY || "").trim();
    const webhookUrl = String(process.env.PAGARME_WEBHOOK_URL || "").trim();
    if (!apiKey) return NextResponse.json({ error: "Missing PAGARME_SECRET_KEY" }, { status: 500 });

    const amountCents = Math.round(Number(link.amount) * 100);
    const origin = new URL(req.url).origin;
    if (method === "pix") {
      const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me").replace(/\/+$/, "");
      const v5Url = `${base}/core/v5/orders`;
      if (!apiKey || apiKey.startsWith("pk_")) {
        console.error("PagarmeCreateV5 preflight invalid secret", JSON.stringify({ hasKey: !!apiKey, keyPrefix: apiKey ? apiKey.slice(0, 3) : null }));
        return NextResponse.json(
          { error: "configError", message: "Invalid secret key. Use sk_*, not pk_*" },
          { status: 500 }
        );
      }
      console.log("PagarmeCreateV5 start", JSON.stringify({ v5Url, amountCents }));
      const orderPayload: any = {
        items: [
          {
            amount: amountCents,
            quantity: 1,
            code: `payment:${String(link._id)}`,
            description: "VetQuark reading payment",
          },
        ],
        customer: {
          name: String((user as any).fullName || ""),
          email: String((user as any).email || ""),
          type: "individual",
          document_type: "CPF",
          document: "01234567890",
          phones: {
            mobile_phone: { country_code: "55", area_code: "11", number: "999999999" },
          },
          address: {
            country: "BR",
            state: "SP",
            city: "São Paulo",
            zip_code: "01000000",
            line_1: "VetQuark",
            line_2: "Test",
          },
        },
        payments: [
          {
            payment_method: "pix",
            pix: { expires_in: 3600 },
            amount: amountCents,
          },
        ],
        closed: false,
        metadata: { paymentLinkId: String(link._id) },
      };
      console.log("DEBUG: Pagar.me Credentials", JSON.stringify({
        apiKey: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "missing",
        apiKeyValid: apiKey.startsWith("sk_"),
        amountCents: amountCents
      }));
      
      console.log("DEBUG: Pagar.me Request Payload", JSON.stringify(orderPayload, null, 2));
      const basic = Buffer.from(`${apiKey}:`, "utf8").toString("base64");
      console.log("DEBUG: Authorization Header", JSON.stringify({ basicAuthPreview: `${basic.slice(0, 20)}...` }));
      console.log("DEBUG: Making API request to", v5Url);
      console.log("DEBUG: Request Headers", JSON.stringify({
        authorization: `Basic ${basic.slice(0, 20)}...`,
        "content-type": "application/json",
        accept: "application/json",
        origin: origin,
        referer: origin
      }, null, 2));
      
      const r = await fetch(v5Url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `Basic ${basic}`,
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          origin,
          referer: origin,
        },
        body: JSON.stringify(orderPayload),
      });
      
      console.log("DEBUG: API Response Status", r.status);
      console.log("DEBUG: API Response Headers", JSON.stringify({
        "content-type": r.headers.get("content-type"),
        "cf-ray": r.headers.get("cf-ray"),
        "server": r.headers.get("server"),
        "date": r.headers.get("date")
      }, null, 2));
      
      const ct = String(r.headers.get("content-type") || "");
      const cfRay = r.headers.get("cf-ray") || r.headers.get("CF-Ray") || "";
      const server = r.headers.get("server") || "";
      const statusCode = r.status;
      if (!ct.includes("application/json")) {
        const text = await r.text().catch(() => "");
        const snippet = typeof text === "string" ? text.slice(0, 300) : "";
        console.error(
          "PagarmeCreateV5 blocked",
          JSON.stringify({ statusCode, contentType: ct, cfRay, server, url: v5Url, bodySnippet: snippet }),
        );
        return NextResponse.json(
          { error: "providerBlocked", reason: "Non-JSON response from provider", diagnostics: { statusCode, contentType: ct, cfRay, server } },
          { status: 502 }
        );
      }
      if (statusCode >= 400) {
        const errJson = await r.json().catch(() => ({}));
        const msg =
          typeof errJson?.message === "string"
            ? errJson.message
            : Array.isArray(errJson?.errors) && typeof errJson.errors?.[0]?.message === "string"
            ? errJson.errors[0].message
            : "Provider error";
        console.error(
          "PagarmeCreateV5 error",
          JSON.stringify({ statusCode, contentType: ct, cfRay, server, url: v5Url, error: errJson }),
        );
        return NextResponse.json(
          { error: "providerError", message: msg, details: errJson, statusCode },
          { status: 502 }
        );
      }
      const createdV5: any = await r.json();
      const orderId = String(createdV5?.id || "");
      const charge: any = Array.isArray(createdV5?.charges) ? createdV5.charges[0] : null;
      const paymentPix = charge?.payment?.pix || {};
      const qrCodeText = String(paymentPix?.qr_code || createdV5?.last_transaction?.qr_code || "");
      const qrCodeBase64 = String(paymentPix?.qr_code_base64 || createdV5?.last_transaction?.qr_code_base64 || "");
      console.log("PagarmeCreateV5 ok", JSON.stringify({ orderId, orderStatus: createdV5?.status, chargeStatus: charge?.status, hasQr: !!qrCodeBase64 || !!qrCodeText }));
      await PaymentLink.updateOne(
        { _id: link._id },
        {
          $set: {
            paymentMethod: "pix",
            provider: "pagarme",
            providerTransactionId: orderId || null,
          },
        },
      );
      const responseV5: any = {
        transactionId: orderId,
        status: String(createdV5?.status || charge?.status || ""),
        pixQrCode: qrCodeText || null,
        pixQrCodeUrl: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
      };
      return NextResponse.json(responseV5, { status: 200 });
    }
    const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me").replace(/\/+$/, "");
    const url = `${base}/1/transactions`;
    const payload: any =
      method === "credit_card"
        ? {
            api_key: apiKey,
            amount: amountCents,
            payment_method: "credit_card",
            card_hash: cardHash,
            metadata: { paymentLinkId: String(link._id) },
            customer: { name: String((user as any).fullName || ""), email: String((user as any).email || "") },
          }
        : {
            api_key: apiKey,
            amount: amountCents,
            payment_method: method,
            metadata: { paymentLinkId: String(link._id) },
          };
    if (webhookUrl) (payload as any).postback_url = webhookUrl;
    console.log("PagarmeCreateV1 start", JSON.stringify({ url, method, amountCents, hasCardHash: method === "credit_card" ? !!cardHash : undefined, hasWebhookUrl: !!webhookUrl }));
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
    console.log("r---------", r);      
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
      return NextResponse.json(
        { error: "providerBlocked", reason: "Non-JSON response from provider", diagnostics: { statusCode, contentType: ct, cfRay, server } },
        { status: 502 }
      );
    }
    const created = await r.json();
    console.log("PagarmeCreate v1 ok", JSON.stringify({ id: created?.id, status: created?.status, method }));
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
    if (method === "boleto") {
      response.boletoUrl = created?.boleto_url || null;
      response.boletoBarcode = created?.boleto_barcode || null;
    }
    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    console.error("PaymentCreate fatal", e);
    return NextResponse.json({ error: "Internal server error", reason: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
