"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import { Column, DynamicTable } from "@/components/Table/page";
import { StatusText } from "@/components/StatusText";
import { format } from "date-fns";
import { useMemo, useState } from "react";

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
      <div className="w-full flex flex-col justify-start items-start gap-6">
        <SearchComponent searchQuery={search} onChangeFunc={setSearch} />

        <BoxProviderWithName >
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
