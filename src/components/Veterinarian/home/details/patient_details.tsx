'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, CheckCheck, CheckCheckIcon, CheckCircle, ChevronLeft, Edit, Eye, FileText, Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import ProgressView from './Progress';
import Header from '@/components/common/header';

type ReportRow = {
  id: string;
  date: string;
  status: 'signed' | 'pending';
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, 'dd/MM/yyyy');
};

const ageLabel = (years: number | null, t: (k: string) => string): string => {
  if (years == null) return '';
  return years === 1 ? `1 ${t('home.ageUnits.year')}` : `${years} ${t('home.ageUnits.years')}`;
};

const Tabs: React.FC<{ activeTab: string; onTabChange: (t: string) => void }> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();
  const tabClass = (active: boolean) =>
    `flex-1 h-[26px] rounded-full text-[12px] font-medium transition-colors cursor-pointer ${active
      ? 'bg-primary text-white shadow-[0_6px_16px_-6px_rgba(63,120,216,0.5)] border-0'
      : 'bg-white text-black/70 border border-primary'
    }`;
  return (
    <div className="flex gap-3 px-1 mt-4 mb-4">
      <button type="button" onClick={() => onTabChange('information')} className={tabClass(activeTab === 'information')}>
        {t('home.informationTab')}
      </button>
      <button type="button" onClick={() => onTabChange('progress')} className={tabClass(activeTab === 'progress')}>
        {t('reading.progress.evolutionTab')}
      </button>
    </div>
  );
};

