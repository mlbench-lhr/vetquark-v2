import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        let body: unknown = null;
        try {
            body = await req.json();
        } catch {}

        const sessionId = req.headers.get("session");
        const baseUrl = process.env.NEXT_PUBLIC_LIVE_URL;

        let backendData: unknown = null;
        let backendError: { status: number; message: string } | null = null;

        if (sessionId && baseUrl) {
            const backendRes = await fetch(baseUrl + "/admin/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Session": sessionId
                },
                body: JSON.stringify(body && typeof body === "object" ? body : {}),
            });

            backendData = await backendRes.json().catch(() => null);

            if (!backendRes.ok) {
                backendError = {
                    status: backendRes.status,
                    message:
                        typeof (backendData as any)?.message === "string"
                            ? (backendData as any).message
                            : "Logout failed",
                };
            }
        }

        const res = NextResponse.json(
            backendError ? { error: backendError.message, backend: backendData } : { message: "Logged out", backend: backendData },
            { status: backendError ? backendError.status : 200 }
        );

        res.cookies.set("session_id", "", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 0,
        });
        res.cookies.set("auth_token", "", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 0,
        });

        return res;
    } catch (error) {
        console.error(error);
        const res = NextResponse.json({ error: "Internal server error" }, { status: 500 });
        res.cookies.set("session_id", "", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 0,
        });
        res.cookies.set("auth_token", "", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 0,
        });
        return res;
    }
}
