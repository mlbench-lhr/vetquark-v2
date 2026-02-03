"use client";

import React, { useState, useEffect } from "react";
import BottomTabs from "@/layout/BottomTabs"; // adjust path as needed
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

// Mobile detection wrapper
function MobileOnly({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("mobileOnly.title")}</h2>
          <p className="text-gray-600">
            {t("mobileOnly.message")}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [hasBackButton, setHasBackButton] = useState(false);

  useEffect(() => {
    const check = () => {
      const nextHasBackButton = (!!document.querySelector(
        'button[aria-label="Back"]'
      ) || !!document.querySelector(
        'button[aria-label="Voltar"]'
      )) && pathname!=="/Guardian/pets";
      setHasBackButton((prev) =>
        prev === nextHasBackButton ? prev : nextHasBackButton
      );
    };

    check();

    const observer = new MutationObserver(() => check());
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-label"],
    });

    return () => observer.disconnect();
  }, [pathname]);

  return (
    <MobileOnly>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Main Content Area - with padding for bottom nav */}
        <main className={`flex-1 pt-4 px-4 overflow-auto relative ${hasBackButton ? "" : "pb-20"}`}>
          {children}
        </main>

        {/* Bottom Navigation */}
        {!hasBackButton ? <BottomTabs /> : null}
      </div>
    </MobileOnly>
  );
}
