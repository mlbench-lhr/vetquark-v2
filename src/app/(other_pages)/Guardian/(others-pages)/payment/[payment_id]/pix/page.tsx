"use client";

import { ChevronLeft, Copy } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const QR_SVG = (
  <svg
    viewBox="0 0 29 29"
    className="h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="29" height="29" fill="#fff" />
    <path
      d="M0 0h9v9H0V0zm2 2v5h5V2H2zM20 0h9v9h-9V0zm2 2v5h5V2h-5zM0 20h9v9H0v-9zm2 2v5h5v-5H2zM10 2h1v1h-1V2zm2 0h1v2h-1V2zm2 0h1v1h-1V2zm2 0h1v2h-1V2zm2 0h1v1h-1V2zm-10 2h2v1h-2V4zm3 0h1v1h-1V4zm2 0h2v1h-2V4zm3 0h1v1h-1V4zm2 0h2v1h-2V4zM10 6h1v1h-1V6zm2 0h2v1h-2V6zm3 0h1v1h-1V6zm2 0h2v1h-2V6zm3 0h1v1h-1V6zM10 8h2v1h-2V8zm3 0h1v1h-1V8zm2 0h2v1h-2V8zm3 0h1v1h-1V8zm2 0h2v1h-2V8zM10 10h1v2h-1v-2zm2 0h2v1h-2v-1zm3 0h1v2h-1v-2zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v2h-1v-2zM10 13h2v1h-2v-1zm3 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zM10 15h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1zm2 0h2v2h-2v-2zm3 0h1v1h-1v-1zm2 0h2v1h-2v-1zM10 17h2v1h-2v-1zm3 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 1h1v1h-1v-1zm2-1h2v1h-2v-1zm3 0h1v1h-1v-1zM10 19h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1zM10 21h2v1h-2v-1zm3 0h1v2h-1v-2zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zM12 24h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1zm2 0h2v1h-2v-1z"
      fill="#000"
    />
  </svg>
);

export default function Page() {
  const router = useRouter();

  const params = useParams<{ payment_id: string }>();
  const paymentId = String(params?.payment_id || "").trim();
  const [amountLabel, setAmountLabel] = useState("R$ 0,00");
  const [paying, setPaying] = useState(false);
  const pixCode = "000201010212268900";

  const title = useMemo(() => "Pay with Boleto", []);

  useEffect(() => {
    let mounted = true;
    if (!paymentId) return;
    (async () => {
      try {
        const res = await fetch(`/api/payment_links/get/${encodeURIComponent(paymentId)}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) return;
        const nextAmountLabel = typeof data?.item?.amountLabel === "string" ? data.item.amountLabel : "";
        if (nextAmountLabel) setAmountLabel(nextAmountLabel);
      } catch {
      }
    })();
    return () => {
      mounted = false;
    };
  }, [paymentId]);

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
          {title}
        </h1>
        <div className="h-10 w-10" />
      </div>

      <div className="px-4 pt-5">
        <div className="text-[20px] font-semibold leading-[24px] text-[#111827]">
          Link Generated
        </div>
        <div className="mt-2 max-w-[320px] text-[14px] leading-[18px] text-[#9AA4AF]">
          Generate your boleto and open it to complete the payment.
        </div>

        <div className="mt-4 rounded-[16px] bg-[#EEF4FF] px-5 py-4">
          <div className="text-[14px] leading-[18px] text-[#6B7280]">
            Amount to be paid
          </div>
          <div className="mt-1 text-[36px] font-semibold leading-[40px] tracking-[-0.02em] text-[#3F78D8]">
            {amountLabel}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="w-full max-w-[328px] rounded-[20px] bg-gradient-to-b from-[#3F78D8] to-[#1F4D9A] px-5 py-5">
            <div className="mx-auto w-full rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
              <div className="text-center text-[14px] font-medium leading-[18px] text-[#111827]">
                Tap Pay below to generate your boleto.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[18px] bg-[#EEF4FF] px-4 py-4">
          <div className="text-[13px] leading-[16px] text-[#9AA4AF]">
            After generating, the boleto will open in a new tab.
          </div>
        </div>

        <div className="mt-6 pb-[calc(env(safe-area-inset-bottom)+18px)]">
          <button
            type="button"
            disabled={paying || !paymentId}
            onClick={async () => {
              if (!paymentId || paying) return;
              try {
                setPaying(true);
                const res = await fetch(`/api/payment/create`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ paymentLinkId: paymentId, method: "boleto" }),
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                  toast.error(typeof data?.error === "string" ? data.error : "Failed to initiate payment");
                  return;
                }
                const boletoUrl = typeof data?.boletoUrl === "string" ? data.boletoUrl : "";
                if (boletoUrl) {
                  try {
                    window.open(boletoUrl, "_blank", "noopener,noreferrer");
                  } catch {}
                }
                toast.success("Boleto generated");
                router.push(`/Guardian/payment/${encodeURIComponent(paymentId)}`);
              } catch {
                toast.error("Network error");
              } finally {
                setPaying(false);
              }
            }}
            className="h-[52px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white disabled:opacity-60"
          >
            {paying ? "Paying..." : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
