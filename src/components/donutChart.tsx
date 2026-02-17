"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BoxProviderWithName } from "./BoxProviderWithName";

export const description = "A donut chart with text";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  "In Progress": {
    label: "In Progress",
    color: "#00ACC0",
  },
  Completed: {
    label: "Completed",
    color: "#5AD2A6",
  },
  "Over Due": {
    label: "Over Due",
    color: "#D5DCD6",
  },
} satisfies ChartConfig;

interface MilestoneOverview {
  inProgress: number;
  completed: number;
  overdue: number;
}

interface Overview {
  milestoneOverview: MilestoneOverview;
}

export function ChartPieDonutText() {
  const [overview, setOverview] = React.useState<Overview>({
    milestoneOverview: {
      inProgress: 10,
      completed: 30,
      overdue: 50,
    },
  });

  const chartData = React.useMemo(() => {
    if (!overview?.milestoneOverview) return [];
    return [
      {
        milestone: "In Progress",
        visitors: Number(overview.milestoneOverview.inProgress) || 0,
        fill: "#00ACC0",
      },
      {
        milestone: "Completed",
        visitors: Number(overview.milestoneOverview.completed) || 0,
        fill: "#5AD2A6",
      },
      {
        milestone: "Over Due",
        visitors: Number(overview.milestoneOverview.overdue) || 0,
        fill: "#D5DCD6",
      },
    ];
  }, [overview]);

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, [chartData]);

  return (
    <BoxProviderWithName
      name="Species Distribution"
      hFull={true}
    >
      <Card className="w-full flex flex-col border-0 p-0 shadow-none items-center justify-center relative">
        <CardHeader className="items-center p-0 w-full">
          {/* <CardTitle className="text-[20px] font-[500]">
            Milestones Overview
          </CardTitle> */}
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[380px] p-0 w-[390px]"
          >
            <PieChart className="relative w-fit h-fit">
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="visitors"
                nameKey="milestone"
                innerRadius={110}
                strokeWidth={70}
                style={{ margin: "0px", padding: "0px" }}
              >
                <defs>
                  <filter
                    id="circleShadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feDropShadow
                      dx="2"
                      dy="2"
                      stdDeviation="30"
                      floodColor="rgba(0,0,0,0.1)"
                    />
                  </filter>
                </defs>

                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const { cx, cy } = viewBox;
                      return (
                        <g>
                          {/* background circle with shadow */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={80} // radius of the circle
                            fill="white"
                            filter="url(#circleShadow)"
                          />
                          {/* text inside */}
                          <text
                            x={cx}
                            y={cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={cx}
                              y={cy as number - 5}
                              className="fill-[#5AD2A6] text-[28px] font-[600]"
                            >
                              {totalVisitors.toLocaleString()}
                            </tspan>
                            <tspan
                              x={cx}
                              y={cy as number + 20}
                              className="fill-muted-foreground text-[11px]"
                            >
                              Milestones Added
                            </tspan>
                          </text>
                        </g>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <div className="flex flex-wrap gap-[20px] justify-center">
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#00ACC0" }}
            />
            In Progress : {Number(overview.milestoneOverview.inProgress)}%
          </div>
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#5AD2A6" }}
            />
            Completed : {Number(overview.milestoneOverview.completed)}%
          </div>
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#D5DCD6" }}
            />
            Over Due : {Number(overview.milestoneOverview.overdue)}%
          </div>
        </div>
      </Card>
    </BoxProviderWithName>
  );
}