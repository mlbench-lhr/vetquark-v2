"use client"
import React from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/common/header";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { useTranslation } from "react-i18next";

export default function EditProfileCard() {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((s) => s.userProfile.profile);

    const fullName = profile?.fullName ?? "";
    const email = profile?.email ?? "";
    const phone = profile?.phone ?? "";
    const profileImageUrl = profile?.profileImageUrl ?? "";
    const fallbackAvatarUrl = "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png";

    const [localFullName, setLocalFullName] = React.useState(fullName);
    const [localEmail, setLocalEmail] = React.useState(email);
    const [localPhone, setLocalPhone] = React.useState(() => {
        const initial = String(phone || "").replace(/\s+/gu, "");
        if (!initial) return "";
        return initial.startsWith("+") ? initial : `+${initial}`;
    });
    const [localProfileImageUrl, setLocalProfileImageUrl] = React.useState(profileImageUrl);
    const [saving, setSaving] = React.useState(false);
    const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        setLocalFullName(fullName);
        setLocalEmail(email);
        const initial = String(phone || "").replace(/\s+/gu, "");
        setLocalPhone(!initial ? "" : initial.startsWith("+") ? initial : `+${initial}`);
        setLocalProfileImageUrl(profileImageUrl);
    }, [email, fullName, phone, profileImageUrl]);

    const parsedPhone = localPhone ? parsePhoneNumberFromString(localPhone) : undefined;
    const derivedPhone = parsedPhone ? parsedPhone.number : localPhone;

    const avatarUrl = localProfileImageUrl || fallbackAvatarUrl;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            e.target.value = "";
            return;
        }

        setUploadingAvatar(true);
        try {
            const signRes = await fetch(`/api/cloudinary/upload?folder=profile_pictures`);
            const signJson = await signRes.json();
            if (!signRes.ok) {
                toast.error("Failed to prepare upload");
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
                return;
            }
            const url = json.secure_url || json.url;
            if (url) {
                const nextUrl = String(url);
                const previousUrl = localProfileImageUrl;
                setLocalProfileImageUrl(nextUrl);

                const saveRes = await fetch("/api/user/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ profileImageUrl: nextUrl }),
                });
                const saveJson = await saveRes.json().catch(() => ({}));
                if (!saveRes.ok) {
                    setLocalProfileImageUrl(previousUrl);
                    toast.error(typeof saveJson?.error === "string" ? saveJson.error : "Failed to save profile picture");
                    return;
                }
                if (saveJson?.profile) dispatch(setProfile(saveJson.profile));
                toast.success("Profile picture updated");
            }
        } catch {
            toast.error("Upload failed");
        } finally {
            setUploadingAvatar(false);
            e.target.value = "";
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    fullName: localFullName,
                    phone: derivedPhone,
                    ...(localProfileImageUrl && localProfileImageUrl !== profileImageUrl
                        ? { profileImageUrl: localProfileImageUrl }
                        : {}),
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
        <div className="min-h-screen bg-white flex flex-col px-4">
            <Header title={t("menu.edit")} />
            {/* Avatar Section */}
            <div className="flex justify-center pt-8 pb-8">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-muted">
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <Camera className="h-4 w-4 text-primary-foreground" />
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-5">
                <div>
                    <Label className="text-[14px] font-medium leading-[18px] text-[#111827] mb-3">
                        Full Name
                    </Label>
                    <Input
                        value={localFullName}
                        onChange={(e) => setLocalFullName(e.target.value)}
                        className="h-[56px] w-full rounded-[16px] border-0 bg-[#F5F6F6] px-4 text-[16px] leading-[20px] text-[#111827] placeholder:text-[#9AA4AF] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-[16px]"
                    />
                </div>

                <div>
                    <Label className="text-[14px] font-medium leading-[18px] text-[#111827] mb-3">
                        Email
                    </Label>
                    <Input
                        type="email"
                        value={localEmail}
                        disabled
                        className="h-[56px] w-full rounded-[16px] border-0 bg-[#F5F6F6] px-4 text-[16px] leading-[20px] text-[#111827] placeholder:text-[#9AA4AF] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-[16px]"
                    />
                </div>

                <div>
                    <Label className="text-[14px] font-medium leading-[18px] text-[#111827] mb-3">
                        Phone Number
                    </Label>
                    <PhoneInput
                        name="phone"
                        value={localPhone}
                        onChange={setLocalPhone}
                        defaultCountry="br"
                        containerClassName="w-full"
                        inputClassName="!w-full !h-[56px] !rounded-[16px] !border-0 !bg-[#F5F6F6] !px-11 !text-[16px] !leading-[20px] !text-[#111827] placeholder:!text-[#9AA4AF] focus:!outline-none md:!text-[16px]"
                        buttonClassName="!h-[56px] !border-0 !bg-[#F5F6F6] !rounded-[16px]"
                    />
                </div>
            </div>

            {/* Save Button */}
            <div className="py-6">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
