'use client'
import { TrendingUp, TrendingDown, Clock, ChevronDown } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { translateUrinalysisParameterLabel } from "@/lib/urinalysisParameters";

interface ParameterData {
    name: string;
    normal: string;
    value: string | number;
    change?: number;
    status: "improving" | "alert" | "stable";
    barColor: string;
    barWidth: number;
    sparkColor?: string;
    sparkValues?: number[];
}

type TrendType = "increasing" | "decreasing" | "normal";

type ReadingResult = {
    key: string;
    label: string;
    unit: string;
    valueLabel: string;
    numericValue?: number;
};

type ReadingItem = {
    id: string;
    date: string;
};

const INCREASING_COLOR = "#F59E0B";
const NORMAL_COLOR = "#10B981";
const DECREASING_COLOR = "#EF4444";

type NormalRule =
    | { type: "range"; low: number; high: number }
    | { type: "exact"; value: number }
    | { type: "negative" }
    | { type: "lt"; value: number }
    | { type: "gt"; value: number };

const PHYSICAL_KEYS = new Set<string>(["ph", "specific-gravity"]);
const MICROSCOPIC_KEYS = new Set<string>(["leukocytes", "blood", "microalbumin", "creatine", "calcium", "magnesium", "ammonium-chloride"]);

function parseNumeric(valueLabel: string): number | undefined {
    const cleaned = String(valueLabel || "").replace(/[^\d.\-]/g, "");
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
}

function isNormal(ruleByKey: Record<string, NormalRule | undefined>, key: string, valueLabel: string, numeric?: number): boolean {
    const rule = ruleByKey[key];
    if (!rule) return false;
    if (rule.type === "negative") {
        const v = String(valueLabel || "").toLowerCase();
        return v === "neg" || v === "negative";
    }
    if (rule.type === "exact") {
        if (numeric == null) {
            const n = parseNumeric(valueLabel);
            return n != null && Math.abs(n - rule.value) < 1e-6;
        }
        return Math.abs(numeric - rule.value) < 1e-6;
    }
    if (rule.type === "lt") {
        const n = numeric ?? parseNumeric(valueLabel);
        return n != null && n < rule.value;
    }
    if (rule.type === "gt") {
        const n = numeric ?? parseNumeric(valueLabel);
        return n != null && n > rule.value;
    }
    if (rule.type === "range") {
        const n = numeric ?? parseNumeric(valueLabel);
        return n != null && n >= rule.low && n <= rule.high;
    }
    return false;
}

function classifyTrend(values: number[], key: string, lastLabel: string, normalRuleByKey: Record<string, NormalRule | undefined>): TrendType {
    if (values.length < 2) {
        const last = values.length ? values[values.length - 1] : undefined;
        if (last == null) return "normal";
        return isNormal(normalRuleByKey, key, lastLabel, last) ? "normal" : "increasing";
    }
    const prev = values[values.length - 2];
    const last = values[values.length - 1];
    if (last > prev) return "increasing";
    if (last < prev) return "decreasing";
    return isNormal(normalRuleByKey, key, lastLabel, last) ? "normal" : "increasing";
}

function trendColor(trend: TrendType): string {
    return trend === "increasing" ? INCREASING_COLOR : trend === "decreasing" ? DECREASING_COLOR : NORMAL_COLOR;
}

