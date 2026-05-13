// components/SearchBar.tsx
'use client'
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from './types';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import StoreModal from '@/components/Modals/StoreModal';

type ExamSuggestion = {
  id: string;
  patientName: string;
  guardianName: string;
  status: 'signed' | 'pending';
  wizardStep: 'identification' | 'timer' | 'review' | 'report';
  date: string;
};

const SearchBar: React.FC = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [examSuggestions, setExamSuggestions] = useState<ExamSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const { t } = useTranslation();

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!trimmedQuery) {
      setPatientSuggestions([]);
      setExamSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        const [patientsRes, examsRes] = await Promise.all([
          fetch(`/api/patient/get_patients?page=1&pageSize=6&q=${encodeURIComponent(trimmedQuery)}`, {
            signal: controller.signal,
            credentials: 'include',
          }),
          fetch(`/api/reading/get_readings?page=1&pageSize=6&q=${encodeURIComponent(trimmedQuery)}`, {
            signal: controller.signal,
            credentials: 'include',
          }),
        ]);

        const [patientsData, examsData] = await Promise.all([
          patientsRes.json().catch(() => null),
          examsRes.json().catch(() => null),
        ]);

        if (patientsRes.ok && patientsData && Array.isArray((patientsData as any).items)) {
          setPatientSuggestions(
            (patientsData as any).items.map((p: any) => ({
              id: String(p.id || p._id),
              name: String(p.name || ''),
              owner: String(p.owner || ''),
              image: String(p.image || ''),
            })),
          );
        } else {
          setPatientSuggestions([]);
        }

        if (examsRes.ok && examsData && Array.isArray((examsData as any).items)) {
          setExamSuggestions(
            (examsData as any).items.map((r: any) => ({
              id: String(r.id || r._id || ''),
              patientName: String(r.patientName || 'N/A'),
              guardianName: String(r.guardianName || 'N/A'),
              status: r.status === 'signed' ? 'signed' : 'pending',
              wizardStep:
                r.wizardStep === 'identification' || r.wizardStep === 'timer' || r.wizardStep === 'review' || r.wizardStep === 'report'
                  ? r.wizardStep
                  : 'identification',
              date: String(r.date || ''),
            })),
          );
        } else {
          setExamSuggestions([]);
        }

        setOpen(true);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          setPatientSuggestions([]);
          setExamSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [trimmedQuery]);

  const selectPatient = (patient: Patient) => {
    setQuery(patient.name);
    setOpen(false);
    router.push(`/Veterinarian/home/patientDetails/${patient.id}`);
  };

  const selectExam = (exam: ExamSuggestion) => {
    setQuery(exam.patientName);
    setOpen(false);
    if (exam.status === 'signed') {
      router.push(`/Veterinarian/history/detail/${exam.id}`);
      return
    }
    const params = new URLSearchParams()
    params.set('draftId', exam.id)
    params.set('step', exam.wizardStep)
    router.push(`/Veterinarian/new-reading?${params.toString()}`)
  };

  const formatExamDate = (raw: string) => {
    const d = new Date(raw);
    if (!Number.isFinite(d.getTime())) return raw || '';
    return d.toLocaleDateString();
  };

  return (
    <div className="mt-4 flex items-center gap-3" ref={containerRef}>
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder={t('dashboard.searchPatientsOrExam')}
          value={query}
          onFocus={() => {
            if (trimmedQuery) setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              return;
            }
            if (e.key === 'Enter') {
              const firstPatient = patientSuggestions[0];
              if (firstPatient) {
                selectPatient(firstPatient);
                return;
              }
              const firstExam = examSuggestions[0];
              if (firstExam) selectExam(firstExam);
            }
          }}
          className="w-full px-4 py-3 pl-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white border border-gray-200 text-sm placeholder:text-gray-400"
        />
        <svg
          className="w-5 h-5 text-primary absolute left-3.5 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {open && trimmedQuery ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">{t('dashboard.searching')}</div>
            ) : patientSuggestions.length === 0 && examSuggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">{t('dashboard.noResults')}</div>
            ) : (
              <div className="max-h-80 overflow-auto">
                {patientSuggestions.length ? (
                  <div className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400">{t('dashboard.patientsLabel')}</div>
                ) : null}
                {patientSuggestions.map((p) => (
                  <button
                    key={`patient-${p.id}`}
                    type="button"
                    onClick={() => selectPatient(p)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200">
                      {p.image ? <Image width={200} height={200} src={p.image} alt={p.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="truncate text-xs text-gray-500">{p.owner}</div>
                    </div>
                  </button>
                ))}

                {examSuggestions.length ? (
                  <div className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400">{t('dashboard.examsLabel')}</div>
                ) : null}
                {examSuggestions.map((r) => (
                  <button
                    key={`exam-${r.id}`}
                    type="button"
                    onClick={() => selectExam(r)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">{r.patientName}</div>
                      <div className="truncate text-xs text-gray-500">{r.guardianName}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-xs font-medium ${r.status === 'signed' ? 'text-green-600' : 'text-amber-600'}`}>
                        {r.status === 'signed' ? t('history.signed') : t('history.pending')}
                      </div>
                      <div className="text-xs text-gray-400">{formatExamDate(r.date)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
      <button type="button" onClick={() => setStoreOpen(true)} className="px-4 py-3 rounded-xl flex items-center gap-2 bg-white border border-gray-200 shrink-0 cursor-pointer" >
        <ShoppingCartIcon className="w-5 h-5 text-primary" />
        <span className="text-gray-700 font-medium text-sm">{t('dashboard.store')}</span>
      </button>

      <StoreModal isOpen={storeOpen} onClose={() => setStoreOpen(false)} />
    </div>
  );
};

export default SearchBar;
