'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PatientCard from '@/components/Veterinarian/home/PatientCard';
import { Patient } from '@/components/Veterinarian/home/types';
import { ChevronLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [pets, setPets] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/pet/get_pets');
        const data = await res.json();
        if (res.ok && Array.isArray(data.items)) {
          setPets(
            data.items.map((p: any) => ({
              id: String(p.id || p._id),
              name: p.name,
              owner: p.owner,
              image: p.image || '/logo.png',
            }))
          );
        } else {
          setPets([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    <div className="min-h-screen px-3 py-5 relative">
      <div className=" flex items-center justify-between">
        <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-base font-medium text-gray-900">All Pets</h1>
        <button className="w-12 h-12 bg-gray-10 rounded-full flex items-center justify-center" />
      </div>

      <div className="relative mt-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
        <input
          type="text"
          placeholder="Search by pet or veterinarian name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="text-tertiary text-sm">Loading...</div>
        ) : filteredPets.length === 0 ? (
          <div className="text-tertiary text-sm">No pets found.</div>
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
    </div>
  );
}