const ParameterRow = ({ param }: { param: ParameterData }) => {
    const { t } = useTranslation();
    const getChangeColor = () => {
        if (!param.change && !param.sparkColor) return "text-muted-foreground";
        if (param.sparkColor === NORMAL_COLOR) return "text-emerald-500";
        if (param.sparkColor === INCREASING_COLOR) return "text-amber-500";
        if (param.sparkColor === DECREASING_COLOR) return "text-red-500";
        return "text-emerald-500";
    };

    const getChangeIcon = () => {
        if (param.sparkColor === INCREASING_COLOR) return <TrendingUp className="w-3 h-3" />;
        if (param.sparkColor === DECREASING_COLOR) return <TrendingDown className="w-3 h-3" />;
        return null;
    };

    const w = 60;
    const h = 24;
    const pathD = useMemo(() => {
        const sv = Array.isArray(param.sparkValues) ? param.sparkValues : [];
        if (sv.length < 2) {
            const mid = h / 2;
            return `M0 ${mid} L${w} ${mid}`;
        }
        const min = Math.min(...sv);
        const max = Math.max(...sv);
        const range = max - min || 1;
        const stepX = w / (sv.length - 1);
        let d = "";
        for (let i = 0; i < sv.length; i++) {
            const v = sv[i];
            const x = i * stepX;
            const y = h - ((v - min) / range) * h;
            d += (i === 0 ? "M" : "L") + x + " " + y;
        }
        return d;
    }, [param.sparkValues]);
    const spikeMarkers = useMemo(() => {
        const sv = Array.isArray(param.sparkValues) ? param.sparkValues : [];
        if (sv.length < 2) return [];
        const min = Math.min(...sv);
        const max = Math.max(...sv);
        const range = max - min || 1;
        const stepX = w / (sv.length - 1);
        const out: Array<{ x: number; y: number; color: string }> = [];
        for (let i = 1; i < sv.length; i++) {
            const prev = sv[i - 1];
            const curr = sv[i];
            const denom = Math.max(Math.abs(prev), 1e-9);
            const rel = (curr - prev) / denom;
            if (Math.abs(rel) >= 0.1) {
                const x = i * stepX;
                const y = h - ((curr - min) / range) * h;
                out.push({ x, y, color: rel > 0 ? INCREASING_COLOR : DECREASING_COLOR });
            }
        }
        return out;
    }, [param.sparkValues]);

    return (
        <div className="flex items-center py-3 border-b border-border/50 last:border-b-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{param.name}</p>
                <p className="text-xs text-muted-foreground">{t("reading.progress.normalColon")} {param.normal}</p>
            </div>
            <div className="flex items-center gap-3">

                <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
                    <path d={pathD} stroke={param.sparkColor || INCREASING_COLOR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    {spikeMarkers.map((m, idx) => (
                        <circle key={idx} cx={m.x} cy={m.y} r="1.5" fill={m.color} />
                    ))}
                </svg>

                <div className="w-12 text-right">
                    <p className="text-sm font-semibold text-foreground">{param.value}</p>
                    <div className={`flex items-center justify-end gap-0.5 text-xs ${getChangeColor()}`}>
                        {getChangeIcon()}
                        <span>{param.change !== undefined ? `${param.change > 0 ? "+" : ""}${param.change}%` : "0%"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProgressView = ({ patientId, variant = "default" }: { patientId?: string; variant?: "default" | "evolution" }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<ReadingItem[]>([]);
    const [seriesByKey, setSeriesByKey] = useState<Record<string, Array<{ date: Date; value: number; valueLabel: string; unit: string; label: string }>>>({});
    const [normalLabelByKey, setNormalLabelByKey] = useState<Record<string, string>>({});
    const [normalRuleByKey, setNormalRuleByKey] = useState<Record<string, NormalRule | undefined>>({});
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/panels", { method: "GET" });
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : [];
                const labelNext: Record<string, string> = {};
                const ruleNext: Record<string, NormalRule | undefined> = {};
                for (const p of raw) {
                    const ranges = Array.isArray(p?.referenceRanges) ? (p.referenceRanges as any[]) : [];
                    for (const rr of ranges) {
                        const key = String(rr?.key || "").trim();
                        if (!key || labelNext[key] || ruleNext[key]) continue;
                        const label = String(rr?.label || "").trim();
                        const rule = rr?.rule;
                        const type = String(rule?.type || "").trim();
                        if (label) labelNext[key] = label;
                        if (type === "negative") {
                            ruleNext[key] = { type: "negative" };
                            continue;
                        }
                        if (type === "range") {
                            const low = Number(rule?.low);
                            const high = Number(rule?.high);
                            if (Number.isFinite(low) && Number.isFinite(high)) ruleNext[key] = { type: "range", low, high };
                            continue;
                        }
                        if (type === "exact") {
                            const value = Number(rule?.value);
                            if (Number.isFinite(value)) ruleNext[key] = { type: "exact", value };
                            continue;
                        }
                        if (type === "lt") {
                            const value = Number(rule?.value);
                            if (Number.isFinite(value)) ruleNext[key] = { type: "lt", value };
                            continue;
                        }
                        if (type === "gt") {
                            const value = Number(rule?.value);
                            if (Number.isFinite(value)) ruleNext[key] = { type: "gt", value };
                            continue;
                        }
                    }
                }
                setNormalLabelByKey(labelNext);
                setNormalRuleByKey(ruleNext);
            } catch {
            }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!patientId) return;
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    patientId: String(patientId),
                    page: "1",
                    pageSize: "200",
                });
                if (dateRange.from && dateRange.to) {
                    const fromTime = dateRange.from.getTime();
                    const end = new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000);
                    params.set("from", new Date(fromTime).toISOString());
                    params.set("to", end.toISOString());
                }
                const res = await fetch(`/api/reading/get_readings?${params.toString()}`);
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                if (!res.ok) {
                    setItems([]);
                    return;
                }
                const rows: ReadingItem[] = Array.isArray((data as any)?.items)
                    ? (data as any).items.map((r: any) => ({ id: String(r.id || r._id || ""), date: String(r.date || r.createdAt || "") }))
                    : [];
                setItems(rows);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [patientId, dateRange.from, dateRange.to]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!patientId || items.length === 0) {
                setSeriesByKey({});
                return;
            }
            const list = items.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const chunks = await Promise.all(
                list.map(async (it) => {
                    try {
                        const res = await fetch(`/api/reading/get_reading/${encodeURIComponent(it.id)}`);
                        const data = await res.json().catch(() => null);
                        if (!res.ok) return null;
                        const results: ReadingResult[] = Array.isArray((data as any)?.reading?.results)
                            ? (data as any).reading.results.map((r: any) => ({
                                key: String(r.key || ""),
                                label: String(r.label || ""),
                                unit: String(r.unit || ""),
                                valueLabel: String(r.valueLabel || ""),
                                numericValue: typeof r.numericValue === "number" ? r.numericValue : parseNumeric(String(r.valueLabel || "")),
                            }))
                            : [];
                        return { date: new Date(String((data as any)?.reading?.signedAt || (data as any)?.reading?.createdAt || it.date || "")), results };
                    } catch {
                        return null;
                    }
                })
            );
            const acc: Record<string, Array<{ date: Date; value: number; valueLabel: string; unit: string; label: string }>> = {};
            for (const chunk of chunks) {
                if (!chunk) continue;
                for (const r of chunk.results) {
                    const n = r.numericValue ?? parseNumeric(r.valueLabel);
                    if (n == null) continue;
                    const arr = acc[r.key] || [];
                    arr.push({ date: chunk.date, value: n, valueLabel: r.valueLabel, unit: r.unit, label: r.label });
                    acc[r.key] = arr;
                }
            }
            for (const k of Object.keys(acc)) {
                acc[k].sort((a, b) => a.date.getTime() - b.date.getTime());
            }
            if (mounted) setSeriesByKey(acc);
        })();
        return () => { mounted = false; };
    }, [items, patientId]);

    const lastExamDateLabel = useMemo(() => {
        const latest = items.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (!latest) return "";
        const d = new Date(latest.date);
        if (Number.isNaN(d.getTime())) return "";
        return format(d, "d MMM yyyy");
    }, [items]);

    const physicalParams: ParameterData[] = useMemo(() => {
        const rows: ParameterData[] = [];
        for (const key of Array.from(PHYSICAL_KEYS)) {
            const series = (seriesByKey[key] || []).filter((s) => {
                const t = s.date.getTime();
                const apply = !!dateRange.from && !!dateRange.to;
                const okFrom = !apply || t >= (dateRange.from as Date).getTime();
                const toBound = apply ? (dateRange.to as Date).getTime() + 24 * 60 * 60 * 1000 : null;
                const okTo = !apply || !toBound || t < toBound;
                return okFrom && okTo;
            });
            const values = series.map((s) => s.value);
            const last = series[series.length - 1];
            const prev = series.length > 1 ? series[series.length - 2] : undefined;
            const normalLabel = normalLabelByKey[key] ?? "";
            const trend = classifyTrend(values, key, last?.valueLabel || "", normalRuleByKey);
            const changePct = prev && last ? Math.round(((last.value - prev.value) / Math.max(Math.abs(prev.value), 1e-9)) * 100) : 0;
            rows.push({
                name: translateUrinalysisParameterLabel(t, key, last?.label || key),
                normal: normalLabel,
                value: last ? (last.unit ? `${last.valueLabel} ${last.unit}` : last.valueLabel) : "-",
                change: changePct,
                status: trend === "increasing" ? "improving" : trend === "decreasing" ? "alert" : "stable",
                barColor: INCREASING_COLOR,
                barWidth: 70,
                sparkColor: trendColor(trend),
                sparkValues: values,
            });
        }
        return rows;
    }, [seriesByKey, dateRange.from, dateRange.to, normalLabelByKey, normalRuleByKey]);

    const chemicalParams: ParameterData[] = useMemo(() => {
        const rows: ParameterData[] = [];
        for (const key of Object.keys(seriesByKey)) {
            if (PHYSICAL_KEYS.has(key) || MICROSCOPIC_KEYS.has(key)) continue;
            const series = (seriesByKey[key] || []).filter((s) => {
                const t = s.date.getTime();
                const apply = !!dateRange.from && !!dateRange.to;
                const okFrom = !apply || t >= (dateRange.from as Date).getTime();
                const toBound = apply ? (dateRange.to as Date).getTime() + 24 * 60 * 60 * 1000 : null;
                const okTo = !apply || !toBound || t < toBound;
                return okFrom && okTo;
            });
            const values = series.map((s) => s.value);
            const last = series[series.length - 1];
            const prev = series.length > 1 ? series[series.length - 2] : undefined;
            const normalLabel = normalLabelByKey[key] ?? "";
            const trend = classifyTrend(values, key, last?.valueLabel || "", normalRuleByKey);
            const changePct = prev && last ? Math.round(((last.value - prev.value) / Math.max(Math.abs(prev.value), 1e-9)) * 100) : 0;
            rows.push({
                name: translateUrinalysisParameterLabel(t, key, last?.label || key),
                normal: normalLabel,
                value: last ? (last.unit ? `${last.valueLabel} ${last.unit}` : last.valueLabel) : "-",
                change: changePct,
                status: trend === "increasing" ? "improving" : trend === "decreasing" ? "alert" : "stable",
                barColor: INCREASING_COLOR,
                barWidth: 65,
                sparkColor: trendColor(trend),
                sparkValues: values,
            });
        }
        return rows;
    }, [seriesByKey, dateRange.from, dateRange.to, normalLabelByKey, normalRuleByKey]);

    const microscopicParams: ParameterData[] = useMemo(() => {
        const rows: ParameterData[] = [];
        for (const key of Array.from(MICROSCOPIC_KEYS)) {
            const series = (seriesByKey[key] || []).filter((s) => {
                const t = s.date.getTime();
                const apply = !!dateRange.from && !!dateRange.to;
                const okFrom = !apply || t >= (dateRange.from as Date).getTime();
                const toBound = apply ? (dateRange.to as Date).getTime() + 24 * 60 * 60 * 1000 : null;
                const okTo = !apply || !toBound || t < toBound;
                return okFrom && okTo;
            });
            const values = series.map((s) => s.value);
            const last = series[series.length - 1];
            const prev = series.length > 1 ? series[series.length - 2] : undefined;
            const normalLabel = normalLabelByKey[key] ?? "";
            const trend = classifyTrend(values, key, last?.valueLabel || "", normalRuleByKey);
            const changePct = prev && last ? Math.round(((last.value - prev.value) / Math.max(Math.abs(prev.value), 1e-9)) * 100) : 0;
            rows.push({
                name: translateUrinalysisParameterLabel(t, key, last?.label || key),
                normal: normalLabel,
                value: last ? (last.unit ? `${last.valueLabel} ${last.unit}` : last.valueLabel) : "-",
                change: changePct,
                status: trend === "increasing" ? "improving" : trend === "decreasing" ? "alert" : "stable",
                barColor: INCREASING_COLOR,
                barWidth: 60,
                sparkColor: trendColor(trend),
                sparkValues: values,
            });
        }
        return rows;
    }, [seriesByKey, dateRange.from, dateRange.to, normalLabelByKey, normalRuleByKey]);

    if (items.length < 1) {
        return (
            <div className="text-[14px] text-gray-500 px-4">{t("reading.progress.noProgressYet")}</div>
        )
    }
    if (variant === "evolution") {
        return (
            <div className="space-y-4">
                <ParameterProgress
                    dataByParameter={seriesByKey}
                    patientId={patientId}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    normalLabelByKey={normalLabelByKey}
                    normalRuleByKey={normalRuleByKey}
                    variant="evolution"
                />
            </div>
        );
    }
    return (
        <div className="space-y-4 px-">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{t("reading.progress.overallProgress")}</h2>
                    <p className="text-xs text-muted-foreground">{lastExamDateLabel ? `${t("reading.progress.lastTest")} ${lastExamDateLabel}` : ""}</p>
                </div>
                {patientId ? (
                    <Link
                        href={`/Guardian/history?petId=${encodeURIComponent(String(patientId || ""))}`}
                        className="flex items-center gap-1 text-sm text-primary font-medium"
                    >
                        <Clock className="w-4 h-4" />
                        {t("reading.progress.viewHistory")}
                    </Link>
                ) : null}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl h-[65px] flex flex-col justify-center items-start w-full text-emerald-500 px-3 text-center">
                    <div className="flex justify-between w-full">
                        <TrendingUp className="w-5 h-5   mb-1" />
                        <p className="text-xl font-bold">{chemicalParams.filter((p) => p.sparkColor === NORMAL_COLOR).length + physicalParams.filter((p) => p.sparkColor === NORMAL_COLOR).length + microscopicParams.filter((p) => p.sparkColor === NORMAL_COLOR).length}</p>
                    </div>
                    <p className="text-xs ">{t("reading.progress.normal")}</p>
                </div>
                <div className="bg-amber-50 rounded-xl h-[65px] flex flex-col justify-center items-start w-full text-amber-500 px-3 text-center">
                    <div className="flex justify-between w-full">
                        <TrendingDown className="w-5 h-5   mb-1" />
                        <p className="text-xl font-bold">{chemicalParams.filter((p) => p.sparkColor === INCREASING_COLOR).length + physicalParams.filter((p) => p.sparkColor === INCREASING_COLOR).length + microscopicParams.filter((p) => p.sparkColor === INCREASING_COLOR).length}</p>
                    </div>
                    <p className="text-xs ">{t("reading.progress.increasing")}</p>
                </div>
                <div className="bg-red-50 rounded-xl h-[65px] flex flex-col justify-center items-start w-full text-red-500 px-3 text-center">
                    <div className="flex justify-between w-full">
                        <Clock className="w-5 h-5   mb-1" />
                        <p className="text-xl font-bold">{chemicalParams.filter((p) => p.sparkColor === DECREASING_COLOR).length + physicalParams.filter((p) => p.sparkColor === DECREASING_COLOR).length + microscopicParams.filter((p) => p.sparkColor === DECREASING_COLOR).length}</p>
                    </div>
                    <p className="text-xs ">{t("reading.progress.decreasing")}</p>
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-start">{t("reading.progress.expandViewEachParameter")}</p>

            {/* Collapsible Sections */}
            <Accordion type="multiple" defaultValue={["physical", "chemical", "microscopic"]} className="space-y-3">
                {/* Physical Parameters */}
                <AccordionItem value="physical" className="bg-card rounded-2xl border-0 shadow-sm overflow-hidden">
                    <AccordionTrigger className="bg-[#F5F6F6] px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-[12px] bg-primary flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M9.99125 18.3171C11.537 18.3171 13.0194 17.7031 14.1124 16.6101C15.2054 15.517 15.8194 14.0347 15.8194 12.489C15.8194 10.8237 14.9869 9.24182 13.3216 7.90967C11.6564 6.57753 10.4076 4.57929 9.99125 2.4978C9.57496 4.57929 8.32606 6.57753 6.66087 7.90967C4.99569 9.24182 4.16309 10.8237 4.16309 12.489C4.16309 14.0347 4.77712 15.517 5.87012 16.6101C6.96311 17.7031 8.44553 18.3171 9.99125 18.3171Z" fill="white" />
                                </svg>
                            </div>
                            <span className="font-semibold text-foreground">{t("reading.progress.physicalParameters")}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                        {physicalParams.map((param, idx) => (
                            <ParameterRow key={idx} param={param} />
                        ))}
                    </AccordionContent>
                </AccordionItem>

                {/* Chemical Parameters */}
                <AccordionItem value="chemical" className="bg-card rounded-2xl border-0 shadow-sm overflow-hidden">
                    <AccordionTrigger className="bg-[#F5F6F6] px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-[12px] bg-primary flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M11.6564 1.66528V6.66085C11.6563 6.94018 11.7265 7.21504 11.8604 7.46015L16.448 15.8527C16.5867 16.1064 16.6571 16.3917 16.6521 16.6807C16.6471 16.9698 16.5669 17.2525 16.4195 17.5012C16.2721 17.7499 16.0625 17.9559 15.8113 18.099C15.56 18.242 15.2759 18.3173 14.9868 18.3172H4.99566C4.70656 18.3173 4.42242 18.242 4.17121 18.099C3.91999 17.9559 3.71036 17.7499 3.56291 17.5012C3.41548 17.2525 3.33531 16.9698 3.33033 16.6807C3.32534 16.3917 3.39569 16.1064 3.53445 15.8527L8.12205 7.46015C8.256 7.21504 8.32615 6.94018 8.32603 6.66085V1.66528" fill="white" />
                                </svg>
                            </div>
                            <span className="font-semibold text-foreground">{t("reading.progress.chemicalParameters")}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                        {chemicalParams.map((param, idx) => (
                            <ParameterRow key={idx} param={param} />
                        ))}
                    </AccordionContent>
                </AccordionItem>

                {/* Microscopic Parameters */}
                <AccordionItem value="microscopic" className="bg-card rounded-2xl border-0 shadow-sm overflow-hidden">
                    <AccordionTrigger className="bg-[#F5F6F6] px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-[12px] bg-primary flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M3.33055 11.6564C3.17299 11.657 3.01852 11.6128 2.88507 11.529C2.75163 11.4453 2.64469 11.3253 2.57668 11.1832C2.50867 11.041 2.48238 10.8826 2.50087 10.7261C2.51935 10.5696 2.58187 10.4216 2.68112 10.2993L10.9238 1.8068C10.9856 1.73543 11.0699 1.6872 11.1627 1.67003C11.2556 1.65286 11.3515 1.66776 11.4348 1.7123C11.5181 1.75683 11.5837 1.82836 11.621 1.91512C11.6582 2.00189 11.6649 2.09874 11.6398 2.18979L10.0412 7.20201C9.99413 7.32817 9.9783 7.46388 9.99514 7.5975C10.0119 7.73112 10.061 7.85867 10.1379 7.96919C10.2148 8.07971 10.3175 8.16992 10.4369 8.23207C10.5565 8.29421 10.6892 8.32645 10.8239 8.32602H16.6521C16.8096 8.32548 16.9642 8.36966 17.0976 8.45342C17.231 8.53719 17.338 8.65709 17.406 8.79922C17.4739 8.94134 17.5002 9.09984 17.4817 9.25631C17.4632 9.41278 17.4008 9.56079 17.3015 9.68315L9.0588 18.1756C8.99697 18.2469 8.91272 18.2952 8.81987 18.3124C8.72701 18.3295 8.63109 18.3146 8.54782 18.2701C8.46455 18.2256 8.39891 18.1541 8.36164 18.0673C8.32439 17.9806 8.31773 17.8837 8.34277 17.7926L9.94135 12.7804C9.98849 12.6542 10.0043 12.5186 9.98749 12.3849C9.97065 12.2513 9.92166 12.1238 9.8447 12.0132C9.76774 11.9027 9.66513 11.8125 9.54565 11.7503C9.42616 11.6881 9.29339 11.656 9.15872 11.6564H3.33055Z" fill="white" />
                                </svg>
                            </div>
                            <span className="font-semibold text-foreground">{t("reading.progress.microscopicParameters")}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                        {microscopicParams.map((param, idx) => (
                            <ParameterRow key={idx} param={param} />
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <ParameterProgress
                dataByParameter={seriesByKey}
                patientId={patientId}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                normalLabelByKey={normalLabelByKey}
                normalRuleByKey={normalRuleByKey}
            />
        </div>
    );
};

export default ProgressView;



import { Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    CartesianGrid,
} from "recharts";

type ViewMode = "graph" | "table";

interface ParameterProgressData {
    name: string;
    normalValue: string;
    data: { label: string; value: number; valueLabel: string }[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-lg">
                {payload[0].value.toFixed(1)}
            </div>
        );
    }
    return null;
};

const EvolutionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="relative">
                <div className="bg-[#3D3A6A] text-white px-3 py-1.5 rounded-md text-[13px] font-semibold shadow-lg">
                    {Number(payload[0].value).toFixed(0)}%
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-[#3D3A6A]" />
            </div>
        );
    }
    return null;
};

