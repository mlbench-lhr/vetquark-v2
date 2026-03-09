"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import { Column, DynamicTable } from "@/components/Table/page";
import { StatusText } from "@/components/StatusText";
import { format } from "date-fns";
import { Briefcase, CreditCard, DollarSign, Pencil, Save, Stethoscope, X } from "lucide-react";
import { StatCard } from "@/components/FinanceCard";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type AdminTransactionRow = {
  id: string;
  transactionId: string;
  date: string | null;
  description: string;
  amount: number;
  currency: string;
  status: string;
};

export default function Dashboard() {
  const [search, setSearch] = useState<string>("");
  const queryParams = useMemo(() => ({ search }), [search]);
  const [stats, setStats] = useState<{ totalGross: number; feesCollected: number; netPayouts: number; avgChargePerTestPerVet: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [feeEditing, setFeeEditing] = useState(false);
  const [feeSaving, setFeeSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState<string>("33.00");
  const [initialFee, setInitialFee] = useState<string>("33.00");

  const LoadingSkeleton = () => (
    <div className="w-full space-y-2 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 md:h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );

  const NoTransactionsFound = () => <NoDataComponent text="No Transactions Found" />;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingStats(true);
        const [sRes, setRes] = await Promise.all([
          fetch("/api/admin/finance/stats", { credentials: "include" }),
          fetch("/api/platform/settings", { credentials: "include" }),
        ]);
        const sJson = await sRes.json().catch(() => null);
        const setJson = await setRes.json().catch(() => null);
        if (!alive) return;
        if (sRes.ok && sJson) {
          setStats({
            totalGross: Number(sJson.totalGross || 0),
            feesCollected: Number(sJson.feesCollected || 0),
            netPayouts: Number(sJson.netPayouts || 0),
            avgChargePerTestPerVet: Number(sJson.avgChargePerTestPerVet || 0),
          });
        }
        if (setRes.ok && setJson) {
          const fee = Number(setJson.platformFee || 33.0);
          const safe = Number.isFinite(fee) && fee >= 0 ? fee : 33.0;
          setPlatformFee(safe.toFixed(2));
          setInitialFee(safe.toFixed(2));
        }
      } finally {
        setLoadingStats(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleSaveFee = async () => {
    const feeNum = Number(platformFee);
    if (!Number.isFinite(feeNum) || feeNum < 0) {
      setPlatformFee(initialFee);
      setFeeEditing(false);
      return;
    }
    try {
      setFeeSaving(true);
      const res = await fetch("/api/platform/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ platformFee: feeNum }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json) {
        const next = Number(json.platformFee || feeNum);
        setPlatformFee(next.toFixed(2));
        setInitialFee(next.toFixed(2));
      } else {
        setPlatformFee(initialFee);
      }
    } finally {
      setFeeSaving(false);
      setFeeEditing(false);
    }
  };

  return (
    <BasicStructureWithName
      name="Finance & Company Settings"
      subHeading="Manage company details, financial configurations, and view transaction history."
      showBackOption={false}

    >

      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
        <StatCard
          icon={DollarSign}
          iconBgColor="#EFF6FF"
          iconColor="#3F78D8"
          title="Total Revenue"
          value={loadingStats ? "—" : `R$ ${Number(stats?.totalGross || 0).toFixed(2)}`}
          trend={{ value: 0, isPositive: true }}
        />

        <StatCard
          icon={CreditCard}
          iconBgColor="#FAF5FF"
          iconColor="#9810FA"
          title="Platform Fees Collected"
          value={loadingStats ? "—" : `R$ ${Number(stats?.feesCollected || 0).toFixed(2)}`}
          trend={{ value: 0, isPositive: true }}
        />

        <StatCard
          icon={Briefcase}
          iconBgColor="#D1FADF"
          iconColor="#2DAA6E"
          title="Net Payouts"
          trend={{
            value: 8.2,
            isPositive: true,
          }}
          value={loadingStats ? "—" : `R$ ${Number(stats?.netPayouts || 0).toFixed(2)}`}
        />

        <StatCard
          icon={Stethoscope}
          iconBgColor="#FFF7ED"
          iconColor="#F97316"
          title="Avg Charge / Test / Vet"
          value={loadingStats ? "—" : `R$ ${Number(stats?.avgChargePerTestPerVet || 0).toFixed(2)}`}
          trend={{ value: 0, isPositive: true }}
        />

      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">


        <BoxProviderWithName
          rightSideComponent={
            feeEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (feeSaving) return;
                    setPlatformFee(initialFee);
                    setFeeEditing(false);
                  }}
                  aria-label="Cancel"
                  className="text-black/60 hover:text-black/80"
                >
                  <X size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleSaveFee}
                  aria-label="Save"
                  className="text-green-600 hover:text-green-700 disabled:opacity-60"
                  disabled={feeSaving}
                >
                  <Save size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setFeeEditing(true)}
                aria-label="Edit"
                className="text-black/60 hover:text-black/80"
              >
                <Pencil size={16} />
              </button>
            )
          }
          name="Platform Fee"
        >
          <div className="border-t flex flex-col w-full justify-start pt-5 items-start gap-1.5">
            <div className="flex w-full justify-between items-center text-sm">
              <span className="font-medium">Commission Rate (R$)</span>
              <span className="text-black/70">Applied to all transactions</span>
            </div>
            <div className="w-full relative h-fit">
              <Input
                disabled={!feeEditing || feeSaving}
                value={platformFee}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                  setPlatformFee(v);
                }}
                className="w-full pe-5"
                inputMode="decimal"
              />
              <span className="absolute text-black/60 right-3 top-1/2 -translate-y-1/2 ">R$</span>
            </div>
          </div>
        </BoxProviderWithName>
      </div>
      <div className="w-full flex flex-col justify-start items-start gap-6">

        <BoxProviderWithName
          rightSideComponent={
            <SearchComponent searchQuery={search} onChangeFunc={setSearch} />
          }
          name="Transaction History">
          <ServerPaginationProvider<AdminTransactionRow>
            apiEndpoint="/api/admin/finance/transactions"
            queryParams={queryParams}
            LoadingComponent={LoadingSkeleton}
            NoDataComponent={NoTransactionsFound}
            itemsPerPage={7}
          >
            {(data, isLoading) => {
              const columns: Column[] = [
                {
                  header: "Transaction ID",
                  accessor: "transactionId",
                  render: (item) => <span>{String(item?.transactionId ?? "")}</span>,
                },
                {
                  header: "Date",
                  accessor: "date",
                  render: (item) => {
                    const raw = item?.date;
                    const d = raw ? new Date(String(raw)) : null;
                    if (!d || Number.isNaN(d.getTime())) return <span>—</span>;
                    return <span>{format(d, "MMM dd, yyyy")}</span>;
                  },
                },
                {
                  header: "Description",
                  accessor: "description",
                  render: (item) => <span>{String(item?.description ?? "")}</span>,
                },
                {
                  header: "Amount",
                  accessor: "amount",
                  render: (item) => {
                    const n = Number(item?.amount);
                    const amount = Number.isFinite(n) ? n : 0;
                    const sign = amount >= 0 ? "+" : "-";
                    const abs = Math.abs(amount);
                    const label = `${sign}R$${abs.toFixed(2)}`;
                    return (
                      <span className={amount >= 0 ? "text-green-600" : "text-gray-900"}>
                        {label}
                      </span>
                    );
                  },
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (item) => <StatusText status={String(item?.status ?? "")} />,
                },
              ];

              return (
                <DynamicTable
                  data={data}
                  columns={columns}
                  itemsPerPage={7}
                  isLoading={isLoading}
                />
              );
            }}
          </ServerPaginationProvider>
        </BoxProviderWithName>
      </div>
    </BasicStructureWithName>
  );
}
