"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/store/hooks";
import { setProfile as setUserProfile } from "@/store/userProfileSlice";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/modal";
import EmailVerification from "@/components/auth/EmailVerification";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("auth.pleaseEnterEmailAndPassword"));
      return;
    }
    try {
      setVerifying(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "veterinarian" }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : t("auth.loginFailed"));
        return;
      }
      if (data?.twoFactorRequired) {
        setTwoFARequired(true);
        return;
      }
      if (data?.profile) {
        dispatch(setUserProfile(data.profile));
      }
      toast.success(t("auth.loggedInSuccessfully"));
      router.push("/Veterinarian/home");
    } catch (err) {
      toast.error(t("auth.networkErrorDuringLogin"));
      console.error("Login network error:", err);
    } finally {
      setVerifying(false);
    }
  };

  const verify2FA = async (code: string) => {
    if (code.length !== 5) {
      toast.error(t("auth.verificationFailed"));
      return;
    }
    try {
      setVerifying(true);
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : t("auth.verificationFailed"));
        return;
      }
      if (data?.profile) {
        dispatch(setUserProfile(data.profile));
      }
      toast.success(t("auth.loggedInSuccessfully"));
      setTwoFARequired(false);
      router.push("/Veterinarian/home");
    } finally {
      setVerifying(false);
    }
  };

  const resend2FA = async () => {
    try {
      setResending(true);
      const res = await fetch("/api/auth/2fa/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : t("auth.loginFailed"));
        return;
      }
      toast.success(data?.message ?? t("auth.codeResent"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F2F2F7]">
      <div className="flex-1 flex flex-col px-5 pb-10">
        {/* Logo with circular backdrop */}
        <div className="relative flex items-center justify-center h-[180px] overflow-hidden mb-4">
          <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[340px] h-[280px] bg-white rounded-full" />
          <span className="relative text-[32px] font-bold text-[#1C1C1E] tracking-tight leading-none mt-6">
            VetQuark<sup className="text-[13px] font-normal align-super">™</sup>
          </span>
        </div>

        {/* Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-[38px] font-bold text-primary leading-tight mb-2">
            {t("auth.welcome")}
          </h1>
          <p className="text-[#6C6C70] text-[15px] leading-snug max-w-[220px] mx-auto">
            {t("auth.accountTypePrompt")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder={t("auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-[17px] bg-[#EBEBF0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-[#1C1C1E] text-[15px] placeholder-[#8E8E93] border-0"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-[17px] bg-[#EBEBF0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-[#1C1C1E] text-[15px] placeholder-[#8E8E93] border-0 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] bg-transparent border-0 cursor-pointer p-0"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Forgot password - centered */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => router.push("/forget-password")}
              className="text-primary text-[14px] font-medium bg-transparent border-0 cursor-pointer"
            >
              {t("auth.forgotPassword")}
            </button>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full bg-primary text-white font-bold text-[16px] py-[17px] rounded-2xl transition-colors cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {verifying ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t("auth.login")}
              </span>
            ) : (
              t("auth.login")
            )}
          </button>
        </form>

        {/* Create Account - underlined */}
        <div className="text-center mt-7">
          <button
            onClick={() => router.push("/signup")}
            className="text-primary text-[15px] font-medium underline underline-offset-2 bg-transparent border-0 cursor-pointer"
          >
            {t("auth.createAccount")}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-12 text-center text-[12px]">
          <Link href="/legal/terms" className="text-primary underline underline-offset-1">
            {t("auth.termsOfService")}
          </Link>
          <span className="mx-1 text-primary">•</span>
          <Link href="/legal/privacy" className="text-primary underline underline-offset-1">
            {t("auth.privacyPolicyFooter")}
          </Link>
        </div>
      </div>

      <Modal isOpen={twoFARequired} onClose={() => setTwoFARequired(false)} className="max-w-[420px] p-0">
        <EmailVerification
          mode="modal"
          title={t("auth.emailVerification")}
          codeLength={5}
          initialTimer={600}
          onSubmit={(code) => verify2FA(code)}
          onResend={() => resend2FA()}
          onClose={() => setTwoFARequired(false)}
        />
      </Modal>
    </div>
  );
}
