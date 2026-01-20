"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Bottom navigation tab data
const VETERINARIAN_TABS = [
    { id: "start", label: "Start", icon: "/images/tabs/home.svg", icon_active: "/images/tabs/home-active.svg", href: "/Veterinarian/home" },
    { id: "patient", label: "+ Patient", icon: "/images/tabs/paw.svg", icon_active: "/images/tabs/paw-active.svg", href: "/Veterinarian/patient" },
    { id: "reading", label: "New reading", icon: "/images/tabs/analysis.svg", icon_active: "/images/tabs/analysis-active.svg", href: "/Veterinarian/new-reading" },
    { id: "history", label: "History", icon: "/images/tabs/clock.svg", icon_active: "/images/tabs/clock-active.svg", href: "/Veterinarian/history" },
    { id: "registrations", label: "Registrations", icon: "/images/tabs/cat.svg", icon_active: "/images/tabs/cat-active.svg", href: "/Veterinarian/registrations" },
];

const GUARDIAN_TABS = [
    { id: "start", label: "Start", icon: "/images/tabs/home.svg", icon_active: "/images/tabs/home-active.svg", href: "/Guardian/home" },
    { id: "pets", label: "Pets", icon: "/images/tabs/paw.svg", icon_active: "/images/tabs/paw-active.svg", href: "/Guardian/home/pets" },
    { id: "history", label: "History", icon: "/images/tabs/clock.svg", icon_active: "/images/tabs/clock-active.svg", href: "/Guardian/history" },
    { id: "glossary", label: "Glossary", icon: "/images/tabs/glossary.svg", icon_active: "/images/tabs/glossary-active.svg", href: "/Guardian/glossary" },
    { id: "payment", label: "Payment", icon: "/images/tabs/payment.svg", icon_active: "/images/tabs/payment-active.svg", href: "/Guardian/payment" },
];

export default function BottomTabs() {

    const pathname = usePathname();

    const role = pathname?.split("/")[1]?.toLowerCase();
    const isGuardianRoute = role === "guardian";

    const tabs = isGuardianRoute ? GUARDIAN_TABS : VETERINARIAN_TABS;


    return (
        <nav className="fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+0px)] w-full bg-white border border-gray-200 rounded- shadow-theme-lg">
            <div className="flex items-center justify-between px-2 sm:px-4 py-2 relative">
                {tabs.map((tab, index) => {
                    const isActive = pathname?.toLowerCase().startsWith(tab.href.toLowerCase()) ?? false;
                    const Icon = isActive ? tab.icon_active : tab.icon;
                    const isReading = tab.id === "reading";

                    return (
                        <Link href={tab.href}
                            key={`${tab.id}-${index}`}
                            className={`flex flex-col items-center justify-center min-w-0 transition-all flex-1 gap-1 sm:gap-1.5 py-1.5 sm:py-2`}
                        >

                            <>
                                <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                                    <Image
                                        src={Icon}
                                        alt={tab.label}
                                        width={28}
                                        height={28}
                                        className={`w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 `}
                                    />
                                </div>
                                <span
                                    className={`text-[10px] sm:text-[11px] md:text-xs transition-colors truncate w-full text-center px-0.5 ${isActive ? "text-[#3F78D8] font-medium" : "text-gray-500"
                                        }`}
                                >
                                    {tab.label}
                                </span>
                            </>

                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
