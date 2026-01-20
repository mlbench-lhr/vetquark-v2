"use client";

import { ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatus = "completed" | "pending";

type PaymentHistoryItem = {
  id: string;
  petName: string;
  reportName: string;
  amountLabel: string;
  status: PaymentStatus;
  vetName: string;
  vetCrmv: string;
  date: string;
  petAvatarUrl: string;
  vetAvatarUrl: string;
};

const ITEMS: PaymentHistoryItem[] = [
  {
    id: "1",
    petName: "Wolfy",
    reportName: "Urinalysis Report",
    amountLabel: "R$ 5,00",
    status: "completed",
    vetName: "Dr. Vet",
    vetCrmv: "CRMV-SP 12345",
    date: "15/02/2026",
    petAvatarUrl:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=faces",
    vetAvatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "2",
    petName: "Wolfy",
    reportName: "Urinalysis Report",
    amountLabel: "R$ 5,00",
    status: "completed",
    vetName: "Dr. Vet",
    vetCrmv: "CRMV-SP 12345",
    date: "15/02/2026",
    petAvatarUrl:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=faces",
    vetAvatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces",
  },
];

type FilterTab = "all" | "completed" | "pending";

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[36px] rounded-full px-6 text-[13px] font-medium transition-colors ${
        active ? "bg-[#3F78D8] text-white" : "bg-[#F5F6F6] text-[#9AA4AF]"
      }`}
    >
      {label}
    </button>
  );
}

function StatusLabel({ status }: { status: PaymentStatus }) {
  if (status === "completed") {
    return (
      <span className="text-[12px] font-medium leading-[14px] text-[#16A34A]">
        Completed
      </span>
    );
  }

  return (
    <span className="text-[12px] font-medium leading-[14px] text-[#9AA4AF]">
      Pending
    </span>
  );
}

export default function Page() {
  const router = useRouter();
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return ITEMS;
    if (tab === "completed") return ITEMS.filter((i) => i.status === "completed");
    return ITEMS.filter((i) => i.status === "pending");
  }, [tab]);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 text-[#111827]" />
        </button>
        <h1 className="text-[16px] font-medium leading-[20px] text-[#111827]">
          Payment History
        </h1>
        <div className="h-10 w-10" />
      </div>

      <div className="px-4 pt-3">
        <div className="flex gap-3">
          <FilterPill label="All" active={tab === "all"} onClick={() => setTab("all")} />
          <FilterPill
            label="Completed"
            active={tab === "completed"}
            onClick={() => setTab("completed")}
          />
          <FilterPill
            label="Pending"
            active={tab === "pending"}
            onClick={() => setTab("pending")}
          />
        </div>

        <div className="mt-4 space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-[18px] bg-[#F5F6F6] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-[44px] w-[44px] rounded-full bg-[#3F78D8] p-[2px]">
                    <img
                      src={item.petAvatarUrl}
                      alt={item.petName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium leading-[18px] text-[#111827]">
                      {item.petName}
                    </div>
                    <div className="mt-1 text-[12px] leading-[14px] text-[#9AA4AF]">
                      {item.reportName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[16px] font-semibold leading-[18px] text-[#3F78D8]">
                    {item.amountLabel}
                  </div>
                  <div className="mt-1">
                    <StatusLabel status={item.status} />
                  </div>
                </div>
              </div>

              <div className="mt-4 h-px w-full bg-[#E5E7EB]" />

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-[40px] w-[40px] rounded-full bg-white p-[2px]">
                    <img
                      src={item.vetAvatarUrl}
                      alt={item.vetName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold leading-[16px] text-[#111827]">
                      {item.vetName}
                    </div>
                    <div className="mt-1 text-[12px] leading-[14px] text-[#9AA4AF]">
                      {item.vetCrmv}
                    </div>
                  </div>
                </div>

                <div className="text-[12px] leading-[14px] text-[#9AA4AF]">
                  {item.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

