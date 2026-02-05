import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    const ipJson = await ipRes.json().catch(() => ({}));
    const infoRes = await fetch("https://ipinfo.io/json", { cache: "no-store" });
    const infoJson = await infoRes.json().catch(() => ({}));
    return NextResponse.json(
      {
        outboundIp: ipJson?.ip || null,
        ipinfo: {
          ip: infoJson?.ip || null,
          city: infoJson?.city || null,
          region: infoJson?.region || null,
          country: infoJson?.country || null,
          org: infoJson?.org || null,
          loc: infoJson?.loc || null,
        },
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json({ error: "Failed to resolve outbound IP" }, { status: 500 });
  }
}
