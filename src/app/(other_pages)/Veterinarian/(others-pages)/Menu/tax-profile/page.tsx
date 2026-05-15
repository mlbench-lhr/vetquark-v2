'use client'

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/common/header";
import DropdownSelect from "@/components/form/DropdownSelect";
import MultiSelect from "@/components/form/MultiSelect";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import TypedDateInput from "@/components/form/input/TypedDateInput";
import { ChevronDown, Pencil } from "lucide-react";

type TaxProfileFormData = {
  taxId: string;
  cnpjIe: string;
  dateOfBirth: string;
  address: string;
  crmv: string;
  crmvState: string;
  mapaRegistration: string;
  operateHow: string;
  expertise: string[];
};

const expertiseOptions = [
  { value: "acupuncture", text: "Acupuncture", selected: false },
  { value: "anesthesia", text: "Anesthesia", selected: false },
  { value: "beef-dairy-cattle", text: "Beef/Dairy Cattle", selected: false },
  { value: "cardiology", text: "Cardiology", selected: false },
  { value: "surgical-clinic-large-animals", text: "Surgical Clinic (Large Animals)", selected: false },
  { value: "surgical-clinic-small-animals", text: "Surgical Clinic (Small Animals)", selected: false },
  { value: "feline-medicine", text: "Feline Medicine", selected: false },
  { value: "medical-clinic-large-animals", text: "Medical Clinic (Large Animals)", selected: false },
  { value: "medical-clinic-small-animals", text: "Medical Clinic (Small Animals)", selected: false },
  { value: "behavioral-medicine", text: "Behavioral Medicine", selected: false },
  { value: "dermatology", text: "Dermatology", selected: false },
  { value: "endocrinology", text: "Endocrinology", selected: false },
  { value: "physiotherapy", text: "Physiotherapy", selected: false },
  { value: "flower-therapy", text: "Flower Therapy", selected: false },
  { value: "gastroenterology", text: "Gastroenterology", selected: false },
  { value: "geriatrics", text: "Geriatrics", selected: false },
  { value: "homeopathy", text: "Homeopathy", selected: false },
  { value: "immunology", text: "Immunology", selected: false },
  { value: "alternative-medicine", text: "Alternative Medicine", selected: false },
  { value: "diagnostic-medicine", text: "Diagnostic Medicine", selected: false },
  { value: "nephrology", text: "Nephrology", selected: false },
  { value: "neurology", text: "Neurology", selected: false },
  { value: "nutrition", text: "Nutrition", selected: false },
  { value: "dentistry", text: "Dentistry", selected: false },
  { value: "ophthalmology", text: "Ophthalmology", selected: false },
  { value: "oncology", text: "Oncology", selected: false },
  { value: "orthopedics", text: "Orthopedics", selected: false },
  { value: "parasitology", text: "Parasitology", selected: false },
  { value: "pediatrics", text: "Pediatrics", selected: false },
  { value: "animal-production", text: "Animal Production", selected: false },
  { value: "reiki", text: "Reiki", selected: false },
  { value: "reproduction-large-animals", text: "Reproduction (Large Animals)", selected: false },
  { value: "reproduction-small-animals", text: "Reproduction (Small Animals)", selected: false },
  { value: "intensive-care", text: "Intensive Care", selected: false },
];

type Option = { value: string; text: string };

const brazilianStateOptions = [
  { value: "AC", text: "Acre" },
  { value: "AL", text: "Alagoas" },
  { value: "AP", text: "Amapá" },
  { value: "AM", text: "Amazonas" },
  { value: "BA", text: "Bahia" },
  { value: "CE", text: "Ceará" },
  { value: "DF", text: "Distrito Federal" },
  { value: "ES", text: "Espírito Santo" },
  { value: "GO", text: "Goiás" },
  { value: "MA", text: "Maranhão" },
  { value: "MT", text: "Mato Grosso" },
  { value: "MS", text: "Mato Grosso do Sul" },
  { value: "MG", text: "Minas Gerais" },
  { value: "PA", text: "Pará" },
  { value: "PB", text: "Paraíba" },
  { value: "PR", text: "Paraná" },
  { value: "PE", text: "Pernambuco" },
  { value: "PI", text: "Piauí" },
  { value: "RJ", text: "Rio de Janeiro" },
  { value: "RN", text: "Rio Grande do Norte" },
  { value: "RS", text: "Rio Grande do Sul" },
  { value: "RO", text: "Rondônia" },
  { value: "RR", text: "Roraima" },
  { value: "SC", text: "Santa Catarina" },
  { value: "SP", text: "São Paulo" },
  { value: "SE", text: "Sergipe" },
  { value: "TO", text: "Tocantins" },
];

