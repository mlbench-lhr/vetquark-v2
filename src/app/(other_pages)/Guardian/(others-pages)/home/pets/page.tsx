'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PatientCard from '@/components/Veterinarian/home/PatientCard';
import { Patient } from '@/components/Veterinarian/home/types';
import Pagination from '@/components/tables/Pagination';
import { ChevronLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/header';
import { useTranslation } from 'react-i18next';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import { FallbackText } from '@/components/ui/fallback-text';

export default function Page() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pets, setPets] = useState<Patient[]>([]);
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
        const res = await fetch(`/api/pet/get_pets?page=${page}&pageSize=${pageSize}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.items)) {
          setPets(
            data.items.map((p: any) => ({
              id: String(p.id || p._id),
              name: p.name,
              owner: p.owner,
              image: p.image,
            }))
          );
          setTotalPages(Number(data.pagination?.totalPages || 0));
        } else {
          setPets([]);
          setTotalPages(0);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const filteredPets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pets;
    return pets.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const owner = (p.owner || '').toLowerCase();
      return name.includes(q) || owner.includes(q);
    });
  }, [pets, searchQuery]);

  return (
    <div className="min-h-scree px-3 py-5 relative">
      <Header title={t('home.allPetsTitle')}/>
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

      <div className="mt-4 space-y-3 pb-10">
        {loading ? (
          skeletonCards.map((k) => <ListItemSkeleton key={k} />)
        ) : filteredPets.length === 0 ? (
          <FallbackText>{t('dashboard.noPatientsFound')}</FallbackText>
        ) : (
          filteredPets.map((pet, index) => (
            <PatientCard
              key={pet.id}
              patient={pet}
              featured={index === 0}
              onClickNavigate={`/Guardian/home/petDetails/${pet.id}`}
            />
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
    </div>
  );
}
