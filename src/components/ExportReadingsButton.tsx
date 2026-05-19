"use client";

import { useState, useRef, useCallback } from "react";
import { FileSpreadsheet, Download, Loader2, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

function jsonToCsv(rows: Record<string, any>[], headers: { key: string; label: string }[]) {
  const escape = (val: unknown) => {
    const s = String(val ?? "").replace(/"/g, '""');
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s}"`;
    }
    return s;
  };

  const headerLine = headers.map((h) => escape(h.label)).join(",");
  const lines = rows.map((row) =>
    headers.map((h) => escape(row[h.key])).join(",")
  );
  return [headerLine, ...lines].join("\n");
}

function downloadBlob(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type ExportFormat = "csv" | "xlsx";

interface ExportReadingsButtonProps {
  tab: "completed" | "incomplete";
  search: string;
}

export default function ExportReadingsButton({ tab, search }: ExportReadingsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setDropdownOpen(false);
      if (isExporting) return;
      setIsExporting(true);

      try {
        const params = new URLSearchParams({ tab });
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/readings/export?${params.toString()}`);
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = typeof json?.error === "string" ? json.error : "Failed to fetch records";
          throw new Error(msg);
        }

        const rows: Record<string, any>[] = Array.isArray(json?.data) ? json.data : [];
        if (rows.length === 0) {
          toast.info("No records to export");
          return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

        const headers = [
          { key: "id", label: "ID" },
          { key: "petName", label: "Pet Name" },
          { key: "species", label: "Species" },
          { key: "breed", label: "Breed" },
          { key: "guardianName", label: "Guardian Name" },
          { key: "guardianEmail", label: "Guardian Email" },
          { key: "guardianPhone", label: "Guardian Phone" },
          { key: "veterinarianName", label: "Veterinarian Name" },
          { key: "veterinarianEmail", label: "Veterinarian Email" },
          { key: "crmv", label: "CRMV" },
          { key: "crmvState", label: "CRMV State" },
          { key: "productCode", label: "Panel" },
          { key: "unlockedProductCodes", label: "Unlocked Panels" },
          { key: "signedAt", label: "Signed At" },
          { key: "createdAt", label: "Created At" },
          { key: "paymentStatus", label: "Payment Status" },
          { key: "wizardStep", label: "Wizard Step" },
          { key: "isDraft", label: "Is Draft" },
        ];

        if (format === "csv") {
          const csv = jsonToCsv(rows, headers);
          downloadBlob(csv, `readings-${tab}-${timestamp}.csv`, "text/csv;charset=utf-8;");
          toast.success(`${rows.length} records exported as CSV`);
        } else {
          let xlsxModule: any;
          try {
            xlsxModule = await import("xlsx");
          } catch {
            toast.error("XLSX library not available. Falling back to CSV.");
            const csv = jsonToCsv(rows, headers);
            downloadBlob(csv, `readings-${tab}-${timestamp}.csv`, "text/csv;charset=utf-8;");
            return;
          }

          const XLSX = xlsxModule;
          const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers.map((h) => h.key) });

          const wscols = headers.map(() => ({ wch: 20 }));
          worksheet["!cols"] = wscols;

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Readings");
          const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
          downloadBlob(xlsxBuffer, `readings-${tab}-${timestamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          toast.success(`${rows.length} records exported as XLSX`);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Export failed");
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, tab, search]
  );

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
        Export
        <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download size={14} />
              Export as CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport("xlsx")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download size={14} />
              Export as XLSX
            </button>
          </div>
        </>
      )}
    </div>
  );
}
