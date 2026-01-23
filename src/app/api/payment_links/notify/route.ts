import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import PaymentLink from "@/lib/models/PaymentLink";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";

export async function POST(req: NextRequest) {
  try {
    const veterinarianId = String(req.headers.get("x-user-id") || "").trim();
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const paymentLinkId = String(body?.paymentLinkId || "").trim();
    if (!paymentLinkId || !mongoose.Types.ObjectId.isValid(paymentLinkId)) {
      return NextResponse.json({ error: "Invalid paymentLinkId" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role tradeName fullName").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const link = await PaymentLink.findOne({ _id: paymentLinkId, veterinarian: veterinarianId }).lean();
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patient = await Patient.findById(link.patient).select("_id animalName").lean();
    const guardianId = String(link.guardian);
    const url = `/Guardian/payment/${encodeURIComponent(String(link._id))}`;
    const vetName = String((veterinarian as any).tradeName || (veterinarian as any).fullName || "Veterinarian");
    const petName = String((patient as any)?.animalName || "your pet");

    const title = "Payment link received";
    const message = `${vetName} sent a payment link for ${petName}.`;

    const doc = await Notification.create({
      user: guardianId,
      type: "payment_link",
      title,
      message,
      url,
      readAt: null,
    });

    const pusher = getPusherServer();
    await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
      id: String(doc._id),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      url: doc.url,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

