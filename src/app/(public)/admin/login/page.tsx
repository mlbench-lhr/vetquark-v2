"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/auth/me", { credentials: "include" });
        if (!alive) return;
        if (res.ok) router.replace("/admin/dashboard");
      } catch { }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-[44px] leading-[1.1] font-semibold text-gray-900">Sign In</h1>
        <p className="mt-3 text-[18px] text-[#8A97A6]">Sign in to access your dashboard and records.</p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) {
            toast.error("Please enter email and password");
            return;
          }
          try {
            setSubmitting(true);
            const res = await fetch("/api/admin/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ email: email.trim(), password, remember }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              toast.error(typeof json?.error === "string" ? json.error : "Login failed");
              return;
            }
            toast.success("Signed in");
            router.replace("/admin/dashboard");
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

        <div>
          <label className="block text-[18px] font-semibold text-[#2E3642] mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full h-[58px] rounded-[12px] bg-white border border-[#D8DEE7] pl-5 pr-12 text-[18px] text-[#2E3642] placeholder:text-[#9AA6B2] outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/50 hover:text-black/70"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 gap-y-2 flex-wrap">
          <label className="inline-flex items-center gap-3 text-[18px] text-[#2E3642] select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-6 w-6 rounded-[6px] border border-[#D8DEE7] bg-white text-primary focus:ring-primary"
            />
            Remember for 30 days
          </label>

          <Link href="/admin/forgot-password" className="text-[18px] font-semibold text-primary hover:text-[#2f67c7]">
            Forgot password ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full h-[72px] rounded-[16px] bg-primary text-white text-[22px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
