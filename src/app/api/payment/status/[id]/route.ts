import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentLink from "@/lib/models/PaymentLink";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = String(req.headers.get("x-user-id") || "").trim();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = String(process.env.PAGARME_SECRET_KEY || "").trim();
    if (!apiKey) return NextResponse.json({ error: "Missing PAGARME_SECRET_KEY" }, { status: 500 });

    const resolved = await Promise.resolve(ctx.params);
    const idRaw = String(resolved?.id || "").trim();
    if (!idRaw) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await connectMongo();

    const user = await User.findById(userId).select("_id role").lean();
    if (!user || ((user as any).role !== "Guardian" && (user as any).role !== "Veterinarian")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter =
      (user as any).role === "Guardian"
        ? mongoose.Types.ObjectId.isValid(idRaw)
          ? { _id: idRaw, guardian: userId }
          : { provider: "pagarme", providerTransactionId: idRaw, guardian: userId }
        : mongoose.Types.ObjectId.isValid(idRaw)
          ? { _id: idRaw, veterinarian: userId }
          : { provider: "pagarme", providerTransactionId: idRaw, veterinarian: userId };

    const link: any = await PaymentLink.findOne(filter)
      .select("_id providerTransactionId status reading kind productCode panelVersion")
      .lean();
    const txId = String(link?.providerTransactionId || (mongoose.Types.ObjectId.isValid(idRaw) ? "" : idRaw) || "").trim();
    if (!txId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const base = String(process.env.PAGARME_API_BASE || "https://api.pagar.me").replace(/\/+$/, "");
    const origin = new URL(req.url).origin;
    console.log("PaymentStatus v5 init", JSON.stringify({ idRaw, resolvedFromLink: !!link, txId }));
    const url = `${base}/core/v5/orders/${encodeURIComponent(txId)}`;
    const basic = Buffer.from(`${apiKey}:`, "utf8").toString("base64");
    console.log("PaymentStatus v5 GET", JSON.stringify({ url }));
    const r = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Basic ${basic}`,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        origin,
        referer: origin,
      },
    });
    const ct = String(r.headers.get("content-type") || "");
    const statusCode = r.status;
    if (!ct.includes("application/json")) {
      const text = await r.text().catch(() => "");
      const snippet = typeof text === "string" ? text.slice(0, 300) : "";
      console.error("PaymentStatus v5 blocked", JSON.stringify({ statusCode, contentType: ct, url, bodySnippet: snippet }));
      return NextResponse.json(
        { error: "providerBlocked", reason: "Non-JSON response from provider", diagnostics: { statusCode, contentType: ct } },
        { status: 502 }
      );
    }
    const ord = await r.json();
    const charge = Array.isArray(ord?.charges) ? ord.charges[0] : null;
    const status = String(ord?.status || charge?.status || "");
    console.log("PaymentStatus v5 ok", JSON.stringify({ id: txId, status }));

    const statusLower = status.trim().toLowerCase();
    const shouldMarkPaid = statusLower === "paid" || statusLower === "authorized" || statusLower === "captured";
    const shouldMarkExpired = statusLower === "refused" || statusLower === "failed" || statusLower === "chargedback";

    if (link?._id) {
      const wasPaid = String(link.status) === "paid";
      const wasPending = String(link.status) === "pending";

      if (!wasPaid && shouldMarkPaid) {
        await PaymentLink.updateOne({ _id: link._id }, { $set: { status: "paid" } });
        const readingId = link.reading ? String(link.reading) : "";
        if (readingId && mongoose.Types.ObjectId.isValid(readingId)) {
          const kind = String(link.kind || "reading_payment");
          if (kind === "upgrade") {
            await (await import("@/lib/models/Reading")).default.updateOne(
              { _id: readingId },
              {
                $addToSet: { unlockedProductCodes: String(link.productCode || "VETQ_MASTER_360") },
                $set: { panelVersion: Number(link.panelVersion || 1) },
              },
            );
          } else {
            await (await import("@/lib/models/Reading")).default.updateOne(
              { _id: readingId },
              { $set: { paymentStatus: "paid", paymentLink: link._id } },
            );
          }
        }
      } else if (wasPending && shouldMarkExpired) {
        await PaymentLink.updateOne({ _id: link._id, status: "pending" }, { $set: { status: "expired" } });
        const readingId = link.reading ? String(link.reading) : "";
        if (readingId && mongoose.Types.ObjectId.isValid(readingId)) {
          await (await import("@/lib/models/Reading")).default.updateOne(
            { _id: readingId },
            { $set: { paymentStatus: "expired", paymentLink: link._id } },
          );
        }
      }
    }

    return NextResponse.json({ id: txId, status }, { status: 200 });
  } catch (e) {
    console.error("PaymentStatus fatal", e);
    return NextResponse.json({ error: "Internal server error", reason: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
