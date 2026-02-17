import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import WalletTransaction from "@/lib/models/WalletTransaction";

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
    const origin = new URL(req.url).origin;
    const amountCents = Math.round(Number(withdrawAmount) * 100);

    const provider = "pagarme";
    let providerAttempted = false;
    let providerOk = false;
    let providerResponse: any = null;
    let providerError: any = null;

    if (!apiKey || apiKey.startsWith("pk_")) {
      providerAttempted = false;
      providerOk = false;
      providerError = { code: "configError", message: "Missing or invalid PAGARME_SECRET_KEY" };
    } else if (pm.type !== "bank") {
      providerAttempted = false;
      providerOk = false;
      providerError = { code: "unsupportedPayoutMethod", message: "Provider withdrawals not supported for this payout method" };
    } else {
      const apiBaseRoot = String(process.env.PAGARME_API_BASE || "https://api.pagar.me").replace(/\/+$/, "");
      const basic = Buffer.from(`${apiKey}:`, "utf8").toString("base64");

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

      try {
        providerAttempted = true;
        const res = await fetch(transferUrl, {
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
        providerResponse = await res.json().catch(() => null);
        if (!res.ok) {
          const message =
            typeof (providerResponse as any)?.message === "string"
              ? (providerResponse as any).message
              : typeof (providerResponse as any)?.error === "string"
              ? (providerResponse as any).error
              : "Provider failed to create transfer";
          providerOk = false;
          providerError = { code: "providerError", message, status: res.status, details: providerResponse };
        } else {
          providerOk = true;
        }
      } catch (e) {
        providerOk = false;
        providerError = { code: "networkError", message: e instanceof Error ? e.message : "Provider request failed" };
      }
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
        provider,
        providerAttempted,
        providerOk,
        providerResponse,
        providerError,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
