'use client'

import React from "react";
import Header from "@/components/common/header";
import { Laptop, Monitor, Smartphone, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

type SessionRow = {
  id: string;
  label: string;
  rightLabel?: string;
  icon:
  | { type: "smartphone" }
  | { type: "laptop" }
  | { type: "monitor" }
  | { type: "google" };
};

export default function SecurityPage() {
  const { t } = useTranslation();
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState<boolean | null>(null);
  const [changeOpen, setChangeOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [sessions, setSessions] = React.useState<SessionRow[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.profile) {
          setTwoFactorEnabled(Boolean(data.profile.twoFactorEnabled));
        } else {
          setTwoFactorEnabled(false);
        }
      } catch {
        setTwoFactorEnabled(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/sessions", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data?.items)) {
          const rows: SessionRow[] = data.items.map((it: any) => {
            const os = it.type === "android" ? "Android" : "iOS";
            const right = it.isCurrent ? `${os} • ${t("security.thisDevice")}` : os;
            return {
              id: String(it.id),
              label: String(it.model),
              rightLabel: right,
              icon: { type: "smartphone" },
            };
          });
          setSessions(rows);
        } else {
          setSessions([]);
        }
      } catch {
        setSessions([]);
      }
    })();
  }, [t]);
  return (
    <div className="min-h-screen bg-[#F5F6F6]">
      <Header title={t("menu.security")} />

      <div className="px-4 pt-4 pb-10">
        <div className="space-y-3">
          <div className="rounded-2xl bg-white px-4 py-4 flex items-center justify-between">
            <div className="text-[15px] text-[#111827] font-medium">{t("security.twoFactorAuth")}</div>
            <button
              type="button"
              onClick={async () => {
                try {
                  const next = !Boolean(twoFactorEnabled);
                  const res = await fetch("/api/user/two-factor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ enabled: next }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    toast.error(typeof data?.error === "string" ? data.error : "Failed to update 2FA");
                    return;
                  }
                  setTwoFactorEnabled(next);
                  toast.success(next ? "Two-factor enabled" : "Two-factor disabled");
                } catch {
                  toast.error("Network error updating 2FA");
                }
              }}
              className="h-10 px-6 rounded-full bg-[#4A7BF7] text-white text-[14px] font-medium"
            >
              {twoFactorEnabled ? "Deactivate" : t("security.activate")}
            </button>
          </div>

          <div className="rounded-2xl bg-white px-4 py-4 flex items-center justify-between">
            <div className="text-[15px] text-[#111827] font-medium">{t("security.changePassword")}</div>
            <button
              type="button"
              onClick={() => setChangeOpen(true)}
              className="h-10 px-6 rounded-full bg-[#4A7BF7] text-white text-[14px] font-medium"
            >
              {t("security.change")}
            </button>
          </div>

          <div className="rounded-3xl bg-white px-4 pt-4 pb-5">
            <div className="text-[15px] text-[#111827] font-semibold mb-3">{t("security.activeSessions")}</div>

            <div className="rounded-2xl bg-[#F5F6F6] p-2 space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="rounded-xl bg-white px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg border border-[#4A7BF7] flex items-center justify-center bg-white">
                      {s.icon.type === "smartphone" && <Smartphone className="w-5 h-5 text-[#4A7BF7]" />}
                      {s.icon.type === "laptop" && <Laptop className="w-5 h-5 text-[#4A7BF7]" />}
                      {s.icon.type === "monitor" && <Monitor className="w-5 h-5 text-[#4A7BF7]" />}
                      {s.icon.type === "google" && <span className="text-[14px] font-semibold text-[#4A7BF7]">G</span>}
                    </div>
                    <div className="text-[15px] text-[#111827] font-medium">{s.label}</div>
                  </div>

                  {s.rightLabel ? (
                    <div className="text-[14px] font-medium text-[#4A7BF7]">{s.rightLabel}</div>
                  ) : (
                    <div className="w-20" />
                  )}
                </div>
              ))}
            </div>

            {/* <button
              type="button"
              className="w-full mt-4 text-center text-[15px] font-medium text-[#EF4444]"
            >
              {t("security.disconnectAllDevices")}
            </button> */}
          </div>
        </div>
      </div>

      {changeOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
          <div className="w-full rounded-3xl bg-white p-5">
            <div className="text-[16px] font-semibold text-[#111827]">{t("security.changePassword")}</div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[14px] font-medium text-[#111827]">{t("security.currentPassword")}</div>
                <div className="relative mt-2">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-[48px] w-full rounded-[14px] bg-[#F5F6F6] px-4 pr-12 text-[15px] text-[#111827] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[14px] font-medium text-[#111827]">{t("security.newPassword")}</div>
                <div className="relative mt-2">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-[48px] w-full rounded-[14px] bg-[#F5F6F6] px-4 pr-12 text-[15px] text-[#111827] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[14px] font-medium text-[#111827]">{t("security.confirmNewPassword")}</div>
                <div className="relative mt-2">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-[48px] w-full rounded-[14px] bg-[#F5F6F6] px-4 pr-12 text-[15px] text-[#111827] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (!currentPassword || !newPassword) {
                    toast.error(t("security.pleaseFillAllFields"));
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    toast.error(t("security.passwordsDoNotMatch"));
                    return;
                  }
                  try {
                    setSaving(true);
                    const res = await fetch("/api/user/change-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      toast.error(typeof json?.error === "string" ? json.error : t("security.failedToChangePassword"));
                      return;
                    }
                    toast.success(t("security.passwordChanged"));
                    setChangeOpen(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="h-[52px] w-full rounded-full bg-[#4A7BF7] text-[15px] font-medium text-white disabled:opacity-60"
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangeOpen(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="h-[52px] w-full rounded-full bg-[#F5F6F6] text-[15px] font-medium text-[#111827]"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
