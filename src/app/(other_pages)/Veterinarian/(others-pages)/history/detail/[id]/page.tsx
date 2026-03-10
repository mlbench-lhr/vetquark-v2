'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { downloadUrinalysisPdf } from "@/utils/urinalysisPdf";
import { useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";

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

function ResultRow({ item }: { item: ReadingResult }) {
  const isNormal = item.status === "Normal";
  const dotColor = isNormal ? "#10B981" : "#F59E0B";
  const value = item.unit ? `${item.valueLabel} ${item.unit}` : item.valueLabel;
  return (
    <div className="bg-white py-4 border-t px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-gray-900">{item.label}</p>
            <p className="truncate text-[12px] text-gray-400">{value}</p>
          </div>
        </div>
        <div className="shrink-0" />
      </div>
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

function formatCollectionMethod(value: string | null | undefined) {
  const v = (value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "free_catch") return "Free catch";
  if (v === "cystocentesis") return "Cystocentesis";
  if (v === "catheter") return "Catheter";
  return value || "";
}

function asReportText(value: string | null | undefined) {
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s : "N/A";
}

async function shareReadingReport(title: string) {
  const url = window.location.href;
  const navAny = navigator as any;
  if (typeof navAny?.share === "function") {
    await navAny.share({ title, url });
    return;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }
  throw new Error(url);
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
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reading/get_reading/${encodeURIComponent(readingId)}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (res.status === 402) {
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : "Payment required";
          throw new Error(msg);
        }
        if (!res.ok) {
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load report";
          throw new Error(msg);
        }
        setReading((data as any)?.reading ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load report";
        toast.error(msg);
        setReading(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [readingId]);

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
      const msg = e instanceof Error ? e.message : "Failed to download report";
      toast.error(msg);
    }
  }, [reading, readingId]);

  const handleShare = useCallback(async () => {
    if (!readingId) return;
    try {
      await shareReadingReport(`${panelTitleForCode(reading?.productCode)} Report`);
      toast.success("Report link ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Share failed";
      if (typeof msg === "string" && msg.startsWith("http")) {
        toast.info("Copy link: " + msg);
        return;
      }
      // toast.error(msg);
    }
  }, [reading?.productCode, readingId]);

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
        toast.error(typeof (json as any)?.error === "string" ? (json as any).error : "Failed to send invite");
        return;
      }
      toast.success("Invite sent");
      setUpgradeOpen(false);
      setUpgradeProductCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setSendingUpgrade(false);
    }
  }, [readingId, sendingUpgrade, upgradeProductCode]);

  return (
    <div className="min-h-[100dvh w-full bg-white">
      <div className="mx-auto w-full pb-6">
        <div className="flex items-center justify-between px-">
          <button
            aria-label="Back"
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-base font-medium text-gray-900">{t("history.details")}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Download report (PDF)"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EBF2FF]"
              onClick={handleDownloadPdf}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="17" viewBox="0 0 14 17" fill="none">
                <path d="M6.66667 0L6.76417 0.00583331C6.95018 0.0277699 7.12338 0.111733 7.25582 0.244176C7.38827 0.376619 7.47223 0.549819 7.49417 0.735833L7.5 0.833333V4.16667L7.50417 4.29167C7.53399 4.68848 7.7048 5.06152 7.98572 5.34336C8.26664 5.62519 8.63912 5.79722 9.03583 5.82833L9.16667 5.83333H12.5L12.5975 5.83917C12.7835 5.8611 12.9567 5.94507 13.0892 6.07751C13.2216 6.20995 13.3056 6.38315 13.3275 6.56917L13.3333 6.66667V14.1667C13.3334 14.8043 13.0897 15.4179 12.6523 15.8819C12.2148 16.3458 11.6166 16.6251 10.98 16.6625L10.8333 16.6667H2.5C1.86232 16.6667 1.24874 16.4231 0.784783 15.9856C0.320828 15.5481 0.0415771 14.9499 0.00416677 14.3133L3.88371e-09 14.1667V2.5C-3.55181e-05 1.86232 0.243604 1.24874 0.68107 0.784783C1.11854 0.320828 1.71676 0.0415771 2.35333 0.00416676L2.5 0H6.66667ZM6.66667 6.66667C6.44565 6.66667 6.23369 6.75446 6.07741 6.91074C5.92113 7.06702 5.83333 7.27899 5.83333 7.5V10.4875L5.1725 9.8275C5.02901 9.68402 4.83809 9.59783 4.63557 9.58509C4.43305 9.57236 4.23284 9.63396 4.0725 9.75833L3.99417 9.8275C3.83794 9.98377 3.75018 10.1957 3.75018 10.4167C3.75018 10.6376 3.83794 10.8496 3.99417 11.0058L6.0775 13.0892L6.11417 13.1242L6.17083 13.17L6.2625 13.2292L6.3575 13.2742L6.445 13.3033L6.57 13.3283L6.66667 13.3333L6.76417 13.3275L6.86167 13.3108L6.95167 13.2833L7.01917 13.255L7.10083 13.2117L7.1775 13.1583L7.25583 13.0892L9.33917 11.0058C9.49539 10.8496 9.58315 10.6376 9.58315 10.4167C9.58315 10.1957 9.49539 9.98377 9.33917 9.8275L9.26083 9.75833C9.1005 9.63396 8.90029 9.57236 8.69777 9.58509C8.49524 9.59783 8.30433 9.68402 8.16083 9.8275L7.5 10.4867V7.5C7.49997 7.29589 7.42504 7.09889 7.2894 6.94636C7.15377 6.79383 6.96688 6.69638 6.76417 6.6725L6.66667 6.66667ZM9.16583 0.8325L12.5 4.16667H9.16667L9.16583 0.8325Z" fill="#3F78D8" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Share report"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F3FFEB]"
              onClick={handleShare}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10.0003 4.16634V11.2497M12.5003 5.83301L10.0003 3.33301L7.50033 5.83301M4.16699 9.99967V14.1663C4.16699 14.6084 4.34259 15.0323 4.65515 15.3449C4.96771 15.6574 5.39163 15.833 5.83366 15.833H14.167C14.609 15.833 15.0329 15.6574 15.3455 15.3449C15.6581 15.0323 15.8337 14.6084 15.8337 14.1663V9.99967" stroke="#3E9306" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isVeterinarian ? (
              <button
                type="button"
                aria-label="Invite to upgrade"
                className="inline-flex h-9 items-center justify-center rounded-full bg-[#EBF2FF] px-3 text-[13px] font-medium text-[#3F78D8]"
                onClick={() => {
                  setUpgradeOpen(true);
                  setUpgradeProductCode("");
                }}
                disabled={!reading || accessKeys === null}
              >
                Invite To Upgrade
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 px- text-[14px] text-gray-500">{t("history.loading")}</div>
        ) : !reading ? (
          <div className="mt-6 px- text-[14px] text-gray-500">{t("history.noExamsFound")}</div>
        ) : (
          <>
            <div className="mt-5 px-">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F5F6F6]">
                  <Image
                    width={100}
                    height={100}
                    src={reading.patient.photo || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
                    alt={reading.patient.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-medium text-[#111827]">{reading.patient.name}</div>
                  <div className="truncate text-[13px] text-[#9AA4AF]">{reading.guardian.fullName}</div>
                  <div className="truncate text-[13px] text-[#9AA4AF]">{panelTitleForCode(reading.productCode)}</div>
                </div>
              </div>
            </div>

            {physicalResults.length > 0 ? (
              <div className="mt-5 rounded-[16px] bg-[#F5F6F6]">
                <h1 className="px-4 pt-4 text-base font-medium text-gray-900 mb-2">{t("history.physicalParameters")}</h1>
                {physicalResults.map((r) => (
                  <ResultRow key={r.key} item={r} />
                ))}
              </div>
            ) : null}

            {chemicalResults.length > 0 ? (
              <div className="mt-2 rounded-[16px] bg-[#F5F6F6]">
                <h1 className="px-4 pt-4 text-base font-medium text-gray-900 mb-2">{t("history.chemicalParameters")}</h1>
                {chemicalResults.map((r) => (
                  <ResultRow key={r.key} item={r} />
                ))}
              </div>
            ) : null}

            {microscopicResults.length > 0 ? (
              <div className="mt-2 rounded-[16px] bg-[#F5F6F6]">
                <h1 className="px-4 pt-4 text-base font-medium text-gray-900 mb-2">{t("history.microscopicParameters")}</h1>
                {microscopicResults.map((r) => (
                  <ResultRow key={r.key} item={r} />
                ))}
              </div>
            ) : null}

            <div className="w-full flex justify-start items-start flex-col gap-0 px-4 mt-5">
              <h1 className="text-[18px] font-medium">{t("history.veterinaryReport")}</h1>
              <h2 className="text-[14px] font-normal">{t("reading.report.summaryInterpretation")}</h2>
              <p className="text-[14px] font-normal text-black/60">
                {reading.report?.summaryAndInterpretation || reading.timer?.analysis?.summary || "N/A"}
              </p>
              <p className="text-[14px] font-normal">
                {t("reading.report.disclaimerNote")}
              </p>
              <span className="text-[14px] font-normal mt-3">{t("reading.report.otherInformation")}</span>
              <div className="w-full text-[16px] font-normal bg-[#F5F6F6] rounded-[12px] p-4 mt-1">
                {reading.report?.otherInformation || "N/A"}
              </div>
              <span className="text-[14px] font-normal mt-3">{t("reading.report.veterinarianNotes")}</span>
              <div className="w-full text-[16px] font-normal bg-[#F5F6F6] rounded-[12px] p-4 mt-1">
                {reading.report?.veterinarianNotes || "N/A"}
              </div>
              {reading.signatureImageUrl ? (
                <div className="w-full mt-4">
                  <div className="text-[14px] font-normal mb-1">{t("reading.report.signature")}</div>
                  <div className="rounded-[12px] bg-[#F5F6F6] p-4">
                    <div className="w-full h-24 bg-white rounded-md flex items-center justify-center overflow-hidden">
                      <img
                        src={reading.signatureImageUrl}
                        alt="Veterinarian signature"
                        className="max-h-24 w-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-[#F5F6F6] w-full h-4 mt-4" />
            <div className="w-full flex justify-start items-center flex-col gap-0 px-4">
              <h1 className="text-[18px] font-medium">{reading.veterinarian.fullName}</h1>
              <h2 className="text-[14px] font-normal">
                {reading.veterinarian.crmvState && reading.veterinarian.crmv
                  ? `CRMV-${reading.veterinarian.crmvState} ${reading.veterinarian.crmv}`
                  : "CRMV"}
              </h2>
              <p className="text-[14px] font-normal text-black/60">
                {generatedAtLabel ? `${t("reading.report.generatedOnPrefix")} ${generatedAtLabel}` : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {isVeterinarian && upgradeOpen ? (
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
              <div className="text-[16px] font-semibold text-[#111827]">Invite To Upgrade</div>
              <div className="mt-1 text-[13px] text-[#6B7280]">Tap to select a panel type & invite the guardian</div>
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
                        <div className="text-[15px] font-medium text-[#111827]">{p.title}</div>
                        <div className="mt-1 text-[12px] text-[#3F78D8]">
                          {p.subtitle} - {priceLabelFor(p.code, p.suggestedPriceBRL)}
                        </div>
                      </div>
                      <div
                        className={`h-6 w-10 rounded-full p-1 transition-colors ${selected ? "bg-[#3F78D8]" : "bg-gray-300"}`}
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
              className="mt-5 w-full rounded-full bg-[#3F78D8] py-4 text-[15px] font-medium text-white disabled:opacity-60"
              onClick={handleSendUpgradeInvite}
              disabled={!upgradeProductCode || sendingUpgrade}
            >
              {sendingUpgrade ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
