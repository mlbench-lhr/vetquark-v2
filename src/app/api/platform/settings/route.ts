import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import PlatformSettings from "@/lib/models/PlatformSettings";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();

    const envFee = Number.parseFloat(String(process.env.PLATFORM_FEE_BRL || "").trim());
    const envMin = Number.parseFloat(String(process.env.PRICING_SUGGESTED_MIN_BRL || "").trim());
    const envMax = Number.parseFloat(String(process.env.PRICING_SUGGESTED_MAX_BRL || "").trim());
    const envMinWithdrawal = Number.parseFloat(String(process.env.MIN_WITHDRAWAL_BRL || "").trim());

    let doc = await PlatformSettings.findOne({}).lean();
    if (!doc) {
      doc = await PlatformSettings.create({
        platformFeeBRL: Number.isFinite(envFee) ? envFee : undefined,
        pricingSuggestedMinBRL: Number.isFinite(envMin) ? envMin : undefined,
        pricingSuggestedMaxBRL: Number.isFinite(envMax) ? envMax : undefined,
        minWithdrawalBRL: Number.isFinite(envMinWithdrawal) ? envMinWithdrawal : undefined,
      }).then((d) => d.toObject());
    }

    const platformFee = Number.isFinite(Number((doc as any).platformFeeBRL))
      ? Number((doc as any).platformFeeBRL)
      : 33.0;
    const minSuggested = Number.isFinite(Number((doc as any).pricingSuggestedMinBRL))
      ? Number((doc as any).pricingSuggestedMinBRL)
      : 59.0;
    const maxSuggested = Number.isFinite(Number((doc as any).pricingSuggestedMaxBRL))
      ? Number((doc as any).pricingSuggestedMaxBRL)
      : 119.0;
    const minWithdrawal = Number.isFinite(Number((doc as any).minWithdrawalBRL))
      ? Number((doc as any).minWithdrawalBRL)
      : 20.0;

    return NextResponse.json(
      {
        currency: "BRL",
        platformFee,
        minSuggested,
        maxSuggested,
        minWithdrawal,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

