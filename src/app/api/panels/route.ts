import { NextResponse } from "next/server";
import { getActivePanels } from "@/lib/panels";

export async function GET() {
  try {
    const panels = await getActivePanels();
    return NextResponse.json({ panels }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
