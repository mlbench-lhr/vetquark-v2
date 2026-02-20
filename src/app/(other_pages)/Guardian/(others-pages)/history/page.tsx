'use client'

import { Check } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { FallbackText } from "@/components/ui/fallback-text";
import { Skeleton, ListItemSkeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { downloadUrinalysisPdf } from "@/utils/urinalysisPdf";

type ReportStatus = "signed" | "pending";

type Pet = {
  id: string;
  name: string;
  avatarSrc: string;
};

type ReportHistoryItem = {
  id: string;
  title: string;
  dateLabel: string;
  status: ReportStatus;
  avatarSrc: string;
};

function StatusPill({ status }: { status: ReportStatus }) {
  const label = status === "signed" ? "Signed" : "Pending";
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#EBF2FF] px-3 py-1.5 text-[13px] font-medium text-[#3F78D8]">
      <Check className="h-4 w-4" />
      {label}
    </span>
  );
}

function formatDateLabel(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB");
}

function ReportCard({
  item,
  onDownloadPdf,
}: {
  item: ReportHistoryItem;
  onDownloadPdf: (id: string) => void;
}) {
  return (
    <div className="rounded-[16px] bg-white px-4 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F3F4F6]">
            <Image width={200} height={200} src={item.avatarSrc} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium leading-[18px] text-[#111827]">
              {item.title}
            </div>
            <div className="mt-1 text-[12px] leading-[16px] text-[#9CA3AF]">{item.dateLabel}</div>
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="mt-3 flex items-center justify-end gap-3">
        <div>
          <button
            type="button"
            disabled={item.status === "pending"}
            className={`inline-flex h-[34px] items-center gap-2 rounded-full px-4 text-[13px] font-medium ${item.status === "pending" ? "bg-[#9CA3AF] text-white cursor-not-allowed" : "bg-[#3F78D8] text-white"}`}
            onClick={() => onDownloadPdf(item.id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="17" viewBox="0 0 15 17" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0 1.66364C0 1.22241 0.175276 0.79926 0.487268 0.487268C0.79926 0.175276 1.22241 0 1.66364 0L10.7659 0L14.4182 3.65224V14.9727C14.4182 15.414 14.2429 15.8371 13.9309 16.1491C13.6189 16.4611 13.1958 16.6364 12.7545 16.6364H1.66364C1.22241 16.6364 0.79926 16.4611 0.487268 16.1491C0.175276 15.8371 0 15.414 0 14.9727V1.66364ZM2.77273 6.65455H1.10909V12.2H2.21818V9.98182H2.77273C3.21395 9.98182 3.6371 9.80655 3.9491 9.49455C4.26109 9.18256 4.43636 8.75941 4.43636 8.31818C4.43636 7.87696 4.26109 7.45381 3.9491 7.14181C3.6371 6.82982 3.21395 6.65455 2.77273 6.65455ZM7.20909 6.65455H5.54546V12.2H7.20909C7.65032 12.2 8.07347 12.0247 8.38546 11.7127C8.69745 11.4007 8.87273 10.9776 8.87273 10.5364V8.31818C8.87273 7.87696 8.69745 7.45381 8.38546 7.14181C8.07347 6.82982 7.65032 6.65455 7.20909 6.65455ZM9.98182 12.2V6.65455H13.3091V7.76364H11.0909V8.87273H12.2V9.98182H11.0909V12.2H9.98182Z" fill="white" />
            </svg>
            Download
          </button>
        </div>
        {item.status === "pending" ? (
          <button
            type="button"
            disabled
            className="inline-flex h-[34px] items-center justify-center rounded-full bg-[#EBF2FF] px-5 text-[13px] font-medium text-[#9CA3AF] cursor-not-allowed"
          >
            Details
          </button>
        ) : (
          <Link
            href={`/Guardian/history/detail/${item.id}`}
            className="inline-flex h-[34px] items-center justify-center rounded-full bg-[#EBF2FF] px-5 text-[13px] font-medium text-[#3F78D8]"
          >
            Details
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-[100dvh] w-full bg-white" />}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  const initialPetId = useMemo(() => (searchParams.get("petId") || "").trim(), [searchParams]);

  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState("");
  const [loadingPets, setLoadingPets] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPets(true);
        const res = await fetch(`/api/pet/get_pets?page=1&pageSize=100`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load pets");
        }
        const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
        const mapped = items.map((p: any) => ({
          id: String(p.id || p._id || ""),
          name: String(p.name || p.animalName || "N/A"),
          avatarSrc: String(p.image || p.photo || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
        }));
        setPets(mapped);
        setActivePetId((prev) => prev || initialPetId || mapped[0]?.id || "");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load pets");
        setPets([]);
      } finally {
        if (mounted) setLoadingPets(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialPetId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!activePetId) {
        setReports([]);
        return;
      }
      try {
        setLoadingReports(true);
        const res = await fetch(`/api/reading/get_readings?patientId=${encodeURIComponent(activePetId)}&page=1&pageSize=200`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load reports");
        }
        const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
        setReports(
          items.map((r: any) => ({
            id: String(r.id || r._id || ""),
            title: String(r.panelTitle || "Urinalysis Report"),
            dateLabel: formatDateLabel(String(r.date || "")),
            status: r.status === "signed" ? "signed" : "pending",
            avatarSrc: String(r.avatarSrc || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
          }))
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load reports");
        setReports([]);
      } finally {
        if (mounted) setLoadingReports(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activePetId]);

  const handleDownloadPdf = useCallback(async (id: string) => {
    try {
      await downloadUrinalysisPdf({ readingId: id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  }, []);

  return (
    <div className="h-[100dvh w-full bg-white">
      <div className="mx-auto w-full h-full pb-6 -[calc(env(safe-area-inset-top)+20px)]">
        <div className="px-">
          <h1 className="text-[22px] font-semibold leading-[28px] text-[#111827]">
            Examination History
          </h1>
          <p className="mt-1 text-[15px] leading-[20px] text-[#9CA3AF]">
            View your recent report details for pets
          </p>
        </div>

        <div className="px- mt-5 flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {loadingPets ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#F5F6F6] px-3 py-2"
                >
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              ))}
            </>
          ) : pets.length === 0 ? (
            <FallbackText>No pets found.</FallbackText>
          ) : pets.map((pet) => {
            const active = pet.id === activePetId;
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => setActivePetId(pet.id)}
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2",
                  active ? "bg-[#EBF2FF]" : "bg-[#F5F6F6]",
                ].join(" ")}
              >
                <span className="h-8 w-8 overflow-hidden rounded-full bg-white">
                  <Image width={200} height={200} src={pet.avatarSrc} alt="" className="h-full w-full object-cover" />
                </span>
                <span className={`text-[14px] font-medium ${active ? "text-[#3F78D8]" : "text-[#111827]"}`}>
                  {pet.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-4 p-4 h-full rounded-[16px] bg-[#F5F6F6]">
          {loadingReports ? (
            <>
              <ListItemSkeleton />
              <ListItemSkeleton />
            </>
          ) : reports.length === 0 ? (
            <FallbackText>No reports found.</FallbackText>
          ) : (
            reports.map((item) => (
              <ReportCard
                key={item.id}
                item={item}
                onDownloadPdf={handleDownloadPdf}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
