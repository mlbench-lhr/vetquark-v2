import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getPusherServer, notificationsChannelForUser } from "@/lib/pusherServer";

function getUserIdFromRequest(req: NextRequest): { userId: string | null; error: NextResponse | null } {
  const headerId = req.headers.get("x-user-id");
  if (headerId?.trim()) return { userId: headerId.trim(), error: null };

  const token = req.cookies.get("session_id")?.value || req.cookies.get("auth_token")?.value;
  if (!token) return { userId: null, error: null };

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }),
    };
  }

  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object" && "sub" in decoded) {
      const sub = (decoded as { sub?: unknown }).sub;
      if (typeof sub === "string" && sub.trim()) return { userId: sub.trim(), error: null };
    }
    return { userId: null, error: null };
  } catch {
    return { userId: null, error: null };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData().catch(() => null);
    const socketId = String(form?.get("socket_id") || "").trim();
    const channelName = String(form?.get("channel_name") || "").trim();
    if (!socketId || !channelName) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const expected = notificationsChannelForUser(userId);
    if (channelName !== expected) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectMongo();
    const user = await User.findById(userId).select("_id role").lean();
    if (!user || (user.role !== "Guardian" && user.role !== "Veterinarian")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pusher = getPusherServer();
    const auth = (pusher as any).authorizeChannel
      ? (pusher as any).authorizeChannel(socketId, channelName)
      : (pusher as any).authenticate(socketId, channelName);

    return NextResponse.json(auth, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
