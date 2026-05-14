'use client'
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/common/header";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { BalanceCardSkeleton, ListItemSkeleton } from "@/components/ui/skeleton";

interface Transaction {
    id: string;
    type: "credit" | "withdrawal";
    title: string;
    subtitle?: string;
    date?: string;
    amount?: string;
    avatarUrl?: string;
    isPix?: boolean;
}

interface WalletCardProps {
    balance?: string;
    currency?: string;
    pixNumber?: string;
    transactions?: Transaction[];
    onWithdraw?: () => void;
    onBankDetails?: () => void;
}

const defaultTransactions: Transaction[] = [
    {
        id: "1",
        type: "credit",
        title: "Wolfy",
        subtitle: "Urinalysis Report",
        amount: "5.00",
        avatarUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop&crop=face",
    },
    {
        id: "2",
        type: "credit",
        title: "Zack Knight",
        date: "15/02/2026",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    {
        id: "3",
        type: "withdrawal",
        title: "PIX (CPF/CNPJ)",
        date: "15/02/2026",
        amount: "5.00",
        isPix: true,
    },
];

export default function WalletCard({
    balance: balanceProp = "925.00",
    currency: currencyProp = "R$",
    pixNumber = "***222.***-00",
    transactions: transactionsProp = defaultTransactions,
    onBankDetails,
}: WalletCardProps) {
    const { t } = useTranslation();
    const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
    const [filter, setFilter] = useState<"all" | "credits" | "withdrawals">("all");
    const router = useRouter()
    const profile = useAppSelector((s) => s.userProfile.profile);
    const [currency, setCurrency] = useState(currencyProp);
    const [balance, setBalance] = useState(balanceProp);
    const [transactions, setTransactions] = useState<Transaction[]>(transactionsProp);
    const [loading, setLoading] = useState(true);

    const handleWithdraw = async () => {
        try {
            const res = await fetch("/api/wallet/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({}),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                toast.error(typeof data?.error === "string" ? data.error : "Failed to withdraw");
                return;
            }
            toast.success("Withdrawal requested");
            // Refresh wallet
            const r = await fetch("/api/wallet", { credentials: "include" });
            const j = await r.json().catch(() => null);
            if (r.ok && j) {
                const currency = String(j?.currency || "BRL");
                const balanceNumber = typeof j?.balance === "number" ? j.balance : 0;
                setCurrency(currency === "BRL" ? "R$" : currency);
                setBalance(balanceNumber.toFixed(2));
                const list: any[] = Array.isArray(j?.transactions) ? j.transactions : [];
                const mapped: Transaction[] = list.map((it: any) => ({
                    id: String(it.id),
                    type: it.type === "withdrawal" ? "withdrawal" : "credit",
                    title: String(it.title || "Urinalysis"),
                    subtitle: String(it.subtitle || "Urinalysis Report"),
                    date: typeof it.date === "string" ? new Date(it.date).toLocaleDateString() : "",
                    amount: String(it.amount || ""),
                    avatarUrl: String(it.avatarUrl || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
                    isPix: false,
                }));
                setTransactions(mapped);
            }
        } catch {
            toast.error("Network error");
        }
    };
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/wallet");
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                if (!res.ok) {
                    toast.error(typeof data?.error === "string" ? data.error : "Failed to load wallet");
                    return;
                }
                const currency = String(data?.currency || "BRL");
                const balanceNumber = typeof data?.balance === "number" ? data.balance : 0;
                setCurrency(currency === "BRL" ? "R$" : currency);
                setBalance(balanceNumber.toFixed(2));
                const list: any[] = Array.isArray(data?.transactions) ? data.transactions : [];
                const mapped: Transaction[] = list.map((it: any) => ({
                    id: String(it.id),
                    type: it.type === "withdrawal" ? "withdrawal" : "credit",
                    title: String(it.title || "Urinalysis"),
                    subtitle: String(it.subtitle || "Urinalysis Report"),
                    date: typeof it.date === "string" ? new Date(it.date).toLocaleDateString() : "",
                    amount: String(it.amount || ""),
                    avatarUrl: String(it.avatarUrl || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
                    isPix: false,
                }));
                setTransactions(mapped);
            } catch {
                toast.error("Network error");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const resolvedPixNumber = useMemo(() => {
        const pm = profile?.payoutMethod as any;
        if (!pm || typeof pm !== "object" || pm.type !== "pix") return pixNumber;
        const raw = typeof pm.pixKey === "string" ? pm.pixKey : typeof pm.holderCpfCnpj === "string" ? pm.holderCpfCnpj : "";
        const digits = raw.replace(/\D/g, "");
        if (digits.length >= 6) return `***${digits.slice(3, 6)}.***-${digits.slice(-2)}`;
        return raw ? "***" : pixNumber;
    }, [pixNumber, profile?.payoutMethod]);

    const filteredTransactions = transactions.filter((t) => {
        if (filter === "all") return true;
        if (filter === "credits") return t.type === "credit";
        if (filter === "withdrawals") return t.type === "withdrawal";
        return true;
    });

    return (
        <div className="bg-[#F4F5FA] min-h-screen">
            <Header title={t("wallet.wallet")} />

            <div className="pt-3 pb-8 space-y-3">
                {/* Balance Card */}
                {loading ? (
                    <BalanceCardSkeleton />
                ) : (
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                        <div className="text-[20px] font-bold text-[#1C1C1E] leading-[26px]">
                            {t("wallet.availableBalance") || "Saldo Disponível"}
                        </div>
                        <div className="text-[13px] text-[#8E8E93] mt-1">
                            Valores liberados para saque.
                        </div>
                        <div className="flex items-end justify-between mt-2">
                            <div className="text-[26px] font-bold text-[#3F78D8] leading-none">
                                {currency} {balance}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleWithdraw}
                                    className="h-8 px-4 rounded-md bg-[#3F78D8] text-white text-[13px] font-medium hover:bg-[#2f68c8] transition-colors"
                                >
                                    {t("wallet.withdraw") || "Sacar"}
                                </button>
                                <button
                                    onClick={() => router.push("/Veterinarian/Menu/wallet/bankDetails")}
                                    className="h-8 px-4 rounded-md bg-[#3F78D8] text-white text-[13px] font-medium hover:bg-[#2f68c8] transition-colors"
                                >
                                    {t("wallet.bankDetails") || "Dados Bancários"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statement Card */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                    <div className="text-[20px] font-bold text-[#1C1C1E] leading-[26px]">
                        {t("wallet.statement") || "Extrato"}
                    </div>
                    <div className="text-[13px] text-[#8E8E93] mt-1 mb-3">
                        Suas movimentações recentes.
                    </div>

                    {/* Period tabs */}
                    <div className="flex gap-2 mb-3">
                        {(["7d", "30d", "90d"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1 text-[13px] font-medium rounded-md border transition-colors ${period === p
                                    ? "bg-[#E5EDF9] border-[#3F78D8] text-[#3F78D8]"
                                    : "bg-white border-[#E5E7EB] text-[#1C1C1E]"
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Transaction List */}
                    {loading ? (
                        <>
                            <ListItemSkeleton />
                            <ListItemSkeleton />
                        </>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-[14px] font-semibold text-[#8E8E93]">
                                Sem movimentações ainda
                            </p>
                            <p className="text-[12px] text-[#8E8E93] mt-1 leading-[1.5] px-4">
                                Quando seus pagamentos forem confirmados, eles aparecerão aqui.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between rounded-lg bg-[#F4F5FA] px-4 py-2.5"
                                >
                                    <div className="text-[14px] text-[#1C1C1E]">
                                        {transaction.title}
                                    </div>
                                    {transaction.amount && (
                                        <div className={`text-[14px] font-semibold ${transaction.type === "credit"
                                            ? "text-[#3F78D8]"
                                            : "text-[#EF4444]"
                                            }`}>
                                            {transaction.type === "withdrawal" ? "-" : ""}R$ {transaction.amount}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filter tabs */}
                    <div className="flex gap-2 mt-4 justify-center">
                        {([
                            { key: "all" as const, label: t("wallet.all") || "Todos" },
                            { key: "credits" as const, label: t("wallet.credits") || "Créditos" },
                            { key: "withdrawals" as const, label: t("wallet.withdrawals") || "Saques" },
                        ]).map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-1 text-[13px] font-medium rounded-md border transition-colors ${filter === f.key
                                    ? "bg-[#E5EDF9] border-[#3F78D8] text-[#3F78D8]"
                                    : "bg-white border-[#E5E7EB] text-[#1C1C1E]"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
