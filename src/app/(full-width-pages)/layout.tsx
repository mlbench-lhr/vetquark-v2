'use client'
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  function MobileOnly({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(true);

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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("common.mobileOnly")}</h2>
            <p className="text-gray-600">
              {t("common.mobileOnlyMessage")}
            </p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }
  return (
    <MobileOnly >
      <div className="min-h-[100dvh]">
        {children}
      </div>
    </MobileOnly >
  );
}
