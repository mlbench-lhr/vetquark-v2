'use client';
import React from 'react';
import { Search, Bell, ChevronLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from "react-i18next";

interface HeaderProps {
    title: string;
    onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();

    const handleBack = () => {
        if (typeof onBack === 'function') {
            onBack();
        } else {
            router.back();
        }
    };

    const notificationsHref = pathname?.toLowerCase().includes('guardian')
        ? '/Guardian/notifications'
        : '/Veterinarian/notifications';

    return (
        <div className="flex items-center justify-between px-1 py-2">
            {/* Left: back button + title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    onClick={handleBack}
                    aria-label={t("common.back")}
                    className="w-9 h-9 rounded-full bg-[#F1F2F3] flex items-center justify-center hover:bg-gray-200 flex-shrink-0"
                >
                    <ChevronLeft size={18} className="text-gray-700" />
                </button>
                <h1 className="text-[18px] font-bold text-primary truncate leading-tight">{title}</h1>
            </div>

            {/* Right: search + bell */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    type="button"
                    aria-label={t("common.search") ?? "Search"}
                    className="w-9 h-9 flex items-center justify-center"
                >
                    <Search size={20} className="text-gray-500" />
                </button>
                <button
                    type="button"
                    aria-label={t("common.notifications")}
                    onClick={() => router.push(notificationsHref)}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-90"
                >
                    <Bell size={18} className="text-white" />
                </button>
            </div>
        </div>
    );
};

export default Header;
