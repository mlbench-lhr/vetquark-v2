"use client";
import { ChevronLeft, Copy } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export default function Page() {
  const router = useRouter();

  const params = useParams<{ payment_id: string }>();
  const paymentId = String(params?.payment_id || "").trim();
  const [amountLabel, setAmountLabel] = useState("R$ 0,00");
  const [paying, setPaying] = useState(false);
  const [pixCode] = useState<string>("");
  const [qrUrl] = useState<string>("");
  const [boletoUrl] = useState<string>("");
  const [boletoBarcode] = useState<string>("");
  const [payingBoleto] = useState(false);

  const title = useMemo(() => "Payment", []);

  useEffect(() => {
    let mounted = true;
    if (!paymentId) return;
    (async () => {
      try {
        console.log("PixPage fetch link", { paymentId });
        const res = await fetch(`/api/payment_links/get/${encodeURIComponent(paymentId)}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) return;
        const nextAmountLabel = typeof data?.item?.amountLabel === "string" ? data.item.amountLabel : "";
        if (nextAmountLabel) setAmountLabel(nextAmountLabel);
        const status = String(data?.item?.status || "").trim();
        if (status && status !== "pending") {
          toast.error(status === "paid" ? "This link is already paid" : "This payment link has expired");
          router.replace("/Guardian/payment/history");
          return;
        }
      } catch {
        console.error("PixPage fetch link error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [paymentId]);

  return (
    <div className="min-h-scree bg-white">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-0 w-fit items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 text-[#111827]" />
        </button>
        <h1 className="text-[16px] font-medium leading-[20px] text-[#111827]">{title}</h1>
        <div className="h-0 w-10" />
      </div>

      <div className="pt-5">
        <div className="text-[20px] font-semibold leading-[24px] text-[#111827]">
          Link Generated
        </div>
        <div className="mt-2 max-w-[320px] text-[14px] leading-[18px] text-[#9AA4AF]">
          PIX and boleto are temporarily unavailable. Please pay with card.
        </div>

        <div className="mt-4 rounded-[16px] bg-[#EEF4FF] px-5 py-4">
          <div className="text-[14px] leading-[18px] text-[#6B7280]">
            Amount to be paid
          </div>
          <div className="mt-1 text-[36px] font-semibold leading-[40px] tracking-[-0.02em] text-[#3F78D8]">
            {amountLabel}
          </div>
        </div>

        {null}

        <div className="mt-5 rounded-[18px] bg-[#EEF4FF] px-4 py-4">
          <div className="text-[13px] leading-[16px] text-[#9AA4AF]">
            Use the button below to pay securely with your card.
          </div>
        </div>

        <div className="mt-6 pb-[calc(env(safe-area-inset-bottom)+18px)]">
          <button
            type="button"
            onClick={() => router.push(`/Guardian/payment/${encodeURIComponent(paymentId)}/card`)}
            className="h-[52px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
          >
            Pay with Card
          </button>
          <div className="mt-8 border-t border-[#E5E7EB] pt-6">
            <div className="text-[16px] font-medium text-[#111827]">Prefer boleto?</div>
            <div className="mt-2 text-[13px] leading-[16px] text-[#9AA4AF]">
              Boleto is temporarily unavailable. Please pay with card.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
