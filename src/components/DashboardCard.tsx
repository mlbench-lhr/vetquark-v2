import * as React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    icon: LucideIcon;
    iconBgColor?: string;
    iconColor?: string;
    title: string;
    value: string | number;
    trend?: {
        value: string | number;
        isPositive?: boolean;
        color?: string;
        bgColor?: string;
    };
    className?: string;
}

export function StatCard({
    icon: Icon,
    iconBgColor = "#B3D4FF",
    iconColor = "#2986FF",
    title,
    value,
    trend,
    className = "",
}: StatCardProps) {
    const trendColor = trend?.color || (trend?.isPositive ? "#039855" : "#D92D20");
    const trendBgColor = trend?.bgColor || (trend?.isPositive ? "#ECFDF3" : "#FEF3F2");
    const isPositive = trend?.isPositive !== false;

    return (
        <div className={`p-4 border flex flex-col justify-start items-start gap-2 rounded-2xl ${className}`}>
            <div
                className="w-8.5 h-8.5 rounded-[9px] flex justify-center items-center"
                style={{ backgroundColor: iconBgColor }}
            >
                <Icon color={iconColor} size={16} />
            </div>

            <h4 className="text-sm text-black/80">{title}</h4>

            <div className="flex justify-between w-full items-center gap-1">
                <h2 className="text-base font-bold md:text-[24px] text-black/80">
                    {typeof value === "number" ? value.toLocaleString() : value}
                </h2>

                {trend && (
                    <div
                        className="flex justify-center items-center gap-1 leading-normal rounded-full px-2 py-1"
                        style={{
                            color: trendColor,
                            backgroundColor: trendBgColor
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="9"
                            viewBox="0 0 10 9"
                            fill="none"
                            className={`transition-transform ${!isPositive ? "rotate-180" : ""}`}
                        >
                            <path
                                d="M4.64361 1.50845C4.92637 1.50845 5.1836 1.65972 5.32878 1.91098L8.20519 6.89017C8.3506 7.14187 8.35083 7.45329 8.2058 7.70523C8.06076 7.95716 7.80358 8.11264 7.51288 8.11264H1.77436C1.48366 8.11264 1.22648 7.95716 1.08144 7.70523C0.936406 7.45329 0.936639 7.14187 1.08205 6.89017L3.95846 1.91098C4.10364 1.65972 4.36087 1.50845 4.64361 1.50845Z"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="text-[10px]">{trend.value}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}