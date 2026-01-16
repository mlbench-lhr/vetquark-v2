"use client"
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/common/header";

interface EditProfileCardProps {
    fullName?: string;
    email?: string;
    phoneCode?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    onAvatarChange?: () => void;
    onSave?: (data: {
        fullName: string;
        email: string;
        phoneCode: string;
        phoneNumber: string;
    }) => void;
}

export default function EditProfileCard({
    fullName = "Jackson Miro",
    email = "jackm@gmail.com",
    phoneCode = "+222",
    phoneNumber = "273782901",
    avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    onAvatarChange,
    onSave,
}: EditProfileCardProps) {
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
                        onClick={onAvatarChange}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <Camera className="h-4 w-4 text-primary-foreground" />
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-5">
                <div className="space-y-2">
                    <Label className="text-sm font-normal text-foreground">
                        Full Name
                    </Label>
                    <Input
                        defaultValue={fullName}
                        className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 text-base text-foreground focus-visible:ring-0 focus-visible:border-primary"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-normal text-foreground">Email</Label>
                    <Input
                        type="email"
                        defaultValue={email}
                        className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 text-base text-foreground focus-visible:ring-0 focus-visible:border-primary"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-normal text-foreground">
                        Phone Number
                    </Label>
                    <div className="flex items-center gap-2 border-b border-border">
                        <span className="text-base text-foreground">{phoneCode}</span>
                        <Input
                            type="tel"
                            defaultValue={phoneNumber}
                            className="h-12 border-0 rounded-none bg-transparent px-0 text-base text-foreground focus-visible:ring-0"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="py-6">
                <Button
                    onClick={() =>
                        onSave?.({
                            fullName,
                            email,
                            phoneCode,
                            phoneNumber,
                        })
                    }
                    className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
                >
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
