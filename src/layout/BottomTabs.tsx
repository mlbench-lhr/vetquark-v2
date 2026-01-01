"use client";

import React, { useState } from "react";
import Image from "next/image";

// Bottom navigation tab data
const tabs = [
    { id: "start", label: "Start", icon: "/images/tabs/home.svg", icon_active: "/images/tabs/home-active.svg" },
    { id: "patient", label: "+ Patient", icon: "/images/tabs/paw.svg", icon_active: "/images/tabs/paw-active.svg" },
    { id: "patient", label: "", icon: "/images/tabs/paw.svg", icon_active: "/images/tabs/paw-active.svg" },
    { id: "reading", label: "New reading", icon: "/images/tabs/analysis.svg", icon_active: "/images/tabs/analysis-active.svg" },
    { id: "history", label: "History", icon: "/images/tabs/clock.svg", icon_active: "/images/tabs/clock-active.svg" },
    { id: "registrations", label: "Registrations", icon: "/images/tabs/cat.svg", icon_active: "/images/tabs/cat-active.svg" },
];

export default function BottomTabs() {
    const [activeTab, setActiveTab] = useState("start");

    return (
        <nav className="fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+16px)] w-[calc(100%-2rem)] max-w-2xl bg-gray-100 border border-gray-200 rounded-full shadow-theme-lg">
            <div className="flex items-center justify-between px-2 sm:px-4 py-2 relative">
                {tabs.map((tab, index) => {
                    const isActive = activeTab === tab.id;
                    const Icon = isActive ? tab.icon_active : tab.icon;
                    const isReading = tab.id === "reading";

                    return (
                        <button
                            key={`${tab.id}-${index}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center min-w-0 transition-all ${isReading
                                    ? "absolute left-1/2 -translate-x-1/2 -top-2 sm:-top-4 z-10"
                                    : "flex-1 gap-1 sm:gap-1.5 py-1.5 sm:py-2"
                                }`}
                        >
                            {isReading ? (
                                <div className="flex flex-col items-center justify-center w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gray-200 shadow-md gap-0.5 sm:gap-1">
                                    <Image
                                        src={Icon}
                                        alt={tab.label}
                                        width={32}
                                        height={32}
                                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 ${isActive ? "opacity-100" : "opacity-50"}`}
                                    />
                                    <span
                                        className={`text-[10px] sm:text-[11px] md:text-xs transition-colors w-full text-center px-0.5 leading-tight max-w-[60px] sm:max-w-[70px] ${isActive ? "text-blue-500 font-medium" : "text-gray-500"
                                            }`}
                                    >
                                        {tab.label}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                                        <Image
                                            src={Icon}
                                            alt={tab.label}
                                            width={28}
                                            height={28}
                                            className={`w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 ${isActive ? "opacity-100" : "opacity-50"}`}
                                        />
                                    </div>
                                    <span
                                        className={`text-[10px] sm:text-[11px] md:text-xs transition-colors truncate w-full text-center px-0.5 ${isActive ? "text-blue-500 font-medium" : "text-gray-500"
                                            }`}
                                    >
                                        {tab.label}
                                    </span>
                                </>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}