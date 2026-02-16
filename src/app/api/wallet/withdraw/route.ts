import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import WalletTransaction from "@/lib/models/WalletTransaction";
import PlatformSettings from "@/lib/models/PlatformSettings";

export async function POST(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const user = await User.findById(userId).select("_id role payoutMethod").lean();
    if (!user || user.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const requested = typeof body?.amount === "number" ? body.amount : Number(body?.amount);
    const requestedAmount = Number.isFinite(requested) && requested > 0 ? requested : null;

    const docs: any[] = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    let availableBalance = 0;
    for (const tx of docs as any[]) {
      if (tx.type === "credit") availableBalance += Number(tx.amountNet || 0);
      else if (tx.type === "withdrawal") availableBalance -= Number(tx.amountNet || tx.amountGross || 0);
    }

    const withdrawAmount = requestedAmount ?? availableBalance;
    if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: "No available balance" }, { status: 400 });
    }
    if (withdrawAmount > availableBalance) {
      return NextResponse.json({ error: "Amount exceeds available balance" }, { status: 400 });
    }

    const pm: any = (user as any).payoutMethod || null;
    if (!pm || typeof pm !== "object") {
      return NextResponse.json({ error: "Payout method not set" }, { status: 400 });
    }
    if (pm.type !== "bank" && pm.type !== "pix") {
      return NextResponse.json({ error: "Invalid payout method" }, { status: 400 });
    }

    const apiKey = String(process.env.PAGARME_SECRET_KEY || "").trim();
    if (!apiKey || apiKey.startsWith("pk_")) {
      return NextResponse.json({ error: "Missing or invalid PAGARME_SECRET_KEY" }, { status: 500 });
    }

    const apiBaseRoot = String(process.env.PAGARME_API_BASE || "https://api.pagar.me").replace(/\/+$/, "");
    const origin = new URL(req.url).origin;
    const basic = Buffer.from(`${apiKey}:`, "utf8").toString("base64");
    const amountCents = Math.round(Number(withdrawAmount) * 100);

    if (pm.type === "pix") {
      return NextResponse.json({ error: "Pix withdrawals are not supported via provider" }, { status: 400 });
    }

    const nameRaw = String((user as any).fullName || (user as any).tradeName || "").trim() || "Veterinarian";
    const docRaw = String(pm.holderCpfCnpj || "").replace(/\D/g, "");
    const personTypeRaw = String(pm.personType || "").trim();
    const holderType = personTypeRaw === "legal" ? "company" : "individual";

    function bankCodeFromName(name: string): string {
      const n = name.toLowerCase();
      if (n.includes("itaú")) return "341";
      if (n.includes("itau")) return "341";
      if (n.includes("banco do brasil")) return "001";
      if (n.includes("santander")) return "033";
      if (n.includes("bradesco")) return "237";
      if (n.includes("caixa")) return "104";
      if (n.includes("nubank")) return "260";
      return "001";
    }
    const bankCode = bankCodeFromName(String(pm.bankName || ""));

    function parseNumberAndDv(raw: string) {
      const s = String(raw || "").replace(/\s+/g, "");
      const digits = s.replace(/\D/g, "");
      if (!digits) return { number: "", dv: "" };
      if (digits.length === 1) return { number: digits, dv: "" };
      const number = digits.slice(0, -1);
      const dv = digits.slice(-1);
      return { number, dv };
    }
    const agencyParsed = parseNumberAndDv(String(pm.agency || ""));
    const accountParsed = parseNumberAndDv(String(pm.account || ""));

    const bankAccount = {
      bank_code: bankCode,
      branch_number: agencyParsed.number || String(pm.agency || "").replace(/\D/g, ""),
      account_number: accountParsed.number || String(pm.account || "").replace(/\D/g, ""),
      account_check_digit: accountParsed.dv || "",
      holder_name: nameRaw,
      holder_type: holderType,
      holder_document: docRaw,
    };

    const transferUrl = `${apiBaseRoot}/core/v5/transfers`;
    const payload: any = {
      amount: amountCents,
      bank_account: bankAccount,
      metadata: { userId, withdrawAmount: withdrawAmount },
    };
    let res = await fetch(transferUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Basic ${basic}`,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: origin,
        Origin: origin,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36 VetQuark",
      },
      body: JSON.stringify(payload),
    });
    let json: any = await res.json().catch(() => null);

    // Detect Cloudflare HTML block (providerBlocked)
    const ct = res.headers.get("content-type") || "";
    const cfRay = res.headers.get("cf-ray") || "";
    if (ct.includes("text/html") && (cfRay || (typeof json === "string" && /cloudflare|ray id/i.test(json)))) {
      return NextResponse.json(
        {
          error: "providerBlocked",
          message: "Provider blocked the request (Cloudflare)",
          details: { cfRay: cfRay || null },
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const message =
        typeof (json as any)?.message === "string"
          ? (json as any).message
          : typeof (json as any)?.error === "string"
          ? (json as any).error
          : "Provider failed to create transfer";
      return NextResponse.json({ error: "providerError", message, details: json }, { status: 502 });
    }

    const created = await WalletTransaction.create({
      user: userId,
      type: "withdrawal",
      amountGross: withdrawAmount,
      platformFee: 0,
      amountNet: withdrawAmount,
      currency: "BRL",
      status: "released",
      paymentLink: null,
      patient: null,
      guardian: null,
      releaseAt: new Date(),
    });

    const newBalance = availableBalance - withdrawAmount;
    return NextResponse.json(
      {
        ok: true,
        transactionId: String(created._id),
        amount: withdrawAmount,
        balance: newBalance,
        provider: "pagarme",
        providerResponse: json,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
