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

    const platformFee = 33.0;
    const minSuggested = 59.0;
    const maxSuggested = 119.0;

    const initialAmount = useMemo(() => profile?.baseExamPrice ?? 89.9, [profile?.baseExamPrice]);

    const [amount, setAmount] = useState(initialAmount);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setAmount(initialAmount);
    }, [initialAmount]);

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
                body: JSON.stringify({ baseExamPrice: amount }),
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
    };

    return (
        <div className="w-full bg-background min-h-screen flex flex-col px-5 py-6">
            {/* Header */}
            <Header title="Pricing" />

            <div className="mb-4">
                <h1 className="text-[18px] font-semibold text-foreground mb-2">
                    Base Price Per Exam
                </h1>
                <p className="text-[14px] text-muted-foreground leading-[1.5]">
                    This is the amount that the tutor will pay. The platform will apply a fixed fee of R$ {platformFee.toFixed(2)} on this amount.
                </p>
            </div>

            {/* Amount Card */}
            <div className="bg-[hsl(220,20%,97%)] rounded-xl p-4 mb-3">
                <p className="text-[13px] text-muted-foreground mb-1">
                    Amount to the tutor (R$)
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
