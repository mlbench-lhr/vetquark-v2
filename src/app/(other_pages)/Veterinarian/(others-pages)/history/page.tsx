"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, FileText, Upload, Search, Bell } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { createUrinalysisPdfObjectUrl, downloadUrinalysisPdf } from "@/utils/urinalysisPdf";

type ReportStatus = "signed" | "pending";

type PaymentStatus = "pending" | "paid" | "expired";

type ReportHistoryItem = {
  id: string;
  patientId: string;
  patientName: string;
  guardianName: string;
  dateLabel: string;
  status: ReportStatus;
  signedAt: string | null;
  isSigned: boolean;
  wizardStep: "identification" | "timer" | "review" | "report";
  avatarSrc: string;
  paymentStatus: PaymentStatus | null;
  paymentLinkId: string;
};

type ApiReportHistoryItem = {
  id: string;
  patientId: string;
  patientName: string;
  guardianName: string;
  date: string;
  status: ReportStatus;
  signedAt?: string | null;
  isSigned?: boolean;
  wizardStep?: "identification" | "timer" | "review" | "report";
  avatarSrc: string;
  paymentStatus?: PaymentStatus | null;
  paymentLinkId?: string;
};

function formatDateLabel(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB");
}

function StatusPill({ signed }: { signed: boolean }) {
  const { t } = useTranslation();
  if (!signed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
        <span className="h-2 w-2 rounded-full bg-gray-400" />
        {t("history.notSigned")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B7280] px-3 py-1 text-[11px] font-medium text-white">
      <Check className="h-3 w-3" />
      {t("history.signed")}
    </span>
  );
}

function ReportCard({ item, onDownload, onShare }: { item: ReportHistoryItem; onDownload: () => void; onShare: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleView = () => {
    if (item.isSigned) {
      router.push(`/Veterinarian/history/detail/${item.id}`);
    } else {
      const params = new URLSearchParams();
      params.set("draftId", item.id);
      params.set("step", item.wizardStep);
      router.push(`/Veterinarian/new-reading?${params.toString()}`);
    }
  };

  return (
    <div className="rounded-[16px] bg-white px-4 py-4 border border-gray-100/80 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
            <Image
              width={100}
              height={100}
              src={item.avatarSrc}
              alt={item.patientName}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="truncate text-[15px] font-semibold text-gray-900">
              {item.patientName}
            </p>
            <p className="truncate text-[12px] text-gray-400 mt-0.5">
              {t("common.guardian")}: {item.guardianName} | {t("common.date")}: {item.dateLabel}
            </p>
            <div className="mt-2">
              <StatusPill signed={item.isSigned} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            type="button"
            onClick={handleView}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF2FF] text-[#3F78D8]"
            aria-label={t("history.details")}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF2FF] text-[#3F78D8]"
            aria-label={t("history.download")}
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF2FF] text-[#3F78D8]"
            aria-label={t("common.share")}
          >
            <Upload className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const patientId = useMemo(() => String(searchParams.get("patientId") || "").trim(), [searchParams]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReportHistoryItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("pageSize", "500");
        if (patientId) params.set("patientId", patientId);
        const res = await fetch(`/api/reading/get_readings?${params.toString()}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : (t("history.failedToLoadReports") as string);
          throw new Error(msg);
        }

        const rawItems = Array.isArray((data as any)?.items) ? ((data as any).items as ApiReportHistoryItem[]) : [];
        setItems(
          rawItems.map((it) => ({
            id: String(it.id),
            patientId: String(it.patientId || ""),
            patientName: it.patientName,
            guardianName: it.guardianName,
            dateLabel: formatDateLabel(it.date),
            status: it.status,
            signedAt: typeof it.signedAt === "string" ? it.signedAt : null,
            isSigned: typeof it.isSigned === "boolean" ? it.isSigned : typeof it.signedAt === "string" ? true : it.status === "signed",
            wizardStep:
              it.wizardStep === "identification" || it.wizardStep === "timer" || it.wizardStep === "review" || it.wizardStep === "report"
                ? it.wizardStep
                : "identification",
            avatarSrc: it.avatarSrc,
            paymentStatus: it.paymentStatus === "pending" || it.paymentStatus === "paid" || it.paymentStatus === "expired" ? it.paymentStatus : null,
            paymentLinkId: String(it.paymentLinkId || ""),
          })),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : (t("history.failedToLoadReports") as string);
        toast.error(msg);
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientId, t]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (it) =>
        it.patientName.toLowerCase().includes(q) ||
        it.guardianName.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const handleDownload = useCallback(async (id: string) => {
    try {
      await downloadUrinalysisPdf({ readingId: id });
    } catch (e) {
      const msg = e instanceof Error ? e.message : (t("history.failedToDownloadReport") as string);
      toast.error(msg);
    }
  }, [t]);

  const handleShare = useCallback(async (id: string) => {
    try {
      const { url, fileName, blob } = await createUrinalysisPdfObjectUrl({ readingId: id });
      const navAny = navigator as any;
      try {
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navAny?.share && navAny?.canShare && navAny.canShare({ files: [file] })) {
          await navAny.share({
            title: t("history.urinalysisReport") as string,
            files: [file],
          });
          URL.revokeObjectURL(url);
          toast.success(t("common.reportLinkReady"));
          return;
        }
      } catch {
      }
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(t("history.reportLinkReady"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : (t("common.shareFailed") as string);
      toast.error(msg);
    }
  }, [t]);

  return (
    <div className="w-full bg-white">
      {/* Page Header */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <h1 className="text-[22px] font-bold text-[#3F78D8]">
          {t("history.laudosTitle")}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 transition-colors"
            aria-label={t("common.search")}
          >
            <Search className="h-5 w-5 text-gray-500" />
          </button>
          <Link
            href="/Veterinarian/notifications"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3F78D8] text-white"
            aria-label={t("common.notifications")}
          >
            <Bell className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Search input */}
      {searchOpen && (
        <div className="px-2 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="w-full rounded-full bg-[#F5F6F6] pl-9 pr-4 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#3F78D8]/20"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Gray Container Card */}
      <div className="mt-2 rounded-[20px] bg-[#F5F6F6] p-4 pb-6">
        <div className="mb-4">
          <h2 className="text-[18px] font-bold text-gray-900">
            {t("history.laudosTitle")}
          </h2>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {t("history.manageLaudos")}
          </p>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-[14px] text-gray-500 py-4">{t("history.loading")}</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-[14px] text-gray-500 py-4">{t("history.noReportsYet")}</div>
          ) : (
            filteredItems.map((item) => (
              <ReportCard
                key={item.id}
                item={item}
                onDownload={() => handleDownload(item.id)}
                onShare={() => handleShare(item.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="w-full bg-white" />}>
      <PageContent />
    </Suspense>
  );
}

