"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

export default function AdminVerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const sp = new URL(window.location.href).searchParams;
    const e = (sp.get("email") || "").trim();
    if (e) setEmail(e);
  }, []);

  const code = useMemo(() => otp.join(""), [otp]);
  const canVerify = useMemo(() => email.trim() && otp.every((d) => d.length === 1), [email, otp]);

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-[44px] leading-[1.1] font-semibold text-gray-900">Verify OTP</h1>
        <p className="mt-3 text-[18px] text-[#8A97A6]">Enter the 5-digit code we sent to your email.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[18px] font-semibold text-[#2E3642] mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            className="w-full h-[58px] rounded-[12px] bg-white border border-[#D8DEE7] px-5 text-[18px] text-[#2E3642] placeholder:text-[#9AA6B2] outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-[18px] font-semibold text-[#2E3642] mb-3">OTP</label>
          <div className="grid grid-cols-5 gap-3">
            {otp.map((v, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  refs.current[idx] = el;
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={v}
                onChange={(e) => {
                  const nextRaw = String(e.target.value || "");
                  const next = nextRaw.replace(/\D/g, "").slice(-1);
                  setOtp((prev) => {
                    const copy = [...prev];
                    copy[idx] = next;
                    return copy;
                  });
                  if (next && idx < 4) refs.current[idx + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                    refs.current[idx - 1]?.focus();
                  }
                }}
                className="h-[58px] rounded-[12px] bg-white border border-[#D8DEE7] text-center text-[22px] font-semibold text-[#2E3642] outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canVerify || submitting}
          onClick={async () => {
            if (!canVerify) {
              toast.error("Please enter email and OTP");
              return;
            }
            try {
              setSubmitting(true);
              const res = await fetch("/api/admin/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), otp: code }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) {
                toast.error(typeof json?.error === "string" ? json.error : "Verification failed");
                return;
              }
              const resetToken = typeof json?.reset_token === "string" ? json.reset_token : "";
              if (!resetToken.trim()) {
                toast.error("Verification failed");
                return;
              }
              sessionStorage.setItem("admin_reset_email", email.trim());
              sessionStorage.setItem("admin_reset_token", resetToken);
              toast.success("OTP verified");
              router.push("/admin/reset-password");
            } finally {
              setSubmitting(false);
            }
          }}
          className="w-full h-[72px] rounded-[16px] bg-primary text-white text-[22px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          disabled={!email.trim() || resending}
          onClick={async () => {
            if (!email.trim()) {
              toast.error("Please enter your email");
              return;
            }
            try {
              setResending(true);
              const res = await fetch("/api/admin/auth/forget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) {
                toast.error(typeof json?.error === "string" ? json.error : "Failed to resend");
                return;
              }
              toast.success(typeof json?.message === "string" ? json.message : "Code resent");
            } finally {
              setResending(false);
            }
          }}
          className="w-full h-[58px] rounded-[16px] bg-white border border-[#D8DEE7] text-[#2E3642] text-[18px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {resending ? "Resending..." : "Resend code"}
        </button>
      </div>

      <div className="mt-6 text-center">
        <span className="text-[18px] text-[#2E3642]">Back to </span>
        <Link href="/admin/login" className="text-[18px] font-semibold text-primary hover:text-[#2f67c7]">
          Sign in
        </Link>
      </div>
    </div>
  );
}
