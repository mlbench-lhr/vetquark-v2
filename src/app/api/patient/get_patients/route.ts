import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";
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
    if (!veterinarianId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!mongoose.Types.ObjectId.isValid(veterinarianId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const species = (url.searchParams.get("species") || "").trim();
    const gender = (url.searchParams.get("gender") || "").trim();
    const age = (url.searchParams.get("age") || "").trim();
    const lastExam = (url.searchParams.get("lastExam") || "").trim();
    const sort = (url.searchParams.get("sort") || "recent").trim();
    const guardianId = (url.searchParams.get("guardianId") || "").trim();
    const { page, pageSize, skip, limit } = parsePagination(url.searchParams, {
      defaultPageSize: 50,
      maxPageSize: 100,
    });

    await connectMongo();

    const veterinarian = await User.findById(veterinarianId).select("_id role").lean();
    if (!veterinarian || veterinarian.role !== "Veterinarian") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const veterinarianObjectId = new mongoose.Types.ObjectId(veterinarianId);
    const baseMatch: any = { veterinarian: veterinarianObjectId };

    if (guardianId) {
      if (!mongoose.Types.ObjectId.isValid(guardianId)) {
        return NextResponse.json({ error: "Invalid guardianId" }, { status: 400 });
      }
      baseMatch.guardian = new mongoose.Types.ObjectId(guardianId);
    }
    if (species) baseMatch.species = species;
    if (gender) baseMatch.sex = gender;

    const pipeline: any[] = [{ $match: baseMatch }];

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "guardian",
        foreignField: "_id",
        as: "guardianUser",
      },
    });

    pipeline.push({
      $addFields: {
        guardianName: {
          $ifNull: [{ $arrayElemAt: ["$guardianUser.fullName", 0] }, ""],
        },
      },
    });

    if (q) {
      const qRegex = new RegExp(escapeRegex(q), "i");
      pipeline.push({
        $match: {
          $or: [{ animalName: { $regex: qRegex } }, { guardianName: { $regex: qRegex } }],
        },
      });
    }

    pipeline.push({
      $addFields: {
        dobDate: {
          $dateFromString: {
            dateString: "$dateOfBirth",
            onError: null,
            onNull: null,
          },
        },
      },
    });

    pipeline.push({
      $addFields: {
        dobSortAsc: { $ifNull: ["$dobDate", new Date("9999-12-31T00:00:00.000Z")] },
        dobSortDesc: { $ifNull: ["$dobDate", new Date("1970-01-01T00:00:00.000Z")] },
        derivedAgeYears: {
          $cond: [
            { $ne: ["$dobDate", null] },
            {
              $trunc: {
                $divide: [{ $subtract: [now, "$dobDate"] }, 31557600000],
              },
            },
            null,
          ],
        },
      },
    });
    pipeline.push({
      $addFields: {
        ageYears: { $ifNull: ["$ageYears", "$derivedAgeYears"] },
      },
    });

    if (age) {
      const minYears = Number.parseInt(age.replace("+", ""), 10);
      if (!Number.isNaN(minYears) && minYears > 0) {
        const cutoff = new Date(now);
        cutoff.setFullYear(cutoff.getFullYear() - minYears);
        pipeline.push({
          $match: {
            $or: [{ dobDate: null }, { dobDate: { $lte: cutoff } }],
          },
        });
      }
    }

    pipeline.push({
      $lookup: {
        from: "readings",
        let: { patientId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$patient", "$$patientId"] },
                  { $eq: ["$veterinarian", veterinarianObjectId] },
                ],
              },
            },
          },
          { $project: { signedAt: 1, createdAt: 1 } },
          {
            $addFields: {
              examAt: { $ifNull: ["$signedAt", "$createdAt"] },
            },
          },
          { $sort: { examAt: -1 } },
          { $limit: 1 },
          { $project: { examAt: 1 } },
        ],
        as: "lastReading",
      },
    });

    pipeline.push({
      $lookup: {
        from: "readings",
        let: { patientId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$patient", "$$patientId"] },
                  { $eq: ["$veterinarian", veterinarianObjectId] },
                ],
              },
            },
          },
          { $count: "count" },
        ],
        as: "examCountArr",
      },
    });

    pipeline.push({
      $addFields: {
        lastExamAt: { $arrayElemAt: ["$lastReading.examAt", 0] },
      },
    });

    if (lastExam) {
      const maxDays =
        lastExam === "1day" ? 1 : lastExam === "1week" ? 7 : lastExam === "1month" ? 30 : null;
      if (typeof maxDays === "number") {
        const cutoff = new Date(now.getTime() - maxDays * 86400000);
        pipeline.push({ $match: { lastExamAt: { $gte: cutoff } } });
      }
    }

    pipeline.push({
      $addFields: {
        lastExamDaysAgo: {
          $cond: [
            { $ne: ["$lastExamAt", null] },
            {
              $trunc: {
                $divide: [{ $subtract: [now, "$lastExamAt"] }, 86400000],
              },
            },
            null,
          ],
        },
      },
    });

    const sortStage: any =
      sort === "name_az"
        ? { animalName: 1, _id: 1 }
        : sort === "age_lh"
          ? { dobSortDesc: -1, animalName: 1, _id: 1 }
          : sort === "age_hl"
            ? { dobSortAsc: 1, animalName: 1, _id: 1 }
            : { createdAt: -1, _id: 1 };

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
              animalName: 1,
              photo: 1,
              species: 1,
              breed: 1,
              sex: 1,
              dateOfBirth: 1,
              createdAt: 1,
              guardian: 1,
              guardianName: 1,
              ageYears: 1,
              lastExamDaysAgo: 1,
              microchip: 1,
              allergies: 1,
              planName: 1,
              neutered: 1,
              examCount: { $arrayElemAt: ["$examCountArr.count", 0] },
            },
          },
        ],
      },
    });

    const agg = await Patient.aggregate(pipeline);
    const meta = agg?.[0]?.metadata?.[0] ?? null;
    const total = typeof meta?.total === "number" ? meta.total : 0;
    const docs = Array.isArray(agg?.[0]?.items) ? agg[0].items : [];

    const items = docs.map((p: any) => ({
      id: String(p._id),
      name: p.animalName,
      owner: p.guardianName || "N/A",
      image: p.photo,
      species: p.species ?? "",
      breed: p.breed ?? "",
      gender: p.sex ?? "",
      dateOfBirth: p.dateOfBirth ?? null,
      createdAt: p.createdAt ?? null,
      ageYears: typeof p.ageYears === "number" ? p.ageYears : null,
      lastExamDaysAgo: typeof p.lastExamDaysAgo === "number" ? p.lastExamDaysAgo : null,
      guardianId: p.guardian ? String(p.guardian) : "",
      microchip: p.microchip ?? "",
      allergies: p.allergies ?? "",
      planName: p.planName ?? "",
      neutered: p.neutered ?? "",
      examCount: typeof p.examCount === "number" ? p.examCount : 0,
    }));

    return NextResponse.json(
      { items, pagination: toPaginationMeta({ page, pageSize, total }) },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
