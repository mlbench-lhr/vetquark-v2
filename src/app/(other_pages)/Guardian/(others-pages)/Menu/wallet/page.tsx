'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/common/header";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
        amount: "5,00",
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
        amount: "5,00",
        isPix: true,
    },
];

export default function WalletCard({
    balance = "925.00",
    currency = "R$",
    pixNumber = "***222.***-00",
    transactions = defaultTransactions,
    onWithdraw,
    onBankDetails,
}: WalletCardProps) {
    const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
    const [filter, setFilter] = useState<"all" | "credits" | "withdrawals">("all");
    const router = useRouter()

    const filteredTransactions = transactions.filter((t) => {
        if (filter === "all") return true;
        if (filter === "credits") return t.type === "credit";
        if (filter === "withdrawals") return t.type === "withdrawal";
        return true;
    });

    return (
        <div className="bg-background min-h-screen">
            <Header title="Wallet" />
            {/* Balance Card */}
            <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-[#F5F6F6] to-[#EBF2FF] p-5 text-white">
                <p className="text-sm opacity-90 mb-1 text-black">Available Balance</p>
                <p className="text-3xl font-bold text-primary">
                    {currency} {balance}
                </p>
            </div>
            <div className="flex gap-3 mx-4 mt-4">
                <Button
                    onClick={onWithdraw}
                    variant="secondary"
                    className="flex-1 h-12 rounded-full bg-[#F5F6F6] text-foreground font-medium hover:bg-white/90"
                >
                    Withdraw
                </Button>
                <Button
                    onClick={() => {
                        router.push("/Guardian/Menu/wallet/bankDetails")
                    }}
                    variant="outline"
                    className="flex-1 h-12 rounded-full border-white/40 bg-[#F5F6F6] text-black font-medium hover:bg-white/10"
                >
                    Bank Details
                </Button>
            </div>

            {/* PIX Info */}
            <div className="mx-4 mt-4 flex items-center gap-3 p-4 bg-[#F5F6F6] rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                    <Image src={"/images/pixLogo.svg"} alt="" width={20} height={20} />
                </div>
                <div>
                    <p className="font-medium text-foreground text-sm">PIX (CPF/CNPJ)</p>
                    <p className="text-xs text-muted-foreground">{pixNumber}</p>
                </div>
            </div>

            <div className="h-2 w-full bg-[#F5F6F6] mt-6"></div>

            {/* Statement Section */}
            <div className="mx-4 mt-6">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-semibold text-foreground">Statement</h2>
                    <div className="flex gap-1">
                        {(["7d", "30d", "90d"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 text-xs font-medium rounded-[8px] transition-colors ${period === p
                                    ? "bg-[#EBF2FF] text-primary"
                                    : "bg-[#F5F6F6] text-foreground hover:bg-muted/50"}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Your recent transactions</p>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                    {([
                        { key: "all", label: "All" },
                        { key: "credits", label: "Credits" },
                        { key: "withdrawals", label: "Withdrawals" },
                    ] as const).map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${filter === f.key
                                ? "bg-[#EBF2FF] text-primary"
                                : "bg-[#F5F6F6] text-foreground hover:bg-muted/50"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Transaction List */}
                <div className="space-y-2">
                    {filteredTransactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl"
                        >
                            {transaction.isPix ? (
                                <div className="w-10 h-10 rounded-full bg-[#00D4AA]/10 flex items-center justify-center flex-shrink-0">
                                    <Image src={"/images/pixLogo.svg"} alt="" width={20} height={20} />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                    <img
                                        src={transaction.avatarUrl}
                                        alt={transaction.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">
                                    {transaction.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {transaction.subtitle || transaction.date}
                                </p>
                            </div>
                            {transaction.amount ? (
                                <div className="text-right flex-shrink-0">
                                    <p
                                        className={`font-semibold text-sm ${transaction.type === "credit"
                                            ? "text-green-600"
                                            : "text-red-500"
                                            }`}
                                    >
                                        R$ {transaction.amount}
                                    </p>
                                    <p
                                        className={`text-xs ${transaction.type === "credit"
                                            ? "text-green-600"
                                            : "text-red-500"
                                            }`}
                                    >
                                        {transaction.type === "credit" ? "Credits" : "Withdrawal"}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground flex-shrink-0">
                                    {transaction.date}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
