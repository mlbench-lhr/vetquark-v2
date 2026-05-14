"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Eye, EyeOff, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function ForgetForm() {
    const { t } = useTranslation();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");

    const OTP_LENGTH = 6;
    const RESEND_COOLDOWN_SECONDS = 35;
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [countdown, setCountdown] = useState(0);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);

    const passwordRequirements = [
        { key: "minLength", label: t("auth.passwordReqMinLength"), test: (pwd: string) => pwd.length >= 8 },
        { key: "upperLower", label: t("auth.passwordReqUpperLower"), test: (pwd: string) => /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) },
        { key: "number", label: t("auth.passwordReqNumber"), test: (pwd: string) => /\d/.test(pwd) },
        { key: "special", label: t("auth.passwordReqSpecial"), test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
    ];
    const passwordStrength = passwordRequirements.filter((r) => r.test(password)).length;
    const passwordStrengthPercent = (passwordStrength / passwordRequirements.length) * 100;

    useEffect(() => {
        if (countdown <= 0) return;
        const id = setTimeout(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
        return () => clearTimeout(id);
    }, [countdown]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < OTP_LENGTH - 1) {
            setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const raw = e.clipboardData.getData("text");
        const digits = raw.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
        if (digits.length === 0) return;
        e.preventDefault();
        const newOtp = Array(OTP_LENGTH).fill("");
        for (let i = 0; i < digits.length; i++) newOtp[i] = digits[i];
        setOtp(newOtp);
        const focusIndex = digits.length >= OTP_LENGTH ? OTP_LENGTH - 1 : digits.length;
        setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
    };

    const handleInputClick = (index: number) => {
        const firstEmptyIndex = otp.findIndex((d) => !d);
        if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
            inputRefs.current[firstEmptyIndex]?.focus();
        }
    };

    const sendOTP = async () => {
        if (!email.trim()) {
            toast.error(t("auth.emailRequired"));
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch("/api/auth/forget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (!response.ok) {
                toast.error(typeof result.message === "string" ? result.message : t("auth.failedToSendOtp"));
                return;
            }
            toast.success(result.message ?? t("auth.otpSentToEmail"));
            setCountdown(RESEND_COOLDOWN_SECONDS);
            setStep(2);
        } catch (error) {
            toast.error(t("auth.networkErrorSendingOtp"));
            console.error("Network Error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0 || resending) return;
        setResending(true);
        try {
            const response = await fetch("/api/auth/forget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (!response.ok) {
                toast.error(typeof result.message === "string" ? result.message : t("auth.failedToSendOtp"));
                return;
            }
            toast.success(result.message ?? t("auth.otpSentToEmail"));
            setCountdown(RESEND_COOLDOWN_SECONDS);
        } catch (error) {
            toast.error(t("auth.networkErrorResendingOtp"));
            console.error("Network Error:", error);
        } finally {
            setResending(false);
        }
    };

    const verifyOTP = async () => {
        const token = otp.join("");
        if (token.length !== OTP_LENGTH) {
            toast.error(t("auth.enterOtpCode"));
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: token, purpose: "reset" }),
            });
            const result = await response.json();
            if (!response.ok) {
                toast.error(typeof result.error === "string" ? result.error : t("auth.verificationFailed"));
                return;
            }
            sessionStorage.setItem("email", email);
            if (typeof result.reset_token === "string" && result.reset_token.trim()) {
                sessionStorage.setItem("reset_token", result.reset_token);
            }
            sessionStorage.setItem("token", token);
            setStep(3);
        } catch (error) {
            toast.error(t("auth.networkErrorVerifyingOtp"));
            console.error("Network Error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (password !== confirmPassword) {
            toast.error(t("auth.passwordsDoNotMatch"));
            return;
        }
        if (passwordStrength < passwordRequirements.length) {
            toast.error(t("auth.passwordRequirementsNotMet"));
            return;
        }
        setSubmitting(true);
        try {
            const resetToken = sessionStorage.getItem("reset_token") || "";
            const response = await fetch("/api/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: sessionStorage.getItem("token"), reset_token: resetToken, new_password: password }),
            });
            const result = await response.json();
            if (!response.ok) {
                toast.error(typeof result.error === "string" ? result.error : t("auth.failedToResetPassword"));
                return;
            }
            toast.success(result.message ?? t("auth.passwordResetSuccessfully"));
            sessionStorage.removeItem("email");
            sessionStorage.removeItem("reset_token");
            sessionStorage.removeItem("token");
            router.push("/signin");
        } catch (error) {
            toast.error(t("auth.networkErrorResettingPassword"));
            console.error("Network Error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        if (step === 1) router.push("/signin");
        else setStep((s) => s - 1);
    };

    const getTitle = () => {
        if (step === 1) return t("auth.forgotPasswordTitle");
        if (step === 2) return t("auth.emailVerification");
        return t("auth.resetPasswordTitle");
    };

    const getDesc = () => {
        if (step === 1) return t("auth.forgotPasswordDesc");
        if (step === 2) return t("auth.enterOtpCode");
        return t("auth.createNewPassword");
    };

    return (
        <div className="min-h-[100dvh] flex flex-col bg-[#F2F2F7]">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-2">
                <button
                    onClick={handleBack}
                    className="w-[36px] h-[36px] rounded-full bg-[#EBEBF0] flex items-center justify-center border-0 cursor-pointer shrink-0"
                >
                    <ChevronLeft size={20} className="text-[#1C1C1E]" />
                </button>
                <h2 className="text-[18px] font-bold text-primary">{getTitle()}</h2>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-4 pb-8">
                <p className="text-[14px] text-[#6C6C70] mb-6">{getDesc()}</p>

                {step === 1 && (
                    <form id="forget-step-1" onSubmit={(e) => { e.preventDefault(); sendOTP(); }} className="space-y-4">
                        <input
                            type="email"
                            placeholder={t("auth.email")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-[17px] bg-[#EBEBF0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-[#1C1C1E] text-[15px] placeholder-[#8E8E93] border-0"
                        />
                    </form>
                )}

                {step === 2 && (
                    <form id="forget-step-2" onSubmit={(e) => { e.preventDefault(); verifyOTP(); }} className="space-y-6">
                        <div className="flex justify-center gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    value={digit}
                                    onPaste={handlePaste}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onClick={() => handleInputClick(index)}
                                    className="w-[48px] h-[52px] text-center bg-[#EBEBF0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-[18px] font-medium text-[#1C1C1E] border-0"
                                    maxLength={1}
                                    autoComplete="off"
                                />
                            ))}
                        </div>
                        <div className="text-center">
                            <p className="text-[14px] font-semibold text-primary mb-1">{t("auth.didntGetCode")}</p>
                            <p className="text-[13px] text-[#8E8E93]">
                                {countdown > 0 ? (
                                    <span>{t("auth.resendIn")} {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}s</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resending}
                                        className="text-[#8E8E93] underline bg-transparent border-0 cursor-pointer text-[13px]"
                                    >
                                        {resending ? t("auth.sending") : t("auth.sendAgain")}
                                    </button>
                                )}
                            </p>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form id="forget-step-3" onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
                        {/* Password */}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t("auth.newPassword")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                required
                                className="w-full px-4 py-[17px] bg-[#EBEBF0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-[#1C1C1E] text-[15px] placeholder-[#8E8E93] border-0 pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] bg-transparent border-0 cursor-pointer p-0"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Strength */}
                        {(passwordFocused || password) && (
                            <div className="space-y-2 px-1">
                                <div className="h-[4px] w-full bg-[#E5E5EA] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${passwordStrengthPercent === 100 ? "bg-primary" : "bg-red-500"}`}
                                        style={{ width: `${passwordStrengthPercent}%` }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    {passwordRequirements.map((req) => (
                                        <div key={req.key} className="flex items-center gap-2 text-[13px]">
                                            <div className={`w-[16px] h-[16px] rounded-full border flex items-center justify-center shrink-0 ${req.test(password) ? "bg-primary border-primary" : "border-[#C7C7CC]"}`}>
                                                {req.test(password) && <Check size={9} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <span className={req.test(password) ? "text-[#1C1C1E]" : "text-[#8E8E93]"}>{req.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder={t("auth.confirmNewPassword")}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-[17px] bg-[#EBEBF0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-[#1C1C1E] text-[15px] placeholder-[#8E8E93] border-0 pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((p) => !p)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] bg-transparent border-0 cursor-pointer p-0"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-8 pt-4">
                <button
                    type="submit"
                    form={`forget-step-${step}`}
                    disabled={submitting}
                    className="w-full bg-primary text-white font-bold text-[16px] py-[17px] rounded-2xl transition-colors cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <span className="inline-flex items-center justify-center gap-2">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {step === 3 ? t("auth.reseting") : step === 2 ? t("auth.verifying") : t("auth.sending")}
                        </span>
                    ) : (
                        step === 3 ? t("auth.updatePassword") : step === 2 ? t("auth.verifyOtp") : t("auth.continue")
                    )}
                </button>
            </div>
        </div>
    );
}

