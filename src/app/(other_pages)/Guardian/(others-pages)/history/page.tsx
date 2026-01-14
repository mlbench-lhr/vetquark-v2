import React from "react";
import { Bell, Check, Clock, Download, Eye, Upload } from "lucide-react";

type ReportStatus = "signed" | "pending";

type ReportHistoryItem = {
  id: string;
  patientName: string;
  guardianName: string;
  dateLabel: string;
  status: ReportStatus;
  avatarSrc: string;
};

function StatusPill({ status }: { status: ReportStatus }) {
  if (status === "signed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-primary">
        <Check className="h-4 w-4" />
        Signed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-[13px] font-medium text-gray-500">
      <Clock className="h-4 w-4" />
      Pending
    </span>
  );
}

function ActionButton({
  variant,
  label,
  children,
}: {
  variant: "neutral" | "primary" | "success";
  label: string;
  children: React.ReactNode;
}) {
  const className =
    variant === "primary"
      ? "bg-primary text-white"
      : variant === "success"
        ? "bg-[#EAF9D6] text-[#2E7D32]"
        : "bg-gray-100 text-gray-800";

  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${className}`}
    >
      {children}
    </button>
  );
}

function ReportCard({ item }: { item: ReportHistoryItem }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-theme-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
            <img
              src={item.avatarSrc}
              alt={item.patientName}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold text-gray-900">
              {item.patientName}
            </p>
            <p className="truncate text-[13px] text-gray-400">
              {item.guardianName}
            </p>
          </div>
        </div>
        <p className="shrink-0 pt-1 text-[13px] font-medium text-gray-400">
          {item.dateLabel}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <StatusPill status={item.status} />
        <div className="flex items-center gap-2">
          <ActionButton variant="neutral" label="View report">
            <Eye className="h-5 w-5" />
          </ActionButton>
          <ActionButton variant="primary" label="Download report">
            <Download className="h-5 w-5" />
          </ActionButton>
          <ActionButton variant="success" label="Share report">
            <Upload className="h-5 w-5" />
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const items: ReportHistoryItem[] = [
    {
      id: "1",
      patientName: "Cashew",
      guardianName: "Gabriel Bulhoes",
      dateLabel: "22/05/2024",
      status: "signed",
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "2",
      patientName: "Cashew",
      guardianName: "Gabriel Bulhoes",
      dateLabel: "22/05/2024",
      status: "pending",
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "3",
      patientName: "Cashew",
      guardianName: "Gabriel Bulhoes",
      dateLabel: "22/05/2024",
      status: "signed",
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "4",
      patientName: "Cashew",
      guardianName: "Gabriel Bulhoes",
      dateLabel: "22/05/2024",
      status: "signed",
      avatarSrc: "/images/product/product-01.jpg",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F4F6FB]">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900">
              Reports History
            </h1>
            <p className="mt-1 text-[15px] text-gray-400">
              View and manage your recent reports.
            </p>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-theme-xs"
          >
            <Bell className="h-5 w-5 text-gray-900" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <ReportCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
