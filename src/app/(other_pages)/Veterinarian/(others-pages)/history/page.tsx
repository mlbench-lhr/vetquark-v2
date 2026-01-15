import React from "react";
import { Bell, Check, Clock, Download, Eye, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[13px] font-normal text-primary">
        <Check className="h-4 w-4" />
        Signed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-[13px] font-normal text-gray-500">
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
      ? "bg-[#EBF2FF] text-white"
      : variant === "success"
        ? "bg-[#F3FFEB] text-[#2E7D32]"
        : "bg-[#F5F6F6] text-gray-800";

  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${className}`}
    >
      {children}
    </button>
  );
}

function ReportCard({ item }: { item: ReportHistoryItem }) {
  return (
    <div className="rounded-[12px] bg-white px-4 py-3 shadow-theme-xs">
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
            <p className="truncate text-[14px] font-medium text-gray-900">
              {item.patientName}
            </p>
            <p className="truncate text-[12px] text-gray-400">
              {item.guardianName}
            </p>
          </div>
        </div>
        <p className="shrink-0 pt-1 text-[12px] font-normal text-gray-400">
          {item.dateLabel}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <StatusPill status={item.status} />
        <div className="flex items-center gap-2">
          <Link href={"/Veterinarian/history/detail/" + 1}>
            <ActionButton variant="neutral" label="View report">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="12" viewBox="0 0 18 12" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M16.8285 5.7125L17.3472 5.4525V5.45L17.3435 5.44625L17.336 5.43125L17.3097 5.38125L17.2097 5.20125C17.0877 4.99076 16.958 4.78479 16.821 4.58375C16.3636 3.91244 15.8379 3.29036 15.2522 2.7275C13.8447 1.3775 11.6785 0 8.70347 0C5.73097 0 3.56347 1.37625 2.15597 2.7275C1.5703 3.29036 1.04457 3.91244 0.587223 4.58375C0.401645 4.85756 0.229767 5.14041 0.0722228 5.43125L0.0647227 5.44625L0.0622228 5.45V5.45125C0.0622228 5.45125 0.0609728 5.4525 0.579723 5.7125L0.0609727 5.45125C0.0208656 5.53228 0 5.62147 0 5.71187C0 5.80228 0.0208656 5.89147 0.0609727 5.9725L0.0597228 5.975L0.0634728 5.97875L0.0709727 5.99375C0.10995 6.07185 0.151642 6.14856 0.195973 6.22375C0.734221 7.13301 1.39266 7.96552 2.15347 8.69875C3.56222 10.0487 5.72847 11.4237 8.70347 11.4237C11.6772 11.4237 13.8447 10.0487 15.2535 8.6975C15.8381 8.13397 16.3633 7.51196 16.821 6.84125C16.9962 6.58319 17.1593 6.31706 17.3097 6.04375L17.336 5.99375L17.3435 5.97875L17.346 5.975V5.97375C17.346 5.97375 17.3472 5.9725 16.8285 5.7125ZM16.8285 5.7125L17.3472 5.97375C17.3873 5.89272 17.4082 5.80353 17.4082 5.71312C17.4082 5.62271 17.3873 5.53353 17.3472 5.4525L16.8285 5.7125ZM8.62847 3.7925C8.11926 3.7925 7.6309 3.99479 7.27083 4.35486C6.91076 4.71492 6.70847 5.20328 6.70847 5.7125C6.70847 6.22172 6.91076 6.71007 7.27083 7.07014C7.6309 7.43021 8.11926 7.6325 8.62847 7.6325C9.13769 7.6325 9.62605 7.43021 9.98612 7.07014C10.3462 6.71007 10.5485 6.22172 10.5485 5.7125C10.5485 5.20328 10.3462 4.71492 9.98612 4.35486C9.62605 3.99479 9.13769 3.7925 8.62847 3.7925ZM5.55097 5.7125C5.55097 4.89563 5.87547 4.11222 6.45308 3.53461C7.0307 2.957 7.81411 2.6325 8.63097 2.6325C9.44784 2.6325 10.2312 2.957 10.8089 3.53461C11.3865 4.11222 11.711 4.89563 11.711 5.7125C11.711 6.52937 11.3865 7.31278 10.8089 7.89039C10.2312 8.468 9.44784 8.7925 8.63097 8.7925C7.81411 8.7925 7.0307 8.468 6.45308 7.89039C5.87547 7.31278 5.55097 6.52937 5.55097 5.7125Z" fill="#2B2B2B" />
              </svg>          </ActionButton>
          </Link>
          <ActionButton variant="primary" label="Download report">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="17" viewBox="0 0 14 17" fill="none">
              <path d="M6.66667 0L6.76417 0.00583331C6.95018 0.0277699 7.12338 0.111733 7.25582 0.244176C7.38827 0.376619 7.47223 0.549819 7.49417 0.735833L7.5 0.833333V4.16667L7.50417 4.29167C7.53399 4.68848 7.7048 5.06152 7.98572 5.34336C8.26664 5.62519 8.63912 5.79722 9.03583 5.82833L9.16667 5.83333H12.5L12.5975 5.83917C12.7835 5.8611 12.9567 5.94507 13.0892 6.07751C13.2216 6.20995 13.3056 6.38315 13.3275 6.56917L13.3333 6.66667V14.1667C13.3334 14.8043 13.0897 15.4179 12.6523 15.8819C12.2148 16.3458 11.6166 16.6251 10.98 16.6625L10.8333 16.6667H2.5C1.86232 16.6667 1.24874 16.4231 0.784783 15.9856C0.320828 15.5481 0.0415771 14.9499 0.00416677 14.3133L3.88371e-09 14.1667V2.5C-3.55181e-05 1.86232 0.243604 1.24874 0.68107 0.784783C1.11854 0.320828 1.71676 0.0415771 2.35333 0.00416676L2.5 0H6.66667ZM6.66667 6.66667C6.44565 6.66667 6.23369 6.75446 6.07741 6.91074C5.92113 7.06702 5.83333 7.27899 5.83333 7.5V10.4875L5.1725 9.8275C5.02901 9.68402 4.83809 9.59783 4.63557 9.58509C4.43305 9.57236 4.23284 9.63396 4.0725 9.75833L3.99417 9.8275C3.83794 9.98377 3.75018 10.1957 3.75018 10.4167C3.75018 10.6376 3.83794 10.8496 3.99417 11.0058L6.0775 13.0892L6.11417 13.1242L6.17083 13.17L6.2625 13.2292L6.3575 13.2742L6.445 13.3033L6.57 13.3283L6.66667 13.3333L6.76417 13.3275L6.86167 13.3108L6.95167 13.2833L7.01917 13.255L7.10083 13.2117L7.1775 13.1583L7.25583 13.0892L9.33917 11.0058C9.49539 10.8496 9.58315 10.6376 9.58315 10.4167C9.58315 10.1957 9.49539 9.98377 9.33917 9.8275L9.26083 9.75833C9.1005 9.63396 8.90029 9.57236 8.69777 9.58509C8.49524 9.59783 8.30433 9.68402 8.16083 9.8275L7.5 10.4867V7.5C7.49997 7.29589 7.42504 7.09889 7.2894 6.94636C7.15377 6.79383 6.96688 6.69638 6.76417 6.6725L6.66667 6.66667ZM9.16583 0.8325L12.5 4.16667H9.16667L9.16583 0.8325Z" fill="#3F78D8" />
            </svg>          </ActionButton>
          <ActionButton variant="success" label="Share report">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10.0003 4.16634V11.2497M12.5003 5.83301L10.0003 3.33301L7.50033 5.83301M4.16699 9.99967V14.1663C4.16699 14.6084 4.34259 15.0323 4.65515 15.3449C4.96771 15.6574 5.39163 15.833 5.83366 15.833H14.167C14.609 15.833 15.0329 15.6574 15.3455 15.3449C15.6581 15.0323 15.8337 14.6084 15.8337 14.1663V9.99967" stroke="#3E9306" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
            </svg>          </ActionButton>
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
    <div className="h-[100dvh] w-full bg-white">
      <div className="mx-auto w-full h-full pb-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="flex items-start justify-between gap- flex-col px-4">
          <h1 className="text-[16px] font-[500] text-[#2B2B2B]">
            Reports History
          </h1>
          <p className=" text-[15px] text-gray-400">
            View and manage your recent reports.
          </p>

        </div>

        <div className="mt-6 space-y-4 p-4 h-full rounded-[16px] bg-[#F5F6F6]">
          {items.map((item) => (
            <ReportCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
