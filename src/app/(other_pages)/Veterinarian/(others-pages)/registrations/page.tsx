'use client'
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PawPrint, User, ChevronRight, Plus, History, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Pagination from "@/components/tables/Pagination";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FallbackText } from "@/components/ui/fallback-text";

type TabType = "patients" | "guardians";

interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: string;
  avatarUrl?: string;
  createdAt: string;
  lastExamDaysAgo: number;
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
    createdAt: "2026-02-10T10:00:00.000Z",
    lastExamDaysAgo: 1,
  },
  {
    id: "2",
    name: "Wolfy",
    species: "Dog",
    breed: "Golden Retriever",
    gender: "Male",
    age: "3 years",
    avatarUrl: "https://images.unsplash.com/photo-1617895153857-3cfe49f4f456?w=100&h=100&fit=crop&crop=face",
    createdAt: "2026-02-12T10:00:00.000Z",
    lastExamDaysAgo: 7,
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
  patients,
  guardians,
  onAddPatient,
  onAddGuardian,
  onPatientAction,
  onPatientClick,
  onGuardianClick,
}: RegistrationsListProps) {
  return (
    <Suspense fallback={<div className="h-[100dvh] w-full bg-white" />}>
      <RegistrationsListContent
        patients={patients}
        guardians={guardians}
        onAddPatient={onAddPatient}
        onAddGuardian={onAddGuardian}
        onPatientAction={onPatientAction}
        onPatientClick={onPatientClick}
        onGuardianClick={onGuardianClick}
      />
    </Suspense>
  );
}

