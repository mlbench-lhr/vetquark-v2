import { TrendingUp, TrendingDown, Clock, ChevronDown } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface ParameterData {
    name: string;
    normal: string;
    value: string | number;
    change?: number;
    status: "improving" | "declining" | "alert" | "stable";
    barColor: string;
    barWidth: number;
}

const ParameterRow = ({ param }: { param: ParameterData }) => {
    const getChangeColor = () => {
        if (!param.change) return "text-muted-foreground";
        if (param.status === "improving") return "text-emerald-500";
        if (param.status === "declining") return "text-amber-500";
        if (param.status === "alert") return "text-red-500";
        return "text-muted-foreground";
    };

    const getChangeIcon = () => {
        if (!param.change) return null;
        if (param.change > 0) return <TrendingUp className="w-3 h-3" />;
        if (param.change < 0) return <TrendingDown className="w-3 h-3" />;
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
                        <path d="M0.967529 23.0647L15.4775 15.6841L29.9874 12.7318L44.4974 8.30345L59.0073 0.922852" stroke="#F59E0B" strokeWidth="1.88978" strokeLinecap="round" strokeLinejoin="round" />
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
    const physicalParams: ParameterData[] = [
        { name: "Specific Gravity", normal: "1.015-1.030", value: "1.000", change: 1, status: "improving", barColor: "#f59e0b", barWidth: 70 },
        { name: "pH", normal: "5.5-7.0", value: "8.5", change: -2, status: "declining", barColor: "#f59e0b", barWidth: 85 },
    ];

    const chemicalParams: ParameterData[] = [
        { name: "Protein", normal: "0-15", value: "≥10.0", change: 11, status: "improving", barColor: "#22c55e", barWidth: 65 },
        { name: "Glucose", normal: "0", value: "Neg", change: 0, status: "stable", barColor: "#f59e0b", barWidth: 50 },
        { name: "Ketone Bodies", normal: "Negative", value: "16", change: 0, status: "stable", barColor: "#f59e0b", barWidth: 45 },
        { name: "Bilirubin", normal: "Negative", value: "Neg", change: 0, status: "stable", barColor: "#f59e0b", barWidth: 40 },
        { name: "Urobilinogen", normal: "0-1", value: "16", change: 11, status: "improving", barColor: "#22c55e", barWidth: 75 },
        { name: "Nitrite", normal: "Negative", value: "-", change: 0, status: "stable", barColor: "#94a3b8", barWidth: 20 },
        { name: "Ascorbic Acid", normal: "0", value: "0", change: 0, status: "stable", barColor: "#94a3b8", barWidth: 10 },
    ];

    const microscopicParams: ParameterData[] = [
        { name: "Leukocytes", normal: "Negative", value: "15", change: -33, status: "alert", barColor: "#ef4444", barWidth: 60 },
        { name: "Blood", normal: "Negative", value: "200", change: 14, status: "improving", barColor: "#22c55e", barWidth: 90 },
        { name: "Microalbumin", normal: "< 0.03", value: "0", change: 5, status: "improving", barColor: "#22c55e", barWidth: 30 },
        { name: "Creatine", normal: "0.9-26.5", value: "0.9", change: 0, status: "stable", barColor: "#f59e0b", barWidth: 45 },
        { name: "Calcium", normal: "0-2.5", value: "0", change: -5, status: "declining", barColor: "#f59e0b", barWidth: 25 },
        { name: "Magnesium", normal: "0-1.5", value: "0", change: 2, status: "improving", barColor: "#22c55e", barWidth: 20 },
        { name: "Ammonium Chloride", normal: "0", value: "0", change: 0, status: "stable", barColor: "#94a3b8", barWidth: 15 },
    ];

    return (
        <div className="space-y-4 px-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Overall Progress</h2>
                    <p className="text-xs text-muted-foreground">Last test: May 20, 2024</p>
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
                        <p className="text-xl font-bold">9</p>
                    </div>
                    <p className="text-xs ">Improving</p>
                </div>
                <div className="bg-amber-50 rounded-xl h-[65px] flex flex-col justify-center items-start w-full text-amber-500 px-3 text-center">
                    <div className="flex justify-between w-full">
                        <TrendingDown className="w-5 h-5   mb-1" />
                        <p className="text-xl font-bold">9</p>
                    </div>
                    <p className="text-xs ">Improving</p>
                </div>
                <div className="bg-red-50 rounded-xl h-[65px] flex flex-col justify-center items-start w-full text-red-500 px-3 text-center">
                    <div className="flex justify-between w-full">
                        <Clock className="w-5 h-5   mb-1" />
                        <p className="text-xl font-bold">9</p>
                    </div>
                    <p className="text-xs ">Improving</p>
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
            <ParameterProgress />
        </div>
    );
};

export default ProgressView;



import { useState } from "react";
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
import { format } from "date-fns";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import Link from "next/link";

type ViewMode = "graph" | "table";

interface ParameterProgressData {
    name: string;
    normalValue: string;
    data: { month: string; value: number }[];
}

const parameters: Record<string, ParameterProgressData> = {
    color: {
        name: "Color",
        normalValue: "Pale Yellow",
        data: [
            { month: "January", value: 10 },
            { month: "February", value: 10 },
            { month: "March", value: 10 },
            { month: "April", value: 10 },
            { month: "May", value: 10 },
        ],
    },
    protein: {
        name: "Protein",
        normalValue: "6",
        data: [
            { month: "January", value: 1 },
            { month: "February", value: 7.5 },
            { month: "March", value: 3 },
            { month: "April", value: 8.5 },
            { month: "May", value: 5 },
        ],
    },
    glucose: {
        name: "Glucose",
        normalValue: "100",
        data: [
            { month: "January", value: 95 },
            { month: "February", value: 102 },
            { month: "March", value: 98 },
            { month: "April", value: 105 },
            { month: "May", value: 99 },
        ],
    },
};

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

export function ParameterProgress() {
    const [viewMode, setViewMode] = useState<ViewMode>("graph");
    const [selectedParameter, setSelectedParameter] = useState("protein");
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: new Date(2024, 0, 15),
        to: new Date(2024, 4, 20),
    });

    const currentParam = parameters[selectedParameter];

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
                        <SelectItem value="color">Color</SelectItem>
                        <SelectItem value="protein">Protein</SelectItem>
                        <SelectItem value="glucose">Glucose</SelectItem>
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
                        {currentParam.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Normal: {currentParam.normalValue}
                    </p>
                </div>
                <Button variant="outline" className="bg-[#F5F6F6] border-0 shadow-none rounded-full gap-2 ">
                    <Download className="h-4 w-4 text-primary" />
                    Export
                </Button>
            </div>

            {/* Content Area */}
            {viewMode === "graph" ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={currentParam.data}
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
                                stroke="hsl(var(--chart-line))"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{
                                    r: 5,
                                    fill: "hsl(var(--chart-line))",
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
                        {currentParam.data.map((item) => (
                            <div
                                key={item.month}
                                className="flex justify-between py-3 text-card-foreground"
                            >
                                <span>{item.month}</span>
                                <span className="font-medium">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
