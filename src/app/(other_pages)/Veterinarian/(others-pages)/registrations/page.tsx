'use client'
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PawPrint, User, ChevronDown, Plus, History, Pencil, X, Search, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  microchip?: string;
  allergies?: string;
  planName?: string;
  neutered?: string;
  examCount?: number;
}

interface Guardian {
  id: string;
  name: string;
  idNumber: string;
  avatarUrl?: string;
  pets?: string[];
  phone?: string;
}

function formatPatientAge(args: {
  dateOfBirth: unknown;
  ageYears: unknown;
  language: string;
}): string {
  const lang = args.language === "pt" ? "pt" : "en";
  const dob = typeof args.dateOfBirth === "string" && args.dateOfBirth.trim()
    ? new Date(args.dateOfBirth)
    : null;

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
      if (lang === "pt") {
        if (type === "y") return n === 1 ? "ano" : "anos";
        if (type === "m") return n === 1 ? "mês" : "meses";
        return n === 1 ? "dia" : "dias";
      }
      if (type === "y") return n === 1 ? "year" : "years";
      if (type === "m") return n === 1 ? "month" : "months";
      return n === 1 ? "day" : "days";
    };

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${unit("y", years)}`);
    if (months > 0) parts.push(`${months} ${unit("m", months)}`);
    if (days > 0 || parts.length === 0) parts.push(`${Math.max(0, days)} ${unit("d", Math.max(0, days))}`);
    return parts.join(" ");
  }

  const y = typeof args.ageYears === "number" && Number.isFinite(args.ageYears) ? Math.max(0, args.ageYears) : null;
  if (y !== null) {
    const label = lang === "pt" ? (y === 1 ? "ano" : "anos") : (y === 1 ? "year" : "years");
    return `${y} ${label}`;
  }

  return "";
}

function formatLastExam(daysAgo: number, lang: string): string {
  if (daysAgo < 0) return lang === "pt" ? "Nenhum exame" : "No exams";
  if (lang === "pt") {
    if (daysAgo === 0) return "hoje";
    if (daysAgo === 1) return "1 dia atrás";
    return `${daysAgo} dias atrás`;
  }
  if (daysAgo === 0) return "today";
  if (daysAgo === 1) return "1 day ago";
  return `${daysAgo} days ago`;
}

function genderLabel(gender: string, lang: string): string {
  if (lang === "pt") {
    if (gender === "Male") return "Macho";
    if (gender === "Female") return "Fêmea";
    return gender;
  }
  return gender;
}

function neuteredLabel(neutered: string, lang: string): string {
  if (lang === "pt") {
    if (neutered === "Yes") return "Sim";
    if (neutered === "No") return "Não";
    return neutered;
  }
  return neutered;
}

function speciesLabel(species: string, lang: string): string {
  if (lang === "pt") {
    if (species === "Dog") return "Cão";
    if (species === "Cat") return "Gato";
    return species;
  }
  return species;
}

export default function RegistrationsList() {
  return (
    <Suspense fallback={<div className="h-[100dvh] w-full bg-white" />}>
      <RegistrationsListContent />
    </Suspense>
  );
}

function RegistrationsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "pt" ? "pt" : "en";
  const [activeTab, setActiveTab] = useState<TabType>("patients");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [guardiansLoading, setGuardiansLoading] = useState(false);
  const [patientsPage, setPatientsPage] = useState(1);
  const [guardiansPage, setGuardiansPage] = useState(1);
  const [patientsTotalPages, setPatientsTotalPages] = useState(0);
  const [guardiansTotalPages, setGuardiansTotalPages] = useState(0);
  const [patientsTotalCount, setPatientsTotalCount] = useState(0);
  const [guardiansTotalCount, setGuardiansTotalCount] = useState(0);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);

  const sort = (searchParams.get("sort") || "name_az").trim();
  const species = (searchParams.get("species") || "").trim();
  const genderFilter = (searchParams.get("gender") || "").trim();
  const age = (searchParams.get("age") || "").trim();
  const lastExam = (searchParams.get("lastExam") || "").trim();

  const pageSize = 10;
  const patientsSkeletonRows = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);
  const guardiansSkeletonRows = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  useEffect(() => {
    setPatientsPage(1);
  }, [age, genderFilter, lastExam, sort, species]);

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
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const res = await fetch(`/api/patient/get_patients?${params.toString()}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : t("registrations.failedToLoadPatients");
          throw new Error(msg);
        }

        const raw = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];
        const mapped: Patient[] = raw.map((p) => ({
          id: String(p.id || p._id || ""),
          name: String(p.name || p.animalName || ""),
          species: String(p.species || ""),
          breed: String(p.breed || ""),
          gender: String(p.gender || p.sex || ""),
          age: formatPatientAge({ dateOfBirth: p.dateOfBirth, ageYears: p.ageYears, language: i18n.language }),
          avatarUrl: String(p.avatarUrl || p.image || p.photo || ""),
          createdAt: String(p.createdAt || ""),
          lastExamDaysAgo: typeof p.lastExamDaysAgo === "number" ? p.lastExamDaysAgo : -1,
          microchip: p.microchip ?? "",
          allergies: p.allergies ?? "",
          planName: p.planName ?? "",
          neutered: p.neutered ?? "",
          examCount: typeof p.examCount === "number" ? p.examCount : 0,
        }));

        setPatients(mapped);
        setPatientsTotalPages(Number((data as any)?.pagination?.totalPages || 0));
        setPatientsTotalCount(Number((data as any)?.pagination?.total || 0));
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("registrations.failedToLoadPatients");
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
  }, [patientsPage, searchParams, i18n.language, searchQuery]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setGuardiansLoading(true);
        const params = new URLSearchParams();
        params.set("page", String(guardiansPage));
        params.set("pageSize", String(pageSize));
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const res = await fetch(`/api/guardians/get-guardians?${params.toString()}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          const msg = typeof (data as any)?.error === "string" ? (data as any).error : t("registrations.failedToLoadGuardians");
          throw new Error(msg);
        }

        const raw = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];
        const mapped: Guardian[] = raw.map((g) => ({
          id: String(g.id || g._id || ""),
          name: String(g.name || g.fullName || ""),
          idNumber: String(g.idNumber || g.taxId || ""),
          avatarUrl: String(g.avatarUrl || g.profileImageUrl || ""),
          pets: Array.isArray(g.pets) ? g.pets : [],
          phone: g.phone ?? "",
        }));

        setGuardians(mapped);
        setGuardiansTotalPages(Number((data as any)?.pagination?.totalPages || 0));
        setGuardiansTotalCount(Number((data as any)?.pagination?.total || 0));
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("registrations.failedToLoadGuardians");
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
  }, [guardiansPage, searchQuery]);

  const setSortParam = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`/Veterinarian/registrations?${params.toString()}`);
    setSortOpen(false);
  };

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
      if (action === "edit") {
        router.push(`/Veterinarian/patient/new_patient?edit=${encodeURIComponent(patientId)}`);
        return;
      }
    },
    [router],
  );

  const handleGuardianAction = useCallback(
    (guardianId: string, action: "newPet" | "viewPets" | "edit") => {
      if (action === "newPet") {
        router.push(`/Veterinarian/patient/new_patient?guardianId=${encodeURIComponent(guardianId)}`);
        return;
      }
      if (action === "viewPets") {
        router.push(`/Veterinarian/home/guardianPatients/${encodeURIComponent(guardianId)}`);
        return;
      }
      if (action === "edit") {
        router.push(`/Veterinarian/patient/new_guardian?edit=${encodeURIComponent(guardianId)}`);
        return;
      }
    },
    [router],
  );

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setPatientsPage(1);
    setGuardiansPage(1);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-white pb-28 -mx-4 -mt-4 px-0 pt-0">
      <div className="mx-auto w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h1 className="text-[24px] font-bold italic text-[#3F78D8] tracking-tight">{lang === "pt" ? "Cadastros" : t("registrations.title")}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent hover:bg-black/5 transition-colors"
              aria-label="Search"
            >
              <Search className="h-[20px] w-[20px] text-[#6B7280]" strokeWidth={2} />
            </button>
            <button
              onClick={() => router.push("/Veterinarian/notifications")}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#3F78D8]"
              aria-label="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3501 21.9965 12 21.9965C11.6499 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute top-[7px] right-[7px] h-[8px] w-[8px] rounded-full bg-[#EF4444] ring-2 ring-[#3F78D8]" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen ? (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA4AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={lang === "pt" ? "Buscar..." : t("search.placeholder")}
                className="h-10 w-full rounded-full border border-gray-200 bg-[#F5F6F6] pl-9 pr-4 text-sm outline-none focus:border-[#3F78D8] focus:ring-1 focus:ring-[#3F78D8]"
                autoFocus
              />
            </div>
          </div>
        ) : null}

        {/* Tabs & Filters */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("patients")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[13px] font-medium whitespace-nowrap transition-colors ${activeTab === "patients"
              ? "border border-[#3F78D8] text-[#3F78D8] bg-white"
              : "border border-transparent text-[#6B7280] bg-[#F2F3F5]"
              }`}
          >
            <PawPrint className="h-[14px] w-[14px]" />
            <span>{lang === "pt" ? "Pacientes" : t("registrations.patientsTab")} ({patientsTotalCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("guardians")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[13px] font-medium whitespace-nowrap transition-colors ${activeTab === "guardians"
              ? "border border-[#3F78D8] text-[#3F78D8] bg-white"
              : "border border-transparent text-[#6B7280] bg-[#F2F3F5]"
              }`}
          >
            <User className="h-[14px] w-[14px]" />
            <span>{lang === "pt" ? "Tutores" : t("registrations.guardiansTab")} ({guardiansTotalCount})</span>
          </button>
          <button
            onClick={() => router.push(`/Veterinarian/registrations/filter?${searchParams.toString()}`)}
            className="flex items-center gap-1.5 rounded-full bg-[#F2F3F5] px-3.5 py-[7px] text-[13px] font-medium text-[#6B7280] whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.75 3.74988C6.55109 3.74988 6.36032 3.8289 6.21967 3.96955C6.07902 4.11021 6 4.30097 6 4.49988C6 4.6988 6.07902 4.88956 6.21967 5.03021C6.36032 5.17087 6.55109 5.24988 6.75 5.24988C6.94891 5.24988 7.13968 5.17087 7.28033 5.03021C7.42098 4.88956 7.5 4.6988 7.5 4.49988C7.5 4.30097 7.42098 4.11021 7.28033 3.96955C7.13968 3.8289 6.94891 3.74988 6.75 3.74988ZM4.6275 3.74988C4.78245 3.31073 5.0698 2.93046 5.44995 2.66148C5.8301 2.39249 6.28432 2.24805 6.75 2.24805C7.21568 2.24805 7.6699 2.39249 8.05005 2.66148C8.4302 2.93046 8.71755 3.31073 8.8725 3.74988H14.25C14.4489 3.74988 14.6397 3.8289 14.7803 3.96955C14.921 4.11021 15 4.30097 15 4.49988C15 4.6988 14.921 4.88956 14.7803 5.03021C14.6397 5.17087 14.4489 5.24988 14.25 5.24988H8.8725C8.71755 5.68903 8.4302 6.06931 8.05005 6.33829C7.6699 6.60728 7.21568 6.75172 6.75 6.75172C6.28432 6.75172 5.8301 6.60728 5.44995 6.33829C5.0698 6.06931 4.78245 5.68903 4.6275 5.24988H3.75C3.55109 5.24988 3.36032 5.17087 3.21967 5.03021C3.07902 4.88956 3 4.6988 3 4.49988C3 4.30097 3.07902 4.11021 3.21967 3.96955C3.36032 3.8289 3.55109 3.74988 3.75 3.74988H4.6275ZM11.25 8.24989C11.0511 8.24989 10.8603 8.3289 10.7197 8.46955C10.579 8.61021 10.5 8.80097 10.5 8.99989C10.5 9.1988 10.579 9.38956 10.7197 9.53021C10.8603 9.67087 11.0511 9.74989 11.25 9.74989C11.4489 9.74989 11.6397 9.67087 11.7803 9.53021C11.921 9.38956 12 9.1988 12 8.99989C12 8.80097 11.921 8.61021 11.7803 8.46955C11.6397 8.3289 11.4489 8.24989 11.25 8.24989ZM9.1275 8.24989C9.28245 7.81074 9.5698 7.43046 9.94995 7.16148C10.3301 6.89249 10.7843 6.74805 11.25 6.74805C11.7157 6.74805 12.1699 6.89249 12.5501 7.16148C12.9302 7.43046 13.2175 7.81074 13.3725 8.24989H14.25C14.4489 8.24989 14.6397 8.3289 14.7803 8.46955C14.921 8.61021 15 8.80097 15 8.99989C15 9.1988 14.921 9.38956 14.7803 9.53021C14.6397 9.67087 14.4489 9.74989 14.25 9.74989H13.3725C13.2175 10.189 12.9302 10.5693 12.5501 10.8383C12.1699 11.1073 11.7157 11.2517 11.25 11.2517C10.7843 11.2517 10.3301 11.1073 9.94995 10.8383C9.5698 10.5693 9.28245 10.189 9.1275 9.74989H3.75C3.55109 9.74989 3.36032 9.67087 3.21967 9.53021C3.07902 9.38956 3 9.1988 3 8.99989C3 8.80097 3.07902 8.61021 3.21967 8.46955C3.36032 8.3289 3.55109 8.24989 3.75 8.24989H9.1275ZM6.75 12.7499C6.55109 12.7499 6.36032 12.8289 6.21967 12.9696C6.07902 13.1102 6 13.301 6 13.4999C6 13.6988 6.07902 13.8896 6.21967 14.0302C6.36032 14.1709 6.55109 14.2499 6.75 14.2499C6.94891 14.2499 7.13968 14.1709 7.28033 14.0302C7.42098 13.8896 7.5 13.6988 7.5 13.4999C7.5 13.301 7.42098 13.1102 7.28033 12.9696C7.13968 12.8289 6.94891 12.7499 6.75 12.7499ZM4.6275 12.7499C4.78245 12.3107 5.0698 11.9305 5.44995 11.6615C5.8301 11.3925 6.28432 11.248 6.75 11.248C7.21568 11.248 7.6699 11.3925 8.05005 11.6615C8.4302 11.9305 8.71755 12.3107 8.8725 12.7499H14.25C14.4489 12.7499 14.6397 12.8289 14.7803 12.9696C14.921 13.1102 15 13.301 15 13.4999C15 13.6988 14.921 13.8896 14.7803 14.0302C14.6397 14.1709 14.4489 14.2499 14.25 14.2499H8.8725C8.71755 14.689 8.4302 15.0693 8.05005 15.3383C7.6699 15.6073 7.21568 15.7517 6.75 15.7517C6.28432 15.7517 5.8301 15.6073 5.44995 15.3383C5.0698 15.0693 4.78245 14.689 4.6275 14.2499H3.75C3.55109 14.2499 3.36032 14.1709 3.21967 14.0302C3.07902 13.8896 3 13.6988 3 13.4999C3 13.301 3.07902 13.1102 3.21967 12.9696C3.36032 12.8289 3.55109 12.7499 3.75 12.7499H4.6275Z" fill="#6B7280" />
            </svg>
            <span>{lang === "pt" ? "Filtros" : t("registrations.filter")}</span>
          </button>
          <button
            onClick={() => setSortOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#F2F3F5] px-3.5 py-[7px] text-[13px] font-medium text-[#6B7280] whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 15V7.5M6 15L3.75 12.75M6 15L8.25 12.75M12 3V10.5M12 3L14.25 5.25M12 3L9.75 5.25" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{lang === "pt" ? "Ordenar" : t("registrations.sort")}</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 px-4 pt-2">
          {activeTab === "patients" ? (
            patientsLoading ? (
              patientsSkeletonRows.map((k) => (
                <div key={k} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-gray-200" />
                        <div className="h-3 w-48 rounded bg-gray-200" />
                      </div>
                    </div>
                    <div className="h-5 w-5 rounded bg-gray-200" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-3 rounded bg-gray-200" />
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="h-9 rounded-full bg-gray-200" />
                    <div className="h-9 rounded-full bg-gray-200" />
                    <div className="h-9 rounded-full bg-gray-200" />
                  </div>
                </div>
              ))
            ) : patients.length === 0 ? (
              <FallbackText>{t("registrations.noPatientsFound")}</FallbackText>
            ) : (
              patients.map((patient) => {
                const isExpanded = expandedPatientId === patient.id;
                return (
                  <div
                    key={patient.id}
                    className="rounded-[16px] bg-white p-4 border border-[#EAECEF] shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                  >
                    {/* Patient Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-[56px] w-[56px]">
                          <AvatarImage
                            src={patient.avatarUrl || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
                            alt={patient.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-[#F5F6F6] text-[#6B7280] text-sm font-medium">
                            {patient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-[18px] font-bold text-[#1F2937] leading-tight">{patient.name}</h3>
                          <p className="text-[13px] text-[#6B7280] mt-0.5">
                            {speciesLabel(patient.species, lang)}/{patient.breed}
                          </p>
                          <p className="text-[13px] text-[#6B7280]">
                            {genderLabel(patient.gender, lang)}/{neuteredLabel(patient.neutered || "", lang)} • {patient.age}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedPatientId(isExpanded ? null : patient.id)}
                        className="mt-1 text-[#9AA4AF] hover:text-[#6B7280] transition-colors"
                      >
                        <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    {/* Exam Info Row */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#1F2937]">
                        {lang === "pt" ? "Último exame:" : "Last exam:"}
                        <span className="font-normal text-[#6B7280] ml-1">
                          {formatLastExam(patient.lastExamDaysAgo, lang)}
                        </span>
                      </span>
                      <span className="rounded-full border border-[#E5E7EB] bg-white px-2.5 py-[3px] text-[11px] font-medium text-[#374151]">
                        {lang === "pt" ? "Exames: " : "Exams: "}{patient.examCount ?? 0}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePatientAction(patient.id, "urinalysis")}
                        className="flex-1 rounded-lg bg-[#F2F3F5] h-[36px] px-2 text-[12px] font-medium text-[#374151] hover:bg-[#E9EAEC] gap-1.5"
                      >
                        <svg width="14" height="10" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="0.5" y="0.5" width="16" height="11" rx="1.5" stroke="#374151" />
                          <line x1="4" y1="1" x2="4" y2="11" stroke="#374151" />
                          <line x1="7" y1="1" x2="7" y2="11" stroke="#374151" />
                          <line x1="10" y1="1" x2="10" y2="11" stroke="#374151" />
                          <line x1="13" y1="1" x2="13" y2="11" stroke="#374151" />
                        </svg>
                        {lang === "pt" ? "Iniciar Urinálise" : t("registrations.startUrinalysis")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePatientAction(patient.id, "history")}
                        className="flex-1 rounded-lg bg-[#F2F3F5] h-[36px] px-2 text-[12px] font-medium text-[#374151] hover:bg-[#E9EAEC] gap-1.5"
                      >
                        <History className="h-[14px] w-[14px]" />
                        {lang === "pt" ? "Histórico" : t("registrations.history")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePatientAction(patient.id, "edit")}
                        className="flex-1 rounded-lg bg-[#F2F3F5] h-[36px] px-2 text-[12px] font-medium text-[#374151] hover:bg-[#E9EAEC] gap-1.5"
                      >
                        <Pencil className="h-[14px] w-[14px]" />
                        {lang === "pt" ? "Editar" : "Edit"}
                      </Button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded ? (
                      <div className="mt-3 border-t border-[#EAECEF] pt-3 space-y-2">
                        {patient.microchip ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-[#1F2937]">{lang === "pt" ? "Microchip:" : "Microchip:"}</span>
                            <span className="text-[13px] text-[#6B7280]">{patient.microchip}</span>
                          </div>
                        ) : null}
                        {patient.allergies ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-bold text-[#1F2937]">{lang === "pt" ? "Alergias:" : "Allergies:"}</span>
                            {patient.allergies.split(",").map((allergy) => (
                              <span key={allergy.trim()} className="rounded-full bg-[#EF4444] px-3 py-[3px] text-[12px] font-semibold text-white">
                                {allergy.trim()}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {patient.planName ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-[#1F2937]">{lang === "pt" ? "Plano de Saúde:" : "Health Plan:"}</span>
                            <span className="text-[13px] text-[#6B7280]">{patient.planName}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )
          ) : (
            guardiansLoading ? (
              guardiansSkeletonRows.map((k) => (
                <div key={k} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-40 rounded bg-gray-200" />
                      <div className="h-3 w-24 rounded bg-gray-200" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="h-9 rounded-full bg-gray-200" />
                    <div className="h-9 rounded-full bg-gray-200" />
                    <div className="h-9 rounded-full bg-gray-200" />
                  </div>
                </div>
              ))
            ) : guardians.length === 0 ? (
              <FallbackText>{t("registrations.noGuardiansFound")}</FallbackText>
            ) : (
              guardians.map((guardian) => (
                <div
                  key={guardian.id}
                  className="rounded-[16px] bg-white p-4 border border-[#EAECEF] shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                >
                  {/* Guardian Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[20px] font-bold text-[#1F2937] leading-tight">{guardian.name}</h3>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] text-[#6B7280]">CPF:</span>
                        {guardian.idNumber ? (
                          <span className="text-[14px] text-[#374151]">{guardian.idNumber}</span>
                        ) : (
                          <span className="rounded-full bg-[#EF4444] px-3 py-[3px] text-[12px] font-semibold text-white">
                            {lang === "pt" ? "Sem CPF" : "No CPF"}
                          </span>
                        )}
                      </div>
                      {guardian.pets && guardian.pets.length > 0 ? (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-[#1F2937]">{lang === "pt" ? "Pets:" : "Pets:"}</span>
                          {guardian.pets.map((pet) => (
                            <span key={pet} className="rounded-full border border-[#E5E7EB] bg-white px-3 py-[3px] text-[12px] font-medium text-[#374151]">
                              {pet}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={guardian.phone ? `tel:${guardian.phone}` : undefined}
                        className={`flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#3F78D8] ${guardian.phone ? "" : "opacity-60 pointer-events-none"}`}
                        aria-label="Phone"
                      >
                        <Phone className="h-[15px] w-[15px] text-white" fill="white" strokeWidth={0} />
                      </a>
                      <button
                        onClick={() => router.push(`/Veterinarian/home/guardianDetails/${encodeURIComponent(guardian.id)}`)}
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#3F78D8]"
                        aria-label="Message"
                      >
                        <MessageCircle className="h-[15px] w-[15px] text-white" fill="white" strokeWidth={0} />
                      </button>
                      <button
                        onClick={() => router.push(`/Veterinarian/home/guardianDetails/${encodeURIComponent(guardian.id)}`)}
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#3F78D8]"
                        aria-label="Email"
                      >
                        <Mail className="h-[15px] w-[15px] text-white" strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>

                  {/* Guardian Action Buttons */}
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGuardianAction(guardian.id, "newPet")}
                      className="flex-1 rounded-lg bg-[#F2F3F5] h-[36px] px-2 text-[12px] font-medium text-[#374151] hover:bg-[#E9EAEC] gap-1.5"
                    >
                      <Plus className="h-[14px] w-[14px]" />
                      {lang === "pt" ? "Novo Pet" : "New Pet"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGuardianAction(guardian.id, "viewPets")}
                      className="flex-1 rounded-lg bg-[#F2F3F5] h-[36px] px-2 text-[12px] font-medium text-[#374151] hover:bg-[#E9EAEC] gap-1.5"
                    >
                      <PawPrint className="h-[14px] w-[14px]" />
                      {lang === "pt" ? "Ver Pets" : "View Pets"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGuardianAction(guardian.id, "edit")}
                      className="flex-1 rounded-lg bg-[#F2F3F5] h-[36px] px-2 text-[12px] font-medium text-[#374151] hover:bg-[#E9EAEC] gap-1.5"
                    >
                      <Pencil className="h-[14px] w-[14px]" />
                      {lang === "pt" ? "Editar" : "Edit"}
                    </Button>
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

        {/* Bottom Add Button - only on Patients tab per design */}
        {activeTab === "patients" ? (
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+92px)] left-4 right-4 z-10">
            <Button
              onClick={() => router.push("/Veterinarian/patient")}
              className="h-[48px] w-full rounded-xl bg-[#3F78D8] text-[15px] font-semibold text-white hover:bg-[#3568C0] shadow-[0_6px_18px_-6px_rgba(63,120,216,0.5)] gap-2"
            >
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
              {lang === "pt" ? "Adicionar Paciente" : t("registrations.addNewPatientButton")}
            </Button>
          </div>
        ) : null}
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
                {t("registrations.sortBy")}
              </div>
              <button
                type="button"
                onClick={() => setSortOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-transparent"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5 text-[#9AA4AF]" />
              </button>
            </div>

            <div className="mt-4 space-y-3 px-4">
              {[
                { id: "name_az", label: t("registrations.sortNameAZ") },
                { id: "age_lh", label: t("registrations.sortAgeLowHigh") },
                { id: "age_hl", label: t("registrations.sortAgeHighLow") },
                { id: "recent", label: t("registrations.sortRecentlyAdded") },
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
                {t("registrations.select")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
