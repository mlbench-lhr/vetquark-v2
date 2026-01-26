import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import Notification from "@/lib/models/Notification";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";
import mongoose from "mongoose";

function isAllowedCloudinaryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return url.hostname.endsWith("res.cloudinary.com");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    const profileImageUrl = String(body?.profileImageUrl || "").trim();

    if (!userId || !profileImageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!isAllowedCloudinaryUrl(profileImageUrl)) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    await connectMongo();

    const updated = await User.findByIdAndUpdate(
      userId,
      { profileImageUrl },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ((updated as any).role === "Guardian") {
      const patients = await Patient.find({ guardian: userId }).select("veterinarian").lean();
      const vetIds = new Set<string>();
      patients.forEach((p: any) => {
        if (p.veterinarian) vetIds.add(String(p.veterinarian));
      });

      const pusher = getPusherServer();
      const guardianName = (updated as any).fullName || "A guardian";
      const title = "Guardian updated profile picture";
      const message = `${guardianName} updated their profile picture.`;
      const url = `/Veterinarian/home/guardianPatients/${encodeURIComponent(userId)}`;

      for (const vetId of vetIds) {
        if (mongoose.Types.ObjectId.isValid(vetId)) {
          const notification = await Notification.create({
            user: vetId,
            type: "profile_picture_updated",
            title,
            message,
            url,
            readAt: null,
          });

          await pusher.trigger(notificationsChannelForUser(vetId), "notification:new", {
            id: String(notification._id),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            url: notification.url,
            createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
