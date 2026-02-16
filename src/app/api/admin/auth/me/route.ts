import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const authSecret = process.env.AUTH_SECRET;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!authSecret) {
    return NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 });
  }

  let adminId: string | null = null;
  let role: string | null = null;
  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object") {
      adminId = typeof (decoded as any).sub === "string" ? String((decoded as any).sub) : null;
      role = typeof (decoded as any).role === "string" ? String((decoded as any).role) : null;
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminId || role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();
  const admin = await Admin.findById(adminId).lean();
  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      profile: {
        id: String((admin as any)._id),
        fullName: typeof (admin as any).fullName === "string" ? (admin as any).fullName : "",
        email: typeof (admin as any).email === "string" ? (admin as any).email : "",
        role: "Admin",
      },
    },
    { status: 200 }
  );
}
