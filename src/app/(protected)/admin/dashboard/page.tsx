"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { StatCard } from "@/components/DashboardCard";
import { ChartPieDonutText } from "@/components/donutChart";
import { ChartAreaGradient } from "@/components/Graph";
import { Briefcase, DollarSign, Stethoscope, Users } from "lucide-react";


export default function Dashboard() {
  return (
    <BasicStructureWithName
      name="Overview"
      subHeading="Welcome back, here's what's happening with your veterinary platform today."
      showBackOption={false}

    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Stethoscope}
            iconBgColor="#B3D4FF"
            iconColor="#2986FF"
            title="Total Veterinarians"
            value={1200}
            trend={{ value: 10, isPositive: true }}
          />

          <StatCard
            icon={Users}
            iconBgColor="#FFF4E5"
            iconColor="#FFA500"
            title="Total Guardians"
            value="2,450"
            trend={{ value: 5, isPositive: false }}
          />

          <StatCard
            icon={Briefcase}
            iconBgColor="#D1FADF"
            iconColor="#2DAA6E"
            title="Total Patients"
            trend={{
              value: 15,
              isPositive: true,
            }}
            value={45}
          />

          <StatCard
            icon={DollarSign}
            iconBgColor="#F2F4F7"
            iconColor="#555B61"
            title="Revenue"
            value="$12,500"
            trend={{
              value: 15,
              isPositive: true,
            }}
            className="hover:shadow-lg transition-shadow"
          />
        </div>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="w-full lg:col-span-2">
            <ChartAreaGradient />
          </div>
          <ChartPieDonutText />
        </div>
      </div>
    </BasicStructureWithName>
  );
}
