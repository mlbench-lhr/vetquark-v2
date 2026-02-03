import React from "react";
import { cn } from "@/lib/utils";

export function FallbackText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-[14px] leading-[18px] text-[#9AA4AF]", className)}>
      {children}
    </div>
  );
}

