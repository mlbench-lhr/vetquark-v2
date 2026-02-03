'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react'
import Pagination from '@/components/tables/Pagination'
import { useTranslation } from 'react-i18next'
import { ListItemSkeleton } from '@/components/ui/skeleton'
import { FallbackText } from '@/components/ui/fallback-text'
import Image from 'next/image'

type PatientRow = {
  id: string
  name: string
  owner: string
  image: string
}

export default function Page() {
  const router = useRouter()
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState('')

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 10
  const skeletonRows = useMemo(() => Array.from({ length: 8 }, (_, i) => i), [])

  useEffect(() => {
    setSelectedId((new URLSearchParams(window.location.search).get('selected') || '').trim())
  }, [])

  useEffect(() => {
    ; (async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/patient/get_patients?page=${page}&pageSize=${pageSize}`)
        const data = await res.json()
        if (res.ok && Array.isArray(data.items)) {
          setPatients(
            data.items.map((p: any) => ({
              id: String(p.id || p._id),
              name: String(p.name || p.animalName || ''),
              owner: String(p.owner || ''),
              image: String(p.image || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"),
            }))
          )
          setTotalPages(Number(data.pagination?.totalPages || 0))
        } else {
          setPatients([])
          setTotalPages(0)
        }
      } catch {
        setPatients([])
        setTotalPages(0)
      } finally {
        setLoading(false)
      }
    })()
  }, [page])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) => {
      return p.name.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    })
  }, [patients, query])

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-6">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="absolute left-0 top-1/2 -translate-y-1/2 p-1"
          >
            <ChevronLeft className="h-6 w-6 text-[#111827]" />
          </button>
          <div className="text-[16px] leading-[20px] font-medium text-[#111827]">{t('dashboard.allPatientsTitle')}</div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#3F78D8]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder={t('dashboard.searchPlaceholder')}
            className="h-[48px] w-full rounded-2xl bg-[#F3F4F6] pl-12 pr-4 text-[14px] leading-[18px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
          />
        </div>

        <div className="mt-4 space-y-3 pb-28">
          {loading ? (
            skeletonRows.map((k) => <ListItemSkeleton key={k} />)
          ) : filtered.length === 0 ? (
            <FallbackText>{t('dashboard.noPatientsFound')}</FallbackText>
          ) : (
            filtered.map((p) => {
              const active = !!selectedId && p.id === selectedId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => router.replace(`/Veterinarian/new-reading?patientId=${encodeURIComponent(p.id)}`)}
                  className={`w-full rounded-2xl px-4 py-3 text-left ${active ? 'bg-[#EBF2FF]' : 'bg-[#F3F4F6]'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-white/60">
                        <Image width={200} height={200} src={p.image || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"} alt={p.name} className="h-10 w-10 object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] leading-[18px] font-medium text-[#111827]">{p.name}</div>
                        <div className="mt-1 truncate text-[12px] leading-[16px] text-[#9CA3AF]">{p.owner}</div>
                        <div className="mt-0.5 truncate text-[12px] leading-[16px] text-[#9CA3AF]">{t('registrations.idLabel')}: {p.id}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[#3F78D8]" />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {!loading && totalPages > 1 ? (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => {
                const clamped = Math.max(1, Math.min(totalPages, nextPage))
                setPage(clamped)
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+24px)] right-4">
        <button
          type="button"
          onClick={() => router.push('/Veterinarian/patient')}
          className="h-[56px] rounded-full bg-[#3F78D8] px-6 text-[16px] font-medium text-white shadow-theme-lg flex items-center gap-3"
        >
          <Plus className="h-5 w-5" />
          {t('registrations.addNewPatientButton')}
        </button>
      </div>
    </div>
  )
}
