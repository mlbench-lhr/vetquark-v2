'use client'
import { useEffect, useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import Header from "@/components/common/header";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface FAQItem {
    question: string;
    answer: string;
}

function AccordionSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
                <span className="text-[16px] font-bold text-[#1C1C1E]">{title}</span>
                <ChevronDown
                    className={`w-5 h-5 text-[#8E8E93] transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open && (
                <div className="px-5 pb-5">
                    {children}
                </div>
            )}
        </div>
    );
}

export default function FeesAndPayoutsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [openFAQ, setOpenFAQ] = useState<number | null>(0);
    const [platformFee, setPlatformFee] = useState(33.0);
    const [minWithdrawal, setMinWithdrawal] = useState(20.0);
    const [exampleCharge] = useState(89.90);

    const faqItems: FAQItem[] = [
        {
            question: t("feePayouts.faqCanIChargeBelow") || "Posso cobrar abaixo de R$ 33,00?",
            answer: t("feePayouts.faqCanIChargeBelowAnswer") || "Não é recomendado; abaixo disso, seu repasse será R$ 0,00 ou negativo.",
        },
        {
            question: t("feePayouts.faqWhenSeeMoneyQ") || "Quando vejo o dinheiro?",
            answer: t("feePayouts.faqWhenSeeMoneyA") || "Após a confirmação do pagamento, o valor líquido fica disponível na sua Carteira imediatamente.",
        },
        {
            question: t("feePayouts.faqPixOrBankQ") || "PIX ou conta?",
            answer: t("feePayouts.faqPixOrBankA") || "Você pode escolher PIX ou conta bancária para saques. Ambos são suportados sem taxas adicionais da plataforma.",
        },
        {
            question: t("feePayouts.faqTutorNoPayQ") || "E se o tutor não pagar?",
            answer: t("feePayouts.faqTutorNoPayA") || "Se um pagamento do tutor for estornado, o valor é debitado do seu saldo. A plataforma cuida de todas as disputas.",
        },
    ];

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/platform/settings", { credentials: "include" });
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                if (res.ok && data) {
                    const fee = typeof data.platformFee === "number" ? data.platformFee : 33.0;
                    const minW = typeof data.minWithdrawal === "number" ? data.minWithdrawal : 20.0;
                    setPlatformFee(fee);
                    setMinWithdrawal(minW);
                }
            } catch {
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <div className="w-full bg-[#F4F5FA] min-h-screen pb-8">
            <Header title={t("menu.feePayouts") || "Taxas e Repasse"} />

            <div className="pt-3 space-y-3">
                {/* How the charging works */}
                <AccordionSection title={t("feePayouts.howChargingWorks") || "Como funciona a cobrança"} defaultOpen>
                    <div className="text-[14px] text-[#9AA4AF] leading-[1.7] space-y-1.5 mb-4">
                        <p>Taxa fixa por exame: <span className="text-[#111827] font-medium">R$ {platformFee.toFixed(2)}</span> (cobrada pela plataforma no momento do pagamento do tutor).</p>
                        <p>Preço ao tutor: definido por você em Precificação.</p>
                        <p>Repasse ao veterinário: Preço ao tutor – R$ {platformFee.toFixed(2)}.</p>
                    </div>
                    <div className="bg-[#E5EDF9] rounded-xl px-4 py-3">
                        <p className="text-[13px] text-[#3F78D8] leading-[1.5]">
                            <span className="font-semibold">Exemplo rápido:</span> Se você cobra R$ {exampleCharge.toFixed(2)}, retemos R$ {platformFee.toFixed(2)} e você recebe R$ {(exampleCharge - platformFee).toFixed(2)}.
                        </p>
                    </div>
                </AccordionSection>

                {/* Flow of Money */}
                <AccordionSection title={t("feePayouts.flowOfMoney") || "Fluxo do dinheiro"}>
                    <div className="text-[14px] text-[#9AA4AF] leading-[1.7] space-y-1.5">
                        <p><span className="text-[#111827] font-medium">1.</span> O tutor paga pelo exame (link/QR).</p>
                        <p><span className="text-[#111827] font-medium">2.</span> A plataforma retém R$ {platformFee.toFixed(2)}.</p>
                        <p><span className="text-[#111827] font-medium">3.</span> O valor líquido entra na sua Carteira e fica disponível imediatamente.</p>
                        <p><span className="text-[#111827] font-medium">4.</span> Você pode sacar seu saldo disponível a qualquer momento via PIX ou banco.</p>
                    </div>
                </AccordionSection>

                {/* Transparency of Fees */}
                <AccordionSection title={t("feePayouts.transparencyOfFees") || "Transparência das taxas"}>
                    <div className="text-[14px] text-[#9AA4AF] leading-[1.7] space-y-1.5">
                        <p>Plataforma: <span className="text-[#111827] font-medium">R$ {platformFee.toFixed(2)}</span> por exame.</p>
                        <p>Métodos de pagamento: Custos já incluídos na taxa da plataforma.</p>
                        <p>Saque: Sem taxa adicional da plataforma (exceto tarifas bancárias externas, se aplicável).</p>
                    </div>
                </AccordionSection>

                {/* Quick Questions */}
                <AccordionSection title={t("feePayouts.quickQuestions") || "Perguntas rápidas"}>
                    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                        {faqItems.map((item, index) => (
                            <div
                                key={index}
                                className={index !== faqItems.length - 1 ? "border-b border-[#E5E7EB]" : ""}
                            >
                                <button
                                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                                    className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-[#F5F6F6]/50 transition-colors"
                                >
                                    <span className="text-[14px] font-medium text-[#111827] pr-3">{item.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-[#9AA4AF] flex-shrink-0 transition-transform duration-200 ${openFAQ === index ? "rotate-180" : ""}`}
                                    />
                                </button>
                                <div className={`overflow-hidden transition-all duration-200 ${openFAQ === index ? "max-h-40" : "max-h-0"}`}>
                                    <p className="px-4 pb-4 text-[13px] text-[#9AA4AF] leading-[1.5]">{item.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </AccordionSection>

                {/* Withdrawals and Refunds */}
                <AccordionSection title={t("feePayouts.withdrawalsAndRefunds") || "Saques e Reembolsos"}>
                    <div className="text-[14px] text-[#9AA4AF] leading-[1.7] space-y-1.5 mb-5">
                        <p>Os saques são solicitados na tela da Carteira para seu método de pagamento cadastrado.</p>
                        <p>O valor mínimo para saque é <span className="text-[#111827] font-medium">R$ {minWithdrawal.toFixed(2)}</span>.</p>
                        <p>O prazo de recebimento é de até 1 dia útil.</p>
                        <p>Se um pagamento do tutor for estornado, o valor é debitado do seu saldo.</p>
                    </div>
                    <button
                        onClick={() => router.push("/Veterinarian/Menu/wallet")}
                        className="w-full h-[44px] bg-[#3F78D8] text-white text-[14px] font-semibold rounded-lg hover:bg-[#2f68c8] transition-colors flex items-center justify-center gap-2"
                    >
                        <Wallet className="w-4 h-4" />
                        {t("feePayouts.goToWallet") || "Ir para a Carteira"}
                    </button>
                </AccordionSection>

                {/* Taxes and Notes */}
                <AccordionSection title={t("feePayouts.taxesAndNotes") || "Impostos e Notas"}>
                    <p className="text-[14px] text-[#9AA4AF] leading-[1.6]">
                        A taxa de R$ {platformFee.toFixed(2)} não inclui impostos do seu CNPJ/CPF. Consulte seu contador sobre a emissão de nota fiscal ao tutor, se aplicável.
                    </p>
                </AccordionSection>
            </div>
        </div>
    );
}
