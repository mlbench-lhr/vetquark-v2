"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { BoxProviderWithName } from "./BoxProviderWithName";

export const description = "An area chart with gradient fill";

const chartConfig = {
  amount: {
    label: "Exams",
    color: "#3F78D8",
  },
} satisfies ChartConfig;
export interface RevenueChartItem {
  month: string;
  amount: number;
}
export interface RevenueSummaryResponse {
  totalRevenue: number;
  percentageChange: number;
  incremented: boolean;
  chartData: RevenueChartItem[];
}

export function ChartAreaGradient({
  className = " flex-1 ",
}: {
  className?: string;
}) {
  const [data, setData] = useState<RevenueSummaryResponse>({
    totalRevenue: 0,
    percentageChange: 0,
    incremented: true,
    chartData: [
      { month: "January", amount: 0 },
      { month: "February", amount: 0 },
      { month: "March", amount: 0 },
      { month: "April", amount: 0 },
      { month: "May", amount: 0 },
      { month: "June", amount: 0 },
      { month: "July", amount: 0 },
      { month: "August", amount: 0 },
      { month: "September", amount: 0 },
      { month: "October", amount: 0 },
      { month: "November", amount: 0 },
      { month: "December", amount: 0 },
    ],
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard/exams-over-time", { credentials: "include" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (!res.ok) return;
        if (!json || typeof json !== "object") return;
        setData(json as RevenueSummaryResponse);
      } catch { }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return (
    <BoxProviderWithName
      className={className}
      name="Exams Over Time"
      hFull={true}
    >
      <div className="h-[calc(100%-25px)] flex flex-col justify-center items-start relative w-full overflow-hidden">
        <div className="w-full p-0 h-full m-0 border-0 px-0 shadow-none ">
          <div className="w-full px-0 h-full ">
            <ChartContainer
              config={chartConfig}
              className="!px-0 !p-0 w-full h-full"
            >
              <AreaChart
                accessibilityLayer
                data={data.chartData}
                className="!p-0 w-full h-full"
                margin={{ left: 0, right: 20, top: 20, bottom: 30 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={0}
                  tickFormatter={(value) => value.slice(0, 3)}
                  className=""
                />
                <YAxis
                  className=""
                  tickLine={false}
                  axisLine={false}
                  tickMargin={20}
                  tickCount={5}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <defs className="">
                  <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-amount)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-amount)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-mobile)"
                      stopOpacity={0.8}
                    />
                  </linearGradient>
                </defs>
                <Area
                  className=""
                  dataKey="amount"
                  type="natural"
                  fill="url(#fillDesktop)"
                  fillOpacity={0.4}
                  stroke="var(--color-amount)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </BoxProviderWithName>
  );
}
