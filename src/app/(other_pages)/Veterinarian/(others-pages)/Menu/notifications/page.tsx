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
        "w-[58px] h-[34px] rounded-full",
        checked ? "bg-[#4A7BF7]" : "bg-[#D1D5DB]",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        "transition-colors",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[4px] left-[4px]",
          "w-[26px] h-[26px] rounded-full bg-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.18)]",
          checked ? "translate-x-[24px]" : "translate-x-0",
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
    <div className="rounded-2xl bg-[#F5F6F6] px-5 py-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[16px] leading-[22px] font-semibold text-[#111827]">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-[18px] text-[#9AA4AF]">
          {description}
        </div>
      </div>
      <div className="pt-1">
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
    <div className="bg-white">
      <Header title={t("menu.notifications")} />

      <div className=" pb-10 pt-2">
        <div className="text-[18px] leading-[26px] font-normal text-[#111827] mb-3">
          {t("notifications.settings.pushTitle")}
        </div>

        <div className="space-y-4">
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

        <div className="h-8" />

        <div className="text-[18px] leading-[26px] font-normal text-[#111827] mb-3">
          {t("notifications.settings.emailTitle")}
        </div>

        <div className="space-y-4">
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
            className="h-[56px] w-full rounded-full bg-[#4A7BF7] text-[15px] font-medium text-white"
          >
            {saving ? t("common.saving") : t("common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