export function ParameterProgress({
    dataByParameter = {},
    patientId,
    dateRange,
    onDateRangeChange,
    normalLabelByKey = {},
    normalRuleByKey = {},
    variant = "default",
}: {
    dataByParameter?: Record<string, Array<{ date: Date; value: number; valueLabel: string; unit: string; label: string }>>;
    patientId?: string;
    dateRange?: { from: Date | undefined; to: Date | undefined };
    onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
    normalLabelByKey?: Record<string, string>;
    normalRuleByKey?: Record<string, NormalRule | undefined>;
    variant?: "default" | "evolution";
}) {
    const isEvolution = variant === "evolution";
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>("graph");
    const [tempRange, setTempRange] = useState<{ from: Date | undefined; to: Date | undefined }>(dateRange || { from: undefined, to: undefined });
    const [pickerOpen, setPickerOpen] = useState(false);

    const allParameters = useMemo(() => {
        const keys = Object.keys(dataByParameter || {});
        return keys.map((k) => {
            const raw = (dataByParameter || {})[k] || [];
            const filtered = raw.filter((r) => {
                const ts = r.date.getTime();
                const apply = !!dateRange?.from && !!dateRange.to;
                const okFrom = !apply || ts >= (dateRange.from as Date).getTime();
                const toBound = apply ? (dateRange.to as Date).getTime() + 24 * 60 * 60 * 1000 : null;
                const okTo = !apply || !toBound || ts < toBound;
                return okFrom && okTo;
            });
            const series = filtered.map((r) => ({
                label: format(r.date, "MMM d"),
                value: r.value,
                valueLabel: r.valueLabel,
            }));
            const last = raw.length ? raw[raw.length - 1] : undefined;
            const vals = raw.map((r) => r.value);
            const lastLabel = raw.length ? raw[raw.length - 1].valueLabel : "";
            const trend = classifyTrend(vals, k, lastLabel, normalRuleByKey);
            return {
                key: k,
                name: translateUrinalysisParameterLabel(t, k, last?.label || k),
                normalValue: normalLabelByKey[k] || "",
                data: series,
                color: trendColor(trend),
            };
        });
    }, [dataByParameter, dateRange?.from, dateRange?.to, normalLabelByKey, normalRuleByKey, t]);

    const handleExport = (param: { name: string; data: { label: string; value: number; valueLabel: string }[] }) => {
        const rows = [["Date", "Parameter", "ValueLabel", "NumericValue"].join(",")];
        for (const it of param.data) {
            const row = [it.label, param.name, it.valueLabel, String(it.value)];
            rows.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
        }
        const csv = rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${param.name.replace(/\s+/g, "-").toLowerCase()}-${patientId || "patient"}-progress.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const datePicker = (
        <Popover open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (o) setTempRange(dateRange || { to: undefined, from: undefined }); }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={isEvolution
                        ? "justify-between rounded-lg border border-gray-200 bg-white text-[13px] font-normal text-gray-700 h-9 px-3 gap-2"
                        : "w-full justify-between rounded-xl border border-gray-200 bg-white text-sm font-normal text-gray-600 h-10"}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className={isEvolution ? "h-3.5 w-3.5 text-gray-500" : "h-4 w-4 text-primary"} />
                        <span>
                            {dateRange?.from && dateRange.to
                                ? `${format(dateRange.from, "d MMM, yyyy")} - ${format(dateRange.to, "d MMM, yyyy")}`
                                : t("reading.progress.selectDates")}
                        </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg z-50" align="start">
                <CalendarComponent
                    mode="range"
                    selected={{ from: tempRange.from, to: tempRange.to }}
                    onSelect={(range) =>
                        setTempRange({ from: range?.from, to: range?.to })
                    }
                    numberOfMonths={2}
                />
                <div className="flex items-center justify-end gap-2 p-2">
                    <Button
                        variant="secondary"
                        className="rounded-md"
                        onClick={() => { setPickerOpen(false); }}
                    >
                        {t("reading.progress.cancel")}
                    </Button>
                    <Button
                        className="rounded-md"
                        disabled={!tempRange.from || !tempRange.to}
                        onClick={() => { if (tempRange?.from && tempRange?.to && onDateRangeChange) { onDateRangeChange(tempRange); setPickerOpen(false); } }}
                    >
                        {t("reading.progress.apply")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );

    const renderChartCard = (param: typeof allParameters[number]) => {
        const values = param.data.map((d) => d.value);
        const maxV = values.length ? Math.max(...values) : undefined;
        const peakIdx = values.length ? values.indexOf(maxV as number) : -1;
        const peakLabel = peakIdx >= 0 ? param.data[peakIdx].label : undefined;
        const stroke = isEvolution ? "#7B7DDB" : param.color;
        return (
            <div key={param.key} className={isEvolution
                ? "rounded-2xl border border-gray-200 bg-white p-4"
                : "rounded-2xl border border-gray-100 bg-white p-4"}>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className={isEvolution ? "text-[18px] font-extrabold text-gray-900" : "text-sm font-bold text-gray-900"}>{param.name}</h3>
                        <p className={isEvolution ? "text-[13px] text-gray-500 mt-0.5" : "text-xs text-gray-500"}>
                            {t("reading.progress.normalColon")} {param.normalValue}
                        </p>
                    </div>
                    <button
                        onClick={() => handleExport(param)}
                        className={isEvolution
                            ? "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            : "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"}
                    >
                        <Download className="h-3.5 w-3.5" />
                        {t("reading.progress.export")}
                    </button>
                </div>

                {viewMode === "graph" ? (
                    <div className={isEvolution ? "h-56" : "h-48"}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={param.data.map((d) => ({ ...d, month: d.label }))}
                                margin={{ top: 18, right: 10, left: isEvolution ? -10 : -20, bottom: 0 }}
                            >
                                {isEvolution ? (
                                    <CartesianGrid strokeDasharray="0" stroke="#F1F2F4" vertical={false} />
                                ) : null}
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                    tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                    domain={isEvolution ? [0, "dataMax + 5"] : ["dataMin - 1", "dataMax + 1"]}
                                    tickFormatter={isEvolution ? (v) => (v < 10 ? `0${v}` : `${v}`) : undefined}
                                />
                                {isEvolution && maxV !== undefined ? (
                                    <ReferenceLine y={maxV} stroke="#7B7DDB" strokeDasharray="4 4" strokeOpacity={0.7} />
                                ) : null}
                                {isEvolution && peakLabel ? (
                                    <ReferenceLine x={peakLabel} stroke="#7B7DDB" strokeDasharray="4 4" strokeOpacity={0.7} />
                                ) : null}
                                <Tooltip content={isEvolution ? <EvolutionTooltip /> : <CustomTooltip />} cursor={false} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={stroke}
                                    strokeWidth={isEvolution ? 2.2 : 2.5}
                                    dot={false}
                                    activeDot={{
                                        r: 5,
                                        fill: stroke,
                                        stroke: "#fff",
                                        strokeWidth: 2,
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="overflow-hidden">
                        <div className="flex justify-between text-xs text-gray-400 border-b border-gray-100 pb-2 mb-1">
                            <span>{t("reading.progress.month")}</span>
                            <span>{t("reading.progress.value")}</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {param.data.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex justify-between py-2.5 text-sm text-gray-700"
                                >
                                    <span>{item.label}</span>
                                    <span className="font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (isEvolution) {
        return (
            <div className="w-full space-y-4">
                {/* Header card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <h2 className="text-[20px] font-extrabold text-gray-900 leading-tight">
                        {t("reading.progress.parameterEvolution")}
                    </h2>
                    <p className="text-[13px] text-gray-500 mt-1 leading-snug">
                        {t("reading.progress.parameterEvolutionDesc")}
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-3">
                        <div className="flex-1 min-w-0">{datePicker}</div>
                        <div className="flex items-center gap-3 text-[13px]">
                            <button
                                onClick={() => setViewMode("graph")}
                                className={viewMode === "graph"
                                    ? "text-primary underline underline-offset-2 font-medium"
                                    : "text-gray-700"}
                            >
                                {t("reading.progress.graph")}
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={viewMode === "table"
                                    ? "text-primary underline underline-offset-2 font-medium"
                                    : "text-gray-700"}
                            >
                                {t("reading.progress.table")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chart cards */}
                <div className="space-y-4">
                    {allParameters.map((param) => renderChartCard(param))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            {/* Header */}
            <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">
                    {t("reading.progress.parameterProgress")}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    {t("reading.progress.trackTestResults")}
                </p>
            </div>

            {/* Date Range Picker */}
            <div className="mb-4">{datePicker}</div>

            {/* View Mode Toggle */}
            <div className="flex gap-4 mb-5 border-b border-gray-200">
                <button
                    onClick={() => setViewMode("graph")}
                    className={`pb-2 text-sm font-medium transition-colors ${viewMode === "graph"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-400"
                        }`}
                >
                    {t("reading.progress.graph")}
                </button>
                <button
                    onClick={() => setViewMode("table")}
                    className={`pb-2 text-sm font-medium transition-colors ${viewMode === "table"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-400"
                        }`}
                >
                    {t("reading.progress.table")}
                </button>
            </div>

            {/* Individual Parameter Cards */}
            <div className="space-y-4">
                {allParameters.map((param) => renderChartCard(param))}
            </div>
        </div>
    );
}
