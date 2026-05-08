"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface MonthlySalesChartProps {
  links: number[];
}

export default function MonthlySalesChart({ links }: MonthlySalesChartProps) {
  const getLast12Months = (): string[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result: string[] = [];

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 11); // Go 11 months back from current

    for (let i = 0; i < 12; i++) {
      result.push(months[currentDate.getMonth()]);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return result;
  };
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (links) {
      setLoading(false);
    }
  }, [links]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Neulis Neue, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: getLast12Months(), // ← Dynamic months here
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Neulis Neue",
    },
    yaxis: { title: { text: undefined } },
    grid: {
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `${val}` },
    },
  };

  const series = [
    {
      name: "Links",
      data: links,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5  sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-raleway text-lg font-semibold text-gray-800 ">
          Total Generated Links
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {loading ? (
            <div className="h-[200px] w-full rounded-2xl bg-gray-100 animate-pulse" />
          ) : (
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height={180}
            />
          )}
        </div>
      </div>
    </div>
  );
}
