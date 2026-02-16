"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = useMemo(() => email.trim(), [email]);

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-[44px] leading-[1.1] font-semibold text-gray-900">Forgot Password?</h1>
        <p className="mt-3 text-[18px] text-[#8A97A6]">
          Don’t worry it happens, we will send a verification code to your email.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) {
            toast.error("Please enter your email");
            return;
          }
          try {
            setSubmitting(true);
            const res = await fetch("/api/admin/auth/forget", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.trim() }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              toast.error(typeof json?.error === "string" ? json.error : "Failed to send code");
              return;
            }
            toast.success(typeof json?.message === "string" ? json.message : "Code sent");
            router.push(`/admin/verify-otp?email=${encodeURIComponent(email.trim())}`);
          } finally {
            setSubmitting(false);
          }
        }}
        className="space-y-6"
      >
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

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full h-[72px] rounded-[16px] bg-primary text-white text-[22px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending..." : "Send OTP"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-[18px] text-[#2E3642]">Remember your password? </span>
        <Link href="/admin/login" className="text-[18px] font-semibold text-primary hover:text-[#2f67c7]">
          Sign in
        </Link>
      </div>
    </div>
  );
}
