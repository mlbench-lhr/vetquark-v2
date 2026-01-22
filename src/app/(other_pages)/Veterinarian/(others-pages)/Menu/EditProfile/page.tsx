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
import { toast } from "react-toastify";

export default function EditProfileCard() {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((s) => s.userProfile.profile);

    const fullName = profile?.fullName ?? "";
    const email = profile?.email ?? "";
    const phone = profile?.phone ?? "";
    const avatarUrl =
        profile?.profileImageUrl ??
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face";

    const [localFullName, setLocalFullName] = React.useState(fullName);
    const [localEmail, setLocalEmail] = React.useState(email);
    const [localPhone, setLocalPhone] = React.useState(() => {
        const initial = String(phone || "").replace(/\s+/gu, "");
        if (!initial) return "";
        return initial.startsWith("+") ? initial : `+${initial}`;
    });
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setLocalFullName(fullName);
        setLocalEmail(email);
        const initial = String(phone || "").replace(/\s+/gu, "");
        setLocalPhone(!initial ? "" : initial.startsWith("+") ? initial : `+${initial}`);
    }, [email, fullName, phone]);

    const parsedPhone = localPhone ? parsePhoneNumberFromString(localPhone) : undefined;
    const derivedPhone = parsedPhone ? parsedPhone.number : localPhone;

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    fullName: localFullName,
                    email: localEmail,
                    phone: derivedPhone,
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
        <div className="bg-background min-h-screen flex flex-col px-4">
            <Header title="Edit Profile" />
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
                    <button
                        onClick={() => toast.info("Coming soon")}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <Camera className="h-4 w-4 text-primary-foreground" />
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-5">
                <div>
                    <Label className="block text-gray-900 font-medium mb-2">Full Name</Label>
                    <Input
                        value={localFullName}
                        onChange={(e) => setLocalFullName(e.target.value)}
                        className="w-full h-12 px-4 py-3 bg-gray-50 rounded-xl border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800 placeholder:text-gray-400 md:text-base"
                    />
                </div>

                <div>
                    <Label className="block text-gray-900 font-medium mb-2">Email</Label>
                    <Input
                        type="email"
                        value={localEmail}
                        onChange={(e) => setLocalEmail(e.target.value)}
                        className="w-full h-12 px-4 py-3 bg-gray-50 rounded-xl border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800 placeholder:text-gray-400 md:text-base"
                    />
                </div>

                <div>
                    <Label className="block text-gray-900 font-medium mb-2">Phone Number</Label>
                    <PhoneInput
                        name="phone"
                        value={localPhone}
                        onChange={setLocalPhone}
                        defaultCountry="br"
                        containerClassName="w-full"
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
