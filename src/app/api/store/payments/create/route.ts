import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const orderIdRaw = String((body as any)?.orderId || "").trim();
    const cardToken = String((body as any)?.cardToken || (body as any)?.card_token || "").trim();
    const installments = Number((body as any)?.installments || 1);
    if (!orderIdRaw) return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    if (!cardToken) return NextResponse.json({ error: "Missing cardToken" }, { status: 400 });

    await connectMongo();

    const user = await User.findById(userId).select("_id role fullName email").lean();
    if (!user || user.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const coll = mongoose.connection.collection("store_orders");
    const orderObjectId = new mongoose.Types.ObjectId(orderIdRaw);
    const doc = await coll.findOne({ _id: orderObjectId });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const status = String((doc as any)?.status || "created").toLowerCase();
    if (status === "paid") {
      return NextResponse.json({ ok: true, status: "paid" }, { status: 200 });
    }

    const total = Number((doc as any)?.total || 0);
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "Invalid total" }, { status: 400 });
    }

    const apiKey = String(process.env.PAGARME_SECRET_KEY || "").trim();
    if (!apiKey) return NextResponse.json({ error: "Missing PAGARME_SECRET_KEY" }, { status: 500 });
    if (apiKey.startsWith("pk_")) {
      return NextResponse.json({ error: "Invalid secret key" }, { status: 500 });
    }

    const amountCents = Math.round(total * 100);
    const origin = new URL(req.url).origin;
    const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me/core/v5/orders").replace(/\/+$/, "");
    const v5Url = base;
    const basic = Buffer.from(`${apiKey}:`, "utf8").toString("base64");

    const orderPayload: any = {
      code: `store:${String(orderIdRaw)}`,
      items: [
        {
          amount: amountCents,
          quantity: 1,
          code: `store:${String(orderIdRaw)}`,
          description: "VetQuark store order",
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
          line_1: "VetQuark Store",
          line_2: "Order payment",
        },
      },
      payments: [
        {
          payment_method: "credit_card",
          credit_card: {
            capture: true,
            installments,
            statement_descriptor: "VetQuark".slice(0, 13),
            card_token: cardToken,
            card: {
              billing_address: {
                country: "BR",
                state: "SP",
                city: "São Paulo",
                zip_code: "01000000",
                line_1: "VetQuark Store",
                line_2: "Order payment",
              },
            },
          },
          amount: amountCents,
        },
      ],
      closed: true,
      metadata: { storeOrderId: String(orderIdRaw) },
    };

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

    const ct = String(r.headers.get("content-type") || "");
    if (!ct.includes("application/json")) {
      const text = await r.text().catch(() => "");
      const snippet = typeof text === "string" ? text.slice(0, 300) : "";
      return NextResponse.json(
        { error: "providerBlocked", reason: "Non-JSON response from provider", diagnostics: { statusCode: r.status, contentType: ct, snippet } },
        { status: 502 }
      );
    }

    const createdV5: any = await r.json();
    if (r.status >= 400) {
      const msg =
        typeof createdV5?.message === "string"
          ? createdV5.message
          : Array.isArray(createdV5?.errors) && typeof createdV5.errors?.[0]?.message === "string"
          ? createdV5.errors[0].message
          : "Provider error";
      return NextResponse.json({ error: "providerError", message: msg, details: createdV5 }, { status: 502 });
    }

    const orderProviderId = String(createdV5?.id || "");
    const charge: any = Array.isArray(createdV5?.charges) ? createdV5.charges[0] : null;
    const statusOrder = String(createdV5?.status || "").toLowerCase();
    const statusCharge = String(charge?.status || "").toLowerCase();
    const paid =
      statusOrder === "paid" ||
      statusOrder === "captured" ||
      statusCharge === "paid" ||
      statusCharge === "captured" ||
      statusCharge === "authorized";

    await coll.updateOne(
      { _id: orderObjectId },
      {
        $set: {
          status: paid ? "paid" : statusOrder || "created",
          provider: "pagarme",
          providerTransactionId: orderProviderId || null,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true, transactionId: orderProviderId, status: paid ? "paid" : statusCharge || statusOrder }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
