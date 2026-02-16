import React from "react";

export default function AdminPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-white px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-[640px] rounded-[28px] bg-[#EEF4FF] shadow-[0_10px_30px_rgba(31,41,55,0.12)] px-6 py-10 sm:px-12">
        {children}
      </div>
    </div>
  );
}
