// components/SearchBar.tsx
'use client'
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from './types';

const SearchBar: React.FC = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/patient/get_patients?page=1&pageSize=6&q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal, credentials: 'include' }
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || !Array.isArray(data.items)) {
          setSuggestions([]);
          return;
        }
        setSuggestions(
          data.items.map((p: any) => ({
            id: String(p.id || p._id),
            name: String(p.name || ''),
            owner: String(p.owner || ''),
            image: String(p.image || ''),
          }))
        );
        setOpen(true);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') setSuggestions([]);
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

  return (
    <div className="mt-2 flex items-center gap-3" ref={containerRef}>
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search for patient or exam..."
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
              const first = suggestions[0];
              if (first) selectPatient(first);
            }
          }}
          className="w-full px-4 py-3 pl-12  rounded-xl focus:outline-none focus:border-primary bg-gray-100"
        />
        <svg
          className="w-5 h-5 text-primary absolute left-4 top-1/2 -translate-y-1/2"
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
              <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No patients found</div>
            ) : (
              <div className="max-h-80 overflow-auto">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPatient(p)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="truncate text-xs text-gray-500">{p.owner}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
      <Link href={"/Veterinarian/store"} className="px-4 py-3 rounded-xl flex items-center gap-2 bg-gray-100" >
        <ShoppingCartIcon className="w-5 h-5 text-primary" />
        <span className="text-black font-light">Store</span>
      </Link>

    </div>
  );
};

export default SearchBar;
