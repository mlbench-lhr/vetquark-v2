'use client';

import Header from '@/components/common/header';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PatientInfoCard } from '@/components/Veterinarian/home/details/Information';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';
import ProgressView from '@/components/Veterinarian/home/details/Progress';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { downloadUrinalysisPdf } from '@/utils/urinalysisPdf';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3 px- mb-4 mt-2">
      <button
        onClick={() => onTabChange('information')}
        className={`flex-1 py-1 px-6 rounded-full flex justify-center items-center gap-2 font-medium transition-colors ${activeTab === 'information' ? 'bg-[#EBF2FF] text-primary' : 'text-gray-600 bg-[#F5F6F6]'
          }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M9.1665 14.1667H10.8332V9.16675H9.1665V14.1667ZM9.99984 7.50008C10.2359 7.50008 10.434 7.42008 10.594 7.26008C10.754 7.10008 10.8337 6.9023 10.8332 6.66675C10.8326 6.43119 10.7526 6.23342 10.5932 6.07341C10.4337 5.91341 10.2359 5.83342 9.99984 5.83342C9.76373 5.83342 9.56595 5.91341 9.4065 6.07341C9.24706 6.23342 9.16706 6.43119 9.1665 6.66675C9.16595 6.9023 9.24595 7.10036 9.4065 7.26092C9.56706 7.42147 9.76484 7.50119 9.99984 7.50008ZM9.99984 18.3334C8.84706 18.3334 7.76373 18.1145 6.74984 17.6767C5.73595 17.239 4.854 16.6454 4.10401 15.8959C3.354 15.1465 2.76039 14.2645 2.32317 13.2501C1.88595 12.2356 1.66706 11.1523 1.6665 10.0001C1.66595 8.84786 1.88484 7.76453 2.32317 6.75008C2.76151 5.73564 3.35512 4.85369 4.10401 4.10425C4.85289 3.3548 5.73484 2.76119 6.74984 2.32341C7.76484 1.88564 8.84817 1.66675 9.99984 1.66675C11.1515 1.66675 12.2348 1.88564 13.2498 2.32341C14.2648 2.76119 15.1468 3.3548 15.8957 4.10425C16.6446 4.85369 17.2384 5.73564 17.6773 6.75008C18.1162 7.76453 18.3348 8.84786 18.3332 10.0001C18.3315 11.1523 18.1126 12.2356 17.6765 13.2501C17.2404 14.2645 16.6468 15.1465 15.8957 15.8959C15.1446 16.6454 14.2626 17.2392 13.2498 17.6776C12.2371 18.1159 11.1537 18.3345 9.99984 18.3334ZM9.99984 16.6667C11.8609 16.6667 13.4373 16.0209 14.729 14.7292C16.0207 13.4376 16.6665 11.8612 16.6665 10.0001C16.6665 8.13897 16.0207 6.56258 14.729 5.27091C13.4373 3.97925 11.8609 3.33341 9.99984 3.33341C8.13873 3.33341 6.56234 3.97925 5.27067 5.27091C3.979 6.56258 3.33317 8.13897 3.33317 10.0001C3.33317 11.8612 3.979 13.4376 5.27067 14.7292C6.56234 16.0209 8.13873 16.6667 9.99984 16.6667Z"
            fill={activeTab !== 'progress' ? '#3F78D8' : 'black'}
          />
        </svg>
        {t('home.informationTab')}
      </button>
      <button
        onClick={() => onTabChange('progress')}
        className={`flex-1 h-10 px-6 rounded-full flex justify-center items-center gap-2 font-medium transition-colors ${activeTab === 'progress' ? 'bg-[#EBF2FF] text-primary' : 'text-gray-600 bg-[#F5F6F6]'
          }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10.8335 1.69165V3.37498C14.4918 3.82498 17.0835 7.14998 16.6335 10.8083C16.2502 13.8417 13.8668 16.25 10.8335 16.6083V18.275C15.4168 17.8167 18.7502 13.75 18.2918 9.16665C17.9168 5.20832 14.7752 2.08332 10.8335 1.69165ZM9.16683 1.71665C7.54183 1.87498 5.99183 2.49998 4.72516 3.54998L5.91683 4.78332C6.85016 4.03332 7.97516 3.54998 9.16683 3.38332V1.71665ZM3.55016 4.72498C2.50887 5.98983 1.86774 7.53607 1.7085 9.16665H3.37516C3.5335 7.98332 4.00016 6.85832 4.74183 5.91665L3.55016 4.72498ZM12.9168 7.08332L8.85016 11.15L7.0835 9.38332L6.20016 10.2667L8.85016 12.9167L13.8002 7.96665L12.9168 7.08332ZM1.71683 10.8333C1.8835 12.4667 2.52516 14.0083 3.5585 15.275L4.74183 14.0833C4.00587 13.1414 3.53671 12.0188 3.3835 10.8333H1.71683ZM5.91683 15.3083L4.72516 16.45C5.98764 17.502 7.53296 18.1572 9.16683 18.3333V16.6667C7.98131 16.5134 6.85879 16.0443 5.91683 15.3083Z"
            fill={activeTab === 'progress' ? '#3F78D8' : 'black'}
          />
        </svg>
        {t('home.progressTab')}
      </button>
    </div>
  );
};

