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
  const [pixCode, setPixCode] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [boletoUrl, setBoletoUrl] = useState<string>("");
  const [boletoBarcode, setBoletoBarcode] = useState<string>("");
  const [payingBoleto, setPayingBoleto] = useState(false);

  const title = useMemo(() => "Pay with PIX", []);

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
          Generate your PIX and scan the QR code to complete the payment.
        </div>

        <div className="mt-4 rounded-[16px] bg-[#EEF4FF] px-5 py-4">
          <div className="text-[14px] leading-[18px] text-[#6B7280]">
            Amount to be paid
          </div>
          <div className="mt-1 text-[36px] font-semibold leading-[40px] tracking-[-0.02em] text-[#3F78D8]">
            {amountLabel}
          </div>
        </div>

        {qrUrl ? (
          <div className="mt-6 flex items-center justify-center">
            <div className="w-full max-w-[328px] rounded-[20px] bg-gradient-to-b from-[#3F78D8] to-[#1F4D9A] px-5 py-5">
              <div className="mx-auto w-full rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                <img src={qrUrl} alt="PIX QR Code" className="mx-auto h-[220px] w-[220px]" />
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-[18px] bg-[#EEF4FF] px-4 py-4">
          <div className="text-[13px] leading-[16px] text-[#9AA4AF]">
            After generating, scan the QR or copy the PIX code to pay.
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
                console.log("PixPage create start", { paymentId });
                const res = await fetch(`/api/payment/create`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ paymentLinkId: paymentId, method: "pix" }),
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                  console.error("PixPage create failed", { status: res.status, data });
                  const providerMsg =
                    (typeof data?.message === "string" && data.message) ||
                    (Array.isArray(data?.details?.errors) && typeof data.details.errors?.[0]?.message === "string" && data.details.errors[0].message) ||
                    (typeof data?.error === "string" && data.error) ||
                    "Failed to initiate payment";
                  toast.error(providerMsg);
                  return;
                }
                const nextQr = typeof data?.pixQrCodeUrl === "string" ? data.pixQrCodeUrl : "";
                const nextText = typeof data?.pixQrCode === "string" ? data.pixQrCode : "";
                console.log("PixPage create ok", { hasQr: !!nextQr, hasText: !!nextText });
                if (!nextQr && !nextText) {
                  toast.error("Failed to generate PIX QR. Please try again.");
                  return;
                }
                if (nextQr) setQrUrl(nextQr);
                if (nextText) setPixCode(nextText);
                toast.success("PIX generated");
              } catch {
                console.error("PixPage create exception");
                toast.error("Network error");
              } finally {
                setPaying(false);
              }
            }}
            className="h-[52px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white disabled:opacity-60"
          >
            {paying ? "Generating..." : "Generate PIX"}
          </button>
          <button
            type="button"
            disabled={!pixCode}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pixCode);
                toast.success("PIX code copied");
              } catch {
                toast.error("Failed to copy PIX code");
              }
            }}
            className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#F5F6F6] text-[15px] font-medium text-[#111827] disabled:opacity-60"
          >
            <Copy className="h-5 w-5 text-[#3F78D8]" />
            Copy PIX code
          </button>
          <div className="mt-8 border-t border-[#E5E7EB] pt-6">
            <div className="text-[16px] font-medium text-[#111827]">Prefer boleto?</div>
            <div className="mt-2 text-[13px] leading-[16px] text-[#9AA4AF]">
              Generate a boleto and pay via banking app or lotérica.
            </div>
            <button
              type="button"
              disabled={payingBoleto || !paymentId}
              onClick={async () => {
                if (!paymentId || payingBoleto) return;
                try {
                  setPayingBoleto(true);
                  const res = await fetch(`/api/payment/create`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ paymentLinkId: paymentId, method: "boleto" }),
                  });
                  const data = await res.json().catch(() => null);
                  if (!res.ok) {
                    const providerMsg =
                      (typeof data?.message === "string" && data.message) ||
                      (Array.isArray(data?.details?.errors) && typeof data.details.errors?.[0]?.message === "string" && data.details.errors[0].message) ||
                      (typeof data?.error === "string" && data.error) ||
                      "Failed to initiate boleto";
                    toast.error(providerMsg);
                    return;
                  }
                  const bUrl = typeof data?.boletoUrl === "string" ? data.boletoUrl : "";
                  const bCode = typeof data?.boletoBarcode === "string" ? data.boletoBarcode : "";
                  if (!bUrl && !bCode) {
                    toast.error("Failed to generate boleto. Please try again.");
                    return;
                  }
                  setBoletoUrl(bUrl);
                  setBoletoBarcode(bCode);
                  toast.success("Boleto generated");
                } catch {
                  toast.error("Network error");
                } finally {
                  setPayingBoleto(false);
                }
              }}
              className="mt-4 h-[52px] w-full rounded-full bg-[#111827] text-[15px] font-medium text-white disabled:opacity-60"
            >
              {payingBoleto ? "Generating..." : "Generate Boleto"}
            </button>
            {boletoUrl ? (
              <a
                href={boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-[16px] bg-[#EEF4FF] px-4 py-3 text-center text-[15px] font-medium text-[#3F78D8]"
              >
                Open Boleto
              </a>
            ) : null}
            <button
              type="button"
              disabled={!boletoBarcode}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(boletoBarcode);
                  toast.success("Boleto barcode copied");
                } catch {
                  toast.error("Failed to copy boleto barcode");
                }
              }}
              className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#F5F6F6] text-[15px] font-medium text-[#111827] disabled:opacity-60"
            >
              <Copy className="h-5 w-5 text-[#3F78D8]" />
              Copy boleto barcode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
