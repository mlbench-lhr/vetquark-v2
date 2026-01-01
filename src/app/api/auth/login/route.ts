import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        const backendRes = await fetch(process.env.NEXT_PUBLIC_LOCAL_URL + "/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await backendRes.json();
        if (!backendRes.ok) {
            return NextResponse.json(
                { error: data.message },
                { status: backendRes.status }
            );
        }

        return NextResponse.json(
            { message: "users fetched successfully", data },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}