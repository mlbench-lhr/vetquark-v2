import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-gray-200", className)} />;
}

export function ListItemSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("animate-pulse rounded-2xl bg-[#F5F6F6] px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        </div>
        <Skeleton className="h-5 w-5 rounded" />
      </div>
    </div>
  );
}

export function BalanceCardSkeleton() {
  return (
    <div className="mx- mt-4 rounded-2xl bg-gradient-to-r from-[#F5F6F6] to-[#EBF2FF] p-5">
      <Skeleton className="h-4 w-32 rounded mb-2" />
      <Skeleton className="h-8 w-48 rounded" />
    </div>
  );
}

export function PaymentCardSkeleton() {
  return (
    <div className="rounded-[16px] bg-[#F5F6F6] px-4 py-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-24 rounded mt-2" />
          <Skeleton className="h-10 w-40 rounded mt-3" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-36 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
        <Skeleton className="h-[44px] w-[44px] rounded-full" />
      </div>
    </div>
  );
}