function RegistrationsListContent({
  patients: initialPatients,
  guardians: initialGuardians,
  onAddPatient,
  onAddGuardian,
  onPatientAction,
  onPatientClick,
  onGuardianClick,
}: RegistrationsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("patients");
  const [sortOpen, setSortOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>(() => initialPatients ?? []);
  const [guardians, setGuardians] = useState<Guardian[]>(() => initialGuardians ?? []);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [guardiansLoading, setGuardiansLoading] = useState(false);
  const [patientsPage, setPatientsPage] = useState(1);
  const [guardiansPage, setGuardiansPage] = useState(1);
  const [patientsTotalPages, setPatientsTotalPages] = useState(0);
  const [guardiansTotalPages, setGuardiansTotalPages] = useState(0);
  const [patientsTotalCount, setPatientsTotalCount] = useState(0);
  const [guardiansTotalCount, setGuardiansTotalCount] = useState(0);

  const sort = (searchParams.get("sort") || "name_az").trim();
  const species = (searchParams.get("species") || "").trim();
  const gender = (searchParams.get("gender") || "").trim();
  const age = (searchParams.get("age") || "").trim();
  const lastExam = (searchParams.get("lastExam") || "").trim();

  const pageSize = 10;
  const patientsSkeletonRows = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);
  const guardiansSkeletonRows = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  useEffect(() => {
    setPatientsPage(1);
  }, [age, gender, lastExam, sort, species]);

  useEffect(() => {
    setGuardiansPage(1);
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPatientsLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(patientsPage));
        params.set("pageSize", String(pageSize));
        const res = await fetch(`/api/patient/get_patients?${params.toString()}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load patients";
          throw new Error(msg);
        }

        const raw = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];
        const mapped: Patient[] = raw.map((p) => {
          const name = String(p.name || p.animalName || "");
          const species = String(p.species || "");
          const breed = String(p.breed || "");
          const gender = String(p.gender || p.sex || "");
          const avatarUrl = String(p.avatarUrl || p.image || p.photo || "");
          const createdAt = String(p.createdAt || "");
          const ageYears = typeof p.ageYears === "number" ? p.ageYears : null;
          const age = ageYears === null ? "" : `${ageYears} years`;
          const lastExamDaysAgo = typeof p.lastExamDaysAgo === "number" ? p.lastExamDaysAgo : -1;
          return {
            id: String(p.id || p._id || ""),
            name,
            species,
            breed,
            gender,
            age,
            avatarUrl,
            createdAt,
            lastExamDaysAgo,
          };
        });

        setPatients(mapped);
        setPatientsTotalPages(Number((data as any)?.pagination?.totalPages || 0));
        setPatientsTotalCount(Number((data as any)?.pagination?.total || 0));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load patients";
        toast.error(msg);
        if (mounted) {
          setPatients([]);
          setPatientsTotalPages(0);
          setPatientsTotalCount(0);
        }
      } finally {
        if (mounted) setPatientsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientsPage, searchParams]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setGuardiansLoading(true);
        const params = new URLSearchParams();
        params.set("page", String(guardiansPage));
        params.set("pageSize", String(pageSize));
        const res = await fetch(`/api/guardians/get-guardians?${params.toString()}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load guardians";
          throw new Error(msg);
        }

        const raw = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];
        const mapped: Guardian[] = raw.map((g) => ({
          id: String(g.id || g._id || ""),
          name: String(g.name || g.fullName || ""),
          idNumber: String(g.idNumber || g.taxId || ""),
          avatarUrl: String(g.avatarUrl || g.profileImageUrl || ""),
        }));

        setGuardians(mapped);
        setGuardiansTotalPages(Number((data as any)?.pagination?.totalPages || 0));
        setGuardiansTotalCount(Number((data as any)?.pagination?.total || 0));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load guardians";
        toast.error(msg);
        if (mounted) {
          setGuardians([]);
          setGuardiansTotalPages(0);
          setGuardiansTotalCount(0);
        }
      } finally {
        if (mounted) setGuardiansLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [guardiansPage]);

  const setSortParam = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`/Veterinarian/registrations?${params.toString()}`);
    setSortOpen(false);
  };

  const handlePatientChevron = useCallback(
    (patientId: string) => {
      router.push(`/Veterinarian/home/patientDetails/${encodeURIComponent(patientId)}`);
    },
    [router],
  );

  const handlePatientAction = useCallback(
    (patientId: string, action: "urinalysis" | "history" | "edit") => {
      if (action === "urinalysis") {
        router.push(`/Veterinarian/new-reading?patientId=${encodeURIComponent(patientId)}`);
        return;
      }
      if (action === "history") {
        router.push(`/Veterinarian/history?patientId=${encodeURIComponent(patientId)}`);
        return;
      }
    },
    [router],
  );

  return (
    <div className="h-[100vh pb-[80px w-full bg-white">
      <div className="mx-auto w-full h-ful pb-12! ">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t("registrations.title")}</h2>
          {activeTab === "patients" ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/Veterinarian/registrations/filter?${searchParams.toString()}`)}
                className="bg-[#F5F6F6] rounded-full gap-1.5 h-8 px-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6.75 3.74988C6.55109 3.74988 6.36032 3.8289 6.21967 3.96955C6.07902 4.11021 6 4.30097 6 4.49988C6 4.6988 6.07902 4.88956 6.21967 5.03021C6.36032 5.17087 6.55109 5.24988 6.75 5.24988C6.94891 5.24988 7.13968 5.17087 7.28033 5.03021C7.42098 4.88956 7.5 4.6988 7.5 4.49988C7.5 4.30097 7.42098 4.11021 7.28033 3.96955C7.13968 3.8289 6.94891 3.74988 6.75 3.74988ZM4.6275 3.74988C4.78245 3.31073 5.0698 2.93046 5.44995 2.66148C5.8301 2.39249 6.28432 2.24805 6.75 2.24805C7.21568 2.24805 7.6699 2.39249 8.05005 2.66148C8.4302 2.93046 8.71755 3.31073 8.8725 3.74988H14.25C14.4489 3.74988 14.6397 3.8289 14.7803 3.96955C14.921 4.11021 15 4.30097 15 4.49988C15 4.6988 14.921 4.88956 14.7803 5.03021C14.6397 5.17087 14.4489 5.24988 14.25 5.24988H8.8725C8.71755 5.68903 8.4302 6.06931 8.05005 6.33829C7.6699 6.60728 7.21568 6.75172 6.75 6.75172C6.28432 6.75172 5.8301 6.60728 5.44995 6.33829C5.0698 6.06931 4.78245 5.68903 4.6275 5.24988H3.75C3.55109 5.24988 3.36032 5.17087 3.21967 5.03021C3.07902 4.88956 3 4.6988 3 4.49988C3 4.30097 3.07902 4.11021 3.21967 3.96955C3.36032 3.8289 3.55109 3.74988 3.75 3.74988H4.6275ZM11.25 8.24989C11.0511 8.24989 10.8603 8.3289 10.7197 8.46955C10.579 8.61021 10.5 8.80097 10.5 8.99989C10.5 9.1988 10.579 9.38956 10.7197 9.53021C10.8603 9.67087 11.0511 9.74989 11.25 9.74989C11.4489 9.74989 11.6397 9.67087 11.7803 9.53021C11.921 9.38956 12 9.1988 12 8.99989C12 8.80097 11.921 8.61021 11.7803 8.46955C11.6397 8.3289 11.4489 8.24989 11.25 8.24989ZM9.1275 8.24989C9.28245 7.81074 9.5698 7.43046 9.94995 7.16148C10.3301 6.89249 10.7843 6.74805 11.25 6.74805C11.7157 6.74805 12.1699 6.89249 12.5501 7.16148C12.9302 7.43046 13.2175 7.81074 13.3725 8.24989H14.25C14.4489 8.24989 14.6397 8.3289 14.7803 8.46955C14.921 8.61021 15 8.80097 15 8.99989C15 9.1988 14.921 9.38956 14.7803 9.53021C14.6397 9.67087 14.4489 9.74989 14.25 9.74989H13.3725C13.2175 10.189 12.9302 10.5693 12.5501 10.8383C12.1699 11.1073 11.7157 11.2517 11.25 11.2517C10.7843 11.2517 10.3301 11.1073 9.94995 10.8383C9.5698 10.5693 9.28245 10.189 9.1275 9.74989H3.75C3.55109 9.74989 3.36032 9.67087 3.21967 9.53021C3.07902 9.38956 3 9.1988 3 8.99989C3 8.80097 3.07902 8.61021 3.21967 8.46955C3.36032 8.3289 3.55109 8.24989 3.75 8.24989H9.1275ZM6.75 12.7499C6.55109 12.7499 6.36032 12.8289 6.21967 12.9696C6.07902 13.1102 6 13.301 6 13.4999C6 13.6988 6.07902 13.8896 6.21967 14.0302C6.36032 14.1709 6.55109 14.2499 6.75 14.2499C6.94891 14.2499 7.13968 14.1709 7.28033 14.0302C7.42098 13.8896 7.5 13.6988 7.5 13.4999C7.5 13.301 7.42098 13.1102 7.28033 12.9696C7.13968 12.8289 6.94891 12.7499 6.75 12.7499ZM4.6275 12.7499C4.78245 12.3107 5.0698 11.9305 5.44995 11.6615C5.8301 11.3925 6.28432 11.248 6.75 11.248C7.21568 11.248 7.6699 11.3925 8.05005 11.6615C8.4302 11.9305 8.71755 12.3107 8.8725 12.7499H14.25C14.4489 12.7499 14.6397 12.8289 14.7803 12.9696C14.921 13.1102 15 13.301 15 13.4999C15 13.6988 14.921 13.8896 14.7803 14.0302C14.6397 14.1709 14.4489 14.2499 14.25 14.2499H8.8725C8.71755 14.689 8.4302 15.0693 8.05005 15.3383C7.6699 15.6073 7.21568 15.7517 6.75 15.7517C6.28432 15.7517 5.8301 15.6073 5.44995 15.3383C5.0698 15.0693 4.78245 14.689 4.6275 14.2499H3.75C3.55109 14.2499 3.36032 14.1709 3.21967 14.0302C3.07902 13.8896 3 13.6988 3 13.4999C3 13.301 3.07902 13.1102 3.21967 12.9696C3.36032 12.8289 3.55109 12.7499 3.75 12.7499H4.6275Z" fill="#2B2B2B" />
                </svg>              <span className="text-sm">{t("registrations.filter")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOpen(true)}
                className="bg-[#F5F6F6] rounded-full gap-1.5 h-8 px-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6 15V7.5M6 15L3.75 12.75M6 15L8.25 12.75M12 3V10.5M12 3L14.25 5.25M12 3L9.75 5.25" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>              <span className="text-sm">{t("registrations.sort")}</span>
              </Button>
            </div>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 grid grid-cols-2 px-">
          <button
            onClick={() => setActiveTab("patients")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeTab === "patients"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-black"
              }`}
          >
            <PawPrint className="h-4 w-4" />
            <span>{t("registrations.patientsTab")} ({patientsTotalCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("guardians")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeTab === "guardians"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-black"
              }`}
          >
            <User className="h-4 w-4" />
            <span>{t("registrations.guardiansTab")} ({guardiansTotalCount})</span>
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-2 p-4 h-fu rounded-t-[16px] bg-[#F5F6F6]">
          {activeTab === "patients" ? (
            patientsLoading ? (
              patientsSkeletonRows.map((k) => (
                <div key={k} className="animate-pulse bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-gray-200" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-gray-200" />
                        <div className="h-3 w-48 rounded bg-gray-200" />
                      </div>
                    </div>
                    <div className="h-5 w-5 rounded bg-gray-200" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-9 rounded-full bg-gray-200 col-span-2" />
                    <div className="h-9 rounded-full bg-gray-200" />
                  </div>
                </div>
              ))
            ) : patients.length === 0 ? (
              <FallbackText>{t("registrations.noPatientsFound")}</FallbackText>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={patient.avatarUrl || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"} alt={patient.name} />
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
                      onClick={() => (onPatientClick ? onPatientClick(patient.id) : handlePatientChevron(patient.id))}
                      className="text-black hover:text-foreground transition-colors p-1"
                    >
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </button>
                  </div>
                  <div className="flex gap-2 grid grid-cols-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => (onPatientAction ? onPatientAction(patient.id, "urinalysis") : handlePatientAction(patient.id, "urinalysis"))}
                      className="text-black rounded-full hover:bg-[#F5F6F6] h-9 col-span-2 px-4 text-sm font-normal bg-[#F5F6F6]"
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
                      onClick={() => (onPatientAction ? onPatientAction(patient.id, "history") : handlePatientAction(patient.id, "history"))}
                      className="text-black rounded-full hover:bg-[#F5F6F6] h-9 px-4 text-sm font-normal bg-[#F5F6F6]"
                    >
                      <History className="h-4 w-4 mr-1.5" />
                      History
                    </Button>
                  </div>
                </div>
              ))
            )
          ) : (
            guardiansLoading ? (
              guardiansSkeletonRows.map((k) => (
                <div key={k} className="animate-pulse bg-card rounded-2xl px-3 p-2 shadow-sm border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-gray-200" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 rounded bg-gray-200" />
                        <div className="h-3 w-24 rounded bg-gray-200" />
                      </div>
                    </div>
                    <div className="h-5 w-5 rounded bg-gray-200" />
                  </div>
                </div>
              ))
            ) : guardians.length === 0 ? (
              <FallbackText>{t("registrations.noGuardiansFound")}</FallbackText>
            ) : (
              guardians.map((guardian) => (
                <div
                  key={guardian.id}
                  className="bg-card rounded-2xl px-3 p-2 shadow-sm border border-border/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={guardian.avatarUrl || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"} alt={guardian.name} />
                        <AvatarFallback className="bg-muted text-black text-sm">
                          {guardian.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground text-[15px]">{guardian.name}</h3>
                        <p className="text-sm text-black/70">ID: {guardian.idNumber}</p>
                      </div>
                    </div>
                    <Link
                      href={`/Veterinarian/home/guardianDetails/${encodeURIComponent(guardian.id)}`}
                      className="text-black hover:text-foreground transition-colors p-1"
                    >
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </Link>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {activeTab === "patients" && !patientsLoading && patientsTotalPages > 1 ? (
          <div className="mt-4 flex justify-center px-4">
            <Pagination
              currentPage={patientsPage}
              totalPages={patientsTotalPages}
              onPageChange={(nextPage) => {
                const clamped = Math.max(1, Math.min(patientsTotalPages, nextPage));
                setPatientsPage(clamped);
              }}
            />
          </div>
        ) : null}

        {activeTab === "guardians" && !guardiansLoading && guardiansTotalPages > 1 ? (
          <div className="mt-4 flex justify-center px-4">
            <Pagination
              currentPage={guardiansPage}
              totalPages={guardiansTotalPages}
              onPageChange={(nextPage) => {
                const clamped = Math.max(1, Math.min(guardiansTotalPages, nextPage));
                setGuardiansPage(clamped);
              }}
            />
          </div>
        ) : null}

        {/* Add Button */}
        <div className="">
          <Button
            onClick={() => {
              if (activeTab === "patients") {
                if (onAddPatient) onAddPatient();
                else router.push("/Veterinarian/patient");
                return;
              }
              if (onAddGuardian) onAddGuardian();
              else router.push("/Veterinarian/patient/new_guardian");
            }}
            className="rounded-full h-11 px-6 bg-primary gap-2 fixed bottom-[90px] right-4 z-10 hover:bg-primary/90 text-primary-foreground font-medium shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === "patients" ? "Add New Patient" : "Add Guardian"}
          </Button>
        </div>
      </div>

      {sortOpen ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          onClick={() => setSortOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute inset-x-0 bottom-0 z-[1000]! rounded-t-[24px] bg-white pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-[5px] w-[44px] rounded-full bg-[#E5E7EB]" />
            <div className="relative mt-4 flex items-center justify-center px-4">
              <div className="text-[18px] font-semibold leading-[22px] text-[#111827]">
                Sort By
              </div>
              <button
                type="button"
                onClick={() => setSortOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-transparent"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-[#9AA4AF]" />
              </button>
            </div>

            <div className="mt-4 space-y-3 px-4">
              {[
                { id: "name_az", label: "Name (A-Z)" },
                { id: "age_lh", label: "Age (Low To High)" },
                { id: "age_hl", label: "Age (High To Low)" },
                { id: "recent", label: "Recently Added" },
              ].map((opt) => {
                const active = sort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortParam(opt.id)}
                    className={`flex h-[52px] w-full items-center justify-between rounded-[14px] px-4 text-[14px] font-medium transition-colors ${active ? "bg-[#EEF4FF] text-[#111827]" : "bg-[#F5F6F6] text-[#111827]"
                      }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-[8px] ${active ? "bg-[#3F78D8]" : "bg-transparent"
                        }`}
                    >
                      {active ? (
                        <svg
                          width="14"
                          height="10"
                          viewBox="0 0 14 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.3333 1L5.00001 8.33333L1.66667 5"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 px-4">
              <button
                type="button"
                onClick={() => setSortOpen(false)}
                className="h-[54px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