const PatientInfoSection: React.FC<{
  patientId: string;
  name: string;
  species: string;
  breed: string;
  image: string;
  sex: string;
  age: string;
}> = ({ patientId, name, species, breed, image, sex, age }) => {
  const router = useRouter();
  console.log(image);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="relative w-full h-[350px] rounded-3xl overflow-hidden">
        <Image
          src={image || 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'}
          alt={name}
          fill
          sizes="100vw"
          className="object-cover w-full h-full object-bottom"
        />
      </div>

      <div
        className="absolute left-1/2 w-[100%] -translate-x-1/2 bottom-0 px-4 pt-4 pb-1 space-y-4 rounded-2xl bg-white border border-[#E5E7EB]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h2 className="text-[18px] font-bold text-black/70 leading-none truncate">{name || '-'}</h2>
            {(species || breed) && (
              <span className="px-3 py- rounded-full text-[12px] text-[#6B7280] border border-primary whitespace-nowrap">
                {[species, breed].filter(Boolean).join(' - ')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!patientId) return;
              router.push(`/Veterinarian/patient/new_patient?patientId=${encodeURIComponent(patientId)}`);
            }}
            className="w-[14px] h-[14px] flex items-center justify-center rounded-full cursor-pointer"
          >
            <Edit size={14} className="text-primary" />
          </button>
        </div>

        <div className="space-y-3 grid grid-cols-2 gap-6">
          <div className="flex items-center justify-between gap-3 flex-wrap col-span-1">
            <span className="text-[12px] font-bold text-black/70">Sexo</span>
            <span className="px-4 py-0.5 rounded-sm border border-[#E5E7EB] text-[12px] text-[#6B7280] min-w-[88px] text-center">
              {sex || '-'}
            </span>
            <span className="text-[12px] font-bold text-black/70">Idade</span>
            <span className="px-4 py-0.5 rounded-sm border border-[#E5E7EB] text-[12px] text-[#6B7280] min-w-[88px] text-center">
              {age || '-'}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 col-span-1">
            <span className="text-[12px] font-bold text-black/70">Sexo</span>
            <span className="px-4 py-0.5 rounded-sm border border-[#E5E7EB] text-[12px] text-[#6B7280] min-w-[88px] text-center">
              {sex || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ status: 'signed' | 'pending' }> = ({ status }) => {
  const { t } = useTranslation();
  if (status === 'signed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#10B981]/40 bg-white text-[12px] font-semibold text-[#10B981]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        {t('history.signed')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 rounded-full border border-primary bg-white text-[12px] font-semibold">
      <CheckCircle size={8} className='text-[#2AAD56]' />
      {t('history.pending')}
    </span>
  );
};

const ReportsHistorySection: React.FC<{
  patientId: string;
  petName: string;
  reports: ReportRow[];
  loading: boolean;
}> = ({ patientId, petName, reports, loading }) => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold text-black/70">{t('home.reportsHistory')}</h3>
          <p className="text-[13px] text-[#6B7280] mt-1 leading-snug">
            {t('home.viewAllReportsAssociated', { name: petName || '' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!patientId) return;
            router.push(`/Veterinarian/new-reading?patientId=${encodeURIComponent(patientId)}`);
          }}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-white text-[13px] font-semibold cursor-pointer border-0 shadow-[0_6px_14px_-6px_rgba(63,120,216,0.5)]"
        >
          <Plus size={14} strokeWidth={2.5} />
          {t('home.newTest')}
        </button>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[1fr_1.2fr_auto] items-center pb-2 border-b border-[#E5E7EB]">
          <span className="text-[12px] font-medium text-[#9CA3AF]">{t('common.date')}</span>
          <span className="text-[12px] font-medium text-[#9CA3AF] text-start">{t('common.status')}</span>
          <span className="text-[12px] font-medium text-[#9CA3AF] text-right pr-1">{t('common.actions')}</span>
        </div>

        {loading ? (
          <p className="text-[13px] text-[#9CA3AF] py-4 text-center">{t('history.loading')}</p>
        ) : reports.length === 0 ? (
          <p className="text-[13px] text-[#9CA3AF] py-4 text-center">{t('home.noReportsYet')}</p>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_1.2fr_auto] items-center py-3 border-b border-[#F3F4F6] last:border-b-0"
            >
              <span className="text-[12px] font-thin! text-black/70">{formatDate(r.date)}</span>
              <div className="flex justify-start">
                <StatusPill status={r.status} />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => router.push(`/Veterinarian/history/detail/${encodeURIComponent(r.id)}`)}
                  className="flex items-center justify-center rounded-full bg-transparent border-0 cursor-pointer"
                >
                  <Eye size={13} className="text-[#6B7280]" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/Veterinarian/history/detail/${encodeURIComponent(r.id)}`)}
                  className="flex items-center justify-center rounded-full bg-transparent border-0 cursor-pointer"
                >
                  <FileText size={13} className="text-[#6B7280]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PatientProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ patient_id: string }>();
  const patientId = params?.patient_id || '';

  const [activeTab, setActiveTab] = useState<'information' | 'progress'>('information');
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/pet/get_pet_details?petId=${encodeURIComponent(patientId)}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          toast.error(typeof data?.error === 'string' ? data.error : 'Failed to load patient');
          setPatient(null);
          return;
        }
        setPatient(data?.item || null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!patientId) return;
      try {
        setLoadingReports(true);
        const res = await fetch(
          `/api/reading/get_readings?patientId=${encodeURIComponent(patientId)}&page=1&pageSize=50`
        );
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          setReports([]);
          return;
        }
        const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
        setReports(
          items.map((r: any) => ({
            id: String(r.id || r._id || ''),
            date: String(r.date || r.createdAt || ''),
            status: r.status === 'signed' ? 'signed' : 'pending',
          }))
        );
      } finally {
        if (mounted) setLoadingReports(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  const patientData = useMemo(() => {
    const dob = patient?.dateOfBirth ? new Date(patient.dateOfBirth) : null;
    const now = new Date();
    const explicitAge = typeof patient?.ageYears === 'number' ? patient.ageYears : null;
    const derivedAge =
      dob && !Number.isNaN(dob.getTime())
        ? Math.max(
          0,
          now.getFullYear() -
          dob.getFullYear() -
          (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
        )
        : null;
    const years = explicitAge !== null ? explicitAge : derivedAge;
    return {
      name: patient?.animalName ?? '',
      species: patient?.species ?? '',
      breed: patient?.breed ?? '',
      image: patient?.photo ?? '',
      sex: patient?.sex ?? '',
      age: ageLabel(years, t),
    };
  }, [patient, t]);

  return (
    <div className="pb-24">
      <Header title={"Perfil do Paciente"} />


      {/* Tabs */}
      <Tabs activeTab={activeTab} onTabChange={(v) => setActiveTab(v as 'information' | 'progress')} />

      {/* Content */}
      {loading ? (
        <PatientDetailsSkeleton />
      ) : activeTab === 'information' ? (
        <div className="space-y-4">
          <PatientInfoSection
            patientId={patientId}
            name={patientData.name}
            species={patientData.species}
            breed={patientData.breed}
            image={patientData.image}
            sex={patientData.sex}
            age={patientData.age}
          />
          <ReportsHistorySection
            patientId={patientId}
            petName={patientData.name}
            reports={reports}
            loading={loadingReports}
          />
        </div>
      ) : (
        <ProgressView patientId={patientId} variant="evolution" />
      )}
    </div>
  );
};

const PatientDetailsSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
      <div className="h-[230px] w-full bg-[#E5E7EB]" />
      <div className="px-4 py-4 space-y-3">
        <div className="h-5 w-2/3 rounded bg-[#E5E7EB]" />
        <div className="h-4 w-1/2 rounded bg-[#E5E7EB]" />
        <div className="h-4 w-3/4 rounded bg-[#E5E7EB]" />
      </div>
    </div>
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3">
      <div className="h-5 w-1/2 rounded bg-[#E5E7EB]" />
      <div className="h-4 w-3/4 rounded bg-[#E5E7EB]" />
      <div className="h-10 w-full rounded bg-[#E5E7EB]" />
    </div>
  </div>
);

export default PatientProfilePage;
