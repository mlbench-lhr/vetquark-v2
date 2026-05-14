'use client'

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/common/header";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import Image from "next/image";

type ClinicReportsFormData = {
  clinicLogoUrl: string;
  tradeName: string;
  cnpjIe: string;
  reportHeaderAddress: string;
  reportFooter: string;
};

export default function ClinicReportsPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.userProfile.profile);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [uploadingClinicLogo, setUploadingClinicLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialFormData = useMemo<ClinicReportsFormData>(() => {
    return {
      clinicLogoUrl: profile?.clinicLogoUrl || "",
      tradeName: profile?.tradeName || "",
      cnpjIe: profile?.cnpjIe || "",
      reportHeaderAddress: profile?.reportHeaderAddress || "",
      reportFooter: profile?.reportFooter || "",
    };
  }, [profile]);

  const [formData, setFormData] = useState<ClinicReportsFormData>(initialFormData);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClinicLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!CLOUD_NAME || !API_KEY) {
      toast.error(t("common.cloudinaryNotConfigured"));
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("common.fileTooLarge"));
      return;
    }

    setUploadingClinicLogo(true);
    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=clinic_logos`);
      const signJson = await signRes.json();

      if (!signRes.ok) {
        toast.error(t("common.failedToPrepareUpload"));
        console.error("Cloudinary signature error:", signJson);
        return;
      }
      const { timestamp, signature } = signJson;

      const data = new FormData();
      data.append("file", file);
      data.append("api_key", API_KEY);
      data.append("timestamp", String(timestamp));
      data.append("signature", signature);
      data.append("folder", "clinic_logos");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(t("common.uploadFailed"));
        console.error("Cloudinary upload failed:", json);
        return;
      }
      const url = json.secure_url || json.url;
      if (url) {
        setFormData((prev) => ({ ...prev, clinicLogoUrl: String(url) }));
      }
    } catch (err) {
      toast.error(t("common.uploadFailed"));
      console.error("Cloudinary upload error:", err);
    } finally {
      setUploadingClinicLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clinicLogoUrl: formData.clinicLogoUrl || undefined,
          tradeName: formData.tradeName,
          cnpjIe: formData.cnpjIe,
          reportHeaderAddress: formData.reportHeaderAddress,
          reportFooter: formData.reportFooter,
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
    <div className="w-full bg-white min-h-screen flex flex-col">
      <Header title={t("menu.clinicReports")} />

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <form ref={formRef} onSubmit={handleSubmit} className="pt-2">
          <div className="space-y-4">
            <div>
              <label className="block text-[#111827] font-medium mb-2">
                {t("menu.uploadClinicLogo")} <span className="text-[#9AA4AF] font-normal">{t("menu.optionalSuffix")}</span>
              </label>
              <div className="bg-[#F5F6F6] border-2 border-dashed border-[#E5E7EB] rounded-xl p-4 text-center">
                {formData.clinicLogoUrl ? (
                  <div className="flex w-full h-[200px] flex-col relative items-center gap-3">
                    <Image
                      width={100}
                      height={100}
                      src={formData.clinicLogoUrl}
                      alt="Clinic logo"
                      className="w-full h-full object-contain rounded-lg bg-white"
                    />
                    <label className="inline-block absolute -top-2 -right-2">
                      <input type="file" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                      {
                        uploadingClinicLogo ?
                          <span className="px-3 py-2 bg-[#3F78D8] text-white rounded-md cursor-pointer">
                            {uploadingClinicLogo ? t("menu.uploading") : t("menu.changeLogo")}
                          </span>
                          : <div className="p-2 bg-[#3F78D8] rounded-full">
                            <Pencil color="white" size={16} />
                          </div>
                      }
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 h-[200px]">
                    <div className="text-[#9AA4AF] text-sm">{t("menu.uploadClinicLogo")}</div>
                    <label className="inline-block">
                      <input type="file" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                      <span className="px-3 py-2 bg-[#3F78D8] text-white rounded-md cursor-pointer">
                        {uploadingClinicLogo ? t("menu.uploading") : t("menu.selectFile")}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[#111827] font-medium mb-2">{t("menu.tradeNameLabel")}</label>
              <input
                type="text"
                name="tradeName"
                placeholder={t("menu.enterTradeName")}
                value={formData.tradeName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF]"
              />
            </div>

            <div>
              <label className="block text-[#111827] font-medium mb-2">
                {t("menu.cnpjIeLabel")} <span className="text-[#9AA4AF] font-normal">{t("menu.optionalSuffix")}</span>
              </label>
              <input
                type="text"
                name="cnpjIe"
                placeholder={t("menu.enterCnpjIe")}
                value={formData.cnpjIe}
                onChange={(e) => setFormData((prev) => ({ ...prev, cnpjIe: e.target.value.replace(/\D/g, "") }))}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF]"
              />
            </div>

            <div>
              <label className="block text-[#111827] font-medium mb-2">{t("menu.addressHeaderLabel")}</label>
              <input
                type="text"
                name="reportHeaderAddress"
                placeholder={t("menu.enterReportHeaderAddress")}
                value={formData.reportHeaderAddress}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF]"
              />
            </div>

            <div>
              <label className="block text-[#111827] font-medium mb-2">{t("menu.reportFooterLabel")}</label>
              <textarea
                name="reportFooter"
                placeholder={t("menu.enterReportFooter")}
                value={formData.reportFooter}
                onChange={handleInputChange}
                rows={4}
                required
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF] resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] p-4">
        <button
          type="submit"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={uploadingClinicLogo || saving}
          className="w-full h-[52px] bg-[#3F78D8] hover:bg-[#2f68c8] text-white text-[16px] font-medium rounded-full transition-colors disabled:bg-[#9AA4AF] disabled:cursor-not-allowed"
        >
          {saving ? t("common.saving") : t("common.saveChanges")}
        </button>
      </div>
    </div>
  );
}