export default function Page() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('information');
  const params = useParams<{ pet_id: string }>();
  const petId = params?.pet_id;
  const router = useRouter();

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reports, setReports] = useState<
    Array<{ id: string; date: string; status: 'signed' | 'pending'; avatarSrc: string }>
  >([]);

  useEffect(() => {
    (async () => {
      if (!petId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/pet/get_pet_details?petId=${encodeURIComponent(petId)}`);
        const data = await res.json();
        if (res.ok) {
          console.log("data.item---", data.item);

          setPet(data.item);
        } else {
          toast.error(typeof data?.error === "string" ? data.error : "Failed to load pet");
          setPet(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [petId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!petId) return;
      try {
        setLoadingReports(true);
        const res = await fetch(`/api/reading/get_readings?patientId=${encodeURIComponent(petId)}&page=1&pageSize=50`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load reports");
        }
        const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
        setReports(
          items.map((r: any) => ({
            id: String(r.id || r._id || ""),
            date: String(r.date || ""),
            status: r.status === "signed" ? "signed" : "pending",
            avatarSrc: String(r.avatarSrc || pet?.photo || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
          }))
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load reports");
        setReports([]);
      } finally {
        if (mounted) setLoadingReports(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [petId, pet?.photo]);

  const petData = useMemo(() => {
    const explicitAge = typeof pet?.ageYears === "number" ? pet.ageYears : null;
    const dob = pet?.dateOfBirth ? new Date(pet.dateOfBirth) : null;
    const now = new Date();
    const derivedAgeYears =
      dob && !Number.isNaN(dob.getTime())
        ? Math.max(
          0,
          now.getFullYear() -
          dob.getFullYear() -
          (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
        )
        : null;
    const ageYears = explicitAge !== null ? explicitAge : derivedAgeYears;

    return {
      patientId: petId,
      name: pet?.animalName ?? '',
      type: pet?.species ?? '',
      breed: pet?.breed ?? '',
      image: pet?.photo ?? '',
      sex: pet?.sex ?? '',
      age: ageYears === null ? '' : `${ageYears} years`,
      gender: pet?.sex ?? '',
      microchip: pet?.microchip ?? '',
      temperament: pet?.temperament ?? '',
      size: pet?.size ?? '',
      coat: pet?.coat ?? '',
      neutered: pet?.neutered ?? '',
      rga: pet?.rga ?? '',
      planName: pet?.planName ?? '',
      cardNumber: pet?.cardNumber ?? '',
      cardValidity: pet?.cardValidity ?? '',
      allergies: pet?.allergies ?? '',
      chronicDiseases: pet?.chronicDiseases ?? '',
      otherInformation: pet?.otherInformation ?? '',
      internalNotes: pet?.internalNotes ?? '',
      guardianName: pet?.guardian?.fullName || "",
      guardianTaxId: pet?.guardian?.taxId || "",
      guardianAvatarUrl: pet?.guardian?.profileImageUrl || "",
    };
  }, [pet, petId]);
  console.log("patientData----", pet);

  const details = useMemo(
    () => [
      { label: "Microchip", value: pet?.microchip ?? "" },
      { label: "RGA", value: pet?.rga ?? "" },
      { label: "Plan", value: pet?.planName ?? "" },
      { label: "Neutered", value: pet?.neutered ?? "" },
      { label: "Size", value: pet?.size ?? "" },
      { label: "Coat", value: pet?.coat ?? "" },
      { label: "Temperament", value: pet?.temperament ?? "" },
      { label: "Allergies", value: pet?.allergies ?? "" },
      { label: "Chronic Diseases", value: pet?.chronicDiseases ?? "" },
    ],
    [pet]
  );

  const handleDownload = useCallback(async (readingId: string) => {
    try {
      await downloadUrinalysisPdf({ readingId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  }, []);

  const formatDateLabel = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const date = d.toLocaleDateString("en-GB");
    const time = d.toLocaleTimeString("en-GB", { hour12: false });
    return `${date}, ${time}`;
  };

  const StatusPill = ({ status }: { status: "signed" | "pending" }) => {
    const label = status === "signed" ? t('history.signed') : t('history.pending');
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#EBF2FF] px-3 py-1.5 text-[13px] font-medium text-[#3F78D8]">
        <Check className="h-4 w-4" />
        {label}
      </span>
    );
  };

  const ExamsTab = () => {
    return (
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">{t('dashboard.examsLabel')}</div>
          <Link
            href={`/Guardian/history?petId=${encodeURIComponent(String(petId || ""))}`}
            className="text-[13px] font-medium leading-[18px] text-[#3F78D8]"
          >
            {t('home.viewHistory')}
          </Link>
        </div>

        {loadingReports ? (
          <div className="text-[14px] leading-[18px] text-[#9CA3AF]">{t('history.loading')}</div>
        ) : reports.length === 0 ? (
          <div className="text-[14px] leading-[18px] text-[#9CA3AF]">{t('history.noExamsFound')}</div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-[16px] bg-[#F5F6F6] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white">
                      <Image width={200} height={200} src={r.avatarSrc} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium leading-[18px] text-[#111827]">
                        {t('history.urinalysisReport')}
                      </div>
                      <div className="mt-1 text-[12px] leading-[16px] text-[#9CA3AF]">{formatDateLabel(r.date)}</div>
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>

                <div className="mt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex h-[34px] items-center gap-2 rounded-full bg-[#3F78D8] px-4 text-[13px] font-medium text-white"
                    onClick={() => handleDownload(r.id)}
                  >
                    {t('history.download')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-[34px] items-center justify-center rounded-full bg-[#EBF2FF] px-5 text-[13px] font-medium text-[#3F78D8]"
                    onClick={() => router.push(`/Guardian/history/detail/${encodeURIComponent(r.id)}`)}
                  >
                    {t('history.details')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const PetDetailsSkeleton = () => (
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
          <div className="h-3 w-2/3 rounded bg-gray-300" />
        </div>
      </div>
      <div className="rounded-2xl bg-[#F5F6F6] p-4">
        <div className="h-4 w-32 rounded bg-gray-300" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-gray-300" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-5">
      <Header title={t('home.petProfileTitle')} />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {loading ? (
        <PetDetailsSkeleton />
      ) : activeTab === 'information' ? (
        <div className="px- space-y-4">
          <PatientInfoCard {...petData} />
        </div>
      ) : (
        // <ExamsTab />
        <ProgressView patientId={petId} />
      )}
    </div>
  );
}
