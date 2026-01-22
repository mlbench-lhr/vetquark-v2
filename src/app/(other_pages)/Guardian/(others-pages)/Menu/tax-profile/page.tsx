'use client'

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="relative flex items-center justify-center px-4 pt-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-full"
      >
        <ChevronLeft className="h-6 w-6 text-[#111827]" />
      </button>
      <div className="text-[16px] font-medium leading-[20px] text-[#111827]">{title}</div>
      <div className="absolute right-4 top-6 h-10 w-10" />
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.userProfile.profile);

  const initial = useMemo(
    () => ({
      taxId: profile?.taxId ?? "",
      dateOfBirth: profile?.dateOfBirth ?? "",
      address: profile?.address ?? "",
    }),
    [profile?.address, profile?.dateOfBirth, profile?.taxId]
  );

  const [nationalId, setNationalId] = useState(initial.taxId);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNationalId(initial.taxId);
    setDateOfBirth(initial.dateOfBirth);
    setAddress(initial.address);
  }, [initial.address, initial.dateOfBirth, initial.taxId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taxId: nationalId,
          dateOfBirth,
          address,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof json?.error === "string" ? json.error : "Failed to save changes");
        return;
      }
      if (json?.profile) dispatch(setProfile(json.profile));
      toast.success("Saved changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="ID & Address Info" onBack={() => router.back()} />

      <div className="flex min-h-[calc(100dvh-72px)] flex-col px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div>
          <div className="text-[14px] font-medium leading-[18px] text-[#111827]">National ID</div>
          <input
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="mt-3 h-[56px] w-full rounded-[16px] bg-[#F5F6F6] px-4 text-[16px] leading-[20px] text-[#111827] outline-none"
          />

          <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">Date of Birth</div>
          <div className="relative mt-3">
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="h-[56px] w-full rounded-[16px] bg-[#F5F6F6] px-4 pr-12 text-[16px] leading-[20px] text-[#111827] outline-none"
            />
            <Calendar
              color='#3F78D8'
              className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9AA4AF]" />
          </div>

          <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">Address</div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-3 h-[56px] w-full rounded-[16px] bg-[#F5F6F6] px-4 text-[16px] leading-[20px] text-[#111827] outline-none"
          />
        </div>

        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-[56px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
