'use client'
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/common/header";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const Page = () => {
  const router = useRouter();
  const params = useParams<{ patient_id: string }>();
  const patientId = useMemo(() => String(params?.patient_id || "").trim(), [params]);
  const { t } = useTranslation();
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReportHistoryItem[]>([]);

  useEffect(() => {
    if (!patientId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        const [patientRes, readingsRes] = await Promise.all([
          fetch(`/api/patient/get_patient_details?patientId=${encodeURIComponent(patientId)}`),
          fetch(`/api/reading/get_readings?page=1&pageSize=500&patientId=${encodeURIComponent(patientId)}`),
        ]);

        const [patientData, readingsData] = await Promise.all([
          patientRes.json().catch(() => null),
          readingsRes.json().catch(() => null),
        ]);

        if (!mounted) return;

        if (!patientRes.ok) {
          const msg =
            typeof (patientData as any)?.error === "string" ? (patientData as any).error : "Failed to load patient";
          throw new Error(msg);
        }

        const nextPatientName = String((patientData as any)?.item?.animalName || "").trim();
        setPatientName(nextPatientName);

        if (!readingsRes.ok) {
          const msg =
            typeof (readingsData as any)?.error === "string" ? (readingsData as any).error : "Failed to load reports";
          throw new Error(msg);
        }

        const rawItems = Array.isArray((readingsData as any)?.items) ? (readingsData as any).items : [];
        setItems(
          rawItems.map((it: any) => ({
            id: String(it.id || ""),
            date: String(it.date || ""),
            signed: String(it.status || "") === "signed",
            avatarUrl: String(it.avatarSrc || ""),
          })),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load reports";
        toast.error(msg);
        setPatientName("");
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  const title = useMemo(
    () => (patientName ? t("history.patientHistoryWithName", { name: patientName }) : t("history.petHistory")),
    [patientName, t]
  );

  const handleDownload = useCallback(async (readingId: string) => {
    if (!readingId) return;
    try {
      await downloadReadingReport(readingId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to download report";
      toast.error(msg);
    }
  }, []);

  const handleDetails = useCallback(
    (readingId: string) => {
      if (!readingId) return;
      router.push(`/Veterinarian/history/detail/${encodeURIComponent(readingId)}`);
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <Header title={title} />

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <div className="text-sm text-gray-500">{t("history.loading")}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">{t("history.noReportsYet")}</div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <ReportCard
                key={it.id}
                title={t("reports.urinalysisReport")}
                date={formatDateLabel(it.date)}
                avatarUrl={it.avatarUrl || undefined}
                signed={it.signed}
                onDownload={() => handleDownload(it.id)}
                onDetails={() => handleDetails(it.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;


import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ReportCardProps {
  title: string;
  date: string;
  signed?: boolean;
  avatarUrl?: string;
  onDownload?: () => void;
  onDetails?: () => void;
}

type ReportHistoryItem = {
  id: string;
  date: string;
  signed: boolean;
  avatarUrl: string;
};

function formatDateLabel(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB");
}

async function downloadReadingReport(readingId: string) {
  const res = await fetch(`/api/reading/get_reading/${encodeURIComponent(readingId)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof (data as any)?.error === "string" ? (data as any).error : "Failed to download report";
    throw new Error(msg);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `urinalysis-report-${readingId}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ReportCard({
  title,
  date,
  signed = false,
  avatarUrl,
  onDownload,
  onDetails,
}: ReportCardProps) {
  const { t } = useTranslation();
  return (
    <div className="w-full bg-[#F5F6F6] rounded-2xl p-4 border-border">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {avatarUrl ? (
            <Image width={200} height={200}
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>

            {/* Signed Badge */}
            {signed && (
              <div className="flex items-center gap-1 text-xs text-[#3F78D8] bg-[#EBF2FF] px-2 py-1 rounded-full">
                <Check className="w-3 h-3" />
              <span>{t("history.signed")}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <Button
              variant="default"
              size="sm"
              onClick={onDownload}
              className="rounded-full text-xs bg-[#3F78D8] h-8 px-4 gap-1.5 "
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="17" viewBox="0 0 15 17" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0 1.66364C0 1.22241 0.175276 0.79926 0.487268 0.487268C0.79926 0.175276 1.22241 0 1.66364 0L10.7659 0L14.4182 3.65224V14.9727C14.4182 15.414 14.2429 15.8371 13.9309 16.1491C13.6189 16.4611 13.1958 16.6364 12.7545 16.6364H1.66364C1.22241 16.6364 0.79926 16.4611 0.487268 16.1491C0.175276 15.8371 0 15.414 0 14.9727V1.66364ZM2.77273 6.65455H1.10909V12.2H2.21818V9.98182H2.77273C3.21395 9.98182 3.6371 9.80655 3.9491 9.49455C4.26109 9.18256 4.43636 8.75941 4.43636 8.31818C4.43636 7.87696 4.26109 7.45381 3.9491 7.14181C3.6371 6.82982 3.21395 6.65455 2.77273 6.65455ZM7.20909 6.65455H5.54546V12.2H7.20909C7.65032 12.2 8.07347 12.0247 8.38546 11.7127C8.69745 11.4007 8.87273 10.9776 8.87273 10.5364V8.31818C8.87273 7.87696 8.69745 7.45381 8.38546 7.14181C8.07347 6.82982 7.65032 6.65455 7.20909 6.65455ZM9.98182 12.2V6.65455H13.3091V7.76364H11.0909V8.87273H12.2V9.98182H11.0909V12.2H9.98182Z" fill="white" />
              </svg>
              {t("history.download")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onDetails}
              className="text-[#3F78D8] bg-[#EBF2FF] rounded-full text-xs h-8 px-4"
            >
              {t("history.details")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
