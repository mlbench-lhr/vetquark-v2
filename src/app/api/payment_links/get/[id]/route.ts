import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentLink from "@/lib/models/PaymentLink";

function formatBRL(amount: number) {
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(ctx.params);
    const id = String(resolvedParams?.id || "").trim();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findById(userId).select("_id role").lean();
    if (!user || (user.role !== "Guardian" && user.role !== "Veterinarian")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter = user.role === "Guardian" ? { _id: id, guardian: userId } : { _id: id, veterinarian: userId };
    const link = await PaymentLink.findOne(filter)
      .populate("patient", "animalName photo")
      .populate("veterinarian", "fullName tradeName crmv crmvState")
      .lean();

    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(
      {
        item: {
          id: String(link._id),
          amount: link.amount,
          amountLabel: formatBRL(link.amount),
          status: link.status,
          createdAt: link.createdAt ? new Date(link.createdAt as any).toISOString() : null,
          patient: {
            id: String((link as any).patient?._id || link.patient),
            name: String((link as any).patient?.animalName || ""),
            photo: (link as any).patient?.photo ?? null,
          },
          veterinarian: {
            id: String((link as any).veterinarian?._id || link.veterinarian),
            name: String((link as any).veterinarian?.tradeName || (link as any).veterinarian?.fullName || ""),
            crmv: (link as any).veterinarian?.crmv ?? null,
            crmvState: (link as any).veterinarian?.crmvState ?? null,
          },
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

