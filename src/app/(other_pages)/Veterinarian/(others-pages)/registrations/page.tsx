'use client'
import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown, PawPrint, User, ChevronRight, Plus, Keyboard, History, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TabType = "patients" | "guardians";

interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: string;
  avatarUrl?: string;
}

interface Guardian {
  id: string;
  name: string;
  idNumber: string;
  avatarUrl?: string;
}

const samplePatients: Patient[] = [
  {
    id: "1",
    name: "Buddy",
    species: "Dog",
    breed: "Golden Retriever",
    gender: "Male",
    age: "3 years",
    avatarUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "2",
    name: "Wolfy",
    species: "Dog",
    breed: "Golden Retriever",
    gender: "Male",
    age: "3 years",
    avatarUrl: "https://images.unsplash.com/photo-1617895153857-3cfe49f4f456?w=100&h=100&fit=crop&crop=face",
  },
];

const sampleGuardians: Guardian[] = [
  {
    id: "1",
    name: "Emily",
    idNumber: "111.222.333",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "2",
    name: "Zack Knight",
    idNumber: "111.222.333",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
];

interface RegistrationsListProps {
  patients?: Patient[];
  guardians?: Guardian[];
  onAddPatient?: () => void;
  onAddGuardian?: () => void;
  onPatientAction?: (patientId: string, action: "urinalysis" | "history" | "edit") => void;
  onPatientClick?: (patientId: string) => void;
  onGuardianClick?: (guardianId: string) => void;
}

export default function RegistrationsList({
  patients = samplePatients,
  guardians = sampleGuardians,
  onAddPatient,
  onAddGuardian,
  onPatientAction,
  onPatientClick,
  onGuardianClick,
}: RegistrationsListProps) {
  const [activeTab, setActiveTab] = useState<TabType>("patients");

  return (
    <div className="h-[100dvh] w-full bg-white">
      <div className="mx-auto w-full max-w-[520px] h-full pb-6 pt-[calc(env(safe-area-inset-top)+20px)] ">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-lg font-semibold text-foreground">Registrations</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="bg-[#F5F6F6] rounded-full gap-1.5 h-8 px-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M6.75 3.74988C6.55109 3.74988 6.36032 3.8289 6.21967 3.96955C6.07902 4.11021 6 4.30097 6 4.49988C6 4.6988 6.07902 4.88956 6.21967 5.03021C6.36032 5.17087 6.55109 5.24988 6.75 5.24988C6.94891 5.24988 7.13968 5.17087 7.28033 5.03021C7.42098 4.88956 7.5 4.6988 7.5 4.49988C7.5 4.30097 7.42098 4.11021 7.28033 3.96955C7.13968 3.8289 6.94891 3.74988 6.75 3.74988ZM4.6275 3.74988C4.78245 3.31073 5.0698 2.93046 5.44995 2.66148C5.8301 2.39249 6.28432 2.24805 6.75 2.24805C7.21568 2.24805 7.6699 2.39249 8.05005 2.66148C8.4302 2.93046 8.71755 3.31073 8.8725 3.74988H14.25C14.4489 3.74988 14.6397 3.8289 14.7803 3.96955C14.921 4.11021 15 4.30097 15 4.49988C15 4.6988 14.921 4.88956 14.7803 5.03021C14.6397 5.17087 14.4489 5.24988 14.25 5.24988H8.8725C8.71755 5.68903 8.4302 6.06931 8.05005 6.33829C7.6699 6.60728 7.21568 6.75172 6.75 6.75172C6.28432 6.75172 5.8301 6.60728 5.44995 6.33829C5.0698 6.06931 4.78245 5.68903 4.6275 5.24988H3.75C3.55109 5.24988 3.36032 5.17087 3.21967 5.03021C3.07902 4.88956 3 4.6988 3 4.49988C3 4.30097 3.07902 4.11021 3.21967 3.96955C3.36032 3.8289 3.55109 3.74988 3.75 3.74988H4.6275ZM11.25 8.24989C11.0511 8.24989 10.8603 8.3289 10.7197 8.46955C10.579 8.61021 10.5 8.80097 10.5 8.99989C10.5 9.1988 10.579 9.38956 10.7197 9.53021C10.8603 9.67087 11.0511 9.74989 11.25 9.74989C11.4489 9.74989 11.6397 9.67087 11.7803 9.53021C11.921 9.38956 12 9.1988 12 8.99989C12 8.80097 11.921 8.61021 11.7803 8.46955C11.6397 8.3289 11.4489 8.24989 11.25 8.24989ZM9.1275 8.24989C9.28245 7.81074 9.5698 7.43046 9.94995 7.16148C10.3301 6.89249 10.7843 6.74805 11.25 6.74805C11.7157 6.74805 12.1699 6.89249 12.5501 7.16148C12.9302 7.43046 13.2175 7.81074 13.3725 8.24989H14.25C14.4489 8.24989 14.6397 8.3289 14.7803 8.46955C14.921 8.61021 15 8.80097 15 8.99989C15 9.1988 14.921 9.38956 14.7803 9.53021C14.6397 9.67087 14.4489 9.74989 14.25 9.74989H13.3725C13.2175 10.189 12.9302 10.5693 12.5501 10.8383C12.1699 11.1073 11.7157 11.2517 11.25 11.2517C10.7843 11.2517 10.3301 11.1073 9.94995 10.8383C9.5698 10.5693 9.28245 10.189 9.1275 9.74989H3.75C3.55109 9.74989 3.36032 9.67087 3.21967 9.53021C3.07902 9.38956 3 9.1988 3 8.99989C3 8.80097 3.07902 8.61021 3.21967 8.46955C3.36032 8.3289 3.55109 8.24989 3.75 8.24989H9.1275ZM6.75 12.7499C6.55109 12.7499 6.36032 12.8289 6.21967 12.9696C6.07902 13.1102 6 13.301 6 13.4999C6 13.6988 6.07902 13.8896 6.21967 14.0302C6.36032 14.1709 6.55109 14.2499 6.75 14.2499C6.94891 14.2499 7.13968 14.1709 7.28033 14.0302C7.42098 13.8896 7.5 13.6988 7.5 13.4999C7.5 13.301 7.42098 13.1102 7.28033 12.9696C7.13968 12.8289 6.94891 12.7499 6.75 12.7499ZM4.6275 12.7499C4.78245 12.3107 5.0698 11.9305 5.44995 11.6615C5.8301 11.3925 6.28432 11.248 6.75 11.248C7.21568 11.248 7.6699 11.3925 8.05005 11.6615C8.4302 11.9305 8.71755 12.3107 8.8725 12.7499H14.25C14.4489 12.7499 14.6397 12.8289 14.7803 12.9696C14.921 13.1102 15 13.301 15 13.4999C15 13.6988 14.921 13.8896 14.7803 14.0302C14.6397 14.1709 14.4489 14.2499 14.25 14.2499H8.8725C8.71755 14.689 8.4302 15.0693 8.05005 15.3383C7.6699 15.6073 7.21568 15.7517 6.75 15.7517C6.28432 15.7517 5.8301 15.6073 5.44995 15.3383C5.0698 15.0693 4.78245 14.689 4.6275 14.2499H3.75C3.55109 14.2499 3.36032 14.1709 3.21967 14.0302C3.07902 13.8896 3 13.6988 3 13.4999C3 13.301 3.07902 13.1102 3.21967 12.9696C3.36032 12.8289 3.55109 12.7499 3.75 12.7499H4.6275Z" fill="#2B2B2B" />
              </svg>              <span className="text-sm">Filter</span>
            </Button>
            <Button variant="ghost" size="sm" className="bg-[#F5F6F6] rounded-full gap-1.5 h-8 px-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M6 15V7.5M6 15L3.75 12.75M6 15L8.25 12.75M12 3V10.5M12 3L14.25 5.25M12 3L9.75 5.25" stroke="#2B2B2B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>              <span className="text-sm">Sort</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 grid grid-cols-2 px-4">
          <button
            onClick={() => setActiveTab("patients")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeTab === "patients"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-black"
              }`}
          >
            <PawPrint className="h-4 w-4" />
            <span>Patients ({patients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("guardians")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeTab === "guardians"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-black"
              }`}
          >
            <User className="h-4 w-4" />
            <span>Guardians ({guardians.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-2 p-4 h-full rounded-t-[16px] bg-[#F5F6F6]">
          {activeTab === "patients" ? (
            patients.map((patient) => (
              <div
                key={patient.id}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={patient.avatarUrl} alt={patient.name} />
                      <AvatarFallback className="bg-muted text-black text-sm">
                        {patient.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground text-[15px]">{patient.name}</h3>
                      <p className="text-sm text-black/70">
                        {patient.species} - {patient.breed} - {patient.gender} - {patient.age}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPatientClick?.(patient.id)}
                    className="text-black hover:text-foreground transition-colors p-1"
                  >
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </button>
                </div>
                <div className="flex gap-2 grid grid-cols-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPatientAction?.(patient.id, "urinalysis")}
                    className="text-black rounded-full h-9 col-span-2 px-4 text-sm font-normal bg-[#F5F6F6]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="8" viewBox="0 0 17 8" fill="none">
                      <rect width="17" height="8" rx="1" fill="#2B2B2B" />
                      <rect x="1" y="1" width="5" height="6" rx="1" fill="white" />
                      <rect x="7" y="1" width="5" height="6" rx="1" fill="white" />
                    </svg>
                    Start Urinalysis
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPatientAction?.(patient.id, "history")}
                    className="text-black rounded-full h-9 px-4 text-sm font-normal bg-[#F5F6F6]"
                  >
                    <History className="h-4 w-4 mr-1.5" />
                    History
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPatientAction?.(patient.id, "edit")}
                    className="text-black rounded-full h-9 px-4 text-sm font-normal bg-[#F5F6F6]"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                </div>
              </div>
            ))
          ) : (
            guardians.map((guardian) => (
              <div
                key={guardian.id}
                className="bg-card rounded-2xl px-3 p-2 shadow-sm border border-border/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={guardian.avatarUrl} alt={guardian.name} />
                      <AvatarFallback className="bg-muted text-black text-sm">
                        {guardian.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground text-[15px]">{guardian.name}</h3>
                      <p className="text-sm text-black/70">ID: {guardian.idNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onGuardianClick?.(guardian.id)}
                    className="text-black hover:text-foreground transition-colors p-1"
                  >
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Button */}
        <div className="">
          <Button
            onClick={activeTab === "patients" ? onAddPatient : onAddGuardian}
            className="rounded-full h-11 px-6 bg-primary gap-2 absolute bottom-40 right-4 z-100 hover:bg-primary/90 text-primary-foreground font-medium shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === "patients" ? "Add New Patient" : "Add Guardian"}
          </Button>
        </div>
      </div>
    </div>
  );
}
