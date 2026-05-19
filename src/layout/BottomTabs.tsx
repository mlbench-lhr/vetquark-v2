"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// Bottom navigation tab data
const VETERINARIAN_TABS = [
    { id: "start", labelKey: "tabs.start", icon: "/home icon.svg", icon_active: "/home icon.svg", href: "/Veterinarian/home" },
    { id: "patient", labelKey: "tabs.addPatient", icon: "/footsteppaw-icon.svg", icon_active: "/footsteppaw-icon.svg", href: "/Veterinarian/patient" },
    { id: "reading", labelKey: "tabs.newReading", icon: "/strip-icon.svg", icon_active: "/strip-icon.svg", href: "/Veterinarian/new-reading" },
    { id: "history", labelKey: "tabs.reports", icon: "/time-icon.svg", icon_active: "/time-icon.svg", href: "/Veterinarian/history" },
    { id: "registrations", labelKey: "tabs.registrations", icon: "/sheet-icon.svg", icon_active: "/sheet-icon.svg", href: "/Veterinarian/registrations" },
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
        <nav className="absolute h-[47px] left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] bg-[#F6F8FB] border border-[#E5EAF1] rounded-full z-50">
            <div className="flex items-center justify-between px-4 relative h-full">
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
                                <div className="w-[42px] h-[42px] flex flex-col justify-center items-center rounded-full bg-white border border-[#D6E2F0]">
                                    <Image
                                        src={Icon}
                                        alt={label}
                                        width={16}
                                        height={16}
                                        className={` w-[12px] h-auto`}
                                    />

                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-[24px] h-[24px]">
                                    <Image
                                        src={Icon}
                                        alt={label}
                                        width={22}
                                        height={22}
                                        className={`${tab.id === "patient" ? "w-[18px] h-[16px]" : "w-[13px] h-[13px]"}  object-contain`}
                                    />
                                </div>
                            )}
                            {

                                < span
                                    className={`text-[9px] leading-none transition-colors truncate w-full text-center ${tab.id === "patient" ? "-ml-1" : ""} ${isActive ? "text-primary font-medium" : "text-[#4F5464]"}`}
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
