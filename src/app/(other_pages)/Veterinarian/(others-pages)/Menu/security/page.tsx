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
    <div className="bg-[#F2F2F7] min-h-screen">
      <Header title={t("menu.security")} />

      <div className="pt-4 pb-10">
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#EBEBF0] px-5 py-[18px] flex items-center justify-between">
            <div className="text-[15px] text-black/70 font-medium">{t("security.twoFactorAuth")}</div>
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
                  toast.success(next ? t("security.twoFactorEnabled") : t("security.twoFactorDisabled"));
                } catch {
                  toast.error(t("security.networkErrorUpdating2fa"));
                }
              }}
              className="h-[34px] px-5 rounded-xl bg-primary text-white text-[13px] font-semibold"
            >
              {twoFactorEnabled ? "Deactivate" : t("security.activate")}
            </button>
          </div>

          <div className="rounded-2xl bg-[#EBEBF0] px-5 py-[18px] flex items-center justify-between">
            <div className="text-[15px] text-black/70 font-medium">{t("security.changePassword")}</div>
            <button
              type="button"
              onClick={() => setChangeOpen(true)}
              className="h-[34px] px-5 rounded-xl bg-primary text-white text-[13px] font-semibold"
            >
              {t("security.change")}
            </button>
          </div>
        </div>

        <div className="mt-7">
          <div className="text-[15px] text-black/70 font-medium mb-3">{t("security.activeSessions")}</div>

          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-2xl bg-[#EBEBF0] px-4 py-[14px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {s.icon.type === "smartphone" && <Smartphone className="w-[22px] h-[22px] text-primary" />}
                  {s.icon.type === "laptop" && <Laptop className="w-[22px] h-[22px] text-primary" />}
                  {s.icon.type === "monitor" && <Monitor className="w-[22px] h-[22px] text-primary" />}
                  {s.icon.type === "google" && <span className="text-[14px] font-semibold text-primary">G</span>}
                  <div className="text-[15px] text-black/70 font-medium">{s.label}</div>
                </div>

                {s.rightLabel ? (
                  <div className="text-[12px] font-medium text-primary">{s.rightLabel}</div>
                ) : null}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="w-full mt-6 text-center text-[14px] font-medium text-black/70 hover:text-[#EF4444] transition-colors"
            onClick={async () => {
              try {
                const res = await fetch("/api/user/sessions", { method: "DELETE", credentials: "include" });
                if (res.ok) { toast.success(t("security.disconnectedAllDevices")); setSessions([]); }
                else { toast.error(t("security.failedToDisconnect")); }
              } catch { toast.error(t("security.networkError")); }
            }}
          >
            {t("security.disconnectAllDevices")}
          </button>
        </div>
      </div>

      {changeOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-0">
          <div className="w-full rounded-t-3xl bg-white px-5 pt-5 pb-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => { setChangeOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#EBEBF0]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <div className="text-[18px] font-bold text-black/70">{t("security.changePassword")}</div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[13px] font-medium text-black/70 mb-1.5">{t("security.currentPassword")}</div>
                <div className="relative">
                  <input
                    placeholder={t("security.enterCurrentPassword")}
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-[48px] w-full rounded-xl border border-[#E5E5EA] bg-white px-4 pr-12 text-[15px] text-black/70 outline-none placeholder:text-[#8E8E93] focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
                  >
                    {showCurrentPassword ? <EyeOff className="w-[20px] h-[20px]" /> : <Eye className="w-[20px] h-[20px]" />}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[13px] font-medium text-black/70 mb-1.5">{t("security.newPassword")}</div>
                <div className="relative">
                  <input
                    placeholder={t("security.enterNewPassword")}
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-[48px] w-full rounded-xl border border-[#E5E5EA] bg-white px-4 pr-12 text-[15px] text-black/70 outline-none placeholder:text-[#8E8E93] focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
                  >
                    {showNewPassword ? <EyeOff className="w-[20px] h-[20px]" /> : <Eye className="w-[20px] h-[20px]" />}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[13px] font-medium text-black/70 mb-1.5">{t("security.confirmNewPassword")}</div>
                <div className="relative">
                  <input
                    placeholder={t("security.confirmNewPasswordPlaceholder")}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-[48px] w-full rounded-xl border border-[#E5E5EA] bg-white px-4 pr-12 text-[15px] text-black/70 outline-none placeholder:text-[#8E8E93] focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-[20px] h-[20px]" /> : <Eye className="w-[20px] h-[20px]" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
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
                className="h-[52px] w-full rounded-xl bg-primary text-[16px] font-bold text-white disabled:opacity-60"
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
