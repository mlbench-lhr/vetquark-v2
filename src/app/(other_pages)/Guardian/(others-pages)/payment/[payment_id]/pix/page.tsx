"use client";
import { ChevronLeft, Copy } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export default function Page() {
  const router = useRouter();

  const params = useParams<{ payment_id: string }>();
  const paymentId = String(params?.payment_id || "").trim();
  const [amountLabel, setAmountLabel] = useState("R$ 0.00");
  const [paying, setPaying] = useState(false);
  const [pixCode, setPixCode] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [boletoUrl, setBoletoUrl] = useState<string>("");
  const [boletoBarcode, setBoletoBarcode] = useState<string>("");
  const [payingBoleto, setPayingBoleto] = useState(false);

  const title = useMemo(() => "Payment", []);

  const cacheKeys = useMemo(() => {
    const safeId = encodeURIComponent(paymentId || "");
    return {
      pix: `payment_pix:${safeId}`,
      boleto: `payment_boleto:${safeId}`,
    };
  }, [paymentId]);

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

  useEffect(() => {
    if (!paymentId) return;
    try {
      const pixRaw = typeof window !== "undefined" ? window.localStorage.getItem(cacheKeys.pix) : null;
      const boletoRaw = typeof window !== "undefined" ? window.localStorage.getItem(cacheKeys.boleto) : null;
      const pix = pixRaw ? JSON.parse(pixRaw) : null;
      const boleto = boletoRaw ? JSON.parse(boletoRaw) : null;

      const nextPixCode = typeof pix?.pixCode === "string" ? pix.pixCode : "";
      const nextQrUrl = typeof pix?.qrUrl === "string" ? pix.qrUrl : "";
      const nextBoletoUrl = typeof boleto?.boletoUrl === "string" ? boleto.boletoUrl : "";
      const nextBoletoBarcode = typeof boleto?.boletoBarcode === "string" ? boleto.boletoBarcode : "";

      if (nextPixCode) setPixCode(nextPixCode);
      if (nextQrUrl) setQrUrl(nextQrUrl);
      if (nextBoletoUrl) setBoletoUrl(nextBoletoUrl);
      if (nextBoletoBarcode) setBoletoBarcode(nextBoletoBarcode);
    } catch {
    }
  }, [cacheKeys.boleto, cacheKeys.pix, paymentId]);

  async function createPix() {
    if (!paymentId || paying) return;
    try {
      setPaying(true);
      const res = await fetch(`/api/payment/create`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentLinkId: paymentId, method: "pix" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data?.message === "string" && data.message) ||
          (Array.isArray(data?.details?.errors) && typeof data.details.errors?.[0]?.message === "string" && data.details.errors[0].message) ||
          (typeof data?.error === "string" && data.error) ||
          "Failed to generate PIX";
        toast.error(msg);
        return;
      }
      const nextPixCode = typeof data?.pixQrCode === "string" ? data.pixQrCode : "";
      const nextQrUrl = typeof data?.pixQrCodeUrl === "string" ? data.pixQrCodeUrl : "";
      if (!nextPixCode && !nextQrUrl) {
        toast.error("PIX unavailable for this payment");
        return;
      }
      setPixCode(nextPixCode);
      setQrUrl(nextQrUrl);
      try {
        window.localStorage.setItem(cacheKeys.pix, JSON.stringify({ pixCode: nextPixCode, qrUrl: nextQrUrl }));
      } catch {
      }
      toast.success("PIX generated");
    } catch {
      toast.error("Network error");
    } finally {
      setPaying(false);
    }
  }

  async function createBoleto() {
    if (!paymentId || payingBoleto) return;
    try {
      setPayingBoleto(true);
      const res = await fetch(`/api/payment/create`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentLinkId: paymentId, method: "boleto" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data?.message === "string" && data.message) ||
          (Array.isArray(data?.details?.errors) && typeof data.details.errors?.[0]?.message === "string" && data.details.errors[0].message) ||
          (typeof data?.error === "string" && data.error) ||
          "Failed to generate boleto";
        toast.error(msg);
        return;
      }
      const nextBoletoUrl = typeof data?.boletoUrl === "string" ? data.boletoUrl : "";
      const nextBoletoBarcode = typeof data?.boletoBarcode === "string" ? data.boletoBarcode : "";
      if (!nextBoletoUrl && !nextBoletoBarcode) {
        toast.error("Boleto unavailable for this payment");
        return;
      }
      setBoletoUrl(nextBoletoUrl);
      setBoletoBarcode(nextBoletoBarcode);
      try {
        window.localStorage.setItem(cacheKeys.boleto, JSON.stringify({ boletoUrl: nextBoletoUrl, boletoBarcode: nextBoletoBarcode }));
      } catch {
      }
      if (nextBoletoUrl && typeof window !== "undefined") window.open(nextBoletoUrl, "_blank", "noopener,noreferrer");
      toast.success("Boleto generated");
    } catch {
      toast.error("Network error");
    } finally {
      setPayingBoleto(false);
    }
  }

  async function checkStatus() {
    if (!paymentId) return;
    try {
      const res = await fetch(`/api/payment/status/${encodeURIComponent(paymentId)}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (typeof data?.reason === "string" && data.reason) ||
          (typeof data?.error === "string" && data.error) ||
          "Failed to check status";
        toast.error(msg);
        return;
      }
      const status = String(data?.status || "").trim().toLowerCase();
      if (status === "paid" || status === "authorized" || status === "captured") {
        toast.success("Payment confirmed");
        router.push("/Guardian/payment/history");
        return;
      }
      if (status === "failed" || status === "refused") {
        toast.error("Payment failed");
        return;
      }
      toast.info("Payment still pending");
    } catch {
      toast.error("Network error");
    }
  }

  async function copyText(value: string, label: string) {
    const v = String(value || "").trim();
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="min-h-scree bg-white">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-0 w-fit items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 text-black/70" />
        </button>
        <h1 className="text-[16px] font-medium leading-[20px] text-black/70">{title}</h1>
        <div className="h-0 w-10" />
      </div>

      <div className="pt-5">
        <div className="text-[20px] font-semibold leading-[24px] text-black/70">
          Pay with PIX
        </div>
        <div className="mt-2 max-w-[320px] text-[14px] leading-[18px] text-[#9AA4AF]">
          Generate a PIX QR code to complete your payment.
        </div>

        <div className="mt-4 rounded-[16px] bg-[#EEF4FF] px-5 py-4">
          <div className="text-[14px] leading-[18px] text-[#6B7280]">
            Amount to be paid
          </div>
          <div className="mt-1 text-[36px] font-semibold leading-[40px] tracking-[-0.02em] text-primary">
            {amountLabel}
          </div>
        </div>

        <div className="mt-5 rounded-[18px] bg-[#F5F6F6] px-4 py-4">
          {qrUrl ? (
            <div className="flex flex-col items-center">
              <img src={qrUrl} alt="PIX QR code" className="h-[220px] w-[220px] rounded-[12px] bg-white p-2" />
              <button
                type="button"
                onClick={() => copyText(pixCode, "PIX code")}
                disabled={!pixCode}
                className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-black/70 disabled:opacity-60"
              >
                <Copy className="h-4 w-4" />
                Copy PIX code
              </button>
              {pixCode ? (
                <div className="mt-3 w-full rounded-[14px] bg-white px-4 py-3 text-[12px] leading-[16px] text-[#6B7280] break-all">
                  {pixCode}
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="text-[13px] leading-[16px] text-[#9AA4AF]">
                Click below to generate a PIX QR code.
              </div>
              <button
                type="button"
                disabled={paying || !paymentId}
                onClick={createPix}
                className="mt-4 h-[52px] w-full rounded-full bg-primary text-[15px] font-medium text-white disabled:opacity-60"
              >
                {paying ? "Generating..." : "Generate PIX"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-[18px] bg-[#EEF4FF] px-4 py-4">
          <div className="text-[13px] leading-[16px] text-[#9AA4AF]">
            After paying, you can verify the status.
          </div>
        </div>

        <div className="mt-6 pb-[calc(env(safe-area-inset-bottom)+18px)]">
          <button
            type="button"
            onClick={checkStatus}
            className="h-[52px] w-full rounded-full bg-primary text-[15px] font-medium text-white"
          >
            I already paid
          </button>
          <button
            type="button"
            onClick={() => router.push(`/Guardian/payment/${encodeURIComponent(paymentId)}/card`)}
            className="mt-4 h-[52px] w-full rounded-full bg-[#F5F6F6] text-[15px] font-medium text-black/70"
          >
            Pay with Card instead
          </button>
          <div className="mt-8 border-t border-[#E5E7EB] pt-6">
            <div className="text-[16px] font-medium text-black/70">Prefer boleto?</div>
            {boletoUrl || boletoBarcode ? (
              <div className="mt-3">
                {boletoBarcode ? (
                  <div className="rounded-[14px] bg-[#F5F6F6] px-4 py-3 text-[12px] leading-[16px] text-[#6B7280] break-all">
                    {boletoBarcode}
                  </div>
                ) : null}
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => copyText(boletoBarcode, "Boleto barcode")}
                    disabled={!boletoBarcode}
                    className="flex-1 rounded-full bg-[#F5F6F6] px-4 py-3 text-[14px] font-medium text-black/70 disabled:opacity-60"
                  >
                    Copy barcode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!boletoUrl) return;
                      if (typeof window !== "undefined") window.open(boletoUrl, "_blank", "noopener,noreferrer");
                    }}
                    disabled={!boletoUrl}
                    className="flex-1 rounded-full bg-primary px-4 py-3 text-[14px] font-medium text-white disabled:opacity-60"
                  >
                    Open boleto
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-[13px] leading-[16px] text-[#9AA4AF]">
                  Generate a boleto if you prefer paying later.
                </div>
                <button
                  type="button"
                  onClick={createBoleto}
                  className="mt-4 h-[52px] w-full rounded-full bg-[#F5F6F6] text-[15px] font-medium text-black/70"
                >
                  Generate boleto
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
