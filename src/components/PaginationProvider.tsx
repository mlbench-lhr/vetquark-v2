"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ServerPaginationProviderProps<T> = {
  children: (
    data: T[],
    isLoading: boolean,
    refetch: () => void
  ) => React.ReactNode;
  apiEndpoint: string;
  setState?: (data: T[]) => void;
  queryParams?: Record<string, any>;
  LoadingComponent?: React.ComponentType;
  NoDataComponent?: React.ComponentType;
  itemsPerPage?: number;
  enabled?: boolean;
  setTotalItems?: any;
  refreshData?: number;
  fixedLimit?: boolean;
};

export function ServerPaginationProvider<T = any>({
  children,
  apiEndpoint,
  setState,
  queryParams = {},
  LoadingComponent,
  NoDataComponent,
  itemsPerPage = 10,
  enabled = true,
  setTotalItems,
  refreshData,
  fixedLimit = false,
}: ServerPaginationProviderProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (page: number) => {
      if (!enabled) return;

      try {
        setIsFetching(true);
        setError(null);

        // Build query string
        const params = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
          ...Object.entries(queryParams).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              // Handle arrays (like filters)
              if (Array.isArray(value)) {
                acc[key] = value.join(",");
              } else {
                acc[key] = value.toString();
              }
            }
            return acc;
          }, {} as Record<string, string>),
        });
        console.log("params---", params);

        const response = await fetch(`${apiEndpoint}?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Flexible response structure handling
        // Adjust these based on your API response format
        const responseData = result.data;
        const pagination = result.pagination || result.meta || {};

        const fetchedData = Array.isArray(responseData) ? responseData : [];
        const total = pagination.totalPages;
        const totalCount = pagination.total;
        setData(fetchedData);

        setTotalPages(total);
        if (setTotalItems) {
          setTotalItems(totalCount);
        }

        // Call setState if provided
        if (setState) {
          setState(fetchedData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setData([]);
        setTotalPages(1);
      } finally {
        setIsFetching(false);
        setIsInitialLoading(false);
      }
    },
    [apiEndpoint, queryParams, itemsPerPage, setState, enabled]
  );

  // Fetch data when dependencies change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on query change
  }, [queryParams]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, queryParams, refreshData]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const refetch = useCallback(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  // Show loading component only on initial load
  if (isInitialLoading && LoadingComponent) {
    return <LoadingComponent />;
  }

  // Show no data component if no data after loading
  if (!isInitialLoading && data.length === 0 && NoDataComponent) {
    return <NoDataComponent />;
  }

  return (
    <div className="w-full space-y-4">
      {/* Pass data and loading state to children */}
      {children(data, isFetching, refetch)}

      {/* Pagination */}
      {!fixedLimit &&
        !isInitialLoading &&
        data.length > 0 &&
        totalPages > 1 && (
          <Pagination className="w-full">
            <PaginationContent className="relative w-full flex justify-end items-center">
              <PaginationItem className="">
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  // @ts-ignore
                  disabled={currentPage <= 1}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum =
                  totalPages <= 5
                    ? i + 1
                    : currentPage <= 3
                      ? i + 1
                      : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;

                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === pageNum}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationEllipsis />
              )}

              <PaginationItem className="">
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                  // @ts-ignore
                  disabled={currentPage >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
    </div>
  );
}
