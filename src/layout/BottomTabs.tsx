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


    const isMiddle = (index: number) => index === 2;

    return (
        <nav className="fixed left-4 right-4 h-[68px] bottom-[calc(env(safe-area-inset-bottom)+12px)] bg-gray-50 border border-gray-100 rounded-full shadow-lg z-50">
            <div className="flex items-end justify-between px-3 sm:px-5 pt-1 pb-2 relative h-full">
                {tabs.map((tab, index) => {
                    const isActive = pathname?.toLowerCase().startsWith(tab.href.toLowerCase()) ?? false;
                    const Icon = isActive ? tab.icon_active : tab.icon;
                    const label = t(tab.labelKey);
                    const middle = isMiddle(index);

                    return (
                        <Link href={tab.href}
                            key={`${tab.id}-${index}`}
                            className={`flex flex-col items-center justify-end min-w-0 transition-all flex-1 gap-1 py-1 ${middle ? '-mt-6' : ''}`}
                        >
                            {middle ? (
                                <div className="w-[60px] h-[60px] rounded-full bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center -mt-2">
                                    <Image
                                        src={Icon}
                                        alt={label}
                                        width={28}
                                        height={28}
                                        className="w-7 h-7"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-6 h-6">
                                    <Image
                                        src={Icon}
                                        alt={label}
                                        width={24}
                                        height={24}
                                        className="w-5 h-5"
                                    />
                                </div>
                            )}
                            <span
                                className={`text-[10px] transition-colors truncate w-full text-center px-0.5 ${isActive ? "text-[#3F78D8] font-medium" : "text-gray-500"
                                    }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
