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

function Section({
    title,
    children,
    defaultOpen = true,
    noBorderTop = false,
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    noBorderTop?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={` px-4 pt-4 ${noBorderTop ? "" : "border-t border-[#E5E5EA]"}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between pb-4 text-left"
            >
                <span className="text-[17px] font-bold text-[#1C1C1E] leading-tight pr-3">
                    {title}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-[#8E8E93] flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>
            <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="pb-5">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default function FeesAndPayoutsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const [platformFee, setPlatformFee] = useState(33.0);
    const [minWithdrawal, setMinWithdrawal] = useState(20.0);
    const [exampleCharge] = useState(89.9);

    const formatBRL = (n: number) =>
        `R$ ${n.toFixed(2).replace(".", ",")}`;

    const faqItems: FAQItem[] = [
        {
            question:
                t("feePayouts.faqCanIChargeBelow") ||
                `Posso cobrar abaixo de ${formatBRL(platformFee)}?`,
            answer:
                t("feePayouts.faqCanIChargeBelowAnswer") ||
                "Não é recomendado; abaixo disso, seu repasse será R$ 0,00 ou negativo.",
        },
        {
            question: t("feePayouts.faqWhenSeeMoneyQ") || "Quando vejo o dinheiro?",
            answer:
                t("feePayouts.faqWhenSeeMoneyA") ||
                "Após a confirmação do pagamento, o valor líquido fica disponível na sua Carteira em D+2 dias úteis.",
        },
        {
            question: t("feePayouts.faqPixOrBankQ") || "PIX ou conta?",
            answer:
                t("feePayouts.faqPixOrBankA") ||
                "Você pode escolher PIX ou conta bancária para saques. Ambos são suportados sem taxas adicionais da plataforma.",
        },
        {
            question: t("feePayouts.faqTutorNoPayQ") || "E se o tutor não pagar?",
            answer:
                t("feePayouts.faqTutorNoPayA") ||
                "Se um pagamento do tutor for estornado, o valor é debitado do seu saldo. A plataforma cuida de todas as disputas.",
        },
    ];

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/platform/settings", {
                    credentials: "include",
                });
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                if (res.ok && data) {
                    const fee =
                        typeof data.platformFee === "number" ? data.platformFee : 33.0;
                    const minW =
                        typeof data.minWithdrawal === "number"
                            ? data.minWithdrawal
                            : 20.0;
                    setPlatformFee(fee);
                    setMinWithdrawal(minW);
                }
            } catch { }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const repasse = exampleCharge - platformFee;

    return (
        <div className="w-full pb-10">
            <div className="px-4">
                <Header title={t("menu.feePayouts") || "Taxas e Repasse"} />
            </div>

            <div className="mt-3 border  rounded-lg overflow-hidden mx-4">
                {/* Como funciona a cobrança */}
                <Section
                    noBorderTop
                    title={t("feePayouts.howChargingWorks") || "Como funciona a cobrança"}
                >
                    <div className="text-[14px] text-[#3C3C43] leading-[1.6] space-y-[6px]">
                        <p>
                            <span className="font-bold text-[#1C1C1E]">Taxa fixa por exame:</span>{" "}
                            R$ 33,00 (cobrada pela plataforma no momento do pagamento do tutor).
                        </p>
                        <p>
                            <span className="font-bold text-[#1C1C1E]">Preço ao tutor:</span>{" "}
                            definido por você em Precificação.
                        </p>
                        <p>
                            <span className="font-bold text-[#1C1C1E]">Repasse ao veterinário:</span>{" "}
                            Preço ao tutor – {formatBRL(platformFee)}.
                        </p>
                    </div>
                    <div className="mt-3 bg-white rounded-md border px-4 py-3">
                        <p className="text-[13px] text-[#3C3C43] leading-[1.55]">
                            <span className="font-semibold text-[#1C1C1E]">Exemplo rápido:</span>{" "}
                            Se você cobra {formatBRL(exampleCharge)}, retemos {formatBRL(platformFee)} e você recebe{" "}
                            <span className="font-bold text-primary">{formatBRL(repasse)}</span>.
                        </p>
                    </div>
                </Section>

                {/* Fluxo do dinheiro */}
                <Section title={t("feePayouts.flowOfMoney") || "Fluxo do dinheiro"}>
                    <div className="text-[14px] text-[#3C3C43] leading-[1.7] space-y-[2px]">
                        <p>1. Tutor paga o exame (link/QR).</p>
                        <p>2. A plataforma retém R$ 33,00.</p>
                        <p>3. O valor líquido entra na sua <span className="font-bold text-[#1C1C1E]">Carteira</span> como crédito agendado.</p>
                        <p>4. Liberação do crédito em D+2 úteis após confirmação do pagamento.</p>
                        <p>5. Valor liberado compõe seu <span className="font-bold text-[#1C1C1E]">saldo disponível</span> (apto a saque).</p>
                    </div>
                </Section>

                {/* Transparência das taxas */}
                <Section
                    title={t("feePayouts.transparencyOfFees") || "Transparência das taxas"}
                >
                    <div className="text-[14px] text-[#3C3C43] leading-[1.7] space-y-[6px]">
                        <p>
                            <span className="font-bold text-[#1C1C1E]">Plataforma:</span>{" "}
                            {formatBRL(platformFee)} por exame.
                        </p>
                        <p>
                            <span className="font-bold text-[#1C1C1E]">Meios de pagamento:</span>{" "}
                            Custos já embutidos na taxa da plataforma.
                        </p>
                        <p>
                            <span className="font-bold text-[#1C1C1E]">Saque:</span>{" "}
                            Sem tarifa adicional pela plataforma (salvo tarifas bancárias externas, se houver).
                        </p>
                    </div>
                </Section>

                {/* Perguntas rápidas */}
                <Section
                    title={t("feePayouts.quickQuestions") || "Perguntas rápidas"}
                >
                    <div className="-mx-4 divide-y divide-[#E5E5EA] border-t border-[#E5E5EA]">
                        {faqItems.map((item, index) => {
                            const isOpen = openFAQ === index;
                            return (
                                <div key={index} className="px-4">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFAQ(isOpen ? null : index)}
                                        className="w-full flex items-center justify-between gap-3 py-[14px] text-left"
                                    >
                                        <span className="text-[14px] text-[#1C1C1E] leading-[1.4] font-medium">
                                            {item.question}
                                        </span>
                                        <ChevronDown
                                            className={`w-5 h-5 text-[#8E8E93] flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                                        <div className="overflow-hidden">
                                            <p className="pb-3 text-[13px] text-[#6C6C70] leading-[1.55]">{item.answer}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>

                {/* Saques e Reembolsos */}
                <Section
                    title={t("feePayouts.withdrawalsAndRefunds") || "Saques e Reembolsos"}
                >
                    <div className="text-[14px] text-[#3C3C43] leading-[1.7] space-y-[6px]">
                        <p>
                            Saques são solicitados na tela <span className="font-bold text-[#1C1C1E]">Carteira</span> para seu método de pagamento cadastrado.
                        </p>
                        <p>
                            O valor mínimo para saque é <span className="font-bold text-[#1C1C1E]">R$ {minWithdrawal.toFixed(2).replace(".", ",")}</span>.
                        </p>
                        <p>O prazo de recebimento é de até <span className="font-bold text-[#1C1C1E]">1 dia útil</span>.</p>
                        <p>Se um pagamento do tutor for estornado, o valor é debitado do seu saldo.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/Veterinarian/Menu/wallet")}
                        className="mt-4 w-full h-[48px] bg-primary text-white text-[15px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_16px_-4px_rgba(63,120,216,0.5)] active:opacity-90 transition-opacity"
                    >
                        <Wallet className="w-[18px] h-[18px]" />
                        {t("feePayouts.goToWallet") || "Ir para a Carteira"}
                    </button>
                </Section>

                {/* Impostos e Notas */}
                <Section
                    title={t("feePayouts.taxesAndNotes") || "Impostos e Notas"}
                >
                    <p className="text-[14px] text-[#3C3C43] leading-[1.65]">
                        A taxa de {formatBRL(platformFee)} não inclui impostos do seu CNPJ/CPF. Consulte seu contador sobre a emissão de nota fiscal ao tutor, se aplicável.
                    </p>
                </Section>
            </div>
        </div>
    );
}
