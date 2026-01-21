'use client'

import React, { useMemo, useState } from "react";
import Header from "@/components/common/header";

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
    <div className="rounded-2xl bg-[#F3F4F6] px-5 py-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[16px] leading-[22px] font-semibold text-[#111827]">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-[18px] text-[#6B7280]">
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
  const pushItems: ToggleItem[] = useMemo(
    () => [
      {
        id: "signed-report",
        title: "Signed report",
        description: "When a report is finalised by the owner.",
        defaultOn: true,
      },
      {
        id: "payment-received",
        title: "Payment received",
        description: "Confirmation of payment for an exam.",
        defaultOn: true,
      },
      {
        id: "pending-expired-payment",
        title: "Pending/expired payment",
        description: "Reminders for outstanding payments.",
        defaultOn: false,
      },
    ],
    []
  );

  const emailItems: ToggleItem[] = useMemo(
    () => [
      {
        id: "clinic-report-copy",
        title: "Copy of the report for the clinic",
        description: "Send a PDF of the report to the clinic's email.",
        defaultOn: true,
      },
      {
        id: "daily-summary",
        title: "Daily summary of exams",
        description: "A report at the end of the day with the exams performed.",
        defaultOn: true,
      },
    ],
    []
  );

  const [pushState, setPushState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(pushItems.map((i) => [i.id, i.defaultOn]))
  );
  const [emailState, setEmailState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(emailItems.map((i) => [i.id, i.defaultOn]))
  );

  return (
    <div className="min-h-screen bg-white">
      <Header title="Notifications" />

      <div className="px-4 pb-10 pt-2">
        <div className="text-[18px] leading-[26px] font-normal text-[#111827] mb-3">
          Push Notifications (Mobile)
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
          Email Notifications
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
      </div>
    </div>
  );
}

