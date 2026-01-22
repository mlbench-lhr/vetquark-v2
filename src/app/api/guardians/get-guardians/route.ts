import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import { parsePagination, toPaginationMeta } from "@/lib/utils";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { parsePhoneNumberFromString } from "libphonenumber-js";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getUserIdFromRequest(req: NextRequest): { userId: string | null; error: NextResponse | null } {
  const headerId = req.headers.get("x-user-id");
  if (headerId?.trim()) return { userId: headerId.trim(), error: null };

  const token = req.cookies.get("session_id")?.value || req.cookies.get("auth_token")?.value;
  if (!token) return { userId: null, error: null };

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Server auth misconfigured" }, { status: 500 }),
    };
  }

  try {
    const decoded = jwt.verify(token, authSecret);
    if (decoded && typeof decoded === "object" && "sub" in decoded) {
      const sub = (decoded as { sub?: unknown }).sub;
      if (typeof sub === "string" && sub.trim()) return { userId: sub.trim(), error: null };
    }
    return { userId: null, error: null };
  } catch {
    return { userId: null, error: null };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const guardianId = (url.searchParams.get("guardianId") || "").trim();
    const q = (url.searchParams.get("q") || "").trim();
    const sort = (url.searchParams.get("sort") || "name_az").trim();
    const { page, pageSize, skip, limit } = parsePagination(url.searchParams, {
      defaultPageSize: 50,
      maxPageSize: 100,
    });

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (guardianId) {
      if (!mongoose.Types.ObjectId.isValid(guardianId)) {
        return NextResponse.json({ error: "Invalid guardianId" }, { status: 400 });
      }

      const [guardianUser, patientCount] = await Promise.all([
        User.findById(guardianId)
          .select("_id role fullName email phone taxId dateOfBirth address city state postalCode profileImageUrl")
          .lean(),
        Patient.countDocuments({ veterinarian: veterinarianId, guardian: guardianId }),
      ]);

      if (!guardianUser || guardianUser.role !== "Guardian") {
        return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
      }
      if (!patientCount) {
        return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          item: {
            id: String(guardianUser._id),
            fullName: (guardianUser as any).fullName ?? "",
            email: (guardianUser as any).email ?? "",
            phone: (guardianUser as any).phone ?? "",
            dateOfBirth: (guardianUser as any).dateOfBirth ?? "",
            address: (guardianUser as any).address ?? "",
            city: (guardianUser as any).city ?? "",
            state: (guardianUser as any).state ?? "",
            postalCode: (guardianUser as any).postalCode ?? "",
            taxId: (guardianUser as any).taxId ?? "",
            profileImageUrl: (guardianUser as any).profileImageUrl ?? "",
            patientCount,
          },
        },
        { status: 200 }
      );
    }

    const veterinarianObjectId = new mongoose.Types.ObjectId(veterinarianId);
    const pipeline: any[] = [{ $match: { veterinarian: veterinarianObjectId } }];

    pipeline.push({
      $group: { _id: "$guardian", patientCount: { $sum: 1 } },
    });

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "guardianUser",
      },
    });

    pipeline.push({
      $unwind: { path: "$guardianUser", preserveNullAndEmptyArrays: false },
    });

    pipeline.push({
      $match: { "guardianUser.role": "Guardian" },
    });

    if (q) {
      const qRegex = new RegExp(escapeRegex(q), "i");
      pipeline.push({
        $match: {
          $or: [{ "guardianUser.fullName": { $regex: qRegex } }, { "guardianUser.taxId": { $regex: qRegex } }],
        },
      });
    }

    const sortStage: any =
      sort === "recent"
        ? { "guardianUser.createdAt": -1, _id: 1 }
        : { "guardianUser.fullName": 1, _id: 1 };

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        items: [
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              patientCount: 1,
              name: "$guardianUser.fullName",
              idNumber: "$guardianUser.taxId",
              avatarUrl: "$guardianUser.profileImageUrl",
            },
          },
        ],
      },
    });

    const agg = await Patient.aggregate(pipeline);
    const meta = agg?.[0]?.metadata?.[0] ?? null;
    const total = typeof meta?.total === "number" ? meta.total : 0;
    const items = Array.isArray(agg?.[0]?.items) ? agg[0].items : [];

    return NextResponse.json(
      {
        items: items.map((it: any) => ({
          id: String(it._id),
          name: it.name ?? "N/A",
          idNumber: it.idNumber ?? "",
          avatarUrl: it.avatarUrl ?? "",
          patientCount: typeof it.patientCount === "number" ? it.patientCount : 0,
        })),
        pagination: toPaginationMeta({ page, pageSize, total }),
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: veterinarianId, error } = getUserIdFromRequest(req);
    if (error) return error;
    if (!veterinarianId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      guardianId,
      fullName,
      phone,
      taxId,
      dateOfBirth,
      address,
      city,
      state,
      postalCode,
      profileImageUrl,
    } = body || {};

    if (!guardianId || typeof guardianId !== "string" || !guardianId.trim()) {
      return NextResponse.json({ error: "guardianId is required" }, { status: 400 });
    }
    const resolvedGuardianId = guardianId.trim();
    if (!mongoose.Types.ObjectId.isValid(resolvedGuardianId)) {
      return NextResponse.json({ error: "Invalid guardianId" }, { status: 400 });
    }

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const linked = await Patient.exists({ veterinarian: veterinarianId, guardian: resolvedGuardianId });
    if (!linked) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
    }

    const update: Record<string, any> = {};
    if (typeof fullName === "string") update.fullName = fullName.trim();
    if (typeof taxId === "string") update.taxId = taxId.trim();
    if (typeof dateOfBirth === "string") update.dateOfBirth = dateOfBirth.trim();
    if (typeof address === "string") update.address = address.trim();
    if (typeof city === "string") update.city = city.trim();
    if (typeof state === "string") update.state = state.trim();
    if (typeof postalCode === "string") update.postalCode = postalCode.trim();
    if (typeof profileImageUrl === "string") update.profileImageUrl = profileImageUrl.trim();

    if (typeof phone === "string") {
      const parsed = parsePhoneNumberFromString(phone.trim());
      if (!parsed?.isValid()) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      update.phone = parsed.number;
    }

    const updated = await User.findOneAndUpdate(
      { _id: resolvedGuardianId, role: "Guardian" },
      { $set: update },
      { new: true }
    ).lean();

    if (!updated?._id) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
    }

    return NextResponse.json({ id: String(updated._id) }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
