"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, Camera, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

export default function UploadProfilePicturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useMemo(() => (searchParams.get("userId") || "").trim(), [searchParams]);
  const profileType = useMemo(() => (searchParams.get("profileType") || "").trim(), [searchParams]);
  const homeHref = useMemo(
    () => (profileType === "veterinarian" ? "/Veterinarian/home" : "/Guardian/home"),
    [profileType]
  );

  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);
    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=profile_pictures`);
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
      data.append("folder", "profile_pictures");

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
      if (url) setProfileImageUrl(String(url));
    } catch (err) {
      toast.error("Upload failed");
      console.error("Cloudinary upload error:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSkip = () => {
    router.push(homeHref);
  };

  const handleContinue = async () => {
    if (!userId) {
      toast.error("Missing user id");
      router.push(homeHref);
      return;
    }
    if (!profileImageUrl) {
      router.push(homeHref);
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/auth/profile-picture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, profileImageUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(typeof json.error === "string" ? json.error : "Failed to update profile picture");
        return;
      }
      toast.success("Profile picture updated");
      router.push(homeHref);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F2F2F7] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        <button
          onClick={() => router.push(homeHref)}
          className="w-[36px] h-[36px] rounded-full bg-[#EBEBF0] flex items-center justify-center border-0 cursor-pointer shrink-0"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-[#1C1C1E]" />
        </button>
        <h2 className="text-[18px] font-bold text-primary">Foto de Perfil</h2>
      </div>

      <div className="flex-1 flex flex-col items-center pt-10 px-5">
        <p className="text-[14px] text-[#6C6C70] text-center mb-12">
          Adicione uma foto de perfil para uma aparência mais autêntica
        </p>

        <div className="relative">
          <div className="w-[180px] h-[180px] rounded-full bg-[#EBEBF0] overflow-hidden flex items-center justify-center">
            {profileImageUrl ? (
              <Image width={180} height={180} src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 200 200" fill="none">
                <path d="M200 99.9993C200 128.365 188.191 153.971 169.219 172.169C151.254 189.407 126.864 200 100 200C73.1359 200 48.7459 189.407 30.7807 172.169C11.809 153.971 0 128.365 0 99.9993C0 44.7713 44.7716 0 100 0C155.228 0 200 44.7712 200 99.9993Z" fill="#E5E5EA" />
                <path d="M169.219 172.169C151.254 189.407 126.864 200 100 200C73.136 200 48.7459 189.407 30.7808 172.169C40.6465 143.428 67.911 122.771 100 122.771C110.103 122.771 119.726 124.818 128.48 128.521C147.531 136.579 162.46 152.476 169.219 172.169Z" fill="#C7C7CC" />
                <path d="M99.9998 114.271C120.221 114.271 136.613 97.8793 136.613 77.6586C136.613 57.4379 120.221 41.0458 99.9998 41.0458C79.7789 41.0458 63.3867 57.4379 63.3867 77.6586C63.3867 97.8793 79.7789 114.271 99.9998 114.271Z" fill="#C7C7CC" />
              </svg>
            )}
          </div>
          <label className="absolute bottom-2 right-2 cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <span className={`w-[40px] h-[40px] rounded-full bg-primary flex items-center justify-center shadow-md ${uploading ? "opacity-60" : ""}`}>
              <Camera size={18} className="text-white" />
            </span>
          </label>
        </div>

        {uploading && (
          <p className="mt-4 text-[13px] text-[#8E8E93]">Enviando...</p>
        )}
      </div>

      {/* Footer buttons */}
      <div className="px-5 pb-10 pt-4 space-y-3">
        <button
          type="button"
          onClick={handleContinue}
          disabled={uploading || saving}
          className="w-full bg-primary text-white font-bold text-[16px] py-[17px] rounded-2xl transition-colors cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando..." : "Continuar"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={uploading || saving}
          className="w-full bg-[#EBEBF0] text-primary font-semibold text-[15px] py-[14px] rounded-xl transition-colors cursor-pointer border-0 disabled:opacity-60"
        >
          Pular
        </button>
      </div>
    </div>
  );
}
