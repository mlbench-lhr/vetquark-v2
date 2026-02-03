'use client'

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import Header from "@/components/common/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

type Lang = "en" | "pt";

export default function Page() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.userProfile.profile);
  const { t } = useTranslation();

  const initialLang = useMemo<Lang>(() => (profile?.preferredLanguage === "pt" ? "pt" : "en"), [profile?.preferredLanguage]);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLang(initialLang);
  }, [initialLang]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ preferredLanguage: lang }),
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

  const items: Array<{ id: Lang; label: string; flag: string }> = useMemo(
    () => [
      { id: "en", label: t("common.english"), flag: "🇬🇧" },
      { id: "pt", label: t("common.portuguese"), flag: "🇵🇹" },
    ],
    [t]
  );

  return (
    <div className=" bg-white">
      <Header title={t("settings.languageTitle")} />

      <div className="flex min-h-[calc(100dvh-72px)] flex-col  pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div className="space-y-3">
          {items.map((item) => {
            const selected = item.id === lang;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLang(item.id);
                  i18n.changeLanguage(item.id);
                  if (typeof window !== "undefined") window.localStorage.setItem("ui_language_v1", item.id);
                }}
                className={`flex h-[56px] w-full items-center justify-between rounded-[16px] px-4 ${
                  selected ? "bg-[#EEF4FF]" : "bg-[#F5F6F6]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[18px] leading-none">{item.flag}</span>
                  <div
                    className={`text-[16px] font-medium leading-[20px] ${
                      selected ? "text-[#3F78D8]" : "text-[#111827]"
                    }`}
                  >
                    {item.label}
                  </div>
                </div>

                {selected ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3F78D8]">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-[56px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
          >
            {saving ? t("common.saving") : t("common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
