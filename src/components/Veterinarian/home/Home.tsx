'use client'
// app/page.tsx
import React, { useEffect, useState } from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import StatCard from './StatCard';
import PatientCard from './PatientCard';
import AttendanceChart from './AttendanceChart';
import { Patient } from './types';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';



export default function Home() {
    const router = useRouter();
    const { t } = useTranslation();
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [patientStats, setPatientStats] = useState<{ activePatients: number; newThisMonth: number }>({
        activePatients: 0,
        newThisMonth: 0,
    });
    const [examStats, setExamStats] = useState<{ todayTotal: number; todayCompleted: number }>({
        todayTotal: 0,
        todayCompleted: 0,
    });
    const [attendance, setAttendance] = useState<{ months: string[]; dogs: number[]; cats: number[] }>({
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        dogs: Array(12).fill(0),
        cats: Array(12).fill(0),
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/patient/get_patients?page=1&pageSize=3');
                const data = await res.json();
                if (res.ok && Array.isArray(data.items)) {
                    setPatients(
                        data.items.map((p: { id?: unknown; _id?: unknown; name?: unknown; owner?: unknown; image?: unknown }) => ({
                            id: String(p.id || p._id),
                            name: typeof p.name === 'string' ? p.name : '',
                            owner: typeof p.owner === 'string' ? p.owner : '',
                            image: typeof p.image === 'string' ? p.image : '',
                        }))
                    );
                }
            } catch {
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/patient/get_patient_stats', { credentials: 'include' });
                const data = await res.json().catch(() => null);
                if (!res.ok || !data) return;
                const activePatients = Number((data as any).activePatients);
                const newThisMonth = Number((data as any).newThisMonth);
                if (!Number.isFinite(activePatients) || !Number.isFinite(newThisMonth)) return;
                setPatientStats({ activePatients, newThisMonth });
            } catch {
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const year = new Date().getFullYear();
                const res = await fetch(`/api/patient/get_attendance_species?year=${year}`, { credentials: 'include' });
                const data = await res.json().catch(() => null);
                if (!res.ok || !data) return;
                if (!Array.isArray(data.months) || !Array.isArray(data.dogs) || !Array.isArray(data.cats)) return;
                setAttendance({
                    months: data.months as string[],
                    dogs: data.dogs as number[],
                    cats: data.cats as number[],
                });
            } catch {
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);

            const baseParams = new URLSearchParams({
                page: '1',
                pageSize: '1',
                from: start.toISOString(),
                to: end.toISOString(),
            });

            try {
                const [totalRes, completedRes] = await Promise.all([
                    fetch(`/api/reading/get_readings?${baseParams.toString()}`, { credentials: 'include' }),
                    fetch(`/api/reading/get_readings?${new URLSearchParams({ ...Object.fromEntries(baseParams), status: 'signed' }).toString()}`, { credentials: 'include' }),
                ]);

                const [totalData, completedData] = await Promise.all([
                    totalRes.json().catch(() => null),
                    completedRes.json().catch(() => null),
                ]);

                const todayTotal = Number((totalData as any)?.pagination?.total ?? 0);
                const todayCompleted = Number((completedData as any)?.pagination?.total ?? 0);

                if (Number.isFinite(todayTotal) && Number.isFinite(todayCompleted)) {
                    setExamStats({ todayTotal, todayCompleted });
                }
            } catch {
            }
        })();
    }, []);
    return (
        <div className="">
            <Header userName={profile?.fullName} balance="$ 925,00" />
            <SearchBar />

            <div className="mt-3 grid grid-cols-2 gap-3">
                <StatCard number={examStats.todayTotal} label={t('dashboard.examsToday')} sublabel={t('dashboard.completedCount', { count: examStats.todayCompleted })} variant="primary" />
                <StatCard
                    number={patientStats.activePatients}
                    label={t('dashboard.activePatients')}
                    sublabel={t('dashboard.newThisMonthCount', { count: patientStats.newThisMonth })}
                    variant="secondary"
                />
            </div>



            <div className="">
                <AttendanceChart
                    months={attendance.months}
                    dogs={attendance.dogs}
                    cats={attendance.cats}
                    interactive={true}
                />
            </div>
            <div className="mt-2">
                {
                    patients.length > 0 &&
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-base font-bold text-gray-800">{t('dashboard.recentPatients')}</h2>
                            <p className="text-xs text-gray-500">{t('dashboard.recentPatientsDesc')}</p>
                        </div>
                        <button
                            type="button"
                            className="px-3 py-2 borde border-gray-300 rounded-full text-sm flex items-center gap-2 bg-gray-100"
                            onClick={() => router.push('/Veterinarian/home/patients')}
                        >
                            {t('dashboard.viewAll')}
                            <ChevronRight size={14} color='#3F78D8' />
                        </button>
                    </div>
                }
                <div className="space-y-3">
                    {patients.slice(0, 3).map((patient, index) => (
                        <PatientCard key={patient.id} patient={patient} featured={index === 0} />
                    ))}
                </div>


            </div>
        </div>
    );
}
