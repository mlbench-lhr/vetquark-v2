'use client'
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Camera, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

type View = "list" | "add_pix";

function ModalOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/40" />;
}

function PaymentHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <div className="relative flex items-center justify-center px-4 pt-6">
            <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-full"
            >
                <ChevronLeft className="h-6 w-6 text-[#111827]" />
            </button>
            <div className="text-[16px] font-medium leading-[20px] text-[#111827]">{title}</div>
            <div className="absolute right-4 top-6 h-10 w-10" />
        </div>
    );
}

export default function Page() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((s) => s.userProfile.profile);
  const { t } = useTranslation();
    const [view, setView] = useState<View>("list");
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    const payoutMethod = useMemo(() => {
        const pm = profile?.payoutMethod as any;
        if (!pm || typeof pm !== "object" || pm.type !== "pix") return null;
        return {
            type: "pix" as const,
            keyType: pm.keyType === "cnpj" ? ("cnpj" as const) : ("cpf" as const),
            pixKey: typeof pm.pixKey === "string" ? pm.pixKey : "",
            holderName: typeof pm.holderName === "string" ? pm.holderName : "",
            holderCpfCnpj: typeof pm.holderCpfCnpj === "string" ? pm.holderCpfCnpj : "",
        };
    }, [profile?.payoutMethod]);

    const [pixKeyType, setPixKeyType] = useState<"cpf" | "cnpj">(payoutMethod?.keyType ?? "cpf");
    const [pixKey, setPixKey] = useState(payoutMethod?.pixKey ?? "");
    const [pixHolderName, setPixHolderName] = useState(payoutMethod?.holderName ?? "");
    const [pixHolderCpfCnpj, setPixHolderCpfCnpj] = useState(payoutMethod?.holderCpfCnpj ?? "");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!payoutMethod) return;
        setPixKeyType(payoutMethod.keyType);
        setPixKey(payoutMethod.pixKey);
        setPixHolderName(payoutMethod.holderName);
        setPixHolderCpfCnpj(payoutMethod.holderCpfCnpj);
    }, [payoutMethod]);

    const maskedPix = useMemo(() => {
        const raw = payoutMethod?.pixKey || payoutMethod?.holderCpfCnpj || "";
        const digits = raw.replace(/\D/g, "");
        if (digits.length >= 6) {
            return `***${digits.slice(3, 6)}.***-${digits.slice(-2)}`;
        }
        return raw ? "***" : "***222.***-00";
    }, [payoutMethod?.holderCpfCnpj, payoutMethod?.pixKey, payoutMethod]);

    const handleSavePix = async () => {
        if (!pixKey.trim() || !pixHolderCpfCnpj.trim()) {
            toast.error(t("common.failedToSaveChanges"));
            return;
        }
        try {
            setSaving(true);
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    payoutMethod: {
                        type: "pix",
                        keyType: pixKeyType,
                        pixKey,
                        holderName: pixHolderName,
                        holderCpfCnpj: pixHolderCpfCnpj,
                    },
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(typeof json?.error === "string" ? json.error : t("common.failedToSaveChanges"));
                return;
            }
            if (json?.profile) dispatch(setProfile(json.profile));
            toast.success(t("common.savedChanges"));
            setView("list");
        } finally {
            setSaving(false);
        }
    };

    const onBack = () => {
        if (isAddCardOpen) {
            setIsAddCardOpen(false);
            return;
        }
        if (view !== "list") {
            setView("list");
            return;
        }
        router.back();
    };

    return (
        <div className="min-h-screen bg-white">
            <PaymentHeader title={view === "add_pix" ? t("wallet.addPixAccountTitle") : t("wallet.bankDetails")} onBack={onBack} />

            {view === "list" ? (
                <div className="px-4 pt-4">
                    <div className="rounded-[16px] bg-[#F5F6F6] px-4 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center">
                                <Image src="/images/pixLogo.svg" alt="" width={28} height={28} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[15px] font-medium leading-[18px] text-[#111827]">{t("wallet.pixCpfCnpj")}</div>
                                <div className="mt-1 text-[14px] leading-[18px] text-[#9AA4AF]">{maskedPix}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-[16px] font-semibold leading-[20px] text-[#111827]">{t("wallet.addNewPaymentMethod")}</div>

                    <div className="mt-4 space-y-3">
                        <button
                            type="button"
                            onClick={() => setView("add_pix")}
                            className="flex w-full items-center justify-between rounded-[16px] bg-[#F5F6F6] px-4 py-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center">
                                    <Image src="/images/pixLogo.svg" alt="" width={26} height={26} />
                                </div>
                                <div className="text-[15px] font-medium leading-[20px] text-[#111827]">Pix</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-[#3F78D8]" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsAddCardOpen(true)}
                            className="flex w-full items-center justify-between rounded-[16px] bg-[#F5F6F6] px-4 py-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-[#3F78D8]" />
                                </div>
                                <div className="text-[15px] font-medium leading-[20px] text-[#111827]">{t("wallet.cardLabel")}</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-[#3F78D8]" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex min-h-[calc(100dvh-72px)] flex-col px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
                    <div className="rounded-[16px] bg-[#EEF4FF] px-4 py-4">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-[#3F78D8]" fill="#3F78D8" />
                            <div className="text-[14px] font-medium leading-[18px] text-[#111827]">
                                Faster and with fewer errors.
                            </div>
                        </div>
                        <div className="mt-2 pl-6 text-[13px] leading-[16px] text-[#9AA4AF]">
                            PIX is the fastest and safest method to receive your payments.
                        </div>
                    </div>

                    <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">Key Type</div>
                    <div className="mt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setPixKeyType("cpf")}
                            className={`h-10 w-[120px] rounded-full text-[14px] font-medium ${pixKeyType === "cpf"
                                ? "bg-[#EBF2FF] text-[#3F78D8]"
                                : "bg-[#F5F6F6] text-[#9AA4AF]"
                                }`}
                        >
                            CPF
                        </button>
                        <button
                            type="button"
                            onClick={() => setPixKeyType("cnpj")}
                            className={`h-10 w-[120px] rounded-full text-[14px] font-medium ${pixKeyType === "cnpj"
                                ? "bg-[#EBF2FF] text-[#3F78D8]"
                                : "bg-[#F5F6F6] text-[#9AA4AF]"
                                }`}
                        >
                            CNPJ
                        </button>
                    </div>

                    <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">PIX Key</div>
                    <input
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="e.g. 111.222.333-44"
                        className="mt-3 h-[56px] w-full rounded-[16px] bg-[#F5F6F6] px-4 text-[16px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
                    />

                    <div className="mt-5 text-[14px] font-medium leading-[18px] text-[#111827]">Account Holder Name</div>
                    <input
                        value={pixHolderName}
                        onChange={(e) => setPixHolderName(e.target.value)}
                        placeholder="e.g. Dr Vet"
                        className="mt-3 h-[56px] w-full rounded-[16px] bg-[#F5F6F6] px-4 text-[16px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
                    />

                    <div className="mt-5 text-[14px] font-medium leading-[18px] text-[#111827]">
                        Account Holder&apos;s CPF/CNPJ
                    </div>
                    <input
                        value={pixHolderCpfCnpj}
                        onChange={(e) => setPixHolderCpfCnpj(e.target.value)}
                        placeholder="e.g. 111.222.333-44"
                        className="mt-3 h-[56px] w-full rounded-[16px] bg-[#F5F6F6] px-4 text-[16px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
                    />

                    <div className="mt-auto pt-10">
                        <button
                            type="button"
                            onClick={handleSavePix}
                            disabled={saving}
                            className="h-[56px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
                        >
                            {saving ? "Saving..." : "Add account"}
                        </button>
                    </div>
                </div>
            )}

            <ModalOverlay open={isAddCardOpen} onClose={() => setIsAddCardOpen(false)} />

            {isAddCardOpen ? (
                <div className="fixed inset-x-0 bottom-0 z-10">
                    <div className="rounded-t-[24px] bg-white px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                        <div className="relative flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => setIsAddCardOpen(false)}
                                aria-label="Back"
                                className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full"
                            >
                                <ChevronLeft className="h-6 w-6 text-[#111827]" />
                            </button>
                            <div className="text-[24px] font-semibold leading-[28px] text-[#111827]">Add card</div>
                            <div className="absolute right-0 h-10 w-10" />
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-[12px] font-medium leading-[16px] text-[#9AA4AF]">Card information</div>
                                <button type="button" className="flex items-center gap-2 text-[12px] font-medium text-[#3F78D8]">
                                    <Camera className="h-4 w-4" />
                                    Scan card
                                </button>
                            </div>

                            <div className="mt-3 overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <input
                                        placeholder="Card number"
                                        className="w-full bg-transparent text-[16px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
                                    />
                                    <div className="flex items-center gap-1">
                                        <Image
                                            src="/images/cards/card-01.png"
                                            alt=""
                                            width={28}
                                            height={16}
                                            className="h-4 w-7 rounded object-contain"
                                        />
                                        <Image
                                            src="/images/cards/card-02.png"
                                            alt=""
                                            width={28}
                                            height={16}
                                            className="h-4 w-7 rounded object-contain"
                                        />
                                        <Image
                                            src="/images/cards/card-03.png"
                                            alt=""
                                            width={28}
                                            height={16}
                                            className="h-4 w-7 rounded object-contain"
                                        />
                                    </div>
                                </div>
                                <div className="h-px w-full bg-[#E5E7EB]" />
                                <div className="grid grid-cols-2">
                                    <div className="px-4 py-3">
                                        <input
                                            placeholder="MM / YY"
                                            className="w-full bg-transparent text-[16px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-2 border-l border-[#E5E7EB] px-4 py-3">
                                        <input
                                            placeholder="CVC"
                                            className="w-full bg-transparent text-[16px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
                                        />
                                        <div className="h-5 w-8 rounded bg-[#E5E7EB]" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#9AA4AF]">Billing address</div>

                            <div className="mt-3 overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div>
                                        <div className="text-[12px] leading-[16px] text-[#9AA4AF]">Country or region</div>
                                        <div className="mt-1 text-[14px] font-medium leading-[18px] text-[#111827]">
                                            United States
                                        </div>
                                    </div>
                                    <ChevronDown className="h-5 w-5 text-[#9AA4AF]" />
                                </div>
                                <div className="h-px w-full bg-[#E5E7EB]" />
                                <div className="px-4 py-3">
                                    <input
                                        placeholder="ZIP"
                                        className="w-full bg-transparent text-[16px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsAddCardOpen(false)}
                                className="mt-8 h-[56px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
                            >
                                Add Card
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
