"use client";

import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { PaymentCardSkeleton } from "@/components/ui/skeleton";

type PaymentDetails = {
  id: string;
  petName: string;
  amountLabel: string;
  panelTitle: string;
  kind: string;
  vetName: string;
  vetCrmv: string;
  invoiceDate: string;
  petAvatarUrl: string;
  vetAvatarUrl: string;
};

export default function Page() {
  const router = useRouter();
  const params = useParams<{ payment_id: string }>();
  const paymentId = params?.payment_id;
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const id = String(paymentId || "").trim();
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/payment_links/get/${encodeURIComponent(id)}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          toast.error(typeof data?.error === "string" ? data.error : "Failed to load payment details");
          return;
        }
        const item = data?.item;
        if (!item) return;
        setPayment({
          id: String(item.id),
          petName: String(item.patient?.name || ""),
          amountLabel: String(item.amountLabel || ""),
          panelTitle: String(item.panelTitle || "Master 360"),
          kind: String(item.kind || "reading_payment"),
          vetName: String(item.veterinarian?.name || ""),
          vetCrmv:
            item.veterinarian?.crmv && item.veterinarian?.crmvState
              ? `CRMV-${String(item.veterinarian.crmvState).toUpperCase()} ${String(item.veterinarian.crmv)}`
              : "",
          invoiceDate: typeof item.createdAt === "string" ? new Date(item.createdAt).toLocaleDateString() : "",
          petAvatarUrl: String(item.patient?.photo || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
          vetAvatarUrl: item?.veterinarian?.profileImageUrl || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [paymentId]);

  const safePayment = useMemo(
    () =>
      payment || {
        id: String(paymentId || ""),
        petName: "",
        amountLabel: "",
        panelTitle: "Master 360",
        kind: "reading_payment",
        vetName: "",
        vetCrmv: "",
        invoiceDate: "",
        petAvatarUrl: "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png",
        vetAvatarUrl: "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png",
      },
    [payment, paymentId]
  );

  return (
    <div className="min-h-scree bg-white">
      <div className="flex items-center justify-between ">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-0 w-fit items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 text-[#111827]" />
        </button>
        <h1 className="text-[16px] font-medium leading-[20px] text-[#111827]">
          Payment Details
        </h1>
        <div className="h-0 w-10" />
      </div>

      <div className="pt-5">
        {loading ? (
          <PaymentCardSkeleton />
        ) : null}
        <div className="rounded-[16px] bg-[#F5F6F6] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-[44px] w-[44px] rounded-full bg-[#3F78D8] p-[2px]">
              <Image width={200} height={200}
                src={safePayment.petAvatarUrl}
                alt={safePayment.petName}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-medium leading-[20px] text-[#111827]">
                {safePayment.petName}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[20px] font-semibold leading-[24px] text-[#111827]">
            Link Generated
          </div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            Please proceed to pay to view {safePayment.kind === "upgrade" ? "upgrade" : "urinalysis"} results ({safePayment.panelTitle})
          </div>
        </div>

        <div className="mt-4 rounded-[16px] bg-[#EEF4FF] px-5 py-4">
          <div className="text-[14px] leading-[18px] text-[#6B7280]">
            Amount to be paid
          </div>
          <div className="mt-1 text-[36px] font-semibold leading-[40px] tracking-[-0.02em] text-[#3F78D8]">
            {safePayment.amountLabel}
          </div>
        </div>

        <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#9AA4AF]">
          Generated By
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-[44px] w-[44px] rounded-full bg-[#F5F6F6] p-[2px]">
            <Image
              width={100}
              height={100}
              src={safePayment.vetAvatarUrl}
              alt={safePayment.vetName}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">
              {safePayment.vetName}
            </div>
            <div className="mt-1 text-[13px] leading-[16px] text-[#9AA4AF]">
              {safePayment.vetCrmv}
            </div>
          </div>
        </div>

        <div className="mt-5 h-px w-full bg-[#E5E7EB]" />

        <div className="mt-4 text-[14px] font-medium leading-[18px] text-[#9AA4AF]">
          Invoice Date
        </div>
        <div className="mt-2 text-[16px] font-semibold leading-[20px] text-[#111827]">
          {safePayment.invoiceDate}
        </div>
      </div>

      <div className="mt-10 px-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <button
          type="button"
          onClick={() => router.push(`/Guardian/payment/${encodeURIComponent(String(paymentId || safePayment.id))}/card`)}
          className="mt-4 h-[52px] w-full rounded-full bg-[#111827] text-[15px] font-medium text-white"
        >
          Pay with Card
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 h-[52px] w-full rounded-full bg-[#F5F6F6] text-[15px] font-medium text-[#9AA4AF]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
