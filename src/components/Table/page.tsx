"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { TableSkeleton } from "./Loader";
import { Database, Sprout, Users } from "lucide-react";

// Column Definition Interface
export interface Column {
  header: string;
  accessor: string;
  type?: "text" | "image" | "userProfile";
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  imageAccessor?: string;
  nameAccessor?: string;
  subtitleAccessor?: string;
  imageSize?: { width: number; height: number };
  imageClassName?: string;
  alt?: string;
  render?: (item: any) => React.ReactNode;
  subtitleRender?: Element;
}

// Server Pagination Interface
interface ServerPagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Props Interface
interface DynamicTableProps {
  data: any[];
  columns: Column[];
  itemsPerPage?: number;
  showPagination?: boolean;
  caption?: string;
  onRowClick?: (item: any) => void;
  className?: string;
  rowClassName?: string;
  isLoading?: boolean;
  showImage?: boolean;
  serverPagination?: ServerPagination; // New prop for server-side pagination
  type?: "Users" | "Opportunities" | "Blogs" | "Data" | "Field";
}
const Icons = {
  Users: <Users color="#D8E6DD" size={40} />,
  Opportunities: <Sprout color="#D8E6DD" size={40} />,
  Field: <Database color="#D8E6DD" size={40} />,
  Blogs: (
    <Image
      src={"/blogs imgs/blogPlaceholder.png"}
      alt=""
      width={317}
      height={257}
    />
  ),
  Data: null,
};
export function DynamicTable({
  data = [],
  columns = [],
  itemsPerPage = 7,
  showPagination = true,
  caption,
  onRowClick,
  className = "",
  rowClassName = "",
  isLoading = false,
  showImage = false,
  serverPagination, // New prop
  type = "Data",
}: DynamicTableProps) {
  // Internal state for client-side pagination (fallback)
  const [internalPage, setInternalPage] = useState(1);

  // Determine if using server-side or client-side pagination
  const isServerPagination = !!serverPagination;
  const currentPage = isServerPagination
    ? serverPagination.currentPage
    : internalPage;
  const totalPages = isServerPagination
    ? serverPagination.totalPages
    : Math.ceil(data?.length / itemsPerPage);

  // For client-side pagination, slice the data. For server-side, use data as-is
  const start = (internalPage - 1) * itemsPerPage;
  const currentData = isServerPagination
    ? data
    : data.slice(start, start + itemsPerPage);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (isServerPagination) {
      serverPagination.onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // if (isLoading) {
  //   return <TableSkeleton columns={4} />;
  // }
  console.log("currentData---", currentData);

  if (currentData?.length < 1) {
    return (
      <div className="mx-auto w-full flex justify-center items-center flex-col pt-6 gap-y-2 text-sm md:text-[24px] text-[#7B849A]">
        {Icons[type]}
        No {type} Added Yet!!
      </div>
    );
  }

  return (
    <div className={`space-y-2 md:space-y-4 w-full  ${className}`}>
      <Table className="border-separate md:border-spacing-y-0 w-[800px] md:w-full">
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column, i) => (
              <TableHead
                key={i}
                className={"text-sm md:text-lg font-[500]"}
                style={{ width: column.width }}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((item, i) => (
            <TableRow
              key={i}
              className={`border-none rounded-[35px] border-b-2 custom-table-row h-fit md:h-[65px] text-xs md:text-[14px] font-[400] ${rowClassName} ${onRowClick ? "hover:bg-transparent" : ""
                }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column, j) => (
                <TableCell
                  key={j}
                  className={`${j === 0 ? "ps-3.5" : ""} ${column.cellClassName || ""
                    }`}
                >
                  <RenderCellContent
                    item={item}
                    column={column}
                    showImage={showImage}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showPagination && totalPages > 1 && (
        <Pagination className="w-full">
          <PaginationContent className="relative w-full flex justify-center items-center">
            <PaginationItem className="absolute left-1 sm:left-8">
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
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

            <PaginationItem className="absolute right-1 sm:right-5">
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages)
                    handlePageChange(currentPage + 1);
                }}
                disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

// ==================== USAGE EXAMPLES ====================

// Example 2: Simple Product Table
export function ProductTable() {
  const products = [
    {
      id: 1,
      name: "Product A",
      price: "$99",
      stock: 45,
      category: "Electronics",
    },
    {
      id: 2,
      name: "Product B",
      price: "$149",
      stock: 23,
      category: "Clothing",
    },
    { id: 3, name: "Product C", price: "$79", stock: 67, category: "Books" },
  ];

  const columns: Column[] = [
    { header: "ID", accessor: "id", width: "80px" },
    { header: "Product Name", accessor: "name" },
    { header: "Price", accessor: "price" },
    { header: "Stock", accessor: "stock" },
    { header: "Category", accessor: "category" },
  ];

  return <DynamicTable data={products} columns={columns} itemsPerPage={5} />;
}

// Example 3: Orders Table with Custom Status Rendering
export function OrdersTable() {
  const orders = Array.from({ length: 15 }, (_, i) => ({
    orderId: `ORD-${1000 + i}`,
    customer: `Customer ${i + 1}`,
    amount: `$${(Math.random() * 500 + 50).toFixed(2)}`,
    status: ["pending", "Shipped", "Delivered"][Math.floor(Math.random() * 3)],
    date: "2024-10-07",
  }));

  const columns: Column[] = [
    { header: "Order ID", accessor: "orderId" },
    { header: "Customer", accessor: "customer" },
    { header: "Amount", accessor: "amount" },
    {
      header: "Status",
      accessor: "status",
      render: (item) => (
        <span
          className={`px-3 py-1 rounded-full text-sm ${item.status === "Delivered"
            ? "bg-green-100 text-green-700"
            : item.status === "Shipped"
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-700"
            }`}
        >
          {item.status}
        </span>
      ),
    },
    { header: "Date", accessor: "date" },
  ];

  return <DynamicTable data={orders} columns={columns} />;
}
const RenderCellContent = ({
  item,
  column,
  showImage,
}: {
  item: any;
  column: Column;
  showImage: boolean;
}) => {
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);
  // If column has a custom render function, use it
  if (column.render) {
    return column.render(item);
  }

  // Get the value using accessor (can be nested like "user.name")
  const value = column.accessor
    .split(".")
    .reduce((obj, key) => obj?.[key], item);

  // Handle image type
  if (column.type === "image") {
    return value ? (
      <Image
        width={column.imageSize?.width || 44}
        height={column.imageSize?.height || 44}
        alt={column.alt || ""}
        src={value}
        className={column.imageClassName || "rounded-full h-[44px] w-[44px]"}
      />
    ) : null;
  }

  // Handle user profile type (image + name)
  if (column.type === "userProfile") {
    const imageValue = column.imageAccessor
      ? column.imageAccessor
        .split(".")
        .reduce((obj, key) => obj?.[key], item) ||
      "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
      : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";
    const nameValue = column.nameAccessor
      ? column.nameAccessor.split(".").reduce((obj, key) => obj?.[key], item)
      : value;
    const subtitleValue = column.subtitleAccessor
      ? column.subtitleAccessor
        .split(".")
        .reduce((obj, key) => obj?.[key], item)
      : null;

    return (
      <div className="flex justify-start items-center gap-[10px] h-[44px] p-0 w-full">
        {showImage && (
          <Image
            width={44}
            height={44}
            alt=""
            src={fallbackImage || imageValue}
            className="rounded-full h-[30px] md:h-[44px] w-[30px] md:w-[44px]"
            onError={() => {
              setFallbackImage(
                "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
              );
            }}
          />
        )}
        <div className="flex flex-col justify-start items-start w-full truncate">
          {nameValue && (
            <span className="text-sm md:text-[16px] lg:text-[18px] font-semibold w-full truncate">
              {nameValue}
            </span>
          )}
          {subtitleValue && (
            <span className="w-full truncate">
              #{subtitleValue?.replace(/\D/g, "")?.slice(-5)}
            </span>
          )}
          {column?.subtitleRender}
        </div>
      </div>
    );
  }

  // Default: return the value as-is
  return value;
};
