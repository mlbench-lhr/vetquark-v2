import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import WalletTransaction from "@/lib/models/WalletTransaction";

function formatBRL(amount: number) {
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

export async function GET(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const docs: any[] = await WalletTransaction.find({ user: userId })
      .populate("patient", "animalName photo")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    let availableBalance = 0;
    for (const tx of docs as any[]) {
      if (tx.type === "credit") {
        const releaseAt = tx.releaseAt ? new Date(tx.releaseAt as any) : null;
        const isReleased = tx.status === "released" || (releaseAt && releaseAt.getTime() <= now.getTime());
        if (isReleased) availableBalance += Number(tx.amountNet || 0);
      } else if (tx.type === "withdrawal" && tx.status === "released") {
        availableBalance -= Number(tx.amountNet || tx.amountGross || 0);
      }
    }

    const transactions = docs.map((tx: any) => {
      const amountLabel = (typeof tx.amountNet === "number" && Number.isFinite(tx.amountNet))
        ? tx.amountNet.toFixed(2).replace(".", ",")
        : "";
      const createdAtIso = tx.createdAt ? new Date(tx.createdAt as any).toISOString() : null;
      const releaseAtIso = tx.releaseAt ? new Date(tx.releaseAt as any).toISOString() : null;
      return {
        id: String(tx._id),
        type: tx.type === "withdrawal" ? "withdrawal" : "credit",
        title: String(tx.patient?.animalName || "Urinalysis"),
        subtitle: "Urinalysis Report",
        date: releaseAtIso ?? createdAtIso,
        amount: amountLabel,
        avatarUrl: String(tx.patient?.photo || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
        isPix: false,
      };
    });

    return NextResponse.json(
      {
        balance: availableBalance,
        balanceLabel: formatBRL(availableBalance),
        currency: "BRL",
        transactions,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
