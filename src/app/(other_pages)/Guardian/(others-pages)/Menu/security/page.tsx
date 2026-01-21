'use client'

import React from "react";
import Header from "@/components/common/header";
import { Laptop, Monitor, Smartphone } from "lucide-react";

type SessionRow = {
  id: string;
  label: string;
  rightLabel?: string;
  icon:
    | { type: "smartphone" }
    | { type: "laptop" }
    | { type: "monitor" }
    | { type: "google" };
};

export default function SecurityPage() {
  const sessions: SessionRow[] = [
    { id: "iphone", label: "iPhone 17 Pro Max", rightLabel: "This device", icon: { type: "smartphone" } },
    { id: "macbook", label: "Macbook Computer", icon: { type: "laptop" } },
    { id: "pixel", label: "Google Pixel 9", icon: { type: "google" } },
    { id: "windows", label: "Windows Computer", icon: { type: "monitor" } },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F6]">
      <Header title="Security" />

      <div className="px-4 pt-4 pb-10">
        <div className="space-y-3">
          <div className="rounded-2xl bg-white px-4 py-4 flex items-center justify-between">
            <div className="text-[15px] text-[#111827] font-medium">Two-Factor Authentication (2FA)</div>
            <button
              type="button"
              className="h-10 px-6 rounded-full bg-[#4A7BF7] text-white text-[14px] font-medium"
            >
              Activate
            </button>
          </div>

          <div className="rounded-2xl bg-white px-4 py-4 flex items-center justify-between">
            <div className="text-[15px] text-[#111827] font-medium">Change Password</div>
            <button
              type="button"
              className="h-10 px-6 rounded-full bg-[#4A7BF7] text-white text-[14px] font-medium"
            >
              Change
            </button>
          </div>

          <div className="rounded-3xl bg-white px-4 pt-4 pb-5">
            <div className="text-[15px] text-[#111827] font-semibold mb-3">Active Sessions</div>

            <div className="rounded-2xl bg-[#F5F6F6] p-2 space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="rounded-xl bg-white px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg border border-[#4A7BF7] flex items-center justify-center bg-white">
                      {s.icon.type === "smartphone" && <Smartphone className="w-5 h-5 text-[#4A7BF7]" />}
                      {s.icon.type === "laptop" && <Laptop className="w-5 h-5 text-[#4A7BF7]" />}
                      {s.icon.type === "monitor" && <Monitor className="w-5 h-5 text-[#4A7BF7]" />}
                      {s.icon.type === "google" && <span className="text-[14px] font-semibold text-[#4A7BF7]">G</span>}
                    </div>
                    <div className="text-[15px] text-[#111827] font-medium">{s.label}</div>
                  </div>

                  {s.rightLabel ? (
                    <div className="text-[14px] font-medium text-[#4A7BF7]">{s.rightLabel}</div>
                  ) : (
                    <div className="w-20" />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="w-full mt-4 text-center text-[15px] font-medium text-[#EF4444]"
            >
              Disconnect from all devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

