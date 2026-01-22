'use client'
import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import Header from "@/components/common/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";

type PixData = {
    type: "pix";
    keyType: "cpf" | "cnpj";
    pixKey: string;
    holderName: string;
    holderCpfCnpj: string;
};

type BankData = {
    type: "bank";
    personType: "individual" | "legal";
    bankName: string;
    agency: string;
    account: string;
    holderCpfCnpj: string;
};

type PayoutMethod = PixData | BankData;

export default function Page() {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((s) => s.userProfile.profile);

    const payoutMethod = useMemo(() => {
        const pm = profile?.payoutMethod as any;
        if (!pm || typeof pm !== "object") return null;
        if (pm.type === "pix") {
            const keyType = pm.keyType === "cnpj" ? "cnpj" : "cpf";
            return {
                type: "pix",
                keyType,
                pixKey: typeof pm.pixKey === "string" ? pm.pixKey : "",
                holderName: typeof pm.holderName === "string" ? pm.holderName : "",
                holderCpfCnpj: typeof pm.holderCpfCnpj === "string" ? pm.holderCpfCnpj : "",
            } satisfies PixData;
        }
        if (pm.type === "bank") {
            const personType = pm.personType === "legal" ? "legal" : "individual";
            return {
                type: "bank",
                personType,
                bankName: typeof pm.bankName === "string" ? pm.bankName : "",
                agency: typeof pm.agency === "string" ? pm.agency : "",
                account: typeof pm.account === "string" ? pm.account : "",
                holderCpfCnpj: typeof pm.holderCpfCnpj === "string" ? pm.holderCpfCnpj : "",
            } satisfies BankData;
        }
        return null;
    }, [profile?.payoutMethod]);

    const [activeTab, setActiveTab] = useState<"pix" | "bank">(payoutMethod?.type === "bank" ? "bank" : "pix");
    const [keyType, setKeyType] = useState<"cpf" | "cnpj">(payoutMethod?.type === "pix" ? payoutMethod.keyType : "cpf");
    const [personType, setPersonType] = useState<"individual" | "legal">(
        payoutMethod?.type === "bank" ? payoutMethod.personType : "individual"
    );
    const [pixKey, setPixKey] = useState(payoutMethod?.type === "pix" ? payoutMethod.pixKey : "");
    const [pixHolderName, setPixHolderName] = useState(payoutMethod?.type === "pix" ? payoutMethod.holderName : "");
    const [pixHolderCpfCnpj, setPixHolderCpfCnpj] = useState(
        payoutMethod?.type === "pix" ? payoutMethod.holderCpfCnpj : ""
    );
    const [bankName, setBankName] = useState(payoutMethod?.type === "bank" ? payoutMethod.bankName : "");
    const [agency, setAgency] = useState(payoutMethod?.type === "bank" ? payoutMethod.agency : "");
    const [account, setAccount] = useState(payoutMethod?.type === "bank" ? payoutMethod.account : "");
    const [bankHolderCpfCnpj, setBankHolderCpfCnpj] = useState(
        payoutMethod?.type === "bank" ? payoutMethod.holderCpfCnpj : ""
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setActiveTab(payoutMethod?.type === "bank" ? "bank" : "pix");
        if (payoutMethod?.type === "pix") {
            setKeyType(payoutMethod.keyType);
            setPixKey(payoutMethod.pixKey);
            setPixHolderName(payoutMethod.holderName);
            setPixHolderCpfCnpj(payoutMethod.holderCpfCnpj);
        } else if (payoutMethod?.type === "bank") {
            setPersonType(payoutMethod.personType);
            setBankName(payoutMethod.bankName);
            setAgency(payoutMethod.agency);
            setAccount(payoutMethod.account);
            setBankHolderCpfCnpj(payoutMethod.holderCpfCnpj);
        }
    }, [payoutMethod]);

    const handleSave = async () => {
        const data: PayoutMethod =
            activeTab === "pix"
                ? {
                    type: "pix",
                    keyType,
                    pixKey,
                    holderName: pixHolderName,
                    holderCpfCnpj: pixHolderCpfCnpj,
                }
                : {
                    type: "bank",
                    personType,
                    bankName,
                    agency,
                    account,
                    holderCpfCnpj: bankHolderCpfCnpj,
                };

        if (data.type === "pix") {
            if (!data.pixKey.trim() || !data.holderCpfCnpj.trim()) {
                toast.error("Please fill PIX key and CPF/CNPJ");
                return;
            }
        } else {
            if (!data.bankName.trim() || !data.agency.trim() || !data.account.trim() || !data.holderCpfCnpj.trim()) {
                toast.error("Please fill all bank fields");
                return;
            }
        }

        try {
            setSaving(true);
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ payoutMethod: data }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(typeof json?.error === "string" ? json.error : "Failed to save changes");
                return;
            }
            if (json?.profile) dispatch(setProfile(json.profile));
            toast.success("Saved changes");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full mx-auto bg-white min-h-screen flex flex-col px-5 pt-6 pb-6">
            {/* Tab Selector */}
            <Header title="Bank Details" />
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab("pix")}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeTab === "pix"
                        ? "bg-[#EBF2FF] text-primary"
                        : "bg-[#F0F1F3] text-foreground"
                        }`}
                >
                    Pix (Recommended)
                </button>
                <button
                    onClick={() => setActiveTab("bank")}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeTab === "bank"
                        ? "bg-[#EBF2FF] text-primary"
                        : "bg-[#F0F1F3] text-foreground"
                        }`}
                >
                    Bank Account
                </button>
            </div>

            {activeTab === "pix" ? (
                <div className="flex flex-col flex-1">
                    {/* Info Box */}
                    <div className="bg-[#EEF4FF] rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-[#4A7BF7]" fill="#4A7BF7" />
                            <span className="text-[#1F2937] text-sm font-medium">
                                Faster and with fewer errors.
                            </span>
                        </div>
                        <p className="text-[#6B7280] text-xs pl-6">
                            PIX is the fastest and safest method to receive your payments.
                        </p>
                    </div>

                    {/* Key Type */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-3">
                            Key Type
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setKeyType("cpf")}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${keyType === "cpf"
                                    ? "bg-[#EEF4FF] text-[#4A7BF7]"
                                    : "bg-[#F0F1F3] text-[#6B7280]"
                                    }`}
                            >
                                CPF
                            </button>
                            <button
                                onClick={() => setKeyType("cnpj")}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${keyType === "cnpj"
                                    ? "bg-[#EEF4FF] text-[#4A7BF7]"
                                    : "bg-[#F0F1F3] text-[#6B7280]"
                                    }`}
                            >
                                CNPJ
                            </button>
                        </div>
                    </div>

                    {/* PIX Key */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-2">
                            PIX Key
                        </label>
                        <input
                            type="text"
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            placeholder="e.g. 111.222.333-44"
                            className="w-full bg-[#F5F6F8] rounded-xl px-4 py-3.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#4A7BF7]/20"
                        />
                    </div>

                    {/* Account Holder Name */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-2">
                            Account Holder Name
                        </label>
                        <input
                            type="text"
                            value={pixHolderName}
                            onChange={(e) => setPixHolderName(e.target.value)}
                            placeholder="e.g. Dr Vet"
                            className="w-full bg-[#F5F6F8] rounded-xl px-4 py-3.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#4A7BF7]/20"
                        />
                    </div>

                    {/* Account Holder's CPF/CNPJ */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-2">
                            Account Holder&apos;s CPF/CNPJ
                        </label>
                        <input
                            type="text"
                            value={pixHolderCpfCnpj}
                            onChange={(e) => setPixHolderCpfCnpj(e.target.value)}
                            placeholder="e.g. 111.222.333-44"
                            className="w-full bg-[#F5F6F8] rounded-xl px-4 py-3.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#4A7BF7]/20"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col flex-1">
                    {/* Type Of Person */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-3">
                            Type Of Person
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPersonType("individual")}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${personType === "individual"
                                    ? "bg-[#EEF4FF] text-[#4A7BF7]"
                                    : "bg-[#F0F1F3] text-[#6B7280]"
                                    }`}
                            >
                                Individual
                            </button>
                            <button
                                onClick={() => setPersonType("legal")}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${personType === "legal"
                                    ? "bg-[#EEF4FF] text-[#4A7BF7]"
                                    : "bg-[#F0F1F3] text-[#6B7280]"
                                    }`}
                            >
                                Legal Identity
                            </button>
                        </div>
                    </div>

                    {/* Bank Name */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-2">
                            Bank Name
                        </label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="Write the bank"
                            className="w-full bg-[#F5F6F8] rounded-xl px-4 py-3.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#4A7BF7]/20"
                        />
                    </div>

                    {/* Agency */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-2">
                            Agency (with digit)
                        </label>
                        <input
                            type="text"
                            value={agency}
                            onChange={(e) => setAgency(e.target.value)}
                            placeholder="e.g. 0001"
                            className="w-full bg-[#F5F6F8] rounded-xl px-4 py-3.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#4A7BF7]/20"
                        />
                    </div>

                    {/* Account */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-2">
                            Account (with digit)
                        </label>
                        <input
                            type="text"
                            value={account}
                            onChange={(e) => setAccount(e.target.value)}
                            placeholder="e.g. 123456-7"
                            className="w-full bg-[#F5F6F8] rounded-xl px-4 py-3.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#4A7BF7]/20"
                        />
                    </div>

                    {/* Holder's CPF/CNPJ */}
                    <div className="mb-5">
                        <label className="block text-[#1F2937] text-sm font-medium mb-2">
                            Holder&apos;s CPF/CNPJ
                        </label>
                        <input
                            type="text"
                            value={bankHolderCpfCnpj}
                            onChange={(e) => setBankHolderCpfCnpj(e.target.value)}
                            placeholder="e.g. 111.222.333-44"
                            className="w-full bg-[#F5F6F8] rounded-xl px-4 py-3.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#4A7BF7]/20"
                        />
                    </div>
                </div>
            )}

            <div className="mt-auto pt-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#4A7BF7] text-white py-4 rounded-full text-base font-semibold hover:bg-[#3A6BE7] transition-colors disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
