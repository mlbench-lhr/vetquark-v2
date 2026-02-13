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
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
