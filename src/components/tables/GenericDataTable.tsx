"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";

// Reusable column definition
export interface Column<T> {
  header: string | React.ReactNode;
  accessor: keyof T | string;
  cell?: (row: T) => React.ReactNode;
}

interface GenericDataTableProps<T> {
  title?: string;
  tabs: string[];
  custom_tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  data: T[]; // Make sure each item includes a `tab` field if using tab filtering
  columns: Column<T>[];
  pageSize?: number;
  customTabFilter?: (item: T, tab: string) => boolean;
  emptyStateImages?: { [title: string]: string };
  currentPage: number
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean,
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  querykey?: string
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
}

function GenericDataTable<T extends { id: string; tab?: string }>({
  title,
  tabs,
  custom_tabs,
  activeTab,
  onTabChange,
  customTabFilter,
  data,
  columns,
  emptyStateImages,
  pageSize = 10,
  currentPage,
  setCurrentPage,
  loading,
  setLoading,
  querykey,
  search,
  setSearch
}: GenericDataTableProps<T>) {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tabFilteredData = useMemo(() => {
    if (!activeTab || !customTabFilter) return data;
    return data.filter((item) => customTabFilter(item, activeTab));
  }, [data, activeTab, customTabFilter]);

  const goToPage = (page: number) => {
    if (querykey) {
      if (setLoading) {
        setLoading(true);
      }
      const params = new URLSearchParams(searchParams);
      // setCurrentPage(page)
      params.set(querykey, String(page)); // update dynamic key
      router.push(`?${params.toString()}`);
    }
  };
  
  const isEmpty = tabFilteredData.length === 0;

  // 🔸 Derive fallback key if title is missing
  const fallbackTitle = !title && emptyStateImages
    ? Object.keys(emptyStateImages)[0]
    : undefined;

  // 🔹 Use title or fallback title
  const effectiveTitle = title || fallbackTitle;

  // 🔹 Get image path from effective title
  const emptyImage = effectiveTitle ? emptyStateImages?.[effectiveTitle] : null;

  // 🔹 Derive label from image path
  let entityLabel = "data";
  if (emptyImage) {
    const fileName = emptyImage.split("/").pop(); // e.g. "no-users.png"
    const baseName = fileName?.split(".")[0];     // e.g. "no-users"
    entityLabel = baseName?.split("-").pop() || "data"; // e.g. "users"
  }

  // 📄 Paginate the filtered data
  const totalPages = tabs.length;
  const currentData = tabFilteredData;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <div
        className={`flex items-center justify-between flex-wrap gap-4 ${custom_tabs?.length ? "mb-4" : "mb-6"
          }`}
      >
        {/* Title*/}
        <div className={`flex ${tabs?.length ? "flex-col gap-2" : "items-center gap-4"}`}>
          {title && (
            <h1 className="text-2xl font-weight-600 text-gray-800  font-raleway">
              {title}
            </h1>
          )}
          {custom_tabs && custom_tabs.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 p-2  rounded-lg shadow-sm">
              {custom_tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange?.(tab)}
                  className={`px-3 py-1 rounded-md text-sm border ${tab === activeTab
                    ? "bg-[var(--accent)] text-white"
                    : "text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // setCurrentPage(1);
            }}
          />
          <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="overflow-x-auto border-t border-gray-200">
            <div className="px-4 py-3">
              <div className="h-4 w-40 rounded bg-gray-200" />
            </div>
            <div className="space-y-2 px-4 pb-4">
              {Array.from({ length: Math.min(6, pageSize) }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="grid gap-3 rounded-lg bg-gray-50 px-3 py-3"
                  style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: Math.max(columns.length, 1) }).map((__, colIdx) => (
                    <div key={colIdx} className="h-4 w-full rounded bg-gray-200" />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="h-9 w-24 rounded bg-gray-200" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-8 rounded bg-gray-200" />
              ))}
            </div>
            <div className="h-9 w-24 rounded bg-gray-200" />
          </div>
        </div>
      ) : !loading && isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20">
          {emptyImage && (
            <img src={emptyImage} alt="No data" className="w-52 h-52 mb-4 object-contain" />
          )}
          <p className="text-lg text-gray-600 font-medium">
            {entityLabel?.toLowerCase()} added yet!!
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left font-raleway text-[var(--secondary)] border-b">
                  {columns.map((col, i) => (
                    <th key={i} className="py-2 px-4 font-medium text-center">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    {columns.map((col, i) => (
                      <td key={i} className="py-3 px-4 font-raleway text-center">
                        {col.cell ? col.cell(row) : (row as any)[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
            >
              ← Previous
            </button>
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => goToPage(Number(tab))}
                  className={`w-8 h-8 rounded-md text-sm ${currentPage === Number(tab)
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </>
      )}

    </div>
  );
}

export default GenericDataTable;
