"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ fullName: string; email: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/auth/me", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const p = json?.profile || {};
        setProfile({
          fullName: typeof p?.fullName === "string" ? p.fullName : "",
          email: typeof p?.email === "string" ? p.email : "",
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="text-gray-600">{profile?.email || ""}</div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/admin/auth/logout", { method: "POST" });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                  toast.error(typeof json?.error === "string" ? json.error : "Logout failed");
                  return;
                }
                router.replace("/admin/login");
              } catch {
                router.replace("/admin/login");
              }
            }}
            className="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Signed in as</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">{profile?.fullName || "Admin"}</div>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Quick action</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">Manage platform</div>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Status</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">All systems operational</div>
          </div>
        </div>
      </div>
    </div>
  );
}
