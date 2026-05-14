'use client'
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PatientInfoCard, ReportsHistory } from "./Information";
import { Report } from "../types";
import Progress from "./Progress";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Search, Bell } from "lucide-react";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}







const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3 px-4 mb-4">
      <button
        onClick={() => onTabChange('information')}
        className={`flex-1 py-2.5 px-6 rounded-full text-sm font-semibold transition-colors ${activeTab === 'information'
          ? 'bg-primary text-white'
          : 'bg-white text-gray-600 border border-gray-300'
          }`}
      >
        {t('home.informationTab')}
      </button>
      <button
        onClick={() => onTabChange('progress')}
        className={`flex-1 py-2.5 px-6 rounded-full text-sm font-semibold transition-colors ${activeTab === 'progress'
          ? 'bg-primary text-white'
          : 'bg-white text-gray-600 border border-gray-300'
          }`}
      >
        {t('reading.progress.evolutionTab')}
      </button>
    </div>
  );
};

// Patient Info Card Component


// Main Page Component
const PatientProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('information');
  const params = useParams<{ patient_id: string }>();
  const patientId = params?.patient_id;

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    (async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/patient/get_patient_details?patientId=${encodeURIComponent(patientId)}`);
        const data = await res.json();
        if (res.ok) {
          setPatient(data.item);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!patientId) return;
      try {
        const res = await fetch(`/api/reading/get_readings?patientId=${encodeURIComponent(patientId)}&page=1&pageSize=50`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (res.ok) {
          const items = Array.isArray(data?.items) ? data.items : [];
          setReports(
            items.map((r: any) => ({
              id: String(r.id || r._id || ""),
              date: String(r.date || ""),
              status: r.status === "signed" ? "signed" as const : "pending" as const,
              avatarSrc: String(r.avatarSrc || patient?.photo || ""),
            }))
          );
        }
      } catch {
        setReports([]);
      }
      return () => { mounted = false; };
    })();
  }, [patientId, patient?.photo]);

  const patientData = useMemo(() => {
    const dob = patient?.dateOfBirth ? new Date(patient.dateOfBirth) : null;
    let ageText = "";
    if (dob && Number.isFinite(dob.getTime())) {
      const now = new Date();
      let years = now.getFullYear() - dob.getFullYear();
      let months = now.getMonth() - dob.getMonth();
      let days = now.getDate() - dob.getDate();
      if (days < 0) {
        months -= 1;
        const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += daysInPrevMonth;
      }
      if (months < 0) {
        months += 12;
        years -= 1;
      }
      const unit = (type: "y" | "m" | "d", n: number) => {
        if (type === "y") return n === 1 ? t('home.ageUnits.year') : t('home.ageUnits.years');
        if (type === "m") return n === 1 ? t('home.ageUnits.month') : t('home.ageUnits.months');
        return n === 1 ? t('home.ageUnits.day') : t('home.ageUnits.days');
      };
      const parts: string[] = [];
      if (years > 0) parts.push(`${years} ${unit("y", years)}`);
      if (months > 0) parts.push(`${months} ${unit("m", months)}`);
      if (days > 0 || parts.length === 0) parts.push(`${Math.max(0, days)} ${unit("d", Math.max(0, days))}`);
      ageText = parts.join(" ");
    } else if (typeof patient?.ageYears === "number") {
      const y = Math.max(0, Number(patient.ageYears) || 0);
      const label = y === 1 ? t('home.ageUnits.year') : t('home.ageUnits.years');
      ageText = `${y} ${label}`;
    }

    return {
      name: patient?.animalName ?? "",
      type: patient?.species ?? "",
      breed: patient?.breed ?? "",
      image: patient?.photo ?? "",
      sex: patient?.sex ?? "",
      age: ageText,
      gender: patient?.sex ?? "",
      microchip: patient?.microchip ?? "",
      temperament: patient?.temperament ?? "",
      size: patient?.size ?? "",
      coat: patient?.coat ?? "",
      neutered: patient?.neutered ?? "",
      rga: patient?.rga ?? "",
      planName: patient?.planName ?? "",
      cardNumber: patient?.cardNumber ?? "",
      cardValidity: patient?.cardValidity ?? "",
      allergies: patient?.allergies ?? "",
      chronicDiseases: patient?.chronicDiseases ?? "",
      otherInformation: patient?.otherInformation ?? "",
      internalNotes: patient?.internalNotes ?? "",
      guardianId: patient?.guardian?.id ?? "",
      guardianName: patient?.guardian?.fullName ?? "",
      guardianTaxId: patient?.guardian?.taxId ?? "",
      guardianEmail: patient?.guardian?.email ?? "",
    };
  }, [patient, i18n.language]);


  const PatientDetailsSkeleton = () => (
    <div className="px-4 animate-pulse space-y-4">
      <div className="rounded-2xl bg-[#F5F6F6] p-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-300" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-44 rounded bg-gray-300" />
            <div className="h-3 w-32 rounded bg-gray-300" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-gray-300" />
          <div className="h-3 w-5/6 rounded bg-gray-300" />
          <div className="h-3 w-2/3 rounded bg-gray-300" />
        </div>
      </div>
      <div className="rounded-2xl bg-[#F5F6F6] p-4">
        <div className="h-4 w-28 rounded bg-gray-300" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-gray-300" />
          ))}
        </div>
      </div>
    </div>
  );

  const router = useRouter();

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between px-1 mb-3">
        <button
          onClick={() => router.back()}
          aria-label={t('common.back')}
          className="w-10 h-10 rounded-full bg-[#F1F2F3] flex items-center justify-center hover:bg-gray-200"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-[18px] font-bold text-primary">{t('home.patientProfileTitle')}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            className="w-10 h-10 rounded-full bg-[#F1F2F3] flex items-center justify-center hover:bg-gray-200"
          >
            <Search size={18} className="text-gray-700" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-90"
          >
            <Bell size={18} className="text-white" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">1</span>
          </button>
        </div>
      </div>
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {loading ? (
        <PatientDetailsSkeleton />
      ) : activeTab === 'information' ? (
        <>
          <PatientInfoCard {...patientData} patientId={patientId} />
          <ReportsHistory petName={patientData.name} reports={reports} patientId={patientId} />
        </>
      ) : (
        <Progress patientId={patientId} variant="evolution" />
      )}
    </div>
  );
};

export default PatientProfilePage;
