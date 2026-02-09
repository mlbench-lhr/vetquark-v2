'use client'
import React from "react";
import Header from "@/components/common/header";
import { privacyAndTermsContent } from "@/data/legal";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Termos de Serviço" />
      <div className="px- pt-2 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div className="rounded-3xl bg-[#F5F6F6] p-4">
          <div className="rounded-2xl bg-white p-4">
            <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">
              {privacyAndTermsContent.title}
            </div>
            <div className="mt-2 text-[12px] leading-[16px] text-[#9AA4AF]">
              Última atualização: {privacyAndTermsContent.lastUpdated}
            </div>
            <div className="mt-3 text-[13px] leading-[18px] text-[#111827]">
              {privacyAndTermsContent.controllerOperator}
            </div>
            <div className="mt-1 text-[13px] leading-[18px] text-[#111827]">
              {privacyAndTermsContent.dpoEmail}
            </div>
            <div className="mt-1 text-[13px] leading-[18px] text-[#111827]">
              {privacyAndTermsContent.address}
            </div>
            <div className="mt-3 text-[13px] leading-[18px] text-[#111827]">
              {privacyAndTermsContent.intro}
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {privacyAndTermsContent.sections.map((sec) => (
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
              href="/legal/privacy"
              className="inline-flex h-[44px] px-5 rounded-full bg-[#3F78D8] text-[14px] font-medium text-white items-center justify-center"
            >
              Ver Política de Privacidade
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
