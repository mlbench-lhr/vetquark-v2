 "use client";
 
 import { ChevronLeft } from "lucide-react";
 import { useParams, useRouter } from "next/navigation";
 import { useEffect, useMemo, useState } from "react";
 import { toast } from "react-toastify";
 
 export default function Page() {
   const router = useRouter();
   const params = useParams<{ payment_id: string }>();
   const paymentId = String(params?.payment_id || "").trim();
   const [amountLabel, setAmountLabel] = useState("R$ 0,00");
   const [number, setNumber] = useState("");
   const [holderName, setHolderName] = useState("");
   const [holderDocument, setHolderDocument] = useState("");
   const [expMonth, setExpMonth] = useState("");
   const [expYear, setExpYear] = useState("");
   const [cvv, setCvv] = useState("");
   const [paying, setPaying] = useState(false);
 
   const title = useMemo(() => "Pay with Card", []);
 
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
         const defaultName = typeof data?.item?.guardian?.name === "string" ? data.item.guardian.name : "";
         if (defaultName) setHolderName(defaultName);
       } catch {}
     })();
     return () => {
       mounted = false;
     };
   }, [paymentId]);
 
   async function tokenize() {
    console.log("process.env.PAGARME_PUBLIC_KEY------", process.env.PAGARME_PUBLIC_KEY);
    console.log("String(process.env.PAGARME_PUBLIC_KEY ||------", String(process.env.PAGARME_PUBLIC_KEY || ""));
     const appId = String(process.env.PAGARME_PUBLIC_KEY || "").trim();
     if (!appId) {
       toast.error("Missing public key");
       return null;
     }
     const url = `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(appId)}`;
     const payload = {
       card: {
         number: number.replace(/\s+/g, ""),
         holder_name: holderName,
         holder_document: holderDocument.replace(/\D/g, "") || undefined,
         exp_month: Number(expMonth || 0),
         exp_year: Number(expYear || 0),
         cvv: cvv,
       },
       type: "card",
     };
     const res = await fetch(url, {
       method: "POST",
       headers: { accept: "application/json", "content-type": "application/json" },
       body: JSON.stringify(payload),
     });
     const data = await res.json().catch(() => null);
     if (!res.ok) {
       const msg =
         (typeof data?.message === "string" && data.message) ||
         (Array.isArray(data?.errors) && typeof data.errors?.[0]?.message === "string" && data.errors[0].message) ||
         "Failed to tokenize card";
       toast.error(msg);
       return null;
     }
     const token = typeof data?.id === "string" ? data.id : "";
     if (!token) {
       toast.error("Tokenization failed");
       return null;
     }
     return token;
   }
 
   async function pay() {
     if (!paymentId || paying) return;
     if (!number || !holderName || !expMonth || !expYear || !cvv) {
       toast.error("Fill all card fields");
       return;
     }
     try {
       setPaying(true);
       const token = await tokenize();
       if (!token) return;
       const res = await fetch(`/api/payment/create`, {
         method: "POST",
         headers: { "content-type": "application/json" },
         body: JSON.stringify({ paymentLinkId: paymentId, method: "credit_card", cardToken: token }),
       });
       const data = await res.json().catch(() => null);
       if (!res.ok) {
         const msg =
           (typeof data?.message === "string" && data.message) ||
           (Array.isArray(data?.details?.errors) && typeof data.details.errors?.[0]?.message === "string" && data.details.errors[0].message) ||
           (typeof data?.error === "string" && data.error) ||
           "Payment failed";
         toast.error(msg);
         return;
       }
       toast.success("Payment initiated");
       router.push("/Guardian/payment/history");
     } catch {
       toast.error("Network error");
     } finally {
       setPaying(false);
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
           <ChevronLeft className="h-6 w-6 text-[#111827]" />
         </button>
         <h1 className="text-[16px] font-medium leading-[20px] text-[#111827]">
           {title}
         </h1>
         <div className="h-0 w-10" />
       </div>
 
       <div className="pt-5">
         <div className="rounded-[16px] bg-[#EEF4FF] px-5 py-4">
           <div className="text-[14px] leading-[18px] text-[#6B7280]">
             Amount to be paid
           </div>
           <div className="mt-1 text-[36px] font-semibold leading-[40px] tracking-[-0.02em] text-[#3F78D8]">
             {amountLabel}
           </div>
         </div>
 
         <div className="mt-6 space-y-4 px-1">
           <input
             type="text"
             inputMode="numeric"
             placeholder="Card number"
             value={number}
             onChange={(e) => setNumber(e.target.value)}
             className="h-12 w-full rounded-2xl border border-[#E5E7EB] px-4 text-[15px]"
           />
           <input
             type="text"
             placeholder="Card holder name"
             value={holderName}
             onChange={(e) => setHolderName(e.target.value)}
             className="h-12 w-full rounded-2xl border border-[#E5E7EB] px-4 text-[15px]"
           />
           <input
             type="text"
             inputMode="numeric"
             placeholder="CPF/CNPJ (optional)"
             value={holderDocument}
             onChange={(e) => setHolderDocument(e.target.value)}
             className="h-12 w-full rounded-2xl border border-[#E5E7EB] px-4 text-[15px]"
           />
           <div className="flex gap-3">
             <input
               type="text"
               inputMode="numeric"
               placeholder="MM"
               value={expMonth}
               onChange={(e) => setExpMonth(e.target.value)}
               className="h-12 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-[15px]"
             />
             <input
               type="text"
               inputMode="numeric"
               placeholder="YY or YYYY"
               value={expYear}
               onChange={(e) => setExpYear(e.target.value)}
               className="h-12 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-[15px]"
             />
             <input
               type="text"
               inputMode="numeric"
               placeholder="CVV"
               value={cvv}
               onChange={(e) => setCvv(e.target.value)}
               className="h-12 w-24 rounded-2xl border border-[#E5E7EB] px-4 text-[15px]"
             />
           </div>
         </div>
 
         <div className="mt-8 pb-[calc(env(safe-area-inset-bottom)+18px)]">
           <button
             type="button"
             disabled={paying || !paymentId}
             onClick={pay}
             className="h-[52px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white disabled:opacity-60"
           >
             {paying ? "Processing..." : "Pay with Card"}
           </button>
           <button
             type="button"
             onClick={() => router.push(`/Guardian/payment/${encodeURIComponent(paymentId)}/pix`)}
             className="mt-4 h-[52px] w-full rounded-full bg-[#F5F6F6] text-[15px] font-medium text-[#111827]"
           >
             Prefer PIX or boleto
           </button>
         </div>
       </div>
     </div>
   );
 }
