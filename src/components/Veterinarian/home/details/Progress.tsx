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

interface ParameterData {
    name: string;
    normal: string;
    value: string | number;
    change?: number;
    status: "improving" | "alert" | "stable";
    barColor: string;
    barWidth: number;
    sparkColor?: string;
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

const NORMALS: Record<string, { label: string; type: "range" | "exact" | "negative" | "lt" | "gt"; low?: number; high?: number; value?: number }> = {
    "specific-gravity": { label: "1.015-1.030", type: "range", low: 1.015, high: 1.03 },
    "ph": { label: "5.5-7.0", type: "range", low: 5.5, high: 7.0 },
    "protein": { label: "0-15", type: "range", low: 0, high: 15 },
    "glucose": { label: "Negative", type: "negative" },
    "ketone-bodies": { label: "Negative", type: "negative" },
    "bilirubin": { label: "Negative", type: "negative" },
    "urobilinogen": { label: "0-1", type: "range", low: 0, high: 1 },
    "nitrite": { label: "Negative", type: "negative" },
    "ascorbic-acid": { label: "0", type: "exact", value: 0 },
    "leukocytes": { label: "Negative", type: "negative" },
    "blood": { label: "Negative", type: "negative" },
    "microalbumin": { label: "< 0.03", type: "lt", value: 0.03 },
    "creatine": { label: "0.9-26.5", type: "range", low: 0.9, high: 26.5 },
    "calcium": { label: "0-2.5", type: "range", low: 0, high: 2.5 },
    "magnesium": { label: "0-1.5", type: "range", low: 0, high: 1.5 },
    "ammonium-chloride": { label: "0", type: "exact", value: 0 },
};

const LABEL_BY_KEY: Record<string, string> = {
    "specific-gravity": "Specific Gravity",
    "ph": "pH",
    "protein": "Protein",
    "glucose": "Glucose",
    "ketone-bodies": "Ketone Bodies",
    "bilirubin": "Bilirubin",
    "urobilinogen": "Urobilinogen",
    "nitrite": "Nitrite",
    "ascorbic-acid": "Ascorbic Acid",
    "leukocytes": "Leukocytes",
    "blood": "Blood",
    "microalbumin": "Microalbumin",
    "creatine": "Creatine",
    "calcium": "Calcium",
    "magnesium": "Magnesium",
    "ammonium-chloride": "Ammonium Chloride",
};

const PHYSICAL_KEYS = new Set<string>(["ph", "specific-gravity"]);
const MICROSCOPIC_KEYS = new Set<string>(["leukocytes", "blood", "microalbumin", "creatine", "calcium", "magnesium", "ammonium-chloride"]);

function parseNumeric(valueLabel: string): number | undefined {
    const cleaned = String(valueLabel || "").replace(/[^\d.\-]/g, "");
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
}

function isNormal(key: string, valueLabel: string, numeric?: number): boolean {
    const rule = NORMALS[key];
    if (!rule) return false;
    if (rule.type === "negative") {
        const v = String(valueLabel || "").toLowerCase();
        return v === "neg" || v === "negative";
    }
    if (rule.type === "exact") {
        if (numeric == null) {
            const n = parseNumeric(valueLabel);
            return n != null && Math.abs(n - (rule.value ?? 0)) < 1e-6;
        }
        return Math.abs(numeric - (rule.value ?? 0)) < 1e-6;
    }
    if (rule.type === "lt") {
        const n = numeric ?? parseNumeric(valueLabel);
        return n != null && n < (rule.value ?? Number.POSITIVE_INFINITY);
    }
    if (rule.type === "gt") {
        const n = numeric ?? parseNumeric(valueLabel);
        return n != null && n > (rule.value ?? Number.NEGATIVE_INFINITY);
    }
    if (rule.type === "range") {
        const n = numeric ?? parseNumeric(valueLabel);
        return n != null && n >= (rule.low ?? Number.NEGATIVE_INFINITY) && n <= (rule.high ?? Number.POSITIVE_INFINITY);
    }
    return false;
}

function classifyTrend(values: number[], key: string, lastLabel: string): TrendType {
    if (values.length < 2) {
        const last = values.length ? values[values.length - 1] : undefined;
        if (last == null) return "normal";
        return isNormal(key, lastLabel, last) ? "normal" : "increasing";
    }
    const prev = values[values.length - 2];
    const last = values[values.length - 1];
    if (last > prev) return "increasing";
    if (last < prev) return "decreasing";
    return isNormal(key, lastLabel, last) ? "normal" : "increasing";
}

function trendColor(trend: TrendType): string {
    return trend === "increasing" ? INCREASING_COLOR : trend === "decreasing" ? DECREASING_COLOR : NORMAL_COLOR;
}

const ParameterRow = ({ param }: { param: ParameterData }) => {
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

    return (
        <div className="flex items-center py-3 border-b border-border/50 last:border-b-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{param.name}</p>
                <p className="text-xs text-muted-foreground">Normal: {param.normal}</p>
            </div>
            <div className="flex items-center gap-3">

                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="24" viewBox="0 0 60 24" fill="none">
                    <g clipPath="url(#clip0_761_5785)">
                        <path d="M0.967529 23.0647L15.4775 15.6841L29.9874 12.7318L44.4974 8.30345L59.0073 0.922852" stroke={param.sparkColor || INCREASING_COLOR} strokeWidth="1.88978" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                        <clipPath id="clip0_761_5785">
                            <rect width="59.9872" height="23.9921" fill="white" />
                        </clipPath>
                    </defs>
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

const ProgressView = ({ patientId }: { patientId?: string }) => {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<ReadingItem[]>([]);
    const [seriesByKey, setSeriesByKey] = useState<Record<string, Array<{ date: Date; value: number; valueLabel: string; unit: string }>>>({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!patientId) return;
            try {
                setLoading(true);
                const res = await fetch(`/api/reading/get_readings?patientId=${encodeURIComponent(patientId)}&page=1&pageSize=200`);
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
    }, [patientId]);

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
            const acc: Record<string, Array<{ date: Date; value: number; valueLabel: string; unit: string }>> = {};
            for (const chunk of chunks) {
                if (!chunk) continue;
                for (const r of chunk.results) {
                    const n = r.numericValue ?? parseNumeric(r.valueLabel);
                    if (n == null) continue;
                    const arr = acc[r.key] || [];
                    arr.push({ date: chunk.date, value: n, valueLabel: r.valueLabel, unit: r.unit });
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
            const series = seriesByKey[key] || [];
            const values = series.map((s) => s.value);
            const last = series[series.length - 1];
            const prev = series.length > 1 ? series[series.length - 2] : undefined;
            const normalLabel = NORMALS[key]?.label ?? "";
            const trend = classifyTrend(values, key, last?.valueLabel || "");
            const changePct = prev && last ? Math.round(((last.value - prev.value) / Math.max(Math.abs(prev.value), 1e-9)) * 100) : 0;
            rows.push({
                name: LABEL_BY_KEY[key] || key,
                normal: normalLabel,
                value: last ? (last.unit ? `${last.valueLabel} ${last.unit}` : last.valueLabel) : "-",
                change: changePct,
                status: trend === "increasing" ? "improving" : trend === "decreasing" ? "alert" : "stable",
                barColor: INCREASING_COLOR,
                barWidth: 70,
                sparkColor: trendColor(trend),
            });
        }
        return rows;
    }, [seriesByKey]);

    const chemicalParams: ParameterData[] = useMemo(() => {
        const rows: ParameterData[] = [];
        for (const key of Object.keys(seriesByKey)) {
            if (PHYSICAL_KEYS.has(key) || MICROSCOPIC_KEYS.has(key)) continue;
            const series = seriesByKey[key] || [];
            const values = series.map((s) => s.value);
            const last = series[series.length - 1];
            const prev = series.length > 1 ? series[series.length - 2] : undefined;
            const normalLabel = NORMALS[key]?.label ?? "";
            const trend = classifyTrend(values, key, last?.valueLabel || "");
            const changePct = prev && last ? Math.round(((last.value - prev.value) / Math.max(Math.abs(prev.value), 1e-9)) * 100) : 0;
            rows.push({
                name: LABEL_BY_KEY[key] || key,
                normal: normalLabel,
                value: last ? (last.unit ? `${last.valueLabel} ${last.unit}` : last.valueLabel) : "-",
                change: changePct,
                status: trend === "increasing" ? "improving" : trend === "decreasing" ? "alert" : "stable",
                barColor: INCREASING_COLOR,
                barWidth: 65,
                sparkColor: trendColor(trend),
            });
        }
        return rows;
    }, [seriesByKey]);

    const microscopicParams: ParameterData[] = useMemo(() => {
        const rows: ParameterData[] = [];
        for (const key of Array.from(MICROSCOPIC_KEYS)) {
            const series = seriesByKey[key] || [];
            const values = series.map((s) => s.value);
            const last = series[series.length - 1];
            const prev = series.length > 1 ? series[series.length - 2] : undefined;
            const normalLabel = NORMALS[key]?.label ?? "";
            const trend = classifyTrend(values, key, last?.valueLabel || "");
            const changePct = prev && last ? Math.round(((last.value - prev.value) / Math.max(Math.abs(prev.value), 1e-9)) * 100) : 0;
            rows.push({
                name: LABEL_BY_KEY[key] || key,
                normal: normalLabel,
                value: last ? (last.unit ? `${last.valueLabel} ${last.unit}` : last.valueLabel) : "-",
                change: changePct,
                status: trend === "increasing" ? "improving" : trend === "decreasing" ? "alert" : "stable",
                barColor: INCREASING_COLOR,
                barWidth: 60,
                sparkColor: trendColor(trend),
            });
        }
        return rows;
    }, [seriesByKey]);

    return (
        <div className="space-y-4 px-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Overall Progress</h2>
                    <p className="text-xs text-muted-foreground">{lastExamDateLabel ? `Last test: ${lastExamDateLabel}` : ""}</p>
                </div>
                {patientId ? (
                    <Link
                        href={`/Veterinarian/home/patientHistory/${encodeURIComponent(patientId)}`}
                        className="flex items-center gap-1 text-sm text-primary font-medium"
                    >
                        <Clock className="w-4 h-4" />
                        View History
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
                    <p className="text-xs ">Normal</p>
                </div>
                <div className="bg-amber-50 rounded-xl h-[65px] flex flex-col justify-center items-start w-full text-amber-500 px-3 text-center">
                    <div className="flex justify-between w-full">
                        <TrendingDown className="w-5 h-5   mb-1" />
                        <p className="text-xl font-bold">{chemicalParams.filter((p) => p.sparkColor === INCREASING_COLOR).length + physicalParams.filter((p) => p.sparkColor === INCREASING_COLOR).length + microscopicParams.filter((p) => p.sparkColor === INCREASING_COLOR).length}</p>
                    </div>
                    <p className="text-xs ">Increasing</p>
                </div>
                <div className="bg-red-50 rounded-xl h-[65px] flex flex-col justify-center items-start w-full text-red-500 px-3 text-center">
                    <div className="flex justify-between w-full">
                        <Clock className="w-5 h-5   mb-1" />
                        <p className="text-xl font-bold">{chemicalParams.filter((p) => p.sparkColor === DECREASING_COLOR).length + physicalParams.filter((p) => p.sparkColor === DECREASING_COLOR).length + microscopicParams.filter((p) => p.sparkColor === DECREASING_COLOR).length}</p>
                    </div>
                    <p className="text-xs ">Decreasing</p>
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-start">Expand & view each parameter type</p>

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
                            <span className="font-semibold text-foreground">Physical Parameters</span>
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
                            <span className="font-semibold text-foreground">Chemical Parameters</span>
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
                            <span className="font-semibold text-foreground">Microscopic Parameters</span>
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
            />
        </div>
    );
};

export default ProgressView;



import { Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

export function ParameterProgress({ dataByParameter = {}, patientId }: { dataByParameter?: Record<string, Array<{ date: Date; value: number; valueLabel: string; unit: string }>>; patientId?: string }) {
    const [viewMode, setViewMode] = useState<ViewMode>("graph");
    const [selectedParameter, setSelectedParameter] = useState<string>("");
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: undefined,
        to: undefined,
    });

    const parameterOptions = useMemo(() => {
        const keys = Object.keys(dataByParameter || {});
        return keys.map((k) => ({ key: k, name: LABEL_BY_KEY[k] || k, normalValue: NORMALS[k]?.label || "" }));
    }, [dataByParameter]);

    useEffect(() => {
        if (!selectedParameter && parameterOptions.length) {
            setSelectedParameter(parameterOptions[0].key);
        }
    }, [parameterOptions, selectedParameter]);

    const currentParam: ParameterProgressData | null = useMemo(() => {
        if (!selectedParameter) return null;
        const raw = (dataByParameter || {})[selectedParameter] || [];
        const filtered = raw.filter((r) => {
            const t = r.date.getTime();
            const okFrom = !dateRange.from || t >= dateRange.from.getTime();
            const okTo = !dateRange.to || t <= dateRange.to.getTime();
            return okFrom && okTo;
        });
        const series = filtered.map((r) => ({
            label: format(r.date, "MMM d"),
            value: r.value,
            valueLabel: r.valueLabel,
        }));
        return {
            name: LABEL_BY_KEY[selectedParameter] || selectedParameter,
            normalValue: NORMALS[selectedParameter]?.label || "",
            data: series,
        };
    }, [selectedParameter, dataByParameter, dateRange.from, dateRange.to]);

    const currentTrendColor = useMemo(() => {
        if (!selectedParameter) return INCREASING_COLOR;
        const raw = (dataByParameter || {})[selectedParameter] || [];
        const vals = raw.map((r) => r.value);
        const lastLabel = raw.length ? raw[raw.length - 1].valueLabel : "";
        return trendColor(classifyTrend(vals, selectedParameter, lastLabel));
    }, [selectedParameter, dataByParameter]);

    const handleExport = () => {
        if (!currentParam) return;
        const rows = [["Date", "Parameter", "ValueLabel", "NumericValue"].join(",")];
        for (const it of currentParam.data) {
            const row = [it.label, currentParam.name, it.valueLabel, String(it.value)];
            rows.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
        }
        const csv = rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentParam.name.replace(/\s+/g, "-").toLowerCase()}-${patientId || "patient"}-progress.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-2xl bg-card rounded-2xl p-4 shadow-sm border border-border">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-base font-semibold text-card-foreground">
                        Parameter Progress
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Track test results over time
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-secondary rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("graph")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "graph"
                            ? "bg-tab-active text-primary"
                            : "text-muted-foreground hover:text-card-foreground"
                            }`}
                    >
                        Graph
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "table"
                            ? "bg-tab-active text-primary"
                            : "text-muted-foreground hover:text-card-foreground"
                            }`}
                    >
                        Table
                    </button>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex gap-3 mb-6 grid grid-cols-5">
                <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                    <SelectTrigger className="text-[12px]! col-span-2 bg-secondary border-0 rounded-lg shadow-none">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-50">
                        {parameterOptions.map((opt) => (
                            <SelectItem key={opt.key} value={opt.key}>{opt.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Popover>
                    <PopoverTrigger className="col-span-3 text-[12px]! shadow-none" asChild>
                        <Button
                            variant="secondary"
                            className="bg-secondary border-0 rounded-lg font-normal"
                        >
                            <span>
                                {dateRange.from && dateRange.to
                                    ? `${format(dateRange.from, "d MMM yyyy")} - ${format(
                                        dateRange.to,
                                        "d MMM yyyy"
                                    )}`
                                    : "Select dates"}
                            </span>
                            <Calendar
                                color='#3F78D8'
                                className="ml-2 h-4 w-4 text-muted-foregroun" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className=" w-auto p-0 bg-popover border border-border shadow-l z-50 me-2" align="start">
                        <CalendarComponent
                            mode="range"
                            selected={{ from: dateRange.from, to: dateRange.to }}
                            onSelect={(range) =>
                                setDateRange({ from: range?.from, to: range?.to })
                            }
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Parameter Info & Export */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-base font-semibold text-card-foreground">
                        {currentParam?.name || ""}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Normal: {currentParam?.normalValue || ""}
                    </p>
                </div>
                <Button onClick={handleExport} variant="outline" className="bg-[#F5F6F6] border-0 shadow-none rounded-full gap-2 ">
                    <Download className="h-4 w-4 text-primary" />
                    Export
                </Button>
            </div>

            {/* Content Area */}
            {viewMode === "graph" ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={(currentParam?.data || []).map((d) => ({ ...d, month: d.label }))}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                domain={["dataMin - 1", "dataMax + 1"]}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={currentTrendColor}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{
                                    r: 5,
                                    fill: currentTrendColor,
                                    stroke: "hsl(var(--card))",
                                    strokeWidth: 2,
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="overflow-hidden">
                    <div className="flex justify-between text-sm text-muted-foreground border-b border-border pb-3 mb-1">
                        <span>Month</span>
                        <span>Value</span>
                    </div>
                    <div className="divide-y divide-border">
                        {(currentParam?.data || []).map((item) => (
                            <div
                                key={item.label}
                                className="flex justify-between py-3 text-card-foreground"
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
}
