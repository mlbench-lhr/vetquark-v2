'use client'

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/common/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

type ToggleItem = {
  id: string;
  title: string;
  description: string;
  defaultOn: boolean;
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex items-center shrink-0",
        "w-[51px] h-[31px] rounded-full",
        checked ? "bg-primary" : "bg-[#78788029]",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        "transition-colors",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[2px] left-[2px]",
          "w-[27px] h-[27px] rounded-full bg-white",
          "shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]",
          checked ? "translate-x-[20px]" : "translate-x-0",
          "transition-transform",
        ].join(" ")}
      />
    </button>
  );
}

function SettingCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="rounded-2xl bg-[#EBEBF0] px-5 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] leading-[20px] font-semibold text-black/70">
          {title}
        </div>
        <div className="mt-1 text-[12px] leading-[16px] text-[#8E8E93]">
          {description}
        </div>
      </div>
      <div className="shrink-0">
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.userProfile.profile);
  const { t } = useTranslation();

  const pushItems: ToggleItem[] = useMemo(
    () => [
      {
        id: "signed-report",
        title: t("notifications.settings.signedReportTitle"),
        description: t("notifications.settings.signedReportDesc"),
        defaultOn: true,
      },
      {
        id: "payment-received",
        title: t("notifications.settings.paymentReceivedTitle"),
        description: t("notifications.settings.paymentReceivedDesc"),
        defaultOn: true,
      },
      {
        id: "pending-expired-payment",
        title: t("notifications.settings.pendingExpiredPaymentTitle"),
        description: t("notifications.settings.pendingExpiredPaymentDesc"),
        defaultOn: false,
      },
    ],
    [t]
  );

  const emailItems: ToggleItem[] = useMemo(
    () => [
      {
        id: "clinic-report-copy",
        title: t("notifications.settings.clinicReportCopyTitle"),
        description: t("notifications.settings.clinicReportCopyDesc"),
        defaultOn: true,
      },
      {
        id: "daily-summary",
        title: t("notifications.settings.dailySummaryTitle"),
        description: t("notifications.settings.dailySummaryDesc"),
        defaultOn: true,
      },
    ],
    [t]
  );

  const initialPush = useMemo(() => {
    const fromProfile = (profile?.notificationSettings as any)?.push;
    const record = fromProfile && typeof fromProfile === "object" ? (fromProfile as Record<string, unknown>) : {};
    return Object.fromEntries(
      pushItems.map((i) => [i.id, typeof record[i.id] === "boolean" ? Boolean(record[i.id]) : i.defaultOn])
    ) as Record<string, boolean>;
  }, [profile?.notificationSettings, pushItems]);

  const initialEmail = useMemo(() => {
    const fromProfile = (profile?.notificationSettings as any)?.email;
    const record = fromProfile && typeof fromProfile === "object" ? (fromProfile as Record<string, unknown>) : {};
    return Object.fromEntries(
      emailItems.map((i) => [i.id, typeof record[i.id] === "boolean" ? Boolean(record[i.id]) : i.defaultOn])
    ) as Record<string, boolean>;
  }, [emailItems, profile?.notificationSettings]);

  const [pushState, setPushState] = useState<Record<string, boolean>>(initialPush);
  const [emailState, setEmailState] = useState<Record<string, boolean>>(initialEmail);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPushState(initialPush);
  }, [initialPush]);

  useEffect(() => {
    setEmailState(initialEmail);
  }, [initialEmail]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notificationSettings: {
            push: pushState,
            email: emailState,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof json?.error === "string" ? json.error : t("common.failedToSaveChanges"));
        return;
      }
      if (json?.profile) dispatch(setProfile(json.profile));
      toast.success(t("common.savedChanges"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#F2F2F7] min-h-screen">
      <Header title={t("menu.notifications")} />

      <div className="pb-10 pt-4">
        <div className="space-y-3">
          {pushItems.map((item) => (
            <SettingCard
              key={item.id}
              title={item.title}
              description={item.description}
              checked={!!pushState[item.id]}
              onChange={(next) => setPushState((prev) => ({ ...prev, [item.id]: next }))}
            />
          ))}
        </div>

        <div className="text-[15px] leading-[20px] font-medium text-black/70 mt-6 mb-3">
          {t("notifications.settings.emailTitle")}
        </div>

        <div className="space-y-3">
          {emailItems.map((item) => (
            <SettingCard
              key={item.id}
              title={item.title}
              description={item.description}
              checked={!!emailState[item.id]}
              onChange={(next) => setEmailState((prev) => ({ ...prev, [item.id]: next }))}
            />
          ))}
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-[52px] w-full rounded-xl bg-primary text-[16px] font-bold text-white disabled:opacity-60"
          >
            {saving ? t("common.saving") : t("common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
