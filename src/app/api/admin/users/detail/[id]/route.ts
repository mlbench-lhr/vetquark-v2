import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectMongo from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import User from "@/lib/models/User";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const authSecret = process.env.AUTH_SECRET;
  if (!token) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!authSecret) {
    return { ok: false as const, res: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }) };
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
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!adminId || role !== "Admin" || !mongoose.Types.ObjectId.isValid(adminId)) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  await connectMongo();
  const admin = await Admin.findById(adminId).select("_id").lean();
  if (!admin) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true as const, adminId };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { id } = await ctx.params;
    console.log("id----", id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    await connectMongo();
    const user = await User.findById(id)
      .select(
        [
          "_id",
          "role",
          "profileType",
          "fullName",
          "email",
          "phone",
          "taxId",
          "dateOfBirth",
          "address",
          "country",
          "city",
          "state",
          "postalCode",
          "crmv",
          "crmvState",
          "mapaRegistration",
          "operateHow",
          "expertise",
          "clinicLogoUrl",
          "tradeName",
          "cnpjIe",
          "reportHeaderAddress",
          "reportFooter",
          "profileImageUrl",
          "preferredLanguage",
          "baseExamPrice",
          "emailVerified",
          "emailVerifiedAt",
          "createdAt",
          "updatedAt",
        ].join(" ")
      )
      .lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const role = user.role === "Veterinarian" || user.role === "Guardian" ? user.role : null;
    const profileType = user.profileType === "Veterinarian" || user.profileType === "Guardian" ? user.profileType : null;

    return NextResponse.json(
      {
        user: {
          id: String((user as any)._id),
          role,
          profileType,
          fullName: typeof user.fullName === "string" ? user.fullName : "",
          email: typeof user.email === "string" ? user.email : "",
          phone: typeof user.phone === "string" ? user.phone : "",
          taxId: typeof user.taxId === "string" ? user.taxId : "",
          dateOfBirth: typeof user.dateOfBirth === "string" ? user.dateOfBirth : "",
          address: typeof user.address === "string" ? user.address : "",
          country: typeof user.country === "string" ? user.country : "",
          city: typeof user.city === "string" ? user.city : "",
          state: typeof user.state === "string" ? user.state : "",
          postalCode: typeof user.postalCode === "string" ? user.postalCode : "",
          crmv: typeof user.crmv === "string" ? user.crmv : "",
          crmvState: typeof user.crmvState === "string" ? user.crmvState : "",
          mapaRegistration: typeof user.mapaRegistration === "string" ? user.mapaRegistration : "",
          operateHow: typeof user.operateHow === "string" ? user.operateHow : "",
          expertise: Array.isArray((user as any).expertise) ? (user as any).expertise.filter((x: any) => typeof x === "string") : [],
          clinicLogoUrl: typeof user.clinicLogoUrl === "string" ? user.clinicLogoUrl : "",
          tradeName: typeof user.tradeName === "string" ? user.tradeName : "",
          cnpjIe: typeof user.cnpjIe === "string" ? user.cnpjIe : "",
          reportHeaderAddress: typeof user.reportHeaderAddress === "string" ? user.reportHeaderAddress : "",
          reportFooter: typeof user.reportFooter === "string" ? user.reportFooter : "",
          profileImageUrl: typeof user.profileImageUrl === "string" ? user.profileImageUrl : "",
          preferredLanguage: user.preferredLanguage === "en" || user.preferredLanguage === "pt" ? user.preferredLanguage : "",
          baseExamPrice: typeof user.baseExamPrice === "number" && Number.isFinite(user.baseExamPrice) ? user.baseExamPrice : null,
          emailVerified: typeof (user as any).emailVerified === "boolean" ? (user as any).emailVerified : null,
          emailVerifiedAt:
            typeof (user as any).emailVerifiedAt === "string" ||
            typeof (user as any).emailVerifiedAt === "number" ||
            (user as any).emailVerifiedAt instanceof Date
              ? new Date((user as any).emailVerifiedAt).toISOString()
              : null,
          createdAt:
            typeof (user as any).createdAt === "string" ||
            typeof (user as any).createdAt === "number" ||
            (user as any).createdAt instanceof Date
              ? new Date((user as any).createdAt).toISOString()
              : null,
          updatedAt:
            typeof (user as any).updatedAt === "string" ||
            typeof (user as any).updatedAt === "number" ||
            (user as any).updatedAt instanceof Date
              ? new Date((user as any).updatedAt).toISOString()
              : null,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

