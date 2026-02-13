"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// Bottom navigation tab data
const VETERINARIAN_TABS = [
    { id: "start", labelKey: "tabs.start", icon: "/images/tabs/home.svg", icon_active: "/images/tabs/home-active.svg", href: "/Veterinarian/home" },
    { id: "patient", labelKey: "tabs.addPatient", icon: "/images/tabs/paw.svg", icon_active: "/images/tabs/paw-active.svg", href: "/Veterinarian/patient" },
    { id: "reading", labelKey: "tabs.newReading", icon: "/images/tabs/analysis.svg", icon_active: "/images/tabs/analysis-active.svg", href: "/Veterinarian/new-reading" },
    { id: "history", labelKey: "tabs.reports", icon: "/images/tabs/clock.svg", icon_active: "/images/tabs/clock-active.svg", href: "/Veterinarian/history" },
    { id: "registrations", labelKey: "tabs.registrations", icon: "/images/tabs/cat.svg", icon_active: "/images/tabs/cat-active.svg", href: "/Veterinarian/registrations" },
];

const GUARDIAN_TABS = [
    { id: "start", labelKey: "tabs.start", icon: "/images/tabs/home.svg", icon_active: "/images/tabs/home-active.svg", href: "/Guardian/home" },
    { id: "pets", labelKey: "tabs.pets", icon: "/images/tabs/paw.svg", icon_active: "/images/tabs/paw-active.svg", href: "/Guardian/pets" },
    { id: "history", labelKey: "tabs.reports", icon: "/images/tabs/clock.svg", icon_active: "/images/tabs/clock-active.svg", href: "/Guardian/history" },
    { id: "glossary", labelKey: "tabs.glossary", icon: "/images/tabs/glossary.svg", icon_active: "/images/tabs/glossary-active.svg", href: "/Guardian/glossary" },
    { id: "payment", labelKey: "tabs.payment", icon: "/images/tabs/payment.svg", icon_active: "/images/tabs/payment-active.svg", href: "/Guardian/payment" },
];

export default function BottomTabs() {

    const pathname = usePathname();
    const { t } = useTranslation();

    const role = pathname?.split("/")[1]?.toLowerCase();
    const isGuardianRoute = role === "guardian";

    const tabs = isGuardianRoute ? GUARDIAN_TABS : VETERINARIAN_TABS;


    return (
        <nav className="fixed inset-x-0 h-[80px] bottom-[calc(env(safe-area-inset-bottom)+0px)] w-full bg-white border border-gray-200 rounded-t-xl shadow-theme-lg">
            <div className="flex items-center justify-between px-2 sm:px-4 py-2 relative">
                {tabs.map((tab, index) => {
                    const isActive = pathname?.toLowerCase().startsWith(tab.href.toLowerCase()) ?? false;
                    const Icon = isActive ? tab.icon_active : tab.icon;
                    const label = t(tab.labelKey);

                    return (
                        <Link href={tab.href}
                            key={`${tab.id}-${index}`}
                            className={`flex flex-col items-center justify-center min-w-0 transition-all flex-1 gap-1 sm:gap-1.5 py-1.5 sm:py-2`}
                        >

                            <>
                                <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                                    <Image
                                        src={Icon}
                                        alt={label}
                                        width={28}
                                        height={28}
                                        className={`w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 `}
                                    />
                                </div>
                                <span
                                    className={`text-[10px] sm:text-[11px] md:text-xs transition-colors truncate w-full text-center px-0.5 ${isActive ? "text-[#3F78D8] font-medium" : "text-gray-500"
                                        }`}
                                >
                                    {label}
                                </span>
                            </>

                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
