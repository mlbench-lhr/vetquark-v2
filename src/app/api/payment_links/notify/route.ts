import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import PaymentLink from "@/lib/models/PaymentLink";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";
import Reading from "@/lib/models/Reading";
import { isPushEnabledForUser } from "@/lib/utils";
import { getPanelTitle } from "@/lib/panels";

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

    const identification = body?.identification || null;
    const patientId = String(identification?.patientId || "").trim();
    const analysisType = String(identification?.analysisType || "").trim();
    const collectionMethod = String(identification?.collectionMethod || "").trim();
    const collectionAtRaw = String(identification?.collectionAt || "").trim();
    const stripLot = String(identification?.stripLot || "").trim();
    const stripExpiryRaw = String(identification?.stripExpiry || "").trim();

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json({ error: "Invalid identification.patientId" }, { status: 400 });
    }

    // Determine testType from identification.analysisType or link.productCode
    let testType: "urine" | "eye" | "skin" = "urine";
    if (analysisType === "eye" || analysisType === "skin") {
      testType = analysisType;
    }

    // Validate urine-only fields only for urine testType
    let collectionAt: Date | null = null;
    let stripExpiry: Date | null = null;

    if (testType === "urine") {
      if (collectionMethod !== "free_catch" && collectionMethod !== "cystocentesis" && collectionMethod !== "catheter") {
        return NextResponse.json({ error: "Invalid identification.collectionMethod" }, { status: 400 });
      }
      collectionAt = new Date(collectionAtRaw);
      if (!collectionAtRaw || Number.isNaN(collectionAt.getTime())) {
        return NextResponse.json({ error: "Invalid identification.collectionAt" }, { status: 400 });
      }
      stripExpiry = stripExpiryRaw ? new Date(stripExpiryRaw) : null;
      if (stripExpiryRaw && (!stripExpiry || Number.isNaN(stripExpiry.getTime()))) {
        return NextResponse.json({ error: "Invalid identification.stripExpiry" }, { status: 400 });
      }
      if (stripExpiry) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const expiryStr = stripExpiry.toISOString().slice(0, 10);
        if (expiryStr < todayStr) {
          return NextResponse.json({ error: "Strip expiry must be today or a future date" }, { status: 400 });
        }
      }
    } else {
      // For eye/skin, set collectionAt to now automatically
      collectionAt = new Date();
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role tradeName fullName").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const link = await PaymentLink.findOneAndUpdate(
      { _id: paymentLinkId, veterinarian: veterinarianId, patient: patientId },
      { $set: { notifiedAt: new Date() } },
      { new: true }
    ).lean();
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Infer testType from link.productCode if not already determined
    if (testType === "urine") {
      const linkProductCode = String((link as any).productCode || "").trim();
      if (linkProductCode === "VETQ_EYE_ANALYSIS") {
        testType = "eye";
      } else if (linkProductCode === "VETQ_SKIN_ANALYSIS") {
        testType = "skin";
      }
    }

    if (!(link as any).reading) {
      const readingId = new mongoose.Types.ObjectId();
      const wizardStep = testType === "urine" ? "timer" : "image_capture";
      const created = await Reading.create({
        _id: readingId,
        veterinarian: veterinarianId,
        guardian: (link as any).guardian,
        patient: (link as any).patient,
        paymentLink: link._id,
        paymentStatus: "pending",
        testType,
        productCode: String((link as any).productCode || "VETQ_MASTER_360"),
        panelVersion: Number((link as any).panelVersion || 1),
        isDraft: true,
        wizardStep,
        identification: {
          collectionMethod: testType === "urine" ? collectionMethod : null,
          collectionAt,
          stripLot: testType === "urine" ? stripLot : "",
          stripExpiry: testType === "urine" ? stripExpiry : null,
        },
        results: [],
        report: {
          summaryAndInterpretation: "",
          otherInformation: "",
          veterinarianNotes: "",
        },
        imageAnalysis: null,
      });

      const updated = await PaymentLink.updateOne(
        { _id: link._id, reading: null },
        { $set: { reading: created._id } },
      );
      if (!updated.modifiedCount) {
        await Reading.deleteOne({ _id: created._id });
      }
    }

    const patient = await Patient.findById(link.patient).select("_id animalName").lean();
    const guardianId = String(link.guardian);
    const url = `/Guardian/payment/${encodeURIComponent(String(link._id))}`;
    const vetName = String((veterinarian as any).tradeName || (veterinarian as any).fullName || "Veterinarian");
    const petName = String((patient as any)?.animalName || "your pet");
    const panelTitle = await getPanelTitle(String((link as any).productCode || "VETQ_MASTER_360"));

    const title = "Payment link received";
    const message = `${vetName} sent a payment link for ${petName} (${panelTitle}).`;

    const guardianUser = await User.findById(guardianId).select("_id role notificationSettings").lean();
    const canNotify = isPushEnabledForUser(guardianUser, "payment_link");
    const doc = canNotify
      ? await Notification.create({
          user: guardianId,
          type: "payment_link",
          title,
          message,
          url,
          readAt: null,
        })
      : null;

    if (doc) {
      const pusher = getPusherServer();
      await pusher.trigger(notificationsChannelForUser(guardianId), "notification:new", {
        id: String(doc._id),
        type: doc.type,
        title: doc.title,
        message: doc.message,
        url: doc.url,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.log("Internal server error-----", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
