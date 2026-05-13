'use client'
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Pencil } from "lucide-react";
import Header from "@/components/common/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function BasePriceCard() {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((s) => s.userProfile.profile);

    const [platformFee, setPlatformFee] = useState(33.0);
    const [minSuggested, setMinSuggested] = useState(59.0);
    const [maxSuggested, setMaxSuggested] = useState(119.0);

    const initialAmount = useMemo(() => profile?.baseExamPrice ?? 89.9, [profile?.baseExamPrice]);
    const [panelDefs, setPanelDefs] = useState<Array<{ code: string; title: string; description: string; suggested: number; sortOrder: number }>>([]);

    const [amount, setAmount] = useState(initialAmount);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const initialPanelPrices = useMemo(() => {
        const raw = profile?.panelPrices && typeof profile.panelPrices === "object" ? profile.panelPrices : {};
        return Object.fromEntries(
            panelDefs.map((p) => {
                const v = (raw as any)?.[p.code];
                const n = typeof v === "number" ? v : Number(v);
                const price = Number.isFinite(n) && n >= 0 ? n : p.suggested;
                return [p.code, price];
            })
        ) as Record<string, number>;
    }, [panelDefs, profile?.panelPrices]);
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

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/panels", { method: "GET" });
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : [];
                const next = raw
                    .map((p) => {
                        const code = String(p?.code || "").trim();
                        if (!code || code === "VETQ_MASTER_360") return null;
                        const title = String(p?.title || "").trim() || code;
                        const subtitle = String(p?.subtitle || "").trim();
                        const descRaw = String(p?.description || "").trim();
                        const params = String(p?.params || "").trim();
                        const head = subtitle || descRaw;
                        const description = params ? (head ? `${head} (${params})` : params) : head;
                        const suggested = Number.isFinite(Number(p?.suggestedPriceBRL)) ? Number(p.suggestedPriceBRL) : 0;
                        const sortOrder = Number.isFinite(Number(p?.sortOrder)) ? Number(p.sortOrder) : 0;
                        return { code, title, description, suggested, sortOrder };
                    })
                    .filter(Boolean) as Array<{ code: string; title: string; description: string; suggested: number; sortOrder: number }>;
                next.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title));
                setPanelDefs(next);
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
            toast.success(t("common.savedChanges"));
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        const midPoint = (minSuggested + maxSuggested) / 2;
        setAmount(midPoint);
        setPanelPrices(
            Object.fromEntries(panelDefs.map((p) => [p.code, p.suggested])) as Record<string, number>
        );
    };

    return (
        <div className="w-full bg-white min-h-screen flex flex-col px-4">
            {/* Header */}
            <Header title="Pricing" />

            <div className="mb-4 mt-2">
                <h1 className="text-[18px] font-semibold text-[#111827] mb-2">Master 360</h1>
                <p className="text-[14px] text-[#9AA4AF] leading-[1.5]">
                    This is the amount that the tutor will pay for complete 16-parameter Protocol. The platform will apply a fixed fee of R$ {platformFee.toFixed(2)} on this amount and on specific panels also.
                </p>
            </div>

            {/* Amount Card */}
            <div className="bg-[#F5F6F6] rounded-xl p-4 mb-3">
                <p className="text-[13px] text-[#9AA4AF] mb-1">
                    Amount For The Tutor
                </p>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <div className="flex items-center">
                            <span className="text-[28px] font-semibold text-[#3F78D8]">R$ </span>
                            <input
                                type="number"
                                value={amount}
                                onChange={handleAmountChange}
                                onBlur={() => setIsEditing(false)}
                                autoFocus
                                step="0.01"
                                className="text-[28px] font-semibold text-[#3F78D8] bg-transparent border-b-2 border-[#3F78D8] outline-none w-24"
                            />
                        </div>
                    ) : (
                        <>
                            <span className="text-[28px] font-semibold text-[#3F78D8]">
                                R$ {amount.toFixed(2)}
                            </span>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                            >
                                <Pencil className="w-5 h-5 text-[#3F78D8]" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Suggested Range */}
            <p className="text-[13px] text-[#9AA4AF] mb-4">
                Suggested range by the platform: R$ {minSuggested.toFixed(2)} – R$ {maxSuggested.toFixed(2)}
            </p>

            {/* Net Payout Card */}
            <div className="rounded-xl p-4 bg-[#F0FDF4]">
                <p className="text-[13px] text-[#9AA4AF] mb-1">
                    Your net payout per exam will be:
                </p>
                <span className="text-[28px] font-semibold text-[#16A34A]">
                    R$ {netPayout.toFixed(2)}
                </span>
            </div>

            <div className="mt-6">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-3">Panel Pricing</h2>
                <div className="space-y-5">
                    {panelDefs.map((p) => (
                        <div key={p.code}>
                            <div className="text-[15px] font-medium text-[#111827] mb-2">{p.title}</div>
                            <div className="bg-[#F5F6F6] rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[16px] font-medium text-[#111827]">R$</span>
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
                                        className="w-full bg-transparent outline-none text-[16px] font-medium text-[#111827]"
                                    />
                                </div>
                            </div>
                            <div className="mt-2 text-[12px] text-[#9AA4AF] leading-[1.5]">{p.description}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Buttons */}
            <div className="space-y-3 pt-6 pb-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-[52px] bg-[#4A7BF7] hover:bg-[#3A6BE7] text-white text-[16px] font-medium rounded-full transition-colors"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                    onClick={handleReset}
                    className="w-full h-[44px] text-[#9AA4AF] text-[15px] font-medium hover:text-[#111827] transition-colors"
                >
                    Reset To Suggestion
                </button>
            </div>
        </div>
    );
}
