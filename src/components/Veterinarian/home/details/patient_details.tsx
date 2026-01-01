'use client'
import Header from "@/components/common/header";
import { CheckCircle2, Download, Edit, Edit2, Eye, Plus } from "lucide-react";
import { useState } from "react";
import { PatientInfoCard, ReportsHistory } from "./Information";
import { Report } from "../types";
import AttendanceChart from "../AttendanceChart";
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

  const patientData = {
    name: 'Buddy',
    type: 'Dog',
    breed: 'Golden Retriever',
    image: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&h=600&fit=crop',
    sex: 'Male',
    age: '3 years',
    gender: 'Male',
  };

  const reports: Report[] = [
    { id: '1', date: '22/05/2024', status: 'signed' },
  ];

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