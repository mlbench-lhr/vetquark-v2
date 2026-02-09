'use client'

import { useMemo, useState, useContext } from "react";
import { Bell, ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store/hooks";
import { UserContext } from "@/context/authContext";
import { useTranslation } from "react-i18next";
import Header from "@/components/common/header";

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="relative flex items-center justify-center px- pt-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-full"
      >
        <ChevronLeft className="h-6 w-6 text-[#111827]" />
      </button>
      <div className="text-[16px] font-medium leading-[20px] text-[#111827]">{title}</div>
      <button
        type="button"
        aria-label="Notifications"
        className="absolute right-4 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F6F6]"
      >
        <Bell className="h-5 w-5 text-[#111827]" />
      </button>
    </div>
  );
}

type FaqItem = {
  q: string;
  a: string;
};

export default function Page() {
  const router = useRouter();
  const profile = useAppSelector((s) => s.userProfile.profile);
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const faqs = useMemo<FaqItem[]>(() => {
    const dict = t("helpCentre.faqs", { returnObjects: true }) as Record<string, FaqItem>;
    return Object.values(dict);
  }, [t]);

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <div className="min-h-scree bg-white">
      <Header title={t("helpCentre.title")} />

      <div className="px- pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div>
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">
            {t("helpCentre.urineGuideTitle")}
          </div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            {t("helpCentre.urineGuideSubtitle")}
          </div>

          <button
            type="button"
            onClick={() => router.push("/Guardian/Menu/help-centre/urine-collection-guide")}
            className="mt-4 h-[44px] w-full rounded-full bg-[#3F78D8] text-[14px] font-medium text-white"
          >
            {t("helpCentre.viewStepByStep")}
          </button>
        </div>

        <div className="mt-5 h-[8px] w-full bg-[#F5F6F6]" />

        <div className="pt-5">
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">{t("helpCentre.quickQuestionsTitle")}</div>

          <div className="mt-4 space-y-3">
            {faqs.map((item, idx) => {
              const open = openIndex === idx;
              const canExpand = item.a.trim().length > 0;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => {
                    if (!canExpand) return;
                    setOpenIndex(open ? null : idx);
                  }}
                  className="w-full rounded-[12px] bg-[#F5F6F6] px-4 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[14px] font-medium leading-[18px] text-[#111827]">
                      {item.q}
                    </div>
                    {open ? (
                      <ChevronUp className="mt-[2px] h-5 w-5 flex-shrink-0 text-[#9AA4AF]" />
                    ) : (
                      <ChevronDown className="mt-[2px] h-5 w-5 flex-shrink-0 text-[#9AA4AF]" />
                    )}
                  </div>

                  {open ? (
                    <div className="mt-2 text-[12px] leading-[16px] text-[#9AA4AF]">{item.a}</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">{t("helpCentre.supportTitle")}</div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            {t("helpCentre.supportStatusOnline")}
          </div>

          <button
            type="button"
            onClick={() => router.push("/legal/terms")}
            className="mt-4 h-[44px] w-full rounded-full bg-[#3F78D8] text-[14px] font-medium text-white"
          >
            {t("helpCentre.supportCommonIssuesButton")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/legal/privacy")}
            className="mt-3 h-[44px] w-full rounded-full bg-[#3F78D8] text-[14px] font-medium text-white"
          >
            {t("helpCentre.supportPrivacyAccountButton")}
          </button>

          <div className="mt-3 text-[12px] leading-[16px] text-[#9AA4AF]">
            {t("helpCentre.appVersionLabel", { version: "1.0.0", build: "20240526" })}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">{t("helpCentre.feedbackTitle")}</div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            {t("helpCentre.feedbackSubtitle")}
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t("helpCentre.feedbackPlaceholder")}
            className="mt-4 h-[120px] w-full resize-none rounded-[16px] bg-[#F5F6F6] px-4 py-4 text-[14px] leading-[18px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
          />

          <button
            type="button"
            onClick={async () => {
              const msg = feedback.trim();
              if (!msg) {
                toast.error(t("helpCentre.feedbackEnterMessage"));
                return;
              }
              setSending(true);
              try {
                const res = await fetch("/api/support/feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message: msg,
                    fromEmail: profile?.email || user?.email,
                    fromName: profile?.fullName || [user?.first_name, user?.last_name].filter(Boolean).join(" "),
                    userId: profile?.id || user?.id,
                    appVersion: "1.0.0",
                  }),
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                  toast.error(typeof json?.error === "string" ? json.error : t("helpCentre.feedbackFailed"));
                } else {
                  toast.success(t("helpCentre.feedbackThanks"));
                  setFeedback("");
                }
              } catch {
                toast.error(t("helpCentre.feedbackFailed"));
              } finally {
                setSending(false);
              }
            }}
            disabled={sending || !feedback.trim()}
            className="mt-4 h-[52px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sending ? t("helpCentre.feedbackSending") : t("helpCentre.feedbackSubmit")}
          </button>
        </div>
      </div>
    </div>
  );
}
