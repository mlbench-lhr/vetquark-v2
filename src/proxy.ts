import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|images|fonts|robots.txt|sitemap.xml|manifest.json|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};

function base64UrlToBase64(s: string) {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  return t;
}

function decodeJson<T = unknown>(b64url: string): T {
  const json = atob(base64UrlToBase64(b64url));
  return JSON.parse(json) as T;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

type TokenPayload = {
  exp?: number;
  sub?: string;
  role?: unknown;
};

async function verifyHS256(token: string, secret: string): Promise<TokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const header = decodeJson<{ alg?: string }>(h);
  if (header?.alg !== "HS256") return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = new TextEncoder().encode(`${h}.${p}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const expected = toBase64Url(sig);
  if (expected !== s) return null;

  const payload = decodeJson<TokenPayload>(p);
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && now >= payload.exp) return null;
  return payload;
}

function homeForRole(role: unknown) {
  if (role === "Veterinarian") return "/Veterinarian/home";
  if (role === "Guardian") return "/Guardian/home";
  return null;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/auth") || pathname.includes("cloudinary")) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
  const cookieToken = req.cookies.get("auth_token")?.value || req.cookies.get("session_id")?.value;
  const token = bearer || cookieToken;

  const secret = process.env.AUTH_SECRET;
  const isApi = pathname.startsWith("/api");

  const publicRoutes = new Set([
    "/signin",
    "/signup",
    "/forget-password",
    "/verify_email",
    "/reset-password",
    "/upload-profile-picture",
    "/professional_registration",
    "/error-404",
  ]);

  if (publicRoutes.has(pathname)) {
    if (!token || !secret) return NextResponse.next();
    const payload = await verifyHS256(token, secret);
    const userId = payload?.sub;
    if (!userId) return NextResponse.next();
    const home = homeForRole(payload?.role);
    if (!home) return NextResponse.next();
    return NextResponse.redirect(new URL(home, req.nextUrl.origin));
  }

  if (!token || !secret) {
    if (isApi) {
      return NextResponse.json({ error: !secret ? "Server auth misconfigured" : "Unauthorized" }, { status: !secret ? 500 : 401 });
    }
    return NextResponse.redirect(new URL("/signin", req.nextUrl.origin));
  }

  const payload = await verifyHS256(token, secret);
  const userId = payload?.sub;
  if (!userId) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/signin", req.nextUrl.origin));
  }

  const home = homeForRole(payload?.role);
  if (pathname.startsWith("/Veterinarian") && payload?.role !== "Veterinarian") {
    return NextResponse.redirect(new URL(home ?? "/signin", req.nextUrl.origin));
  }
  if (pathname.startsWith("/Guardian") && payload?.role !== "Guardian") {
    return NextResponse.redirect(new URL(home ?? "/signin", req.nextUrl.origin));
  }

  const headers = new Headers(req.headers);
  headers.set("x-user-id", String(userId));
  return NextResponse.next({ request: { headers } });
}
