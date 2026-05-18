"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// Bottom navigation tab data
const VETERINARIAN_TABS = [
    { id: "start", labelKey: "tabs.start", icon: "/images/tabs/home-new.svg", icon_active: "/images/tabs/home-new-active.svg", href: "/Veterinarian/home" },
    { id: "patient", labelKey: "tabs.addPatient", icon: "/images/tabs/paw-new.svg", icon_active: "/images/tabs/paw-new-active.svg", href: "/Veterinarian/patient" },
    { id: "reading", labelKey: "tabs.newReading", icon: "/new reading icon.svg", icon_active: "/images/tabs/reading-new.svg", href: "/Veterinarian/new-reading" },
    { id: "history", labelKey: "tabs.reports", icon: "/images/tabs/clock.svg", icon_active: "/images/tabs/clock-active.svg", href: "/Veterinarian/history" },
    { id: "registrations", labelKey: "tabs.registrations", icon: "/images/tabs/cat-new.svg", icon_active: "/images/tabs/cat-new.svg", href: "/Veterinarian/registrations" },
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
        <nav className="fixed left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] bg-[#D9D9D995] backdrop-blur-sm rounded-full z-50 h-fit">            <div className="flex items-center justify-between px-4 relative h-full">
            {tabs.map((tab, index) => {
                const isActive = pathname?.toLowerCase().startsWith(tab.href.toLowerCase()) ?? false;
                const Icon = isActive ? tab.icon_active : tab.icon;
                const label = t(tab.labelKey);
                const middle = isMiddle(index);

                return (
                    <Link href={tab.href}
                        key={`${tab.id}-${index}`}
                        className={`flex flex-col items-center justify-end min-w-0 transition-all flex-1 gap-[3px] ${middle ? '-mt-5' : ''}`}
                    >
                        {middle ? (
                            <div className="w-[78px] h-[78px] flex flex-col justify-center items-center rounded-full bg-[#eeeef1]">
                                <Image
                                    src={Icon}
                                    alt={label}
                                    width={16}
                                    height={16}
                                    className="w-[12px] h-auto"
                                />
                                <span
                                    className={`text-[7px] leading-none transition-colors truncate w-full text-center ${isActive ? "text-primary font-medium" : "text-[#4F5464]"}`}
                                >
                                    {label}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-[24px] h-[24px]">
                                <Image
                                    src={Icon}
                                    alt={label}
                                    width={22}
                                    height={22}
                                    className="w-[22px] h-[22px] object-contain"
                                />
                            </div>
                        )}
                        {
                            !middle &&
                            < span
                                className={`text-[7px] leading-none transition-colors truncate w-full text-center ${isActive ? "text-primary font-medium" : "text-[#4F5464]"}`}
                            >
                                {label}
                            </span>
                        }
                    </Link>
                );
            })}
        </div>
        </nav >
    );
}
