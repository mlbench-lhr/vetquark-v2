import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import DoughnutLoginChart from "@/components/ecommerce/DoughnutLoginChart";
import TotalGuestsChart from "@/components/ecommerce/TotalGuestsChart";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Index from "@/components/ecommerce/index";


export default async function Ecommerce() {
  const cookieStore = await cookies(); // use await
  const sessionId = cookieStore.get("session_id")?.value;

  // if (!sessionId) {
  //   redirect("/signin"); 
  // }
  return (
    // <div className="grid grid-cols-12 gap-4 md:gap-6 xl:gap-8">
    //   <div className="col-span-12 space-y-6 xl:col-span-7">
    //     <EcommerceMetrics />
    //     <MonthlySalesChart />
    //   </div>

    //   {/* Set col-span-12 to make it match the width of TotalGuestsChart */}
    //   <div className="col-span-12 xl:col-span-5">
    //     <DoughnutLoginChart />
    //   </div>

    //   {/* Adjusted to col-span-12 to avoid extra whitespace */}
    //   <div className="col-span-12">
    //     <TotalGuestsChart />
    //   </div>
    // </div>
    // <Index sessionId={sessionId}/>
    <div>helo</div>
  );
}
