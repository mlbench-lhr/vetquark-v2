"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const e = sessionStorage.getItem("admin_reset_email") || "";
    const t = sessionStorage.getItem("admin_reset_token") || "";
    setEmail(e);
    setResetToken(t);
    if (!e.trim() || !t.trim()) router.replace("/admin/forgot-password");
  }, [router]);

  const canSubmit = useMemo(
    () => password.trim() && confirmPassword.trim() && password === confirmPassword && email.trim() && resetToken.trim(),
    [password, confirmPassword, email, resetToken]
  );

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-[44px] leading-[1.1] font-semibold text-gray-900">Reset Password?</h1>
        <p className="mt-3 text-[18px] text-[#8A97A6]">Create a new password below.</p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!password.trim() || !confirmPassword.trim()) {
            toast.error("Please enter your new password");
            return;
          }
          if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
          }
          try {
            setSubmitting(true);
            const res = await fetch("/api/admin/auth/reset", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                reset_token: resetToken,
                new_password: password,
              }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              toast.error(typeof json?.error === "string" ? json.error : "Failed to reset password");
              return;
            }
            sessionStorage.removeItem("admin_reset_email");
            sessionStorage.removeItem("admin_reset_token");
            toast.success("Password reset successfully");
            router.replace("/admin/login");
          } finally {
            setSubmitting(false);
          }
        }}
        className="space-y-6"
      >
        <div>
          <label className="block text-[18px] font-semibold text-[#2E3642] mb-2">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="new-password"
            className="w-full h-[58px] rounded-[12px] bg-white border border-[#D8DEE7] px-5 text-[18px] text-[#2E3642] placeholder:text-[#9AA6B2] outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-[18px] font-semibold text-[#2E3642] mb-2">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className="w-full h-[58px] rounded-[12px] bg-white border border-[#D8DEE7] px-5 text-[18px] text-[#2E3642] placeholder:text-[#9AA6B2] outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full h-[72px] rounded-[16px] bg-primary text-white text-[22px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Resetting..." : "Continue"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/admin/login" className="text-[18px] font-semibold text-primary hover:text-[#2f67c7]">
          Back to Sign in
        </Link>
      </div>
    </div>
  );
}
