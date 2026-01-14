"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, Camera } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

export default function UploadProfilePicturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useMemo(() => (searchParams.get("userId") || "").trim(), [searchParams]);

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
    router.push("/signin");
  };

  const handleContinue = async () => {
    if (!userId) {
      toast.error("Missing user id");
      return;
    }
    if (!profileImageUrl) {
      router.push("/signin");
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
      router.push("/signin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-white flex flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/signin")}
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
            <div className="w-56 h-56 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-300" />
              )}
            </div>
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

