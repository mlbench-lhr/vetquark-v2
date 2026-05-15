'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { createUrinalysisPdfObjectUrl, downloadUrinalysisPdf } from "@/utils/urinalysisPdf";
import { useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { translateUrinalysisParameterLabel } from "@/lib/urinalysisParameters";

type ReadingResultStatus = "Normal" | "Abnormal";

type ReadingResult = {
  key: string;
  label: string;
  unit: string;
  status: ReadingResultStatus;
  selectedIndex: number;
  valueLabel: string;
  numericValue?: number;
};

type ReadingDetail = {
  id: string;
  productCode?: string;
  panelVersion?: number;
  unlockedProductCodes?: string[];
  paymentStatus?: "pending" | "paid" | "expired" | null;
  paymentLinkId?: string;
  wizardStep?: "identification" | "timer" | "review" | "report";
  signedAt: string | null;
  createdAt: string | null;
  signatureImageUrl: string | null;
  identification?: {
    collectionMethod?: string | null;
    collectionAt?: string | null;
    stripLot?: string | null;
    stripExpiry?: string | null;
  } | null;
  results: ReadingResult[];
  report: {
    summaryAndInterpretation: string;
    otherInformation: string;
    veterinarianNotes: string;
  } | null;
  timer: {
    analysis?: { summary?: string; confidence?: number; flags?: string[] };
  } | null;
  patient: { id: string; name: string; photo: string | null };
  guardian: { id: string; fullName: string };
  veterinarian: {
    id: string;
    fullName: string;
    crmv: string | null;
    crmvState: string | null;
    tradeName?: string | null;
    clinicLogoUrl?: string | null;
    reportHeaderAddress?: string | null;
    reportFooter?: string | null;
  };
};

type PanelDef = {
  code: string;
  title: string;
  subtitle: string;
  suggestedPriceBRL: number;
  visibleKeys: string[] | null;
  sortOrder: number;
};

function normalizePanelCode(value?: string | null) {
  const code = (value || "").trim();
  return code ? code : "VETQ_MASTER_360";
}

const STRIP_COLORS: Record<string, string[]> = {
  leukocytes: ["white", "#CC93BA", "#966D94", "#8F678C", "#845883"],
  nitrite: ["white", "#E780AF"],
  urobilinogen: ["#FBE8D4", "#F8D5CA", "#F6CECE", "#F3BAC3", "#EE9FA4"],
  protein: ["#FFF6AD", "#F5F2AC", "#E5EAAC", "#C1DDBC", "#9BCEC2", "#7DBBBF"],
  ph: ["#F6B641", "#F9C551", "#FCD469", "#EDD56B", "#C3C474", "#B0B872", "#8FA971"],
  blood: ["#F9CD8A", "#CFC69D", "#B0B99B", "#708E85", "#5C8075", "#336F73"],
  "specific-gravity": ["#3C7F9D", "#899264", "#AAA661", "#B9B062", "#C9B64F", "#D3B94F", "#DAB54C"],
  "ascorbic-acid": ["#0098BF", "#6FB6CD", "#A7D2D8", "#D3E4D4", "#FDFAD4"],
  "ketone-bodies": ["#FAE0C7", "#F5C7BD", "#E9B0B0", "#DC99A2", "#C9728E", "#861459"],
  bilirubin: ["white", "#F8DFEC", "#EFAFCE", "#E780AF"],
  glucose: ["#B4DDE7", "#ADD4BA", "#BDDAB2", "#C3DAA0", "#CED292", "#BFA471"],
  microalbumin: ["#CCE6E2", "#B4DCDF", "#9AD1DC", "#7FC7D9"],
  creatine: ["#E9DF9D", "#D4D39A", "#BDC597", "#AABD96", "#9EB995"],
  calcium: ["#A7C5D9", "#919FC7", "#7679AE", "#828BBA"],
  magnesium: ["#0077AB", "#4378A8", "#78578D", "#45669B", "#A85288", "#B6558A"],
  "ammonium-chloride": ["#4E3122", "#724C36", "#8F6549", "#A27E63", "#B59A80", "#C9B6A0", "#DDD1C2"],
};

function getStripColor(key: string, selectedIndex: number): string {
  const colors = STRIP_COLORS[key];
  if (!colors || colors.length === 0) return "#D1D5DB";
  const color = colors[Math.min(Math.max(0, selectedIndex), colors.length - 1)];
  return color === "white" ? "#F3F4F6" : (color || "#D1D5DB");
}

function ResultRow({ item }: { item: ReadingResult }) {
  const { t } = useTranslation();
  const dotColor = getStripColor(item.key, item.selectedIndex);
  const value = item.unit ? `${item.valueLabel} ${item.unit}` : item.valueLabel;
  const translatedLabel = translateUrinalysisParameterLabel(t, item.key, item.label);
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-[#F3F4F6] last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-[28px] h-[28px] rounded-full flex-shrink-0 border border-black/5"
          style={{ backgroundColor: dotColor }}
        />
        <span className="text-[14px] font-medium text-black/70 truncate">{translatedLabel}</span>
      </div>
      <span className="text-[13px] text-[#6B7280] flex-shrink-0 ml-2">{value}</span>
    </div>
  );
}

function formatDateTimeLabel(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString("en-GB");
  const time = d.toLocaleTimeString("en-GB", { hour12: false });
  return `${date}, ${time}`;
}

function formatCollectionMethod(value: string | null | undefined, t: (key: string) => string) {
  const v = (value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "free_catch") return t("history.collectionMethods.freeCatch");
  if (v === "cystocentesis") return t("history.collectionMethods.cystocentesis");
  if (v === "catheter") return t("history.collectionMethods.catheter");
  return value || "";
}

function asReportText(value: string | null | undefined, t: (key: string) => string) {
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s : t("history.notAvailable");
}

export default function ReportDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const profile = useAppSelector((s: RootState) => s.userProfile.profile);
  const role = String((profile as any)?.role || "");
  const isVeterinarian = role === "Veterinarian";
  const isGuardian = role === "Guardian";
  const readingId = useMemo(() => String((params as any)?.id || "").trim(), [params]);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<ReadingDetail | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeProductCode, setUpgradeProductCode] = useState<string>("");
  const [sendingUpgrade, setSendingUpgrade] = useState(false);
  const [panels, setPanels] = useState<PanelDef[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/panels", { method: "GET" });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : [];
        const next = raw
          .map((p) => {
            const code = normalizePanelCode(String(p?.code || ""));
            const title = String(p?.title || "").trim();
            if (!code) return null;
            return {
              code,
              title: title || code,
              subtitle: String(p?.subtitle || "").trim(),
              suggestedPriceBRL: Number.isFinite(Number(p?.suggestedPriceBRL)) ? Number(p.suggestedPriceBRL) : 0,
              visibleKeys: Array.isArray(p?.visibleKeys) ? p.visibleKeys.map((k: any) => String(k || "").trim()).filter(Boolean) : null,
              sortOrder: Number.isFinite(Number(p?.sortOrder)) ? Number(p.sortOrder) : 0,
            } satisfies PanelDef;
          })
          .filter(Boolean) as PanelDef[];
        next.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title));
        setPanels(next);
      } catch {
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const panelByCode = useMemo(() => {
    const map = new Map<string, PanelDef>();
    for (const p of panels) map.set(normalizePanelCode(p.code), p);
    return map;
  }, [panels]);

  const panelTitleForCode = useCallback(
    (productCode?: string | null) => {
      const code = normalizePanelCode(productCode);
      return panelByCode.get(code)?.title || code;
    },
    [panelByCode]
  );

  const visibleKeysForAccess = useCallback(
    (productCode?: string | null, unlockedProductCodes?: string[] | null): string[] | null => {
      const codes = [
        normalizePanelCode(productCode),
        ...((Array.isArray(unlockedProductCodes) ? unlockedProductCodes : [])
          .map((c) => normalizePanelCode(String(c || "")))
          .filter(Boolean)),
      ];

      for (const c of codes) {
        const keys = panelByCode.get(c)?.visibleKeys ?? null;
        if (keys === null) return null;
      }

      const set = new Set<string>();
      for (const c of codes) {
        const keys = panelByCode.get(c)?.visibleKeys ?? null;
        if (Array.isArray(keys)) keys.forEach((k) => set.add(k));
      }
      return [...set];
    },
    [panelByCode]
  );

  const canUpgradeToTarget = useCallback(
    (currentProductCode: string, unlockedProductCodes: string[] | null | undefined, targetProductCode: string) => {
      const normalizedTarget = normalizePanelCode(targetProductCode);
      const normalizedCurrent = normalizePanelCode(currentProductCode);
      const unlocked = Array.isArray(unlockedProductCodes)
        ? unlockedProductCodes.map((c) => normalizePanelCode(String(c || ""))).filter(Boolean)
        : [];
      if (normalizedTarget === normalizedCurrent) return false;
      if (unlocked.includes(normalizedTarget)) return false;

      const currentKeys = visibleKeysForAccess(normalizedCurrent, unlocked);
      if (currentKeys === null) return false;

      const targetKeys = panelByCode.get(normalizedTarget)?.visibleKeys ?? null;
      if (targetKeys === null) return true;

      const currentSet = new Set(currentKeys);
      return targetKeys.some((k) => !currentSet.has(k));
    },
    [panelByCode, visibleKeysForAccess]
  );

  useEffect(() => {
    if (!readingId) return;
    if (!isVeterinarian && !isGuardian) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reading/get_reading/${encodeURIComponent(readingId)}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (res.status === 402) {
          const paymentLinkId = String((data as any)?.paymentLinkId || "").trim();
          if (isGuardian && paymentLinkId) {
            setReading(null);
            router.replace(`/Guardian/payment/${encodeURIComponent(paymentLinkId)}`);
            return;
          }
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : t("history.paymentRequired");
          throw new Error(msg);
        }
        if (!res.ok) {
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : t("history.failedToLoadReport");
          throw new Error(msg);
        }
        setReading((data as any)?.reading ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("history.failedToLoadReport");
        toast.error(msg);
        setReading(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isGuardian, isVeterinarian, readingId, router]);

  useEffect(() => {
    if (!isVeterinarian) return;
    if (!reading) return;
    if (reading.signedAt) return;
    const params = new URLSearchParams();
    params.set("draftId", String(reading.id || readingId));
    const ws = String((reading as any).wizardStep || "").trim();
    const step =
      ws === "identification" || ws === "timer" || ws === "review" || ws === "report" ? ws : "identification";
    params.set("step", step);
    router.replace(`/Veterinarian/new-reading?${params.toString()}`);
  }, [isVeterinarian, reading, router]);

  const generatedAtLabel = useMemo(() => {
    const ts = reading?.signedAt ?? reading?.createdAt ?? null;
    return formatDateTimeLabel(ts);
  }, [reading?.createdAt, reading?.signedAt]);

  const { physicalResults, chemicalResults, microscopicResults } = useMemo(() => {
    const all = Array.isArray(reading?.results) ? reading!.results : [];
    const keys = visibleKeysForAccess(reading?.productCode, reading?.unlockedProductCodes);
    const results = keys ? all.filter((r) => keys.includes(String(r?.key || ""))) : all;
    const physicalKeys = new Set(["ph", "specific-gravity"]);
    const physicalResults = results.filter((r) => physicalKeys.has(r.key));
    const chemicalResults = results.filter((r) => !physicalKeys.has(r.key));
    const microscopicResults: ReadingResult[] = [];
    return { physicalResults, chemicalResults, microscopicResults };
  }, [reading]);

  const handleDownloadPdf = useCallback(async () => {
    if (!readingId) return;
    try {
      await downloadUrinalysisPdf({ readingId, reading });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("history.failedToDownloadReport");
      toast.error(msg);
    }
  }, [reading, readingId, t]);

  const handleShare = useCallback(async () => {
    if (!readingId) return;
    try {
      const { url, fileName, blob } = await createUrinalysisPdfObjectUrl({ readingId, reading });
      const navAny = navigator as any;
      try {
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navAny?.share && navAny?.canShare && navAny.canShare({ files: [file] })) {
          await navAny.share({
            title: `${panelTitleForCode(reading?.productCode)} ${t("history.reportTitleSuffix")}`,
            files: [file],
          });
          URL.revokeObjectURL(url);
          toast.success(t("history.reportLinkReady"));
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
      const msg = e instanceof Error ? e.message : t("history.shareFailed");
      toast.error(msg);
    }
  }, [panelTitleForCode, reading, readingId, t]);

  const currentProductCode = useMemo(() => String(reading?.productCode || "VETQ_MASTER_360"), [reading?.productCode]);
  const unlockedProductCodes = useMemo(
    () => (Array.isArray(reading?.unlockedProductCodes) ? reading!.unlockedProductCodes : []),
    [reading?.unlockedProductCodes]
  );
  const accessKeys = useMemo(
    () => visibleKeysForAccess(currentProductCode, unlockedProductCodes),
    [currentProductCode, unlockedProductCodes]
  );
  const upgradeOptions = useMemo(() => {
    const current = currentProductCode;
    const unlocked = unlockedProductCodes;
    return panels.map((p) => ({
      ...p,
      disabled: !canUpgradeToTarget(current, unlocked, p.code),
    }));
  }, [canUpgradeToTarget, currentProductCode, panels, unlockedProductCodes]);

  const priceLabelFor = useCallback(
    (productCode: string, suggestedPriceBRL: number) => {
      if (productCode === "VETQ_MASTER_360") {
        const n =
          typeof profile?.baseExamPrice === "number" && Number.isFinite(profile.baseExamPrice)
            ? profile.baseExamPrice
            : suggestedPriceBRL;
        return `R$ ${n.toFixed(2)}`;
      }
      const raw = profile?.panelPrices && typeof profile.panelPrices === "object" ? (profile.panelPrices as any) : null;
      const v = raw && Object.prototype.hasOwnProperty.call(raw, productCode) ? (raw as any)[productCode] : null;
      const n =
        typeof v === "string" && v.trim() === ""
          ? NaN
          : typeof v === "number"
            ? v
            : Number(v);
      const amount = Number.isFinite(n) && n >= 0 ? n : suggestedPriceBRL;
      return `R$ ${amount.toFixed(2)}`;
    },
    [profile?.baseExamPrice, profile?.panelPrices]
  );

  const handleSendUpgradeInvite = useCallback(async () => {
    if (!readingId) return;
    const productCode = (upgradeProductCode || "").trim();
    if (!productCode) return;
    if (sendingUpgrade) return;
    try {
      setSendingUpgrade(true);
      const res = await fetch("/api/payment_links/upgrade_invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId, productCode }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(typeof (json as any)?.error === "string" ? (json as any).error : t("history.failedToSendInvite"));
        return;
      }
      toast.success(t("history.inviteSent"));
      setUpgradeOpen(false);
      setUpgradeProductCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("history.failedToSendInvite"));
    } finally {
      setSendingUpgrade(false);
    }
  }, [readingId, sendingUpgrade, upgradeProductCode, t]);

  return (
    <div className="min-h-[100dvh] w-full pb-6">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <button
            aria-label={t("history.back")}
            className="w-9 h-9 rounded-full bg-[#EBEBF0] flex items-center justify-center flex-shrink-0"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5 text-[#374151]" />
          </button>
          <span className="text-[22px] font-bold text-primary leading-tight">{t("history.details")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("history.downloadPdfAria")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#EBF2FF]"
            onClick={handleDownloadPdf}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 16L7 11M12 16L17 11M12 16V4M6 20H18" stroke="#3F78D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={t("history.shareAria")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#EBF2FF]"
            onClick={handleShare}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12M16 6L12 2M12 2L8 6M12 2V15" stroke="#3F78D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isVeterinarian ? (
            <button
              type="button"
              aria-label={t("history.inviteToUpgrade")}
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#EBF2FF] px-3 text-[13px] font-medium text-primary"
              onClick={() => { setUpgradeOpen(true); setUpgradeProductCode(""); }}
              disabled={!reading || accessKeys === null}
            >
              {t("history.inviteToUpgrade")}
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 text-center text-[14px] text-[#6B7280]">{t("history.loading")}</div>
      ) : !reading ? (
        <div className="mt-8 text-center text-[14px] text-[#6B7280]">{t("history.noExamsFound")}</div>
      ) : (
        <>
          {/* Patient card */}
          <div className="mt-5 flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 overflow-hidden rounded-full bg-[#F5F6F6] border border-[#E5E7EB]">
              <Image
                width={56}
                height={56}
                src={reading.patient.photo || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
                alt={reading.patient.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[18px] font-bold text-black/70 truncate">{reading.patient.name}</div>
              <div className="text-[13px] text-[#6B7280] mt-0.5 truncate">{reading.guardian.fullName}</div>
              <div className="text-[13px] text-[#6B7280] truncate">{panelTitleForCode(reading.productCode)}</div>
            </div>
          </div>

          {/* Physical parameters */}
          {physicalResults.length > 0 ? (
            <div className="mt-5">
              <div className="text-[14px] font-semibold text-black/70 mb-2">{t("history.physicalParameters")}</div>
              <div className="bg-white rounded-[16px] border border-[#F3F4F6] overflow-hidden">
                {physicalResults.map((r) => (
                  <ResultRow key={r.key} item={r} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Chemical parameters */}
          {chemicalResults.length > 0 ? (
            <div className="mt-4">
              <div className="text-[14px] font-semibold text-black/70 mb-2">{t("history.chemicalParameters")}</div>
              <div className="bg-white rounded-[16px] border border-[#F3F4F6] overflow-hidden">
                {chemicalResults.map((r) => (
                  <ResultRow key={r.key} item={r} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Veterinary report */}
          <div className="mt-5">
            <div className="text-[14px] font-semibold text-black/70 mb-2">{t("history.veterinaryReport")}</div>
            <div className="bg-white rounded-[16px] border border-[#F3F4F6] px-4 py-4 space-y-3">
              {(reading.report?.summaryAndInterpretation || reading.timer?.analysis?.summary) ? (
                <div>
                  <div className="text-[13px] font-bold text-black/70 mb-1">{t("reading.report.summaryInterpretation")}</div>
                  <p className="text-[13px] text-[#374151] leading-[19px]">
                    {reading.report?.summaryAndInterpretation || reading.timer?.analysis?.summary}
                  </p>
                  <p className="mt-2 text-[11px] text-[#9CA3AF] leading-[15px] italic">
                    {t("reading.report.disclaimerNote")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Other information */}
          <div className="mt-4">
            <div className="text-[13px] font-semibold text-black/70 mb-1.5">{t("reading.report.otherInformation")}</div>
            <div className="bg-[#F5F6F6] rounded-[14px] px-4 py-3 text-[13px] text-[#374151]">
              {reading.report?.otherInformation || t("history.notAvailable")}
            </div>
          </div>

          {/* Veterinarian notes */}
          <div className="mt-4">
            <div className="text-[13px] font-semibold text-black/70 mb-1.5">{t("reading.report.veterinarianNotes")}</div>
            <div className="bg-[#F5F6F6] rounded-[14px] px-4 py-3 text-[13px] text-[#374151]">
              {reading.report?.veterinarianNotes || t("history.notAvailable")}
            </div>
          </div>

          {/* Signature */}
          <div className="mt-4">
            <div className="text-[13px] font-semibold text-black/70 mb-1.5">{t("reading.report.signature")}</div>
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] px-4 py-4 min-h-[80px] flex items-center justify-center">
              {reading.signatureImageUrl ? (
                <img
                  src={reading.signatureImageUrl}
                  alt="Veterinarian signature"
                  className="max-h-20 w-auto object-contain"
                />
              ) : (
                <span className="text-[12px] text-[#9CA3AF]">{t("history.notAvailable")}</span>
              )}
            </div>
          </div>
        </>
      )}

      {
        isVeterinarian && upgradeOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/30"
              onClick={() => {
                setUpgradeOpen(false);
                setUpgradeProductCode("");
              }}
              aria-label="Close"
            />
            <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 shadow-xl">
              <div className="text-center">
                <div className="text-[16px] font-semibold text-black/70">{t("history.inviteToUpgrade")}</div>
                <div className="mt-1 text-[13px] text-[#6B7280]">{t("history.inviteToUpgradeDesc")}</div>
              </div>

              <div className="mt-4 space-y-3">
                {upgradeOptions.map((p) => {
                  const selected = upgradeProductCode === p.code;
                  const disabled = p.disabled;
                  return (
                    <button
                      key={p.code}
                      type="button"
                      className={`w-full rounded-2xl px-4 py-3 text-left ${disabled ? "bg-gray-100 opacity-60" : "bg-[#F5F6F6]"}`}
                      onClick={() => {
                        if (disabled) return;
                        setUpgradeProductCode(p.code);
                      }}
                      disabled={disabled}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[15px] font-medium text-black/70">{p.title}</div>
                          <div className="mt-1 text-[12px] text-primary">
                            {p.subtitle} - {priceLabelFor(p.code, p.suggestedPriceBRL)}
                          </div>
                        </div>
                        <div
                          className={`h-6 w-10 rounded-full p-1 transition-colors ${selected ? "bg-primary" : "bg-gray-300"}`}
                        >
                          <div className={`h-4 w-4 rounded-full bg-white transition-transform ${selected ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="mt-5 w-full rounded-full bg-primary py-4 text-[15px] font-medium text-white disabled:opacity-60"
                onClick={handleSendUpgradeInvite}
                disabled={!upgradeProductCode || sendingUpgrade}
              >
                {sendingUpgrade ? t("history.sending") : t("history.sendInvite")}
              </button>
            </div>
          </div>
        ) : null
      }
    </div>
  );
}
