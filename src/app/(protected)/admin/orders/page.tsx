"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import { Column, DynamicTable } from "@/components/Table/page";
import { StatusText } from "@/components/StatusText";
import { Copy } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

type AdminOrderRow = {
  id: string;
  orderId: string;
  veterinarian: string;
  products: string;
  amount: number;
  payment: string;
  status: string;
  date: string | null;
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

  const NoOrdersFound = () => <NoDataComponent text="No Orders Yet" />;

  return (
    <BasicStructureWithName
      name="Orders & Deliveries"
      subHeading="Track and manage product orders, shipments, and logistics."
      showBackOption={false}

    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
        <SearchComponent searchQuery={search} onChangeFunc={setSearch} />

        <BoxProviderWithName >
          <ServerPaginationProvider<AdminOrderRow>
            apiEndpoint="/api/admin/orders"
            queryParams={queryParams}
            LoadingComponent={LoadingSkeleton}
            NoDataComponent={NoOrdersFound}
            itemsPerPage={7}
          >
            {(data, isLoading) => {
              const columns: Column[] = [
                {
                  header: "Order ID",
                  accessor: "orderId",
                  render: (item) => <span>{String(item?.orderId ?? "")}</span>,
                },
                {
                  header: "Veterinarian",
                  accessor: "veterinarian",
                  render: (item) => <span>{String(item?.veterinarian ?? "—")}</span>,
                },
                {
                  header: "Products",
                  accessor: "products",
                  render: (item) => <span>{String(item?.products ?? "—")}</span>,
                },
                {
                  header: "Amount",
                  accessor: "amount",
                  render: (item) => {
                    const n = Number(item?.amount);
                    const safe = Number.isFinite(n) ? n : 0;
                    return <span>${safe.toFixed(2)}</span>;
                  },
                },
                {
                  header: "Payment",
                  accessor: "payment",
                  render: (item) => <span className="capitalize">{String(item?.payment ?? "—")}</span>,
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (item) => <StatusText status={String(item?.status ?? "")} />,
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
                  header: "Actions",
                  accessor: "id",
                  render: (item) => {
                    const id = String(item?.id ?? "");
                    return (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!id) return;
                          try {
                            await navigator.clipboard.writeText(id);
                            toast.success("Copied order id");
                          } catch {
                            toast.error("Failed to copy");
                          }
                        }}
                        aria-label="Copy order id"
                        title="Copy order id"
                      >
                        <Copy size={16} />
                      </button>
                    );
                  },
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
