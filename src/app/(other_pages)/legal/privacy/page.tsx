'use client'
import React from "react";
import Header from "@/components/common/header";
import { getLegalContent } from "@/data/legal";
import { useTranslation } from "react-i18next";
import i18nModule, { isAppLanguage } from "@/i18n/i18n";

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const lang = isAppLanguage(i18n.language) ? i18n.language : "pt";
  const content = getLegalContent(lang);
  const headerTitle = lang === "pt" ? "Política de Privacidade" : "Privacy Policy";
  const updatedLabel = lang === "pt" ? "Última atualização:" : "Last updated:";
  return (
    <div className="min-h-screen bg-white">
      <Header title={headerTitle} />
      <div className="px- pt-2 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div className="rounded-3xl bg-[#F5F6F6] p-4">
          <div className="rounded-2xl bg-white p-4">
            <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">
              {content.title}
            </div>
            <div className="mt-2 text-[12px] leading-[16px] text-[#9AA4AF]">
              {updatedLabel} {content.lastUpdated}
            </div>
            <div className="mt-3 text-[13px] leading-[18px] text-[#111827]">
              {content.controllerOperator}
            </div>
            <div className="mt-1 text-[13px] leading-[18px] text-[#111827]">
              {content.dpoEmail}
            </div>
            <div className="mt-1 text-[13px] leading-[18px] text-[#111827]">
              {content.address}
            </div>
            <div className="mt-3 text-[13px] leading-[18px] text-[#111827]">
              {content.intro}
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {content.sections.map((sec) => (
              <div key={sec.title} className={`${sec.paragraphs.length>0?"rounded-2xl bg-white p-4":"px-4"}`}>
                <div className="text-[14px] font-medium leading-[18px] text-[#111827]">
                  {sec.title}
                </div>
                <div className="mt-2 space-y-2">
                  {sec.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-[13px] leading-[18px] text-[#4B5563]">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <a
              href="/legal/terms"
              className="inline-flex h-[44px] px-5 rounded-full bg-[#3F78D8] text-[14px] font-medium text-white items-center justify-center"
            >
              {lang === "pt" ? "Ver Termos de Serviço" : "View Terms of Service"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
