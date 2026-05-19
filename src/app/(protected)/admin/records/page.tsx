"use client";

import { BasicStructureWithName } from "@/components/BasicStructureWithName";
import { BoxProviderWithName } from "@/components/BoxProviderWithName";
import { NoDataComponent } from "@/components/NoDataComponent";
import { ServerPaginationProvider } from "@/components/PaginationProvider";
import { SearchComponent } from "@/components/SearchComponent";
import type { Column } from "@/components/Table/page";
import { DynamicTable } from "@/components/Table/page";
import { Download, Eye, Images } from "lucide-react";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { downloadUrinalysisPdf, openUrinalysisPdf } from "@/utils/urinalysisPdf";
import { ImagesModal } from "@/components/ImagesModal";
import ExportReadingsButton from "@/components/ExportReadingsButton";

type RecordsTab = "completed" | "incomplete";

type AdminRecordRow = {
  id: string;
  petName: string;
  veterinarianName: string;
  veterinarianEmail: string;
  guardianName: string;
  guardianEmail: string;
  productCode: string;
  unlockedProductCodes?: string[];
  signedAt: string | null;
  createdAt: string | null;
  paymentStatus: string | null;
  wizardStep?: string | null;
  isDraft?: boolean;
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
  const [activeTab, setActiveTab] = useState<RecordsTab>("completed");
  const [actionReadingId, setActionReadingId] = useState<string | null>(null);
  const [panelTitleByCode, setPanelTitleByCode] = useState<Map<string, string>>(new Map());
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [selectedReadingId, setSelectedReadingId] = useState<string>("");
  const [selectedPetName, setSelectedPetName] = useState<string>("");

  const queryParams = useMemo(() => ({ search, tab: activeTab }), [search, activeTab]);

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

  const panelBadgesForRecord = useCallback(
    (item: any) => {
      const baseCode = normalizePanelCode(typeof item?.productCode === "string" ? item.productCode : "");
      const unlocked = Array.isArray(item?.unlockedProductCodes) ? item.unlockedProductCodes : [];
      const codes = [baseCode, ...unlocked.map((c: any) => normalizePanelCode(String(c || "")))].filter(Boolean);
      const uniqueCodes = [...new Set(codes)];
      return uniqueCodes.map((code) => ({
        code,
        title: panelTitleByCode.get(code) || code,
        isBase: code === baseCode,
      }));
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

  const handleViewImages = useCallback((readingId: string, petName: string) => {
    setSelectedReadingId(readingId);
    setSelectedPetName(petName);
    setImagesModalOpen(true);
  }, []);

  const STEP_LABELS: Record<string, string> = {
    identification: "Identification",
    timer: "Timer",
    review: "Review",
    report: "Report",
  };

  const sharedColumns: Column[] = [
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
      render: (item) => {
        const badges = panelBadgesForRecord(item);
        if (!badges.length) return <span>—</span>;
        return (
          <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
            {badges.map((b) => (
              <span
                key={b.code}
                title={b.code}
                className={[
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] leading-[16px] truncate max-w-[240px]",
                  b.isBase
                    ? "border-gray-200 bg-gray-50 text-gray-800"
                    : "border-blue-200 bg-blue-50 text-blue-800",
                ].join(" ")}
              >
                {b.title}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  const completedColumns: Column[] = [
    ...sharedColumns,
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
        const petName = String(item?.petName ?? "Unknown");
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
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-blue-700 hover:bg-blue-100"
              disabled={disabled}
              onClick={() => handleViewImages(id, petName)}
              aria-label="View Images"
            >
              <Images size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  const incompleteColumns: Column[] = [
    ...sharedColumns,
    {
      header: "Started",
      accessor: "createdAt",
      render: (item) => {
        const raw = item?.createdAt;
        const d = raw ? new Date(String(raw)) : null;
        if (!d || Number.isNaN(d.getTime())) return <span>—</span>;
        return <span>{format(d, "MMM dd, yyyy")}</span>;
      },
    },
    {
      header: "Step Reached",
      accessor: "wizardStep",
      render: (item) => {
        const step = String(item?.wizardStep ?? "");
        return (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[12px] text-amber-800">
            {STEP_LABELS[step] ?? "—"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessor: "id",
      render: (item) => {
        const id = String(item?.id ?? "");
        const petName = String(item?.petName ?? "Unknown");
        const disabled = !id || actionReadingId === id;
        return (
          <div className="flex justify-start items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-blue-700 hover:bg-blue-100"
              disabled={disabled}
              onClick={() => handleViewImages(id, petName)}
              aria-label="View Images"
            >
              <Images size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <BasicStructureWithName
      name="Records"
      subHeading={activeTab === "completed" ? "All completed and signed test results." : "Tests that were started but not completed."}
      showBackOption={false}
    >
      <div className="w-full flex flex-col justify-start items-start gap-6">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => { setActiveTab("completed"); setSearch(""); }}
            className={[
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "completed"
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("incomplete"); setSearch(""); }}
            className={[
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "incomplete"
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            Incomplete
          </button>
        </div>

        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex-1">
            <SearchComponent searchQuery={search} onChangeFunc={setSearch} />
          </div>
          <ExportReadingsButton tab={activeTab} search={search} />
        </div>

        <BoxProviderWithName>
          <ServerPaginationProvider<AdminRecordRow>
            key={activeTab}
            apiEndpoint="/api/admin/readings"
            queryParams={queryParams}
            LoadingComponent={LoadingSkeleton}
            NoDataComponent={NoRecordsFound}
            itemsPerPage={10}
          >
            {(data, isLoading) => (
              <DynamicTable
                data={data}
                columns={activeTab === "completed" ? completedColumns : incompleteColumns}
                itemsPerPage={10}
                isLoading={isLoading}
              />
            )}
          </ServerPaginationProvider>
        </BoxProviderWithName>
      </div>

      <ImagesModal
        isOpen={imagesModalOpen}
        onClose={() => setImagesModalOpen(false)}
        readingId={selectedReadingId}
        petName={selectedPetName}
      />
    </BasicStructureWithName>
  );
}
