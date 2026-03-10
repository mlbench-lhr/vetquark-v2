"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import type { Column } from "@/components/Table/page";
import { DynamicTable } from "@/components/Table/page";
import { Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { downloadUrinalysisPdf, openUrinalysisPdf } from "@/utils/urinalysisPdf";

type AdminRecordRow = {
  id: string;
  petName: string;
  veterinarianName: string;
  veterinarianEmail: string;
  guardianName: string;
  guardianEmail: string;
  productCode: string;
  signedAt: string | null;
  createdAt: string | null;
  paymentStatus: string | null;
};

function normalizePanelCode(productCode?: string | null) {
  const code = (productCode || "").trim() || "VETQ_MASTER_360";
  return code;
}

async function fetchAdminReadingDetail(readingId: string) {
  const res = await fetch(`/api/admin/readings/detail/${encodeURIComponent(readingId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof (json as any)?.error === "string" ? (json as any).error : "Failed to load record";
    throw new Error(msg);
  }
  return (json as any)?.reading ?? null;
}

export default function RecordsPage() {
  const [search, setSearch] = useState("");
  const [actionReadingId, setActionReadingId] = useState<string | null>(null);
  const [panelTitleByCode, setPanelTitleByCode] = useState<Map<string, string>>(new Map());

  const queryParams = useMemo(() => ({ search }), [search]);

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

  const panelTitleForCode = useCallback(
    (productCode?: string | null) => {
      const code = normalizePanelCode(productCode);
      return panelTitleByCode.get(code) || code;
    },
    [panelTitleByCode]
  );

  const LoadingSkeleton = () => (
    <div className="w-full space-y-2 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 md:h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );

  const NoRecordsFound = () => <NoDataComponent text="No Records Yet" />;

  const handleViewPdf = useCallback(
    async (readingId: string) => {
      try {
        setActionReadingId(readingId);
        const reading = await fetchAdminReadingDetail(readingId);
        await openUrinalysisPdf({ readingId, reading });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to open PDF");
      } finally {
        setActionReadingId(null);
      }
    },
    []
  );

  const handleDownloadPdf = useCallback(
    async (readingId: string) => {
      try {
        setActionReadingId(readingId);
        const reading = await fetchAdminReadingDetail(readingId);
        await downloadUrinalysisPdf({ readingId, reading });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to download PDF");
      } finally {
        setActionReadingId(null);
      }
    },
    []
  );

  return (
    <BasicStructureWithName
      name="Records"
      subHeading="All completed and signed test results."
      showBackOption={false}
    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
        <SearchComponent searchQuery={search} onChangeFunc={setSearch} />

        <BoxProviderWithName>
          <ServerPaginationProvider<AdminRecordRow>
            apiEndpoint="/api/admin/readings"
            queryParams={queryParams}
            LoadingComponent={LoadingSkeleton}
            NoDataComponent={NoRecordsFound}
            itemsPerPage={10}
          >
            {(data, isLoading) => {
              const columns: Column[] = [
                {
                  header: "Pet",
                  accessor: "petName",
                  render: (item) => <span>{String(item?.petName ?? "—")}</span>,
                },
                {
                  header: "Pet Owner",
                  accessor: "guardianName",
                  render: (item) => (
                    <div className="min-w-0">
                      <div className="truncate">{String(item?.guardianName ?? "—")}</div>
                      <div className="truncate text-[12px] text-gray-500">{String(item?.guardianEmail ?? "")}</div>
                    </div>
                  ),
                },
                {
                  header: "Veterinarian",
                  accessor: "veterinarianName",
                  render: (item) => (
                    <div className="min-w-0">
                      <div className="truncate">{String(item?.veterinarianName ?? "—")}</div>
                      <div className="truncate text-[12px] text-gray-500">{String(item?.veterinarianEmail ?? "")}</div>
                    </div>
                  ),
                },
                {
                  header: "Panel",
                  accessor: "productCode",
                  render: (item) => <span>{panelTitleForCode(String(item?.productCode ?? ""))}</span>,
                },
                {
                  header: "Signed",
                  accessor: "signedAt",
                  render: (item) => {
                    const raw = item?.signedAt;
                    const d = raw ? new Date(String(raw)) : null;
                    if (!d || Number.isNaN(d.getTime())) return <span>—</span>;
                    return <span>{format(d, "MMM dd, yyyy")}</span>;
                  },
                },
                {
                  header: "Payment",
                  accessor: "paymentStatus",
                  render: (item) => <span>{String(item?.paymentStatus ?? "—")}</span>,
                },
                {
                  header: "Actions",
                  accessor: "id",
                  render: (item) => {
                    const id = String(item?.id ?? "");
                    const disabled = !id || actionReadingId === id;
                    return (
                      <div className="flex justify-start items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100"
                          disabled={disabled}
                          onClick={() => handleViewPdf(id)}
                          aria-label="View PDF"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100"
                          disabled={disabled}
                          onClick={() => handleDownloadPdf(id)}
                          aria-label="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    );
                  },
                },
              ];

              return <DynamicTable data={data} columns={columns} itemsPerPage={10} isLoading={isLoading} />;
            }}
          </ServerPaginationProvider>
        </BoxProviderWithName>
      </div>
    </BasicStructureWithName>
  );
}
