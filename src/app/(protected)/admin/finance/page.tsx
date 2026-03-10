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
  type: "credit" | "withdrawal";
  veterinarianName: string;
  kind: "reading_payment" | "upgrade";
  productCode: string | null;
  amountGross: number;
  platformFee: number;
  amountNet: number;
  currency: string;
  status: string;
};

function normalizePanelCode(productCode?: string | null) {
  const code = (productCode || "").trim() || "VETQ_MASTER_360";
  return code;
}

export default function Dashboard() {
  const [search, setSearch] = useState<string>("");
  const queryParams = useMemo(() => ({ search }), [search]);
  const [stats, setStats] = useState<{
    totalGross: number;
    feesCollected: number;
    netPayouts: number;
    avgChargePerTestPerVet: number;
    grossSplit?: {
      exams?: { gross?: number; count?: number };
      upgrades?: { gross?: number; count?: number };
    };
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [feeEditing, setFeeEditing] = useState(false);
  const [feeSaving, setFeeSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState<string>("33.00");
  const [initialFee, setInitialFee] = useState<string>("33.00");
  const [panelTitleByCode, setPanelTitleByCode] = useState<Map<string, string>>(new Map());

  const LoadingSkeleton = () => (
    <div className="w-full space-y-2 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 md:h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );

  const NoTransactionsFound = () => <NoDataComponent text="No Transactions Found" />;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/panels", { method: "GET" });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : [];
        const map = new Map<string, string>();
        for (const p of raw) {
          const code = normalizePanelCode(String(p?.code || ""));
          if (!code) continue;
          const title = String(p?.title || "").trim();
          map.set(code, title || code);
        }
        setPanelTitleByCode(map);
      } catch {
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
            grossSplit: sJson.grossSplit ?? undefined,
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
        {(() => {
          const examsGross = Number(stats?.grossSplit?.exams?.gross || 0);
          const examsCount = Number(stats?.grossSplit?.exams?.count || 0);
          const upgradesGross = Number(stats?.grossSplit?.upgrades?.gross || 0);
          const upgradesCount = Number(stats?.grossSplit?.upgrades?.count || 0);
          const hasSplit = examsGross > 0 || upgradesGross > 0 || examsCount > 0 || upgradesCount > 0;
          return (
        <StatCard
          icon={DollarSign}
          iconBgColor="#EFF6FF"
          iconColor="#3F78D8"
          title="Total Revenue"
          value={loadingStats ? "—" : `R$ ${Number(stats?.totalGross || 0).toFixed(2)}`}
          breakdown={
            loadingStats || !hasSplit
              ? undefined
              : [
                {
                  label: `Exams${examsCount ? ` (${examsCount})` : ""}`,
                  value: `R$ ${examsGross.toFixed(2)}`,
                  tone: "neutral",
                },
                {
                  label: `Panel upgrades${upgradesCount ? ` (${upgradesCount})` : ""}`,
                  value: `R$ ${upgradesGross.toFixed(2)}`,
                  tone: "blue",
                },
              ]
          }
          trend={{ value: 0, isPositive: true }}
        />
          );
        })()}

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
                  header: "Details",
                  accessor: "description",
                  render: (item) => {
                    const type = item?.type === "withdrawal" ? "withdrawal" : "credit";
                    const kind = item?.kind === "upgrade" ? "upgrade" : "reading_payment";
                    const code = normalizePanelCode(item?.productCode);
                    const panelTitle = panelTitleByCode.get(code) || code;
                    const tag =
                      type === "withdrawal"
                        ? { label: "Withdrawal", cls: "border-gray-200 bg-gray-50 text-gray-700" }
                        : kind === "upgrade"
                          ? { label: "Upgrade", cls: "border-blue-200 bg-blue-50 text-blue-800" }
                          : { label: "Exam", cls: "border-purple-200 bg-purple-50 text-purple-800" };

                    return (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] leading-[16px]", tag.cls].join(" ")}>
                            {tag.label}
                          </span>
                          <span className="truncate font-medium text-gray-900">
                            {type === "withdrawal" ? String(item?.description ?? "Platform payout") : panelTitle}
                          </span>
                        </div>
                        <div className="truncate text-[12px] text-gray-500">
                          {type === "withdrawal" ? String(item?.veterinarianName ?? "—") : `Vet: ${String(item?.veterinarianName ?? "—")}`}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  header: "Amounts",
                  accessor: "amountGross",
                  render: (item) => {
                    const type = item?.type === "withdrawal" ? "withdrawal" : "credit";
                    const gross = Number.isFinite(Number(item?.amountGross)) ? Number(item.amountGross) : 0;
                    const fee = Number.isFinite(Number(item?.platformFee)) ? Number(item.platformFee) : 0;
                    const net = Number.isFinite(Number(item?.amountNet)) ? Number(item.amountNet) : 0;
                    if (type === "withdrawal") {
                      return (
                        <div className="text-[12px] leading-[18px]">
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-500">Payout</span>
                            <span className="font-medium text-gray-900">-R$ {Math.abs(net).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="text-[12px] leading-[18px]">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Price</span>
                          <span className="font-medium text-gray-900">R$ {gross.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Commission</span>
                          <span className="font-medium text-green-700">R$ {fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-500">Net to vet</span>
                          <span className="font-medium text-gray-900">R$ {net.toFixed(2)}</span>
                        </div>
                      </div>
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
