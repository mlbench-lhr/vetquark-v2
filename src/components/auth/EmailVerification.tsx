"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

type Props = {
    mode?: "page" | "modal";
    title?: string;
    codeLength?: number;
    initialTimer?: number;
    onSubmit?: (code: string) => void;
    onResend?: () => void;
    onClose?: () => void;
};

export default function EmailVerification({
    mode = "page",
    title,
    codeLength = 5,
    initialTimer = 30,
    onSubmit,
    onResend,
    onClose,
}: Props) {
    const router = useRouter();
    const { t } = useTranslation();
    const displayTitle = title ?? t("auth.emailVerificationTitle");
    const [step, setStep] = useState<"code" | "success">("code");
    const [code, setCode] = useState(Array.from({ length: codeLength }, () => ""));
    const [timer, setTimer] = useState(initialTimer);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (timer > 0 && step === "code") {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer, step]);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < codeLength - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleContinue = () => {
        const token = code.join("");
        if (onSubmit) {
            onSubmit(token);
            return;
        }
        setStep("success");
    };

    const handleRequestNewCode = () => {
        if (onResend) {
            onResend();
        } else {
            setCode(Array.from({ length: codeLength }, () => ""));
            setTimer(initialTimer);
            inputRefs.current[0]?.focus();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (step === "success") {
        return (
            <div className={mode === "modal" ? "w-full p-5 flex flex-col" : "w-full min-h-[100dvh] bg-[#FAFAFF] flex flex-col"}
            >
                {mode === "page" && (
                    <div className="flex items-center gap-3 px-5 pt-6 pb-2">
                        <button
                            className="w-[36px] h-[36px] rounded-full bg-[#EBEBF0] flex items-center justify-center border-0 cursor-pointer shrink-0"
                            onClick={() => router.back()}
                        >
                            <ChevronLeft size={20} className="text-black/70" />
                        </button>
                        <h2 className="text-[18px] font-bold text-primary">{displayTitle}</h2>
                    </div>
                )}
                {mode === "modal" && (
                    <h2 className="text-[18px] font-bold text-primary mb-4">{displayTitle}</h2>
                )}

                <p className="text-[14px] text-[#6C6C70] mb-8 px-5">
                    {t("auth.emailVerifiedSuccess")}
                </p>

                <div className="flex justify-center items-center my-10">
                    <svg width="160" height="160" viewBox="0 0 220 220" className="block">
                        <defs>
                            <linearGradient id="ringGradient" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#3F78D8" />
                                <stop offset="100%" stopColor="#C7D9F8" />
                            </linearGradient>
                            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.06)" />
                            </filter>
                        </defs>
                        <g filter="url(#softShadow)">
                            <circle cx="110" cy="110" r="94" fill="none" stroke="url(#ringGradient)" strokeWidth="8" strokeDasharray="590" strokeDashoffset="590" strokeLinecap="round" transform="rotate(-85 110 110)" className="ring-path" />
                        </g>
                        <path d="M78 112 L100 134 L145 89" fill="none" stroke="#3F78D8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <style jsx>{`
                  @keyframes ring-draw { 0% { stroke-dashoffset: 590; } 100% { stroke-dashoffset: 0; } }
                  .ring-path { animation: ring-draw 2.2s ease-out forwards; }
                `}</style>

                <div className="mt-auto px-5 pb-8">
                    <button
                        onClick={() => {
                            if (onClose) onClose();
                            else router.push("/Veterinarian/home");
                        }}
                        className="w-full bg-primary text-white font-bold text-[16px] py-[17px] rounded-2xl transition-colors cursor-pointer border-0"
                    >
                        {t("auth.continue")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={mode === "modal" ? "w-full p-5 flex flex-col" : "w-full flex flex-col min-h-[100dvh] bg-[#FAFAFF]"}>
            {mode === "page" && (
                <div className="flex items-center gap-3 px-5 pt-6 pb-2">
                    <button
                        className="w-[36px] h-[36px] rounded-full bg-[#EBEBF0] flex items-center justify-center border-0 cursor-pointer shrink-0"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft size={20} className="text-black/70" />
                    </button>
                    <h2 className="text-[18px] font-bold text-primary">{displayTitle}</h2>
                </div>
            )}
            {mode === "modal" && (
                <h2 className="text-[18px] font-bold text-primary mb-3">{displayTitle}</h2>
            )}

            <p className={mode === "modal" ? "text-[14px] text-[#6C6C70] mb-6" : "text-[14px] text-black/70 mb-8 px-5 pt-2"}>
                {t("auth.codeSentToEmail")}
                <br />
                {t("auth.enterCodeToActivate")}
            </p>

            <div className={mode === "modal" ? "flex justify-center gap-2 mb-6" : "flex justify-center gap-3 mb-8 px-5"}>
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-[48px] h-[52px] text-center text-[18px] font-medium bg-[#EBEBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-black/70 border-0"
                    />
                ))}
            </div>

            <div className={mode === "modal" ? "text-center mb-6" : "text-center mb-8 px-5"}>
                <p className="text-[14px] font-semibold text-primary mb-1">{t("auth.didntReceiveCode")}</p>
                {timer > 0 ? (
                    <p className="text-[13px] text-[#8E8E93]">
                        {t("auth.requestNewCodeIn", { time: formatTime(timer) })}
                    </p>
                ) : (
                    <button
                        onClick={handleRequestNewCode}
                        className="text-[#8E8E93] underline bg-transparent border-0 cursor-pointer text-[13px]"
                    >
                        {t("auth.requestNewCode")}
                    </button>
                )}
            </div>

            <div className={mode === "modal" ? "mt-2" : "mt-auto px-5 pb-8"}>
                <button
                    onClick={handleContinue}
                    disabled={code.some((digit) => !digit)}
                    className="w-full bg-primary text-white font-bold text-[16px] py-[17px] rounded-2xl transition-colors cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {t("auth.continue")}
                </button>
            </div>
        </div>
    );
}