export default function TaxInfoAndProfessionalProfilePage() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.userProfile.profile);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const initialFormData = useMemo<TaxProfileFormData>(() => {
    return {
      taxId: profile?.taxId || "",
      cnpjIe: profile?.cnpjIe || "",
      dateOfBirth: profile?.dateOfBirth || "",
      address: profile?.address || "",
      crmv: profile?.crmv || "",
      crmvState: profile?.crmvState || "",
      mapaRegistration: profile?.mapaRegistration || "",
      operateHow: profile?.operateHow || "",
      expertise: Array.isArray(profile?.expertise) ? profile.expertise : [],
    };
  }, [profile]);

  const [formData, setFormData] = useState<TaxProfileFormData>(initialFormData);
  const expertiseKey = useMemo(() => {
    return `${profile?.id ?? "anon"}:${initialFormData.expertise.join(",")}`;
  }, [initialFormData.expertise, profile?.id]);

  const operateOptions: Option[] = useMemo(
    () => [
      { value: "Clinic/pet Shop Service", text: t("menu.clinicPetShopService") },
      { value: "Home Care", text: t("menu.homeCare") },
      { value: "Clinic/pet Shop Management", text: t("menu.clinicPetShopManagement") },
      { value: "Other", text: t("menu.other") },
    ],
    [t]
  );

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          taxId: formData.taxId,
          cnpjIe: formData.cnpjIe,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          crmv: formData.crmv,
          crmvState: formData.crmvState,
          mapaRegistration: formData.mapaRegistration,
          operateHow: formData.operateHow,
          expertise: formData.expertise,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof json?.error === "string" ? json.error : "Failed to save changes");
        return;
      }
      if (json?.profile) dispatch(setProfile(json.profile));
      toast.success("Saved changes");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-[44px] rounded-lg border border-[#E5E5EA] bg-white px-4 text-[14px] leading-[18px] text-black/70 placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-primary";
  const labelCls = "block text-[14px] font-medium text-black/70 mb-1.5";

  return (
    <div className="w-full bg-[#F2F2F7] min-h-screen flex flex-col">
      <Header title={t("menu.settings") || "Ajustes"} />

      <div className="flex-1 overflow-y-auto pt-2 pb-8">
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-black/70 leading-[24px]">
                {t("menu.professionalProfile") || "Perfil Profissional"}
              </h2>
              <p className="text-[13px] text-[#8E8E93] mt-1 leading-[18px]">
                {t("menu.professionalProfileDesc") || "Seus dados de identificação e assinatura."}
              </p>
            </div>
            <ChevronDown className="w-5 h-5 text-[#8E8E93]" />
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className={labelCls}>{t("menu.fullName")}</label>
              <DropdownSelect
                options={operateOptions}
                value={formData.operateHow}
                onChange={(value) => setFormData((prev) => ({ ...prev, operateHow: value }))}
                placeholder="Dr. Vet"
                name="operateHow"
              />
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <label className={labelCls}>CRMV</label>
                <input
                  type="text"
                  name="crmv"
                  placeholder="12345"
                  value={formData.crmv}
                  onChange={handleInputChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>UF</label>
                <input
                  type="text"
                  name="crmvState"
                  placeholder="PE"
                  value={formData.crmvState}
                  onChange={handleInputChange}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Telefone/WhatsApp</label>
              <input
                type="text"
                name="taxId"
                placeholder="(11) 98765-4321"
                value={formData.taxId}
                onChange={handleInputChange}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>{t("profile.dateOfBirth")}</label>
              <TypedDateInput
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(nextIsoDate) => setFormData((prev) => ({ ...prev, dateOfBirth: nextIsoDate }))}
                placeholder="dd/mm/aaaa"
                className="w-full h-[44px] px-4 bg-white border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-[14px] text-black/70 placeholder:text-[#8E8E93] pr-11"
                iconClassName="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] cursor-pointer"
              />
            </div>

            <div>
              <label className={labelCls}>E-mail (somente leitura)</label>
              <input
                type="text"
                placeholder="vet@stripscan.app"
                value={profile?.email || ""}
                readOnly
                className={`${inputCls} opacity-80`}
              />
            </div>

            <div>
              <label className={labelCls}>Assinatura Digital</label>
              <button type="button" className="h-[40px] rounded-lg bg-[#3D3D45] text-white px-4 text-[13px] font-semibold inline-flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>
                Enviar nova
              </button>
            </div>

            <div className="hidden">
              <MultiSelect
                key={expertiseKey}
                label="Area Of Expertise"
                options={expertiseOptions}
                defaultSelected={formData.expertise}
                onChange={(values) => setFormData((prev) => ({ ...prev, expertise: values }))}
                placeholder="Select options"
                showInlineChips={false}
                showDoneButton={true}
                name="expertise"
                maxSelected={5}
              />
            </div>
          </form>

          <button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={saving}
            className="w-full h-[52px] mt-5 bg-primary hover:bg-[#2f68c8] text-white text-[16px] font-bold rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Pencil className="w-[18px] h-[18px]" />
            {saving ? t("common.saving") : (t("menu.saveProfile") || "Salvar perfil")}
          </button>
        </div>
      </div>
    </div>
  );
}
