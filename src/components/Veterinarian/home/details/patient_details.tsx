'use client'
import Header from "@/components/common/header";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PatientInfoCard, ReportsHistory } from "./Information";
import { Report } from "../types";
import Progress from "./Progress";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}







const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex gap-3 px-4 mb-4">
      <button
        onClick={() => onTabChange('information')}
        className={`flex-1 py-1 px-6 rounded-full font-semibold transition-colors ${activeTab === 'information'
          ? 'bg-primary text-white'
          : 'text-gray-600 border border-gray-300'
          }`}
      >
        Information
      </button>
      <button
        onClick={() => onTabChange('progress')}
        className={`flex-1 py-1 px-6 rounded-full font-semibold transition-colors ${activeTab === 'progress'
          ? 'bg-primary text-white'
          : 'text-gray-600 border border-gray-300'
          }`}
      >
        Progress
      </button>
    </div>
  );
};

// Patient Info Card Component


// Main Page Component
const PatientProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('information');
  const params = useParams<{ patient_id: string }>();
  const patientId = params?.patient_id;

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const patientData = useMemo(() => {
    const dob = patient?.dateOfBirth ? new Date(patient.dateOfBirth) : null;
    const now = new Date();
    const ageYears = dob && !Number.isNaN(dob.getTime())
      ? Math.max(0, now.getFullYear() - dob.getFullYear() - (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0))
      : null;

    return {
      name: patient?.animalName ?? "",
      type: patient?.species ?? "",
      breed: patient?.breed ?? "",
      image: patient?.photo || "/logo.png",
      sex: patient?.sex ?? "",
      age: ageYears === null ? "" : `${ageYears} years`,
      gender: patient?.sex ?? "",
    };
  }, [patient]);

  const reports: Report[] = [];

  return (
    <div className="pb-5">
      <Header title="Patient Profile" />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'information' && (
        <>
          <PatientInfoCard {...patientData} />
          <ReportsHistory petName={patientData.name} reports={reports} />
        </>
      )}

      {activeTab === 'progress' && (
        <Progress />
      )}
    </div>
  );
};

export default PatientProfilePage;