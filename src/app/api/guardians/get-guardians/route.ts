import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import { parsePagination, toPaginationMeta } from "@/lib/utils";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
          .select("_id role fullName email phone address taxId profileImageUrl")
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
            address: (guardianUser as any).address ?? "",
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
