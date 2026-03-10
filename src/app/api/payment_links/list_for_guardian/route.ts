import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentLink from "@/lib/models/PaymentLink";
import { getPanelTitle } from "@/lib/panels";

function formatBRL(amount: number) {
  return `R$ ${amount.toFixed(2)}`;
}

export async function GET(req: NextRequest) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const statusParam = String(url.searchParams.get("status") || "all").toLowerCase();
    const statusFilter =
      statusParam === "pending" ? "pending" : statusParam === "completed" ? "paid" : "all";

    await connectMongo();

    const user = await User.findById(userId).select("_id role").lean();
    if (!user || user.role !== "Guardian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const baseFilter: any = { guardian: userId };
    if (statusFilter === "pending") {
      baseFilter.status = "pending";
    } else if (statusFilter === "paid") {
      baseFilter.status = "paid";
    }

    const docs = await PaymentLink.find(baseFilter)
      .populate("patient", "animalName photo")
      .populate("veterinarian", "fullName tradeName crmv crmvState")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const keep: any[] = [];
    for (const it of docs as any[]) {
      const createdAt = it.createdAt ? new Date(it.createdAt as any) : null;
      const expiresAt = it.expiresAt ? new Date(it.expiresAt as any) : null;
      const fallbackExpired = !expiresAt && createdAt ? now.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000 : false;
      const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : fallbackExpired;
      if (isExpired && String(it.status) === "pending") {
        continue;
      }
      keep.push(it);
    }

    const items = await Promise.all(keep.map(async (it: any) => ({
      id: String(it._id),
      kind: String(it.kind || "reading_payment"),
      productCode: String(it.productCode || "VETQ_MASTER_360"),
      panelTitle: await getPanelTitle(String(it.productCode || "VETQ_MASTER_360")),
      amount: Number(it.amount || 0),
      amountLabel: formatBRL(Number(it.amount || 0)),
      status: String(it.status || "pending"),
      createdAt: it.createdAt ? new Date(it.createdAt as any).toISOString() : null,
      patient: {
        id: String(it.patient?._id ?? it.patient ?? ""),
        name: String(it.patient?.animalName ?? "N/A"),
        photo: String(it.patient?.photo || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
      },
      veterinarian: {
        id: String(it.veterinarian?._id ?? it.veterinarian ?? ""),
        name: String(it.veterinarian?.tradeName ?? it.veterinarian?.fullName ?? "N/A"),
        crmv: it.veterinarian?.crmv ?? null,
        crmvState: it.veterinarian?.crmvState ?? null,
      },
    })));

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
