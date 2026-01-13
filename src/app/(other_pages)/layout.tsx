"use client";

import React, { useState, useEffect } from "react";
import BottomTabs from "@/layout/BottomTabs"; // adjust path as needed

// Mobile detection wrapper
function MobileOnly({ children }: { children: React.ReactNode }) {
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Mobile Only</h2>
          <p className="text-gray-600">
            This application is designed for mobile devices only. Please access it from your smartphone or tablet.
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
  return (
    <MobileOnly>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Main Content Area - with padding for bottom nav */}
        <main className="flex-1 overflow-auto pb-20">
          {children}
        </main>

        {/* Bottom Navigation */}
        <BottomTabs />
      </div>
    </MobileOnly>
  );
}