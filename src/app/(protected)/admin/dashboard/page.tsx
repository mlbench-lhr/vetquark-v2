"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { StatCard } from "@/components/DashboardCard";
import { ChartPieDonutText } from "@/components/donutChart";
import { ChartAreaGradient } from "@/components/Graph";
import { Briefcase, DollarSign, Stethoscope, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DashboardSummary = {
  totals: {
    veterinarians: number;
    guardians: number;
    patients: number;
    revenue: { amount: number; currency: string };
  };
  trends: {
    veterinarians: { value: number; isPositive: boolean };
    guardians: { value: number; isPositive: boolean };
    patients: { value: number; isPositive: boolean };
    revenue: { value: number; isPositive: boolean };
  };
};

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard/summary", { credentials: "include" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (!res.ok) return;
        if (!json || typeof json !== "object") return;
        setSummary(json as DashboardSummary);
      } catch { }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const revenueLabel = useMemo(() => {
    const amount = summary?.totals?.revenue?.amount;
    const currency = summary?.totals?.revenue?.currency;
    const amountNumber = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
    const currencyCode = typeof currency === "string" && currency ? currency : "USD";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
      }).format(amountNumber);
    } catch {
      return `$${amountNumber.toLocaleString()}`;
    }
  }, [summary]);

  return (
    <BasicStructureWithName
      name="Overview"
      subHeading="Welcome back, here's what's happening with your veterinary platform today."
      showBackOption={false}

    >

      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Stethoscope}
          iconBgColor="#B3D4FF"
          iconColor="#2986FF"
          title="Total Veterinarians"
          value={summary?.totals?.veterinarians ?? 0}
          trend={summary?.trends?.veterinarians ?? { value: 0, isPositive: true }}
        />

        <StatCard
          icon={Users}
          iconBgColor="#FFF4E5"
          iconColor="#FFA500"
          title="Total Guardians"
          value={summary?.totals?.guardians ?? 0}
          trend={summary?.trends?.guardians ?? { value: 0, isPositive: true }}
        />

        <StatCard
          icon={Briefcase}
          iconBgColor="#D1FADF"
          iconColor="#2DAA6E"
          title="Total Patients"
          trend={{
            value: summary?.trends?.patients?.value ?? 0,
            isPositive: summary?.trends?.patients?.isPositive ?? true,
          }}
          value={summary?.totals?.patients ?? 0}
        />

        <StatCard
          icon={DollarSign}
          iconBgColor="#F2F4F7"
          iconColor="#555B61"
          title="Revenue"
          value={revenueLabel}
          trend={{
            value: summary?.trends?.revenue?.value ?? 0,
            isPositive: summary?.trends?.revenue?.isPositive ?? true,
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
    </BasicStructureWithName>
  );
}
