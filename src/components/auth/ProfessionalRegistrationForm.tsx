"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfessionalRegistration() {
  const router = useRouter();
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
          placeholder="CRMV *"
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
            <option value="punjab">Punjab</option>
            <option value="sindh">Sindh</option>
            <option value="kpk">KPK</option>
            <option value="balochistan">Balochistan</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>

        {/* Registration with MAPA */}
        <input
          type="text"
          name="MAPA"
          placeholder="Registration with MAPA (optional)"
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
              placeholder="Clinic service / pet shop"
              value={formData.clinic_service}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              name="home_care"
              placeholder="Home care"
              value={formData.home_care}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              name="clinic_management"
              placeholder="Clinic/pet shop management (owner or technical manager)"
              value={formData.clinic_management}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              name="other"
              placeholder="Other form of operation"
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