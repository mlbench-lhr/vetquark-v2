"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import { Column, DynamicTable } from "@/components/Table/page";
import { StatusText } from "@/components/StatusText";
import { format } from "date-fns";
import { Briefcase, CreditCard, DollarSign, Pencil, Stethoscope, Users } from "lucide-react";
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

  const LoadingSkeleton = () => (
    <div className="w-full space-y-2 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 md:h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );

  const NoTransactionsFound = () => <NoDataComponent text="No Transactions Yet" />;

  return (
    <BasicStructureWithName
      name="Finance & Company Settings"
      subHeading="Manage company details, financial configurations, and view transaction history."
      showBackOption={false}

    >

      <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
        <StatCard
          icon={DollarSign}
          iconBgColor="#EFF6FF"
          iconColor="#3F78D8"
          title="Total Revenue"
          value={"$1,245,231.89"}
          trend={{ value: 0, isPositive: true }}
        />

        <StatCard
          icon={CreditCard}
          iconBgColor="#FAF5FF"
          iconColor="#9810FA"
          title="Platform Fees Collected"
          value={"$186,784.00"}
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
          value={"$186,784.00"}
        />

      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">


        <BoxProviderWithName
          rightSideComponent={
            <Pencil size={15} className="text-black/60" />
          }
          name="Platform Fee"
        >
          <div className="border-t flex flex-col w-full justify-start pt-5 items-start gap-1.5">
            <div className="flex w-full justify-between items-center text-sm">
              <span className="font-medium">Commission Rate (%)</span>
              <span className="text-black/70">Applied to all transactions</span>
            </div>
            <div className="w-full relative h-fit">
              <Input disabled value={15.0} className="w-full pe-5" />
              <span className="absolute text-black/60 right-3 top-1/2 -translate-y-1/2 ">%</span>
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
