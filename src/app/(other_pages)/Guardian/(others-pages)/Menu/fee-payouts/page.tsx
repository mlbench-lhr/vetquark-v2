'use client'
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Header from "@/components/common/header";
import { useRouter } from "next/navigation";

interface FAQItem {
    question: string;
    answer: string;
}

export default function FeesAndPayoutsPage() {
    const router = useRouter();
    const [openFAQ, setOpenFAQ] = useState<number | null>(0);
    const platformFee = 33.0;
    const minWithdrawal = 20.0;

    const faqItems: FAQItem[] = [
        {
            question: "Can i charge below R$33.00?",
            answer: "It is not recommended; below this, your payout would be R$0.00 or negative.",
        },
        {
            question: "When will I see the money?",
            answer: "Credit is released in D+2 business days after payment confirmation and contributes to your available balance.",
        },
        {
            question: "PIX or bank account?",
            answer: "You can choose either PIX or bank account for withdrawals. Both methods are supported with no additional fees from the platform.",
        },
        {
            question: "What if the tutor doesn't pay?",
            answer: "If a tutor's payment is reversed, the amount is deducted from your balance. The platform handles all payment disputes.",
        },
    ];

    const toggleFAQ = (index: number) => {
        setOpenFAQ(openFAQ === index ? null : index);
    };

    return (
        <div className="w-full bg-background min-h-screen px-5 py-6 space-y-6">
            <Header title="Fees and Payouts" />
            {/* How the charging works */}
            <section>
                <h2 className="text-[16px] font-semibold text-foreground mb-3">
                    How the charging works?
                </h2>
                <div className="text-[14px] text-muted-foreground leading-[1.6] space-y-1">
                    <p>Fixed fee per exam: R$ {platformFee.toFixed(2)} (charged by the platform at the time of tutor payment).</p>
                    <p>Price to the tutor: set by you in Pricing.</p>
                    <p>Payout to the veterinarian: Price to the tutor – R$ {platformFee.toFixed(2)}.</p>
                </div>
            </section>

            {/* Flow Of Money */}
            <section>
                <h2 className="text-[16px] font-semibold text-foreground mb-3">
                    Flow Of Money
                </h2>
                <div className="text-[14px] text-muted-foreground leading-[1.7] space-y-1">
                    <p>1. Tutor pays for the exam (link/QR).</p>
                    <p>2. The platform retains R$ {platformFee.toFixed(2)}.</p>
                    <p>3. The net amount enters your Wallet as scheduled credit.</p>
                    <p>4. Credit is released in D+2 business days after payment confirmation.</p>
                    <p>5. Released amount contributes to your available balance (ready for withdrawal).</p>
                </div>
            </section>

            {/* Transparency of fees */}
            <section>
                <h2 className="text-[16px] font-semibold text-foreground mb-3">
                    Transparency of fees
                </h2>
                <div className="text-[14px] text-muted-foreground leading-[1.7] space-y-1">
                    <p>Platform: R$ {platformFee.toFixed(2)} per exam.</p>
                    <p>Payment methods: Costs already included in the platform fee.</p>
                    <p>Withdrawal: No additional fee from the platform (except for any external bank fees, if applicable).</p>
                </div>
            </section>

            {/* Quick questions - Accordion */}
            <section>
                <h2 className="text-[16px] font-semibold text-foreground mb-3">
                    Quick questions
                </h2>
                <div className="border border-border rounded-xl overflow-hidden">
                    {faqItems.map((item, index) => (
                        <div
                            key={index}
                            className={`${index !== faqItems.length - 1 ? "border-b border-border" : ""}`}
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-muted/30 transition-colors"
                            >
                                <span className="text-[14px] font-medium text-foreground">
                                    {item.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openFAQ === index ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-200 ${openFAQ === index ? "max-h-40" : "max-h-0"
                                    }`}
                            >
                                <p className="px-4 pb-4 text-[13px] text-muted-foreground leading-[1.5]">
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Withdrawals and Refunds */}
            <section>
                <h2 className="text-[16px] font-semibold text-foreground mb-3">
                    Withdrawals and Refunds
                </h2>
                <div className="text-[14px] text-muted-foreground leading-[1.7] space-y-1 mb-4">
                    <p>Withdrawals are requested on the Wallet screen for your registered payment method.</p>
                    <p>The minimum withdrawal amount is R$ {minWithdrawal.toFixed(2)}.</p>
                    <p>The processing time is up to 1 business day.</p>
                    <p>If a tutor&apos;s payment is reversed, the amount is deducted from your balance.</p>
                </div>
                <button
                    onClick={() => router.push("/Guardian/Menu/wallet")}
                    className="w-full h-[48px] bg-[hsl(224,65%,56%)] text-[hsl(220,20%,96%)] text-[15px] font-medium rounded-full transition-colors"
                >
                    Go To Wallet
                </button>
            </section>

            {/* Taxes and Invoices */}
            <section>
                <h2 className="text-[16px] font-semibold text-foreground mb-3">
                    Taxes and Invoices
                </h2>
                <p className="text-[14px] text-muted-foreground leading-[1.6]">
                    The fee of R$ {platformFee.toFixed(2)} does not include taxes for your CNPJ/CPF. Consult your accountant regarding the issuance of an invoice to the tutor, if applicable.
                </p>
            </section>
        </div>
    );
}
