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

  return (
    <div className="w-full bg-white min-h-screen flex flex-col">
      <Header title={t("menu.taxProfile")} />

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <form ref={formRef} onSubmit={handleSubmit} className="pt-2">
          <div className="space-y-4">
            <div>
              <label className="block text-[#111827] font-medium mb-2">{t("profile.nationalId")}</label>
              <input
                type="text"
                name="taxId"
                placeholder="i.e AB374892928"
                value={formData.taxId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-[#F5F6F6] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF]"
              />
            </div>

            <div>
              <label className="block text-[#111827] font-medium mb-2">
                {t("menu.cnpjIeLabel")} <span className="text-[#9AA4AF] font-normal">{t("menu.optionalSuffix")}</span>
              </label>
              <input
                type="text"
                name="cnpjIe"
                placeholder="i.e 12.345.678/0001-99"
                value={formData.cnpjIe}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-[#F5F6F6] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF]"
              />
            </div>

            <div>
              <label className="block text-[#111827] font-medium mb-2">{t("profile.dateOfBirth")}</label>
              <TypedDateInput
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(nextIsoDate) => setFormData((prev) => ({ ...prev, dateOfBirth: nextIsoDate }))}
                required
                placeholder="dd/mm/yyyy"
                className="w-full px-4 py-3 bg-[#F5F6F6] rounded-xl focus:outline-none text-[#111827] pr-12"
                iconClassName="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA4AF] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[#111827] font-medium mb-2">{t("profile.address")}</label>
              <input
                type="text"
                name="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-[#F5F6F6] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#111827] font-medium mb-2">CRMV</label>
                <input
                  type="text"
                  name="crmv"
                  placeholder="Enter CRMV code"
                  value={formData.crmv}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-[#F5F6F6] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF]"
                />
              </div>
              <div className="pt-[30px]">
                <DropdownSelect
                  options={brazilianStateOptions}
                  value={formData.crmvState}
                  onChange={(value) => setFormData((prev) => ({ ...prev, crmvState: value }))}
                  placeholder="State"
                  name="crmvState"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#111827] font-medium mb-2">
                Registration with MAPA <span className="text-[#9AA4AF] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="mapaRegistration"
                placeholder="Enter your registration with MAPA"
                value={formData.mapaRegistration}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-[#F5F6F6] rounded-xl focus:outline-none text-[#111827] placeholder-[#9AA4AF]"
              />
            </div>

            <div>
              <DropdownSelect
                label="How do you operate?"
                options={operateOptions}
                value={formData.operateHow}
                onChange={(value) => setFormData((prev) => ({ ...prev, operateHow: value }))}
                placeholder="Select an option"
                name="operateHow"
                required
              />
            </div>

            <div>
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
                required
                maxSelected={5}
              />
              <div className="mt-2 flex flex-wrap gap-2 bg-[#F5F6F6] p-5 rounded-[12px]">
                {formData.expertise.length === 0 ? (
                  <span className="text-sm text-[#9AA4AF]">No expertise selected</span>
                ) : (
                  formData.expertise.map((v) => {
                    const opt = expertiseOptions.find((o) => o.value === v);
                    return (
                      <span key={v} className="inline-flex items-center rounded-full bg-[#4A7BF7] text-white text-sm px-3 py-1">
                        {opt ? opt.text : v}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] p-4">
        <button
          type="submit"
          onClick={() => {
            formRef.current?.requestSubmit();
          }}
          disabled={saving}
          className="w-full h-[52px] bg-[#4A7BF7] hover:bg-[#3A6BE7] text-white text-[16px] font-medium rounded-full transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
