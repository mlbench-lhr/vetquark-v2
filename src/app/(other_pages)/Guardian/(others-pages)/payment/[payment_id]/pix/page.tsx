"use client";

import { ChevronLeft, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

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

  const amountLabel = "R$ 5,00";
  const pixCode = "000201010212268900";

  const title = useMemo(() => "Pay with Pix", []);

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
          Scan the QR code or copy the Pix code in your banking app to complete the
          payment.
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
            <div className="mx-auto aspect-square w-full max-w-[250px] rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
              <div className="h-full w-full">{QR_SVG}</div>
            </div>
            <div className="mt-4 text-center text-[14px] font-medium leading-[18px] text-white">
              Scan this QR code to pay
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[18px] bg-[#EEF4FF] px-4 py-4">
          <div className="text-[13px] leading-[16px] text-[#9AA4AF]">
            Copy the Pix code complete the payment.
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="truncate text-[16px] font-medium leading-[20px] text-[#111827]">
              {pixCode}
            </div>
            <button
              type="button"
              aria-label="Copy Pix code"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(pixCode);
                } catch {}
              }}
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            >
              <Copy className="h-5 w-5 text-[#3F78D8]" />
            </button>
          </div>
        </div>

        <div className="mt-6 pb-[calc(env(safe-area-inset-bottom)+18px)]">
          <button
            type="button"
            className="h-[52px] w-full rounded-full bg-[#EEF4FF] text-[15px] font-medium text-[#3F78D8]"
          >
            Waiting for payment confirmation....
          </button>
        </div>
      </div>
    </div>
  );
}
