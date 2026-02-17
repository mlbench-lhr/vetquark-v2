"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import axios from "axios";
import { useMediaQuery } from "react-responsive";
import { BoxProviderWithName } from "./BoxProviderWithName";

export const description = "An area chart with gradient fill";

const chartConfig = {
  amount: {
    label: "Bookings",
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
  const isMobile = useMediaQuery({ maxWidth: 1350 });
  const [data, setData] = useState<RevenueSummaryResponse>({
    totalRevenue: 120000,
    percentageChange: 10.2,
    incremented: true,
    chartData: [
      { month: "January", amount: 186 },
      { month: "February", amount: 305 },
      { month: "March", amount: 237 },
      { month: "April", amount: 73 },
      { month: "May", amount: 509 },
      { month: "June", amount: 214 },
      { month: "July", amount: 186 },
      { month: "August", amount: 305 },
      { month: "September", amount: 237 },
      { month: "October", amount: 73 },
      { month: "November", amount: 209 },
      { month: "December", amount: 214 },
    ],
  });

  useEffect(() => {
    const getData = async () => {
      let response = await axios.get("/api/vendor/dashboardGraph");
      setData(response.data);
    };
    getData();
  }, []);
  return (
    <BoxProviderWithName
      className={className}
      name="Total Revenue"
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
                margin={{ left: 0, right: 0 }}
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
                  tickFormatter={(value) =>
                    "$" + value
                  }
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
