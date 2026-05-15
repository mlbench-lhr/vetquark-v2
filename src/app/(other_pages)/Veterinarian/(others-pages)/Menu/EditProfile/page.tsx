"use client"
import React from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/common/header";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Image from "next/image";

export default function EditProfileCard() {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((s) => s.userProfile.profile);

    const fullName = profile?.fullName ?? "";
    const email = profile?.email ?? "";
    const phone = profile?.phone ?? "";
    const veterinarianCode = profile?.veterinarianCode ?? "";
    const profileImageUrl = profile?.profileImageUrl ?? "";
    const fallbackAvatarUrl = "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png";

    const [localFullName, setLocalFullName] = React.useState(fullName);
    const [localEmail, setLocalEmail] = React.useState(email);
    const [localPhone, setLocalPhone] = React.useState(() => {
        const initial = String(phone || "").replace(/\s+/gu, "");
        if (!initial) return "";
        return initial.startsWith("+") ? initial : `+${initial}`;
    });
    const [localVetCode, setLocalVetCode] = React.useState(veterinarianCode);
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
        setLocalVetCode(veterinarianCode);
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
            toast.error(t("common.cloudinaryNotConfigured"));
            return;
        }

        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error(t("common.fileTooLarge"));
            e.target.value = "";
            return;
        }

        setUploadingAvatar(true);
        try {
            const signRes = await fetch(`/api/cloudinary/upload?folder=profile_pictures`);
            const signJson = await signRes.json();
            if (!signRes.ok) {
                toast.error(t("common.failedToPrepareUpload"));
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
                toast.error(t("common.uploadFailed"));
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
                    toast.error(typeof saveJson?.error === "string" ? saveJson.error : t("menu.failedToSaveProfilePicture"));
                    return;
                }
                if (saveJson?.profile) dispatch(setProfile(saveJson.profile));
                toast.success(t("common.profilePictureUpdated"));
            }
        } catch {
            toast.error(t("common.uploadFailed"));
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
                toast.error(typeof json?.error === "string" ? json.error : t("menu.failedToSaveChanges"));
                return;
            }
            if (json?.profile) dispatch(setProfile(json.profile));
            toast.success(t("common.savedChanges"));
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateCode = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ regenerateVeterinarianCode: true }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(typeof json?.error === "string" ? json.error : t("menu.failedToRegenerateCode"));
                return;
            }
            if (json?.profile) {
                dispatch(setProfile(json.profile));
                setLocalVetCode(json.profile.veterinarianCode || "");
            }
            toast.success(t("auth.codeRegenerated"));
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "h-[48px] w-full rounded-xl border border-[#E5E5EA] bg-white px-4 text-[15px] leading-[18px] text-[#1C1C1E] placeholder:text-[#8E8E93] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0";
    const labelCls = "text-[14px] font-medium leading-[18px] text-[#1C1C1E] mb-1.5 block";
    return (
        <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
            <Header title={t("menu.editProfile")} />
            {/* Avatar Section */}
            <div className="flex justify-center pt-6 pb-8">
                <div className="relative">
                    <div className="w-[160px] h-[160px] rounded-full overflow-hidden bg-[#E8E8EE]">
                        <Image
                            width={320}
                            height={320}
                            src={avatarUrl}
                            alt={t('profile.profile')}
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
                        className="absolute bottom-2 right-2 w-11 h-11 bg-[#3F78D8] rounded-full flex items-center justify-center shadow-md hover:bg-[#2f68c8] transition-colors"
                    >
                        <Camera className="h-5 w-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-5">
                <div>
                    <Label className={labelCls}>
                        {t('menu.fullName')}<span className="text-[#1C1C1E]">*</span>
                    </Label>
                    <Input
                        value={localFullName}
                        onChange={(e) => setLocalFullName(e.target.value)}
                        placeholder="Jackson Miro"
                        className={inputCls}
                    />
                </div>

                <div>
                    <Label className={labelCls}>
                        {t('menu.email')}
                    </Label>
                    <Input
                        type="email"
                        value={localEmail}
                        disabled
                        placeholder="email@address.com"
                        className={`${inputCls} opacity-70`}
                    />
                </div>

                <div>
                    <Label className={labelCls}>
                        {t('menu.phoneNumber')}
                    </Label>
                    <PhoneInput
                        name="phone"
                        value={localPhone}
                        onChange={setLocalPhone}
                        defaultCountry="br"
                        containerClassName="w-full"
                        inputClassName="!w-full !h-[48px] !rounded-xl !border !border-[#E5E5EA] !bg-white !pl-[52px] !text-[15px] !leading-[18px] !text-[#1C1C1E] placeholder:!text-[#8E8E93] focus:!outline-none"
                        buttonClassName="!h-[48px] !border !border-[#E5E5EA] !border-r-0 !bg-white !rounded-l-xl"
                    />
                </div>

                <div>
                    <Label className={labelCls}>
                        {t("menu.veterinarianUniqueCode")}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            value={localVetCode}
                            readOnly
                            placeholder="QF3GLAS38"
                            className={`${inputCls} flex-1 min-w-0`}
                        />
                        <Button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(localVetCode || ""); toast.success(t("menu.copied")); }}
                            className="h-[48px] rounded-xl bg-[#3F78D8] text-white px-4 text-[13px] font-semibold hover:bg-[#2f68c8] shadow-none"
                        >
                            {t("menu.copy")}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleRegenerateCode}
                            disabled={saving}
                            className="h-[48px] rounded-xl bg-[#3F78D8] text-white px-4 text-[13px] font-semibold hover:bg-[#2f68c8] whitespace-nowrap shadow-none"
                        >
                            {t("menu.regenerate")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="pb-8 pt-6">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-[52px] rounded-xl bg-[#3F78D8] hover:bg-[#2f68c8] text-white font-bold text-[16px] shadow-none"
                >
                    {saving ? t('menu.saving') : t('menu.saveChanges')}
                </Button>
            </div>
        </div>
    );
}
