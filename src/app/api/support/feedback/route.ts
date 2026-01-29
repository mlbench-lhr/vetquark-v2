import { NextRequest, NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const to =
      process.env.ADMIN_EMAIL ||
      process.env.SUPPORT_EMAIL ||
      "mlbenchdev@gmail.com";

    await sendFeedbackEmail(to, message, {
      fromEmail: typeof body?.fromEmail === "string" ? body.fromEmail : undefined,
      fromName: typeof body?.fromName === "string" ? body.fromName : undefined,
      userId: typeof body?.userId === "string" ? body.userId : undefined,
      appVersion: typeof body?.appVersion === "string" ? body.appVersion : undefined,
    });

    return NextResponse.json({ message: "Feedback sent" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
