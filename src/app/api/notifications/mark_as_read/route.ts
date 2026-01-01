import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const sessionId = req.headers.get("session");
        if (!sessionId) {
            throw new Error("No session ID provided");
        }

        const backendRes = await fetch(process.env.NEXT_PUBLIC_LIVE_URL + "/admin/mark_as_read", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Session": sessionId
            },
            body: JSON.stringify(body),
        });

        const data = await backendRes.json();
        if (!backendRes.ok || data.status === false) {
            return NextResponse.json(
                { error: data.message, data },
                { status: backendRes.status }
            );
        }

        return NextResponse.json(
            { message: "Notifications read successfully", data },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error },
            { status: 500 }
        );
    }
}