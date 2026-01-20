'use client'
import { useState } from "react";
import { Zap } from "lucide-react";
import Header from "@/components/common/header";

interface PaymentMethodCardProps {
    onSave?: (data: PixData | BankData) => void;
}

interface PixData {
    type: "pix";
    keyType: "cpf" | "cnpj";
    pixKey: string;
    holderName: string;
    holderCpfCnpj: string;
}

interface BankData {
    type: "bank";
    personType: "individual" | "legal";
    bankName: string;
    agency: string;
    account: string;
    holderCpfCnpj: string;
}

export default function PaymentMethodCard({ onSave }: PaymentMethodCardProps) {
    const [activeTab, setActiveTab] = useState<"pix" | "bank">("pix");
    const [keyType, setKeyType] = useState<"cpf" | "cnpj">("cpf");
    const [personType, setPersonType] = useState<"individual" | "legal">("individual");

    // PIX form state
    const [pixKey, setPixKey] = useState("");
    const [pixHolderName, setPixHolderName] = useState("");
    const [pixHolderCpfCnpj, setPixHolderCpfCnpj] = useState("");

    // Bank form state
    const [bankName, setBankName] = useState("");
    const [agency, setAgency] = useState("");
    const [account, setAccount] = useState("");
    const [bankHolderCpfCnpj, setBankHolderCpfCnpj] = useState("");

    const handleSave = () => {
        if (activeTab === "pix") {
            onSave?.({
                type: "pix",
                keyType,
                pixKey,
                holderName: pixHolderName,
                holderCpfCnpj: pixHolderCpfCnpj,
            });
        } else {
            onSave?.({
                type: "bank",
                personType,
                bankName,
                agency,
                account,
                holderCpfCnpj: bankHolderCpfCnpj,
            });
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

            {/* Save Button - Fixed at bottom */}
            <div className="mt-auto pt-6">
                <button
                    onClick={handleSave}
                    className="w-full bg-[#4A7BF7] text-white py-4 rounded-full text-base font-semibold hover:bg-[#3A6BE7] transition-colors"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
