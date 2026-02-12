'use client';

import { useEffect, useMemo, useState } from 'react';
import PatientCard from '@/components/Veterinarian/home/PatientCard';
import { Patient } from '@/components/Veterinarian/home/types';
import Pagination from '@/components/tables/Pagination';
import { ChevronLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import { FallbackText } from '@/components/ui/fallback-text';

export default function Page() {
    const router = useRouter();
    const { t } = useTranslation();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    const skeletonCards = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/patient/get_patients?page=${page}&pageSize=${pageSize}`);
                const data = await res.json();
                if (res.ok && Array.isArray(data.items)) {
                    setPatients(
                        data.items.map((p: any) => ({
                            id: String(p.id || p._id),
                            name: p.name,
                            owner: p.owner,
                            image: p.image,
                        }))
                    );
                    setTotalPages(Number(data.pagination?.totalPages || 0));
                } else {
                    setPatients([]);
                    setTotalPages(0);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [page]);

    const filteredPatients = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return patients;
        return patients.filter((p) => {
            const name = (p.name || '').toLowerCase();
            const owner = (p.owner || '').toLowerCase();
            return name.includes(q) || owner.includes(q);
        });
    }, [patients, searchQuery]);

    return (
        <div className="min-h-[calc(100vh-40px)] px- py relative">
            <div className=" flex items-center justify-between ">
                <button
                    aria-label="Back"
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-base font-medium text-gray-900">{t('dashboard.allPatientsTitle')}</h1>
                <button className="w-12 h-0 bg-gray-10 rounded-full flex items-center justify-center">
                    {/* <span className="text-white text-sm">
                        <Image
                            src={"/images/home/bell.svg"}
                            alt="Bell icon"
                            width={24}
                            height={24}
                        />
                    </span> */}
                </button>
            </div>

            <div className="relative mt-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                    type="text"
                    placeholder={t('dashboard.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="mt-4 space-y-3 pb-36">
                {loading ? (
                    skeletonCards.map((k) => <ListItemSkeleton key={k} />)
                ) : filteredPatients.length === 0 ? (
                    <FallbackText>{t('dashboard.noPatientsFound')}</FallbackText>
                ) : (
                    filteredPatients.map((patient, index) => (
                        <PatientCard key={patient.id} patient={patient} featured={index === 0} />
                    ))
                )}
            </div>

            {!loading && totalPages > 1 ? (
                <div className="mt-4 flex justify-center">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(nextPage) => {
                            const clamped = Math.max(1, Math.min(totalPages, nextPage));
                            setPage(clamped);
                        }}
                    />
                </div>
            ) : null}

            <button className="w-fit px-5 mt-4 py-3 bg-primary text-white font-semibold rounded-full flex items-center justify-center gap-2 absolute bottom-5 right-4 z-100" onClick={() => router.push("/Veterinarian/patient")}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path d="M12 8v8m-4-4h8" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {t('dashboard.newPatientButton')}
            </button>
        </div>
    );
}
