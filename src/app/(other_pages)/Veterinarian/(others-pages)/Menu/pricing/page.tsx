'use client'
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Pencil } from "lucide-react";
import Header from "@/components/common/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";

export default function BasePriceCard() {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((s) => s.userProfile.profile);

    const [platformFee, setPlatformFee] = useState(33.0);
    const [minSuggested, setMinSuggested] = useState(59.0);
    const [maxSuggested, setMaxSuggested] = useState(119.0);

    const initialAmount = useMemo(() => profile?.baseExamPrice ?? 89.9, [profile?.baseExamPrice]);
    const PANEL_DEFS = useMemo(
        () => [
            { code: "VETQ_U_START", title: "U-Start", description: "Essential Urinary Triage (LEU, NIT, BLD, PH, SG)", suggested: 33.9 },
            { code: "VETQ_METABOLIC_CHECK", title: "Metabolic Check", description: "Metabolic Screening (GLU, KET, PH, SG)", suggested: 49.9 },
            { code: "VETQ_RENAL_EXPRESS", title: "Renal Express", description: "Early Renal Screening (GLU, KET, PH, SG)", suggested: 59.9 },
            { code: "VETQ_RENAL_ADVANCED", title: "Renal Advanced", description: "Renal + Minerals (PRO, MAL, CRE, CA, MG, PH, SG)", suggested: 69.9 },
            { code: "VETQ_HEPATOSCREEN", title: "HepatoScreen", description: "Indirect Hepatobiliary Screening (BIL, UBG, PH, SG)", suggested: 49.9 },
            { code: "VETQ_GERIATRIC_CARE", title: "Geriatric Care", description: "Preventive 7+ Protocol (GLU, KET, PRO, MAL, CRE, CA, BIL, UBG, LEU, NIT, BLD, PH, SG)", suggested: 79.9 },
        ],
        []
    );

    const [amount, setAmount] = useState(initialAmount);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const initialPanelPrices = useMemo(() => {
        const raw = profile?.panelPrices && typeof profile.panelPrices === "object" ? profile.panelPrices : {};
        return Object.fromEntries(
            PANEL_DEFS.map((p) => {
                const v = (raw as any)?.[p.code];
                const n = typeof v === "number" ? v : Number(v);
                const price = Number.isFinite(n) && n >= 0 ? n : p.suggested;
                return [p.code, price];
            })
        ) as Record<string, number>;
    }, [PANEL_DEFS, profile?.panelPrices]);
    const [panelPrices, setPanelPrices] = useState<Record<string, number>>(initialPanelPrices);

    useEffect(() => {
        setAmount(initialAmount);
    }, [initialAmount]);

    useEffect(() => {
        setPanelPrices(initialPanelPrices);
    }, [initialPanelPrices]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/platform/settings", { credentials: "include" });
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                if (res.ok && data) {
                    const fee = typeof data.platformFee === "number" ? data.platformFee : 33.0;
                    const min = typeof data.minSuggested === "number" ? data.minSuggested : 59.0;
                    const max = typeof data.maxSuggested === "number" ? data.maxSuggested : 119.0;
                    setPlatformFee(fee);
                    setMinSuggested(min);
                    setMaxSuggested(max);
                }
            } catch {
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const netPayout = amount - platformFee;

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setAmount(value);
    };

    const handleSave = async () => {
        try {
            setIsEditing(false);
            setSaving(true);
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ baseExamPrice: amount, panelPrices }),
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

    const handleReset = () => {
        const midPoint = (minSuggested + maxSuggested) / 2;
        setAmount(midPoint);
        setPanelPrices(
            Object.fromEntries(PANEL_DEFS.map((p) => [p.code, p.suggested])) as Record<string, number>
        );
    };

    return (
        <div className="w-full bg-background flex flex-col">
            {/* Header */}
            <Header title="Pricing" />

            <div className="mb-4">
                <h1 className="text-[18px] font-semibold text-foreground mb-2">Master 360</h1>
                <p className="text-[14px] text-muted-foreground leading-[1.5]">
                    This is the amount that the tutor will pay for complete 16-parameter Protocol. The platform will apply a fixed fee of R$ {platformFee.toFixed(2)} on this amount and on specific panels also.
                </p>
            </div>

            {/* Amount Card */}
            <div className="bg-[hsl(220,20%,97%)] rounded-xl p-4 mb-3">
                <p className="text-[13px] text-muted-foreground mb-1">
                    Amount For The Tutor
                </p>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <div className="flex items-center">
                            <span className="text-[28px] font-semibold text-[hsl(217,91%,40%)]">R$ </span>
                            <input
                                type="number"
                                value={amount}
                                onChange={handleAmountChange}
                                onBlur={() => setIsEditing(false)}
                                autoFocus
                                step="0.01"
                                className="text-[28px] font-semibold text-[hsl(217,91%,40%)] bg-transparent border-b-2 border-[hsl(217,91%,40%)] outline-none w-24"
                            />
                        </div>
                    ) : (
                        <>
                            <span className="text-[28px] font-semibold text-[hsl(217,91%,40%)]">
                                R$ {amount.toFixed(2)}
                            </span>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                            >
                                <Pencil className="w-5 h-5 text-[hsl(217,91%,40%)]" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Suggested Range */}
            <p className="text-[13px] text-muted-foreground mb-4">
                Suggested range by the platform: R$ {minSuggested.toFixed(2)} – R$ {maxSuggested.toFixed(2)}
            </p>

            {/* Net Payout Card */}
            <div
                className="rounded-xl p-4"
                style={{
                    background: "linear-gradient(135deg, hsl(140, 50%, 96%) 0%, hsl(140, 40%, 92%) 100%)"
                }}
            >
                <p className="text-[13px] text-muted-foreground mb-1">
                    Your net payout per exam will be:
                </p>
                <span className="text-[28px] font-semibold text-[hsl(145,63%,35%)]">
                    R$ {netPayout.toFixed(2)}
                </span>
            </div>

            <div className="mt-6">
                <h2 className="text-[16px] font-semibold text-foreground mb-3">Panel Pricing</h2>
                <div className="space-y-5">
                    {PANEL_DEFS.map((p) => (
                        <div key={p.code}>
                            <div className="text-[15px] font-medium text-foreground mb-2">{p.title}</div>
                            <div className="bg-[hsl(220,20%,97%)] rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[16px] font-medium text-foreground">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={panelPrices[p.code] ?? p.suggested}
                                        onChange={(e) => {
                                            const next = parseFloat(e.target.value);
                                            setPanelPrices((prev) => ({
                                                ...prev,
                                                [p.code]: Number.isFinite(next) && next >= 0 ? next : 0,
                                            }));
                                        }}
                                        className="w-full bg-transparent outline-none text-[16px] font-medium text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="mt-2 text-[12px] text-muted-foreground leading-[1.5]">{p.description}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Buttons */}
            <div className="space-y-3 pt-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-[52px] bg-[hsl(224,65%,56%)] hover:bg-[hsl(224,65%,50%)] text-white text-[16px] font-medium rounded-full transition-colors"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                    onClick={handleReset}
                    className="w-full h-[44px] text-muted-foreground text-[15px] font-medium hover:text-foreground transition-colors"
                >
                    Reset To Suggestion
                </button>
            </div>
        </div>
    );
}
