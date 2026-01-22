"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, Camera, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

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
    <div className="min-h-[calc(100vh-48px)] bg-white flex flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(homeHref)}
          className="hover:bg-gray-100 rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="w-6" />
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto pt-8 px-4">
        <h1 className="text-3xl font-medium text-gray-900">Upload Profile Picture</h1>
        <p className="text-sm text-tertiary mt-2">Add a profile picture for more authentic look</p>

        <div className="mt-14 flex justify-center">
          <div className="relative">
            {profileImageUrl ? (
              <div className="w-50 h-50 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none">
                <path d="M200 99.9993C200 128.365 188.191 153.971 169.219 172.169C151.254 189.407 126.864 200 100 200C73.1359 200 48.7459 189.407 30.7807 172.169C11.809 153.971 0 128.365 0 99.9993C0 44.7713 44.7716 0 100 0C155.228 0 200 44.7712 200 99.9993Z" fill="#F5F6F6" />
                <path d="M169.219 172.169C151.254 189.407 126.864 200 100 200C73.136 200 48.7459 189.407 30.7808 172.169C40.6465 143.428 67.911 122.771 100 122.771C110.103 122.771 119.726 124.818 128.48 128.521C147.531 136.579 162.46 152.476 169.219 172.169Z" fill="#D9D9D9" />
                <path d="M99.9998 114.271C120.221 114.271 136.613 97.8793 136.613 77.6586C136.613 57.4379 120.221 41.0458 99.9998 41.0458C79.7789 41.0458 63.3867 57.4379 63.3867 77.6586C63.3867 97.8793 79.7789 114.271 99.9998 114.271Z" fill="#D9D9D9" />
              </svg>)}
            <label className="absolute bottom-3 right-3">
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <span className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer">
                <Camera size={18} />
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4">
        <button
          type="button"
          onClick={handleSkip}
          className="w-full bg-[#EBF2FF] text-primary font-semibold py-4 rounded-full transition-colors cursor-pointer border-0"
          disabled={uploading || saving}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={uploading || saving}
          className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-colors cursor-pointer border-0 disabled:bg-gray-400 disabled:cursor-not-allowed mt-3"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
