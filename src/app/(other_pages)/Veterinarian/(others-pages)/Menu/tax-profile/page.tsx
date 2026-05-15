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
import Label from "@/components/form/Label";

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

  const inputCls = "flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
  const labelCls = "block text-[15px] font-semibold text-[#1C1C1E] mb-[6px]";

  return (
    <div className="w-full flex flex-col">
      <Header title={t("menu.settings") || "Ajustes"} />

      <div className="flex-1 overflow-y-auto pt-2 pb-8">
        <div className=" rounded-lg border border-[#E5E5EA] p-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-black/70 leading-[24px]">
                {t("menu.professionalProfile") || "Perfil Profissional"}
              </h2>
              <p className="text-[13px] text-[#8E8E93] mt-[3px] leading-[18px]">
                {t("menu.professionalProfileDesc") || "Seus dados de identificação e assinatura."}
              </p>
            </div>
            <ChevronDown className="w-5 h-5 text-[#8E8E93] mt-1 flex-shrink-0" />
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <Label >{t("menu.fullName") || "Nome Completo"}</Label>
              <DropdownSelect
                options={operateOptions}
                value={formData.operateHow}
                onChange={(value) => setFormData((prev) => ({ ...prev, operateHow: value }))}
                placeholder="Dr. Vet"
                name="operateHow"
              />
            </div>

            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div>
                <Label >CRMV</Label>
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
                <Label >UF</Label>
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
              <Label >Telefone/WhatsApp</Label>
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
              <Label >{t("profile.dateOfBirth") || "Data de Nascimento"}</Label>
              <TypedDateInput
                iconSize={12}
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(nextIsoDate) => setFormData((prev) => ({ ...prev, dateOfBirth: nextIsoDate }))}
                placeholder="dd/mm/aaaa"
                className="h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border! border-input w-full px-2 bg-[#EBEBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border-0 text-[12px]!  w-full px-2! py-[14px] bg-secondary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border-0 text-[15px] text-[#1C1C1E] placeholder-[#8E8E93] pr-12"
                iconClassName="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] cursor-pointer"
              />
            </div>

            <div>
              <Label >E-mail (somente leitura)</Label>
              <input
                type="text"
                placeholder="vet@stripscan.app"
                value={profile?.email || ""}
                readOnly
                className={`${inputCls} opacity-70 cursor-default`}
              />
            </div>

            <div>
              <Label >Assinatura Digital</Label>
              <button type="button" className="h-[34px] rounded-sm bg-[#4F5464] text-white px-5 text-[15px] font-semibold inline-flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>
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
            className="w-full h-[32px] mt-3 bg-primary hover:bg-[#2f68c8] text-white text-[12px] font-bold rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-60 shadow-[0_4px_16px_-4px_rgba(63,120,216,0.45)]"
          >
            <Pencil className="w-[12px] h-[12px]" />
            {saving ? t("common.saving") : (t("menu.saveProfile") || "Salvar perfil")}
          </button>
        </div>
      </div>
    </div>
  );
}
