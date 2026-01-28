'use client'
import Header from "@/components/common/header";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { GuardianInfoCard } from "./Information";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface Pet {
  id: string;
  name: string;
  image?: string;
  species?: string;
  breed?: string;
}

interface GuardianDetails {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  profileImageUrl?: string;
  patientCount?: number;
}

const GuardianProfilePage: React.FC = () => {
  const params = useParams<{ patient_id: string }>();
  const guardianId = params?.patient_id;
  const { t } = useTranslation();

  const [guardian, setGuardian] = useState<GuardianDetails | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!guardianId) {
        if (mounted) {
          setGuardian(null);
          setPets([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const [guardianRes, petsRes] = await Promise.all([
          fetch(`/api/guardians/get-guardians?guardianId=${encodeURIComponent(guardianId)}`),
          fetch(`/api/patient/get_patients?guardianId=${encodeURIComponent(guardianId)}&page=1&pageSize=50`),
        ]);

        const guardianJson = await guardianRes.json();
        const petsJson = await petsRes.json();

        if (!mounted) return;

        setGuardian(guardianRes.ok ? (guardianJson.item as GuardianDetails) : null);
        setPets(
          petsRes.ok && Array.isArray(petsJson.items)
            ? (petsJson.items as any[]).map((p) => ({
                id: String(p.id || p._id || ""),
                name: String(p.name || p.animalName || ""),
                image: String(p.image || p.photo || ""),
                species: String(p.species || ""),
                breed: String(p.breed || ""),
              }))
            : [],
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [guardianId]);

  const guardianCardData = useMemo(() => {
    return {
      name: "",
      type: "",
      breed: "",
      image: "",
      sex: "",
      age: "",
      gender: "",
      guardianId: guardian?.id ?? guardianId ?? "",
      guardianName: guardian?.fullName ?? "",
      guardianTaxId: guardian?.taxId ?? "",
      guardianAvatarUrl: guardian?.profileImageUrl ?? "",
      guardianEmail: guardian?.email ?? "",
      guardianMobile: guardian?.phone ?? "",
      guardianAddress: guardian?.address ?? "",
    };
  }, [guardian, guardianId]);

  const GuardianDetailsSkeleton = () => (
    <div className="px-4 animate-pulse space-y-4">
      <div className="rounded-2xl bg-[#F5F6F6] p-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-300" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-gray-300" />
            <div className="h-3 w-28 rounded bg-gray-300" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-gray-300" />
          <div className="h-3 w-5/6 rounded bg-gray-300" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-16 rounded bg-gray-300" />
        <div className="h-4 w-20 rounded bg-gray-300" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-[#F5F6F6] px-3 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gray-300" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-300" />
                  <div className="h-3 w-24 rounded bg-gray-300" />
                </div>
              </div>
              <div className="h-5 w-5 rounded bg-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pb-5">
      <Header title={t("home.guardianDetailsTitle")} />
      {loading ? (
        <GuardianDetailsSkeleton />
      ) : (
        <>
          <GuardianInfoCard {...guardianCardData} />
          <div className="px-4 mt-4 flex flex-col grid grid-cols-1 gap-2">
            <div className="flex mb-2 justify-between items-center">
              <h1 className="col-span-1 text-base font-normal">{t("tabs.pets")}</h1>
              {guardianId ? (
                <Link
                  href={`/Veterinarian/home/guardianPatients/${encodeURIComponent(guardianId)}`}
                  className="col-span-1 text-base text-primary font-normal"
                >
                  {t("dashboard.viewAll")}
                </Link>
              ) : null}
            </div>
            {pets.map((pet) => (
              <div key={pet.id} className="bg-[#F5F6F6] rounded-2xl px-3 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage
                        src={pet.image || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
                        alt={pet.name}
                      />
                      <AvatarFallback className="bg-muted text-black text-sm">{pet.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground text-[15px]">{pet.name}</h3>
                      <p className="text-sm text-black/70">
                        {pet.species ? pet.species : t("home.petLabel")}
                        {pet.breed ? ` • ${pet.breed}` : ""}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/Veterinarian/home/patientDetails/${encodeURIComponent(pet.id)}`}
                    className="text-black hover:text-foreground transition-colors p-1"
                  >
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GuardianProfilePage;
