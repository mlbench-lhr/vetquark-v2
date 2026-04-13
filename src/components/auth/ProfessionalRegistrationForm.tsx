"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

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

export default function ProfessionalRegistration() {
  const router = useRouter();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    CRMV: "",
    CRMV_State: "",
    MAPA: "",
    clinic_service: "",
    home_care: "",
    clinic_management: "",
    other: "",
    Acupuncture: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    router.push("/verify_email")
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button className="mr-4 text-gray-600 hover:text-gray-800 bg-gray-100 p-2 rounded-full" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-primary">Professional registration</h1>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {/* CRMV */}
        <input
          type="text"
          name="CRMV"
          placeholder={`${t("auth.crmv")} *`}
          required
          value={formData.CRMV}
          onChange={handleInputChange}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* CRMV State */}
        <div className="relative">
          <select
            name="CRMV_State"
            value={formData.CRMV_State}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-500 appearance-none pr-12"
          >
            <option value="">CRMV State *</option>
            {brazilianStateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.text}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>

        {/* Registration with MAPA */}
        <input
          type="text"
          name="MAPA"
          placeholder={`${t("auth.mapaRegistration")} ${t("auth.optional")}`}
          value={formData.MAPA}
          onChange={handleInputChange}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* How do you operate? */}
        <div className="mt-6">
          <h3 className="text-primary font-bold text-xl mb-4">How do you operate?</h3>
          <div className="space-y-3">
            <input
              type="text"
              name="clinic_service"
              placeholder={t("auth.clinicPetShopService")}
              value={formData.clinic_service}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              name="home_care"
              placeholder={t("auth.homeCare")}
              value={formData.home_care}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              name="clinic_management"
              placeholder={t("auth.clinicPetShopManagement")}
              value={formData.clinic_management}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              name="other"
              placeholder={t("auth.other")}
              value={formData.other}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Areas of expertise */}
        <div className="mt-6">
          <h3 className="text-primary font-bold text-xl mb-4">Areas of expertise</h3>
          <div className="relative">
            <select
              name="Acupuncture"
              value={formData.Acupuncture}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-500 appearance-none pr-12"
            >
              <option value="">Acupuncture</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full mt-8 py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-blue-700 transition-colors text-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
