'use client'

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/userProfileSlice";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

function maskCpf(digits: string) {
  const v = digits.slice(0, 11);
  const parts = [v.slice(0, 3), v.slice(3, 6), v.slice(6, 9), v.slice(9, 11)].filter(Boolean);
  if (v.length <= 3) return parts[0] || "";
  if (v.length <= 6) return `${parts[0]}.${parts[1]}`;
  if (v.length <= 9) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
}

function maskCnpj(digits: string) {
  const v = digits.slice(0, 14);
  const parts = [v.slice(0, 2), v.slice(2, 5), v.slice(5, 8), v.slice(8, 12), v.slice(12, 14)].filter(Boolean);
  if (v.length <= 2) return parts[0] || "";
  if (v.length <= 5) return `${parts[0]}.${parts[1]}`;
  if (v.length <= 8) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (v.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${parts[4]}`;
}

function maskCpfCnpj(digits: string) {
  if (digits.length <= 11) return maskCpf(digits);
  return maskCnpj(digits);
}

function PageHeader({
  title,
  onBack,
  backAriaLabel,
}: {
  title: string;
  onBack: () => void;
  backAriaLabel: string;
}) {
  return (
    <div className="relative flex items-center justify-center px-4 pt-6">
      <button
        type="button"
        onClick={onBack}
        aria-label={backAriaLabel}
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
  const { t } = useTranslation();

  const initial = useMemo(
    () => ({
      taxId: profile?.taxId ?? "",
      dateOfBirth: profile?.dateOfBirth ?? "",
      address: profile?.address ?? "",
    }),
    [profile?.address, profile?.dateOfBirth, profile?.taxId]
  );

  const [nationalIdDigits, setNationalIdDigits] = useState((initial.taxId || "").replace(/\D/g, ""));
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);

  const nationalIdDisplay = useMemo(() => maskCpfCnpj(nationalIdDigits), [nationalIdDigits]);
  const isCpfValid = nationalIdDigits.length === 11;
  const isCnpjValid = nationalIdDigits.length === 14;
  const idValid = isCpfValid || isCnpjValid || nationalIdDigits.length === 0;

  useEffect(() => {
    setNationalIdDigits((initial.taxId || "").replace(/\D/g, ""));
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
          taxId: nationalIdDigits,
          dateOfBirth,
          address,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof json?.error === "string" ? json.error : t("common.failedToSaveChanges"));
        return;
      }
      if (json?.profile) dispatch(setProfile(json.profile));
      toast.success(t("common.savedChanges"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title={t("menu.idAddressInfo")} onBack={() => router.back()} backAriaLabel={t("common.back")} />

      <div className="flex min-h-[calc(100dvh-72px)] flex-col px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div>
          <div className="text-[14px] font-medium leading-[18px] text-[#111827]">{t("profile.nationalId")}</div>
          <input
            value={nationalIdDisplay}
            onChange={(e) => {
              const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 14);
              setNationalIdDigits(digits);
            }}
            placeholder={t("profile.egNationalId")}
            inputMode="numeric"
            pattern="[0-9]*"
            className="mt-3 h-[56px] w-full rounded-[16px] bg-[#F5F6F6] px-4 text-[16px] leading-[20px] text-[#111827] outline-none"
          />
          {nationalIdDigits.length > 0 && !idValid && (
            <div className="mt-2 text-[12px] leading-[16px] text-[#EF4444]">
              {t("profile.invalidNationalId")}
            </div>
          )}

          <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">{t("profile.dateOfBirth")}</div>
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

          <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">{t("profile.address")}</div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("profile.egAddress")}
            className="mt-3 h-[56px] w-full rounded-[16px] bg-[#F5F6F6] px-4 text-[16px] leading-[20px] text-[#111827] outline-none"
          />
        </div>

        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !idValid}
            className="h-[56px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
          >
            {saving ? t("common.saving") : t("common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
