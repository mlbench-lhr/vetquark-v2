'use client'
import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import Header from "@/components/common/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

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
    accountType: "current" | "savings";
    agency: string;
    account: string;
    holderCpfCnpj: string;
};

type PayoutMethod = PixData | BankData;

export default function Page() {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((s) => s.userProfile.profile);
    const { t } = useTranslation();

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
            const accountType = pm.accountType === "savings" ? "savings" : "current";
            return {
                type: "bank",
                personType,
                bankName: typeof pm.bankName === "string" ? pm.bankName : "",
                accountType,
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
    const [accountType, setAccountType] = useState<"current" | "savings">(payoutMethod?.type === "bank" ? payoutMethod.accountType : "current");
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
            setAccountType(payoutMethod.accountType);
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
                    accountType,
                    agency,
                    account,
                    holderCpfCnpj: bankHolderCpfCnpj,
                };

        if (data.type === "pix") {
            if (!data.pixKey.trim() || !data.holderCpfCnpj.trim()) {
                toast.error(t("wallet.errors.fillPixKeyAndCpfCnpj"));
                return;
            }
        } else {
            if (!data.bankName.trim() || !data.agency.trim() || !data.account.trim() || !data.holderCpfCnpj.trim()) {
                toast.error(t("wallet.errors.fillAllBankFields"));
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
                toast.error(typeof json?.error === "string" ? json.error : t("common.failedToSaveChanges"));
                return;
            }
            if (json?.profile) dispatch(setProfile(json.profile));
            toast.success(t("common.savedChanges"));
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full h-[44px] bg-white border border-[#E5E5EA] rounded-lg px-4 text-[14px] text-black/70 placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-primary";
    const labelCls = "block text-black/70 text-[14px] font-medium mb-1.5";
    return (
        <div className="w-full bg-[#F2F2F7] min-h-screen flex flex-col pb-6">
            <Header title={t("wallet.bankDetails") || "Dados Bancários"} />

            {/* Tab Selector */}
            <div className="flex gap-2 mb-4 mt-3">
                <button
                    onClick={() => setActiveTab("pix")}
                    className={`flex-1 h-[42px] rounded-full text-[14px] font-semibold transition-colors ${activeTab === "pix"
                        ? "bg-primary text-white"
                        : "bg-white border border-[#D1D1D6] text-black/70"
                        }`}
                >
                    {t("wallet.pixRecommended") || "PIX (Recomendado)"}
                </button>
                <button
                    onClick={() => setActiveTab("bank")}
                    className={`flex-1 h-[42px] rounded-full text-[14px] font-semibold transition-colors ${activeTab === "bank"
                        ? "bg-primary text-white"
                        : "bg-white border border-[#D1D1D6] text-black/70"
                        }`}
                >
                    {t("wallet.bankAccountLabel") || "Conta Bancária"}
                </button>
            </div>

            {activeTab === "pix" ? (
                <div className="flex flex-col flex-1">
                    {/* Info Banner */}
                    <div className="bg-[#E5EDF9] rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
                        <Zap className="w-[18px] h-[18px] text-primary flex-shrink-0 mt-0.5" fill="#3F78D8" />
                        <div>
                            <p className="text-primary text-[14px] font-bold leading-[18px]">
                                {t("wallet.pixFewerErrors") || "Mais rápido e com menos erros."}
                            </p>
                            <p className="text-primary text-[12px] mt-0.5 leading-[16px] opacity-80">
                                {t("wallet.pixFastSafeDesc") || "O PIX é o método mais rápido e seguro para receber seus repasses."}
                            </p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4 space-y-4">
                        <div>
                            <label className={labelCls}>{t("wallet.keyType") || "Tipo de Chave"}</label>
                            <select
                                value={keyType}
                                onChange={(e) => setKeyType(e.target.value as "cpf" | "cnpj")}
                                className={`${inputCls} appearance-none pr-10`}
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                            >
                                <option value="cpf">CPF/CNPJ</option>
                                <option value="cnpj">CNPJ</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>{t("wallet.pixKey") || "Chave PIX"}</label>
                            <input type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="111.222.333-44" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>{t("wallet.holderName") || "Nome do Titular"}</label>
                            <input type="text" value={pixHolderName} onChange={(e) => setPixHolderName(e.target.value)} placeholder="Dr. Vet" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>{t("wallet.holderCpfCnpj") || "CPF/CNPJ do Titular"}</label>
                            <input type="text" value={pixHolderCpfCnpj} onChange={(e) => setPixHolderCpfCnpj(e.target.value)} placeholder="111.222.333-44" className={inputCls} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col flex-1">
                    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4 space-y-4">
                        <div>
                            <label className={`${labelCls} mb-3`}>{t("wallet.typeOfPerson") || "Tipo de Pessoa"}</label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer" onClick={() => setPersonType("individual")}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${personType === "individual" ? "border-primary" : "border-[#D1D5DB]"}`}>
                                        {personType === "individual" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <span className="text-[14px] text-black/70">{t("wallet.individual") || "Pessoa Física"}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer" onClick={() => setPersonType("legal")}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${personType === "legal" ? "border-primary" : "border-[#D1D5DB]"}`}>
                                        {personType === "legal" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <span className="text-[14px] text-black/70">{t("wallet.legalEntity") || "Pessoa Jurídica"}</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>{t("wallet.bankName") || "Banco"}</label>
                            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="260" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>{t("wallet.accountType") || "Tipo de Conta"}</label>
                            <select
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value as "current" | "savings")}
                                className={`${inputCls} appearance-none pr-10`}
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                            >
                                <option value="current">Conta Corrente</option>
                                <option value="savings">Conta Poupança</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>{t("wallet.agencyWithDigit") || "Agência (com dígito)"}</label>
                            <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="0001" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>{t("wallet.accountWithDigit") || "Conta (com dígito)"}</label>
                            <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="123456-7" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>{t("wallet.holderCpfCnpj") || "CPF/CNPJ do Titular"}</label>
                            <input type="text" value={bankHolderCpfCnpj} onChange={(e) => setBankHolderCpfCnpj(e.target.value)} placeholder="111.222.333-44" className={inputCls} />
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-5">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary text-white h-[52px] rounded-xl text-[16px] font-bold hover:bg-[#2f68c8] transition-colors disabled:opacity-60"
                >
                    {saving ? t("common.saving") : activeTab === "pix" ? "Salvar Dados Pix" : "Salvar Conta Bancária"}
                </button>
            </div>
        </div>
    );
}
