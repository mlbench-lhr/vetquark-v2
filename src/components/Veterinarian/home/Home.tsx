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



export default function Home() {
    const router = useRouter();
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    const [patients, setPatients] = useState<Patient[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/patient/get_patients');
                const data = await res.json();
                if (res.ok && Array.isArray(data.items)) {
                    setPatients(
                        data.items.map((p: { id?: unknown; _id?: unknown; name?: unknown; owner?: unknown; image?: unknown }) => ({
                            id: String(p.id || p._id),
                            name: typeof p.name === 'string' ? p.name : '',
                            owner: typeof p.owner === 'string' ? p.owner : '',
                            image: typeof p.image === 'string' ? p.image : '/logo.png',
                        }))
                    );
                }
            } catch {
            }
        })();
    }, []);
    return (
        <div className="px-3 py-5">
            <Header userName={profile?.fullName} balance="$ 925,00" />
            <SearchBar />

            <div className="mt-2 grid grid-cols-2 gap-3">
                <StatCard number={3} label="Exams Today" sublabel="1 completed" variant="primary" />
                <StatCard number={6} label="Active Patients" sublabel="+2 new this month" variant="secondary" />
            </div>

            <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-800">Recent Patients</h2>
                    <button
                        type="button"
                        className="text-primary font-medium"
                        onClick={() => router.push('/Veterinarian/home/patients')}
                    >
                        View All
                    </button>
                </div>
                <div className="space-y-3">
                    {patients.slice(0, 3).map((patient, index) => (
                        <PatientCard key={patient.id} patient={patient} featured={index === 0} />
                    ))}
                </div>

                <button className="w-full mt-4 py-3 bg-primary text-white font-semibold rounded-2xl flex items-center justify-center gap-2" onClick={()=> router.push("/Veterinarian/patient")}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path d="M12 8v8m-4-4h8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    New Patient
                </button>
            </div>

            <div className="">
                <AttendanceChart
                    months={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                    dogs={[80, 120, 90, 150, 110, 135, 125, 140, 95, 160, 145, 130]}
                    cats={[60, 70, 80, 65, 95, 85, 90, 75, 100, 80, 110, 95]}
                    interactive={true}
                />
            </div>
        </div>
    );
}
