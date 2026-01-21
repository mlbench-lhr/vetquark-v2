'use client'

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/common/header";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";

type ClinicReportsFormData = {
  clinicLogoUrl: string;
  tradeName: string;
  cnpjIe: string;
  reportHeaderAddress: string;
  reportFooter: string;
};

export default function ClinicReportsPage() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.userProfile.profile);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [uploadingClinicLogo, setUploadingClinicLogo] = useState(false);

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
      toast.error("Cloudinary is not configured");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setUploadingClinicLogo(true);
    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=clinic_logos`);
      const signJson = await signRes.json();

      if (!signRes.ok) {
        toast.error("Failed to prepare upload");
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
        toast.error("Upload failed");
        console.error("Cloudinary upload failed:", json);
        return;
      }
      const url = json.secure_url || json.url;
      if (url) {
        setFormData((prev) => ({ ...prev, clinicLogoUrl: String(url) }));
      }
    } catch (err) {
      toast.error("Upload failed");
      console.error("Cloudinary upload error:", err);
    } finally {
      setUploadingClinicLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clinicLogoUrl) {
      toast.error("Please upload your clinic logo");
      return;
    }

    if (profile) {
      dispatch(
        setProfile({
          ...profile,
          clinicLogoUrl: formData.clinicLogoUrl,
          tradeName: formData.tradeName,
          cnpjIe: formData.cnpjIe || undefined,
          reportHeaderAddress: formData.reportHeaderAddress,
          reportFooter: formData.reportFooter,
        })
      );
    }

    toast.success("Saved changes (local only)");
  };

  return (
    <div className="w-full bg-background min-h-screen flex flex-col">
      <Header title="Clinic & Reports" />

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        <form ref={formRef} onSubmit={handleSubmit} className="pt-2">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-900 font-medium mb-2">Clinic Logo</label>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                {formData.clinicLogoUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={formData.clinicLogoUrl}
                      alt="Clinic logo"
                      className="w-32 h-32 object-contain rounded-lg bg-white"
                    />
                    <label className="inline-block">
                      <input type="file" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                      <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">
                        {uploadingClinicLogo ? "Uploading..." : "Change Logo"}
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-gray-600 text-sm">Upload your clinic logo</div>
                    <label className="inline-block">
                      <input type="file" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                      <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">
                        {uploadingClinicLogo ? "Uploading..." : "Select File"}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-900 font-medium mb-2">Trade Name</label>
              <input
                type="text"
                name="tradeName"
                placeholder="Enter your trade name"
                value={formData.tradeName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-gray-900 font-medium mb-2">
                CNPJ/IE <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="cnpjIe"
                placeholder="Enter your CNPJ/IE"
                value={formData.cnpjIe}
                onChange={(e) => setFormData((prev) => ({ ...prev, cnpjIe: e.target.value.replace(/\D/g, "") }))}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-gray-900 font-medium mb-2">Address (for header)</label>
              <input
                type="text"
                name="reportHeaderAddress"
                placeholder="Enter your address for the report header"
                value={formData.reportHeaderAddress}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-gray-900 font-medium mb-2">Footer of the Report</label>
              <textarea
                name="reportFooter"
                placeholder="Enter the footer text for reports"
                value={formData.reportFooter}
                onChange={handleInputChange}
                rows={4}
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400 resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-100 p-4">
        <button
          type="submit"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={uploadingClinicLogo}
          className="w-full h-[52px] bg-[hsl(224,65%,56%)] hover:bg-[hsl(224,65%,50%)] text-white text-[16px] font-medium rounded-full transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

