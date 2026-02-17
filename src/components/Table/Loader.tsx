import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columns: number; // Number of columns
  rows?: number; // Number of rows to show (default: 5)
  className?: string;
  showPagination?: boolean;
}

export function TableSkeleton({
  columns,
  rows = 7,
  className = "",
  showPagination = true,
}: TableSkeletonProps) {
  return (
    <div className={`space-y-4 w-full ${className}`}>
      <Table className="border-separate border-spacing-y-3">
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-[80%]" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow
              key={rowIndex}
              className="border-none bg-[#F8FAF6] rounded-[35px] border-b-2 custom-table-row h-[75px]"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={colIndex === 0 ? "ps-3.5" : ""}
                >
                  <Skeleton
                    className={`h-4 ${
                      colIndex === 0
                        ? "w-[90%]"
                        : colIndex === columns - 1
                        ? "w-[60%]"
                        : "w-[70%]"
                    }`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="w-full flex justify-center items-center py-4">
          <div className="relative w-full flex justify-center items-center">
            <div className="absolute left-1 sm:left-8">
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>

            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-9 rounded-md" />
              ))}
            </div>

            <div className="absolute right-5">
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Usage Example:
// <TableSkeleton columns={5} rows={5} showPagination={true} />
