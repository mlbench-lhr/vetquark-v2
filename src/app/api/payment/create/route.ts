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
    const method: Method = methodRaw === "pix" || methodRaw === "boleto" ? (methodRaw as Method) : null as any;
    const cardHash = String(body?.cardHash || "").trim();
    console.log("PaymentCreate init", JSON.stringify({ userId, paymentLinkId, method }));

    if (!paymentLinkId || !mongoose.Types.ObjectId.isValid(paymentLinkId)) {
      return NextResponse.json({ error: "Invalid paymentLinkId" }, { status: 400 });
    }
    if (!method) return NextResponse.json({ error: "Method not supported in v5-only mode" }, { status: 501 });

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
    
    console.log("DEBUG: Environment Variables Check", JSON.stringify({
      PAGARME_SECRET_KEY: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "MISSING",
      PAGARME_SECRET_KEY_VALID: apiKey.startsWith("sk_"),
      PAGARME_SECRET_KEY_LENGTH: apiKey.length,
      PAGARME_WEBHOOK_URL: webhookUrl || "MISSING"
    }));
    
    if (!apiKey) return NextResponse.json({ error: "Missing PAGARME_SECRET_KEY" }, { status: 500 });

    const amountCents = Math.round(Number(link.amount) * 100);
    const origin = new URL(req.url).origin;
    const basic = Buffer.from(`${apiKey}:`, "utf8").toString("base64");
    if (method === "pix") {
      const forwardedFor = String(req.headers.get("x-forwarded-for") || "");
      const clientIp =
        (forwardedFor.split(",")[0] || "").trim() ||
        String(req.headers.get("x-real-ip") || "");
      console.log("DEBUG: Client IP Detection", JSON.stringify({ forwardedFor, clientIp }));
      const expiresInSeconds = 3600;
      const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me/core/v5/orders").replace(/\/+$/, "");
      const v5Url = base;
      console.log("DEBUG: Pagar.me API URL", JSON.stringify({ base, v5Url }));
      if (!apiKey || apiKey.startsWith("pk_")) {
        console.error("PagarmeCreateV5 preflight invalid secret", JSON.stringify({ hasKey: !!apiKey, keyPrefix: apiKey ? apiKey.slice(0, 3) : null }));
        return NextResponse.json(
          { error: "configError", message: "Invalid secret key. Use sk_*, not pk_*" },
          { status: 500 }
        );
      }
      console.log("PagarmeCreateV5 start", JSON.stringify({ v5Url, amountCents }));
      const orderPayload: any = {
      code: `payment:${String(link._id)}`,
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
        document: "12345678909".replace(/\D/g, ""),
        phones: {
          mobile_phone: { country_code: "55", area_code: "11", number: "999999999" },
        },
        address: {
          country: "BR",
          state: "SP",
          city: "São Paulo",
          zip_code: "01000000",
          line_1: "VetQuark Payment",
          line_2: "Test transaction",
        },
      },
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_in: expiresInSeconds,
            additional_information: [
              { name: "customer_name", value: String((user as any).fullName || "") },
              { name: "customer_email", value: String((user as any).email || "") },
              { name: "order_code", value: `payment:${String(link._id)}` },
            ],
          },
          amount: amountCents,
        },
      ],
      closed: true,
      ip: clientIp || undefined,
      metadata: { paymentLinkId: String(link._id) },
    };
       console.log("DEBUG: Pagar.me Credentials", JSON.stringify({
        apiKey: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "missing",
        apiKeyValid: apiKey.startsWith("sk_"),
        amountCents: amountCents,
        v5Url: v5Url
      }));
      
      console.log("DEBUG: Pagar.me Request Details", JSON.stringify({
        url: v5Url,
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `Basic ${basic.slice(0, 20)}...`,
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          origin: origin,
          referer: origin
        },
        payload: orderPayload
      }, null, 2));
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
        const responseText = await r.text().catch(() => "");
        let errJson = {};
        try {
          errJson = JSON.parse(responseText);
        } catch (e) {
          console.error("PagarmeCreateV5 error parsing JSON", { statusCode, responseText: responseText.slice(0, 500) });
        }
        
        const msg =
          typeof (errJson as any)?.message === "string"
            ? (errJson as any).message
            : Array.isArray((errJson as any)?.errors) && typeof (errJson as any).errors?.[0]?.message === "string"
            ? (errJson as any).errors[0].message
            : "Provider error";
        
        console.error(
          "PagarmeCreateV5 error - FULL RESPONSE",
          JSON.stringify({ 
            statusCode, 
            contentType: ct, 
            cfRay, 
            server, 
            url: v5Url, 
            error: errJson,
            rawResponse: responseText,
            requestHeaders: {
              authorization: `Basic ${basic.slice(0, 20)}...`,
              "content-type": "application/json",
              accept: "application/json"
            },
            requestPayload: orderPayload
          }, null, 2),
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
      const statusOrder = String(createdV5?.status || "").toLowerCase();
      const statusCharge = String(charge?.status || "").toLowerCase();
      if (statusOrder === "failed" || statusCharge === "failed") {
        const reason =
          String(charge?.last_transaction?.gateway_response?.errors?.[0]?.message || "") ||
          String(charge?.last_transaction?.failure_reason || "") ||
          String(charge?.status_reason || "") ||
          "Provider failed to create Pix charge";
        console.error("PagarmeCreateV5 failed", JSON.stringify({ orderId, statusOrder, statusCharge, reason }));
        return NextResponse.json(
          { error: "providerError", message: reason, details: createdV5 },
          { status: 502 }
        );
      }
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
    if (method === "boleto") {
      const forwardedFor = String(req.headers.get("x-forwarded-for") || "");
      const clientIp =
        (forwardedFor.split(",")[0] || "").trim() ||
        String(req.headers.get("x-real-ip") || "");
      const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me/core/v5/orders").replace(/\/+$/, "");
      const v5Url = base;
      console.log("DEBUG: Pagar.me API URL", JSON.stringify({ base, v5Url }));
      if (!apiKey || apiKey.startsWith("pk_")) {
        console.error("PagarmeCreateV5 preflight invalid secret", JSON.stringify({ hasKey: !!apiKey, keyPrefix: apiKey ? apiKey.slice(0, 3) : null }));
        return NextResponse.json(
          { error: "configError", message: "Invalid secret key. Use sk_*, not pk_*" },
          { status: 500 }
        );
      }
      const dueAtIso = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      const orderPayload: any = {
        code: `payment:${String(link._id)}`,
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
          document: "12345678909".replace(/\D/g, ""),
          phones: {
            mobile_phone: { country_code: "55", area_code: "11", number: "999999999" },
          },
          address: {
            country: "BR",
            state: "SP",
            city: "São Paulo",
            zip_code: "01000000",
            line_1: "VetQuark Payment",
            line_2: "Test transaction",
          },
        },
        payments: [
          {
            payment_method: "boleto",
            boleto: {
              due_at: dueAtIso,
              instructions: "VetQuark payment\nPay by due date",
              billing_address: {
                country: "BR",
                state: "SP",
                city: "São Paulo",
                zip_code: "01000000",
                line_1: "VetQuark Payment",
                line_2: "Test transaction",
              },
            },
            amount: amountCents,
          },
        ],
        closed: true,
        ip: clientIp || undefined,
        metadata: { paymentLinkId: String(link._id) },
      };
      console.log("DEBUG: Pagar.me Credentials", JSON.stringify({
        apiKey: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "missing",
        apiKeyValid: apiKey.startsWith("sk_"),
        amountCents: amountCents,
        v5Url: v5Url
      }));
      console.log("DEBUG: Pagar.me Request Details", JSON.stringify({
        url: v5Url,
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `Basic ${basic.slice(0, 20)}...`,
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          origin: origin,
          referer: origin
        },
        payload: orderPayload
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
      const statusCode = r.status;
      if (!ct.includes("application/json")) {
        const text = await r.text().catch(() => "");
        const snippet = typeof text === "string" ? text.slice(0, 300) : "";
        console.error("PagarmeCreateV5 blocked", JSON.stringify({ statusCode, contentType: ct, url: v5Url, bodySnippet: snippet }));
        return NextResponse.json(
          { error: "providerBlocked", reason: "Non-JSON response from provider", diagnostics: { statusCode, contentType: ct } },
          { status: 502 }
        );
      }
      if (statusCode >= 400) {
        const responseText = await r.text().catch(() => "");
        let errJson = {};
        try {
          errJson = JSON.parse(responseText);
        } catch (e) {
          console.error("PagarmeCreateV5 error parsing JSON", { statusCode, responseText: responseText.slice(0, 500) });
        }
        const msg =
          typeof (errJson as any)?.message === "string"
            ? (errJson as any).message
            : Array.isArray((errJson as any)?.errors) && typeof (errJson as any).errors?.[0]?.message === "string"
            ? (errJson as any).errors[0].message
            : "Provider error";
        console.error(
          "PagarmeCreateV5 error - FULL RESPONSE",
          JSON.stringify({ 
            statusCode, 
            contentType: ct, 
            url: v5Url, 
            error: errJson,
            rawResponse: responseText,
            requestHeaders: {
              authorization: `Basic ${basic.slice(0, 20)}...`,
              "content-type": "application/json",
              accept: "application/json"
            },
            requestPayload: orderPayload
          }, null, 2),
        );
        return NextResponse.json(
          { error: "providerError", message: msg, details: errJson, statusCode },
          { status: 502 }
        );
      }
      const createdV5: any = await r.json();
      const orderId = String(createdV5?.id || "");
      const charge: any = Array.isArray(createdV5?.charges) ? createdV5.charges[0] : null;
      const statusOrder = String(createdV5?.status || "").toLowerCase();
      const statusCharge = String(charge?.status || "").toLowerCase();
      if (statusOrder === "failed" || statusCharge === "failed") {
        const reason =
          String(charge?.last_transaction?.gateway_response?.errors?.[0]?.message || "") ||
          String(charge?.last_transaction?.failure_reason || "") ||
          String(charge?.status_reason || "") ||
          "Provider failed to create Boleto charge";
        console.error("PagarmeCreateV5 failed", JSON.stringify({ orderId, statusOrder, statusCharge, reason }));
        return NextResponse.json(
          { error: "providerError", message: reason, details: createdV5 },
          { status: 502 }
        );
      }
      await PaymentLink.updateOne(
        { _id: link._id },
        {
          $set: {
            paymentMethod: "boleto",
            provider: "pagarme",
            providerTransactionId: orderId || null,
          },
        },
      );
      const lastTxn: any = charge?.last_transaction || {};
      const pBoleto: any = charge?.payment?.boleto || {};
      const boletoUrlRaw =
        pBoleto?.url ||
        pBoleto?.pdf ||
        lastTxn?.boleto_url ||
        lastTxn?.pdf_url ||
        "";
      const boletoBarcodeRaw =
        pBoleto?.barcode ||
        pBoleto?.line ||
        lastTxn?.boleto_barcode ||
        lastTxn?.barcode ||
        lastTxn?.line ||
        "";
      const responseV5: any = {
        transactionId: orderId,
        status: String(createdV5?.status || charge?.status || ""),
        boletoUrl: boletoUrlRaw ? String(boletoUrlRaw) : null,
        boletoBarcode: boletoBarcodeRaw ? String(boletoBarcodeRaw) : null,
      };
      return NextResponse.json(responseV5, { status: 200 });
    }
    return NextResponse.json({ error: "Method not supported in v5-only mode" }, { status: 501 });
  } catch (e) {
    console.error("PaymentCreate fatal", e);
    return NextResponse.json({ error: "Internal server error", reason: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
