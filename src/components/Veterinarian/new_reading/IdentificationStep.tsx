'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LinkGenerated from './LinkGenerated'
import { IdentificationDraft, PatientListItem } from './types'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

type Props = {
  value: IdentificationDraft
  onChange: (patch: Partial<IdentificationDraft>) => void
  onNext: () => void
  paymentLinkStatus?: "unknown" | "pending" | "paid" | "expired"
}

export default function IdentificationStep({ value, onChange, onNext, paymentLinkStatus }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [showLink, setShowLink] = useState(false)
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>((value.paymentLinkId || '').trim() || null)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)
  const [amountLabel, setAmountLabel] = useState<string | undefined>(undefined)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [panelPickerOpen, setPanelPickerOpen] = useState(false)
  const [panels, setPanels] = useState<Array<{ code: string; title: string; description: string; params: string; sortOrder: number }>>([])

  const collectionRef = useRef<HTMLInputElement | null>(null)

  const selectedPanelCode = (value.panelProductCode || "").trim() || "VETQ_MASTER_360"
  const selectedPanel = useMemo(
    () =>
      panels.find((p) => p.code === selectedPanelCode) ?? {
        code: selectedPanelCode,
        title: "",
        description: "",
        params: "",
        sortOrder: 0,
      },
    [panels, selectedPanelCode]
  )

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch('/api/panels', { method: 'GET' })
          const data = await res.json().catch(() => null)
          if (!mounted) return
          const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : []
          const next = raw
            .map((p) => ({
              code: String(p?.code || '').trim(),
              title: String(p?.title || '').trim(),
              description: String(p?.description || '').trim(),
              params: String(p?.params || '').trim(),
              sortOrder: Number.isFinite(Number(p?.sortOrder)) ? Number(p.sortOrder) : 0,
            }))
            .filter((p) => p.code)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title))
          setPanels(next)
        } catch {
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    ; (async () => {
      try {
        const res = await fetch('/api/patient/get_patients?page=1&pageSize=50')
        const data = await res.json()
        if (res.ok && Array.isArray(data.items)) {
          setPatients(
            data.items.map((p: any) => ({
              id: String(p.id || p._id),
              name: String(p.name || p.animalName || ''),
              owner: String(p.owner || ''),
              image: p.image,
            }))
          )
        }
      } catch {
      }
    })()
  }, [])

  useEffect(() => {
    if (value.patientId) return
    if (typeof window === 'undefined') return
    const selected = (new URLSearchParams(window.location.search).get('patientId') || '').trim()
    if (selected) onChange({ patientId: selected })
  }, [onChange, value.patientId])

  useEffect(() => {
    if (!value.patientId) return
    if (patients.some((p) => p.id === value.patientId)) return

      ; (async () => {
        try {
          const res = await fetch(
            `/api/patient/get_patient_details?patientId=${encodeURIComponent(value.patientId)}`,
          )
          const data = await res.json()
          const item = data?.item
          if (!res.ok || !item) return

          const row: PatientListItem = {
            id: String(item.id || item._id || value.patientId),
            name: String(item.animalName || ''),
            owner: String(item.guardian?.fullName || ''),
            image: item.photo,
          }

          setPatients((prev) => (prev.some((p) => p.id === row.id) ? prev : [row, ...prev]))
        } catch {
        }
      })()
  }, [patients, value.patientId])

  useEffect(() => {
    const next = (value.paymentLinkId || '').trim()
    if (!next) return
    setPaymentLinkId(next)
  }, [value.paymentLinkId])

  const buildPaymentLinkUrl = (id: string, serverPath?: string | null) => {
    const trimmedId = (id || '').trim()
    if (!trimmedId) return null
    const path = typeof serverPath === 'string' && serverPath.trim() ? serverPath.trim() : `/Guardian/payment/${encodeURIComponent(trimmedId)}`
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`
  }

  const canProceed = useMemo(() => {
    return !!value.patientId && !!value.collectionMethod && !!value.collectionAt
  }, [value.collectionAt, value.collectionMethod, value.patientId])

  const collectionMethods: Array<{ key: IdentificationDraft["collectionMethod"]; label: string }> = [
    { key: 'free_catch', label: t('reading.identification.freeCatch') },
    { key: 'cystocentesis', label: t('reading.identification.cystocentesis') },
    { key: 'catheter', label: t('reading.identification.catheter') },
    { key: 'compression', label: t('reading.identification.compression') },
  ]

  const formattedCollectionDate = useMemo(() => {
    if (!value.collectionAt) return ''
    try {
      const d = new Date(value.collectionAt)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const mins = String(d.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} — ${hours}:${mins}`
    } catch {
      return value.collectionAt
    }
  }, [value.collectionAt])

  const handleProceed = async () => {
    if (generating) return
    const existingId = (value.paymentLinkId || paymentLinkId || "").trim()
    if (existingId) {
      try {
        setGenerating(true)
        const res = await fetch(`/api/payment_links/get/${encodeURIComponent(existingId)}`)
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          toast.error(typeof data?.error === "string" ? data.error : t("reading.identification.failedToLoadPaymentLink"))
          return
        }
        const nextAmountLabel = typeof data?.item?.amountLabel === "string" ? data.item.amountLabel : undefined
        setAmountLabel(nextAmountLabel)
        setPaymentLinkId(existingId)
        setPaymentLinkUrl(buildPaymentLinkUrl(existingId))
        setShowLink(true)
      } catch {
        toast.error(t("reading.identification.networkErrorLoadingPaymentLink"))
      } finally {
        setGenerating(false)
      }
      return
    }
    try {
      setGenerating(true)
      const res = await fetch('/api/payment_links/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: value.patientId, productCode: selectedPanelCode }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : t("reading.identification.failedToGeneratePaymentLink"))
        return
      }
      const id = String(data?.id || "")
      setPaymentLinkId(id)
      onChange({ paymentLinkId: id })
      setAmountLabel(typeof data?.amountLabel === "string" ? data.amountLabel : undefined)
      setPaymentLinkUrl(buildPaymentLinkUrl(id, typeof data?.url === "string" ? data.url : null))
      setShowLink(true)
    } catch {
      toast.error(t("reading.identification.networkErrorGeneratingPaymentLink"))
    } finally {
      setGenerating(false)
    }
  }

  if (showLink) {
    return (
      <LinkGenerated
        amountLabel={amountLabel}
        paymentUrl={paymentLinkUrl}
        sending={generating || sending}
        paymentLinkStatus={paymentLinkStatus}
        onSend={async () => {
          if (sending || generating) return
          if (!paymentLinkId) {
            toast.error(t("reading.identification.paymentLinkNotReady"))
            return
          }
          try {
            setSending(true)
            const res = await fetch('/api/payment_links/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentLinkId,
                identification: {
                  patientId: value.patientId,
                  collectionMethod: value.collectionMethod,
                  collectionAt: value.collectionAt,
                  stripLot: value.stripLot,
                  stripExpiry: value.stripExpiry,
                },
              }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
              toast.error(typeof data?.error === "string" ? data.error : t("reading.identification.failedToSendPaymentLink"))
              return
            }
            toast.success(t("reading.identification.paymentLinkSent"))
            onNext()
          } catch {
            toast.error(t("reading.identification.networkErrorSendingPaymentLink"))
          } finally {
            setSending(false)
          }
        }}
        onContinue={() => onNext()}
        onBack={() => {
          setShowLink(false)
          setAmountLabel(undefined)
          setPaymentLinkUrl(null)
        }}
      />
    )
  }

  return (
    <div className="mb-6">
      <div className="bg- rounded-xl border border-secondary px-5 py-5">
        <h2 className="text-[20px] font-bold text-black/70">{t("reading.identification.title")}</h2>
        <p className="mt-1 text-[13px] text-[#6B7280] leading-[18px]">{t("reading.identification.desc")}</p>

        <div className="mt-5 space-y-3">
          {/* Patient */}
          <div>
            <div className="text-[14px] font-semibold text-black/70 mb-1.5">{t("reading.identification.patient")}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/Veterinarian/new-reading/select-patient${value.patientId ? `?selected=${encodeURIComponent(value.patientId)}` : ''}`)}
                className="flex-1 relative px-4 py-3.5 bg-[#F5F6F6] rounded-xl text-left"
              >
                <span className={`text-[14px] ${value.patientId ? 'text-black/70' : 'text-[#9CA3AF]'}`}>
                  {value.patientId
                    ? (() => {
                      const p = patients.find((x) => x.id === value.patientId)
                      return p ? `${p.name}${p.owner ? ` — ${p.owner}` : ''}` : t("reading.identification.selectPatient")
                    })()
                    : t("reading.identification.selectPatient")}
                </span>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/50" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/Veterinarian/patient')}
                className="w-13 h-13 flex-shrink-0 flex items-center justify-center bg-[#EBF2FF] rounded-xl text-primary"
              >
                <Plus />
              </button>
            </div>
          </div>

          {/* Collection Method */}
          <div>
            <div className="text-[14px] font-semibold text-black/70 mb-3">{t("reading.identification.collectionMethod")}</div>
            <div className="grid grid-cols-2 gap-2">
              {collectionMethods.map((m) => {
                const isSelected = value.collectionMethod === m.key
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => onChange({ collectionMethod: m.key })}
                    className={`py-3.5 px-3 rounded-lg text-[10px] font-medium text-center border transition-all ${isSelected
                      ? 'border-primary bg-[#EBF2FF] text-primary'
                      : 'border-[#E5E7EB] bg-white text-black/80'
                      }`}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Jejum Toggle */}
          <div className="rounded-lg border border-[#E5E7EB] px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold text-black/70">{t("reading.identification.jejumQuestion")}</div>
                <div className="text-[12px] text-[#6B7280] mt-0.5">{t("reading.identification.jejumHint")}</div>
              </div>
              <button
                type="button"
                onClick={() => onChange({ isJejum: !value.isJejum })}
                className={`relative inline-flex w-12 h-6 rounded-full duration-200 transition-colors flex-shrink-0 ${value.isJejum ? 'bg-primary' : 'bg-[#D1D5DB]'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm duration-200 transition-all ${value.isJejum ? 'left-[26px]' : 'left-0.5'}`}
                />
              </button>
            </div>
          </div>

          {/* Collection Date & Time */}
          <div>
            <div className="text-[14px] font-semibold text-black/70 mb-1.5">{t("reading.identification.collectionDateTime")}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => collectionRef.current?.showPicker?.()}
                className="flex-1 relative flex items-center gap-3 px-4 py-3.5 bg-[#F5F6F6] rounded-xl text-left"
              >
                <Calendar className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
                <span className={`text-[14px] ${value.collectionAt ? 'text-black/70' : 'text-[#9CA3AF]'}`}>
                  {formattedCollectionDate || t("reading.identification.collectionDateTime")}
                </span>
              </button>
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[#EBF2FF] rounded-xl overflow-hidden">
                <Calendar className="w-5 h-5 text-primary pointer-events-none" />
                <input
                  ref={collectionRef}
                  type="datetime-local"
                  value={value.collectionAt}
                  max={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => onChange({ collectionAt: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleProceed}
          disabled={!canProceed || generating}
          className={`w-full py-4 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${canProceed && !generating
            ? 'bg-primary text-white shadow-sm'
            : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
        >
          {generating ? t("reading.identification.generating") : (
            <>
              {t("reading.identification.nextTimer")}
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>

      {panelPickerOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => setPanelPickerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[22px] bg-white shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="text-[18px] font-semibold text-gray-900">{t("reading.identification.panelType")}</div>
              <div className="mt-1 text-[13px] leading-[16px] text-[#9AA4AF]">
                {t("reading.identification.panelTypeDesc")}
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto px-4 pt-3 pb-18">
              <div className="space-y-3 pb-4">
                {(panels.length ? panels : [selectedPanel]).map((p) => {
                  const selected = p.code === selectedPanelCode
                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => {
                        setPanelPickerOpen(false)
                        if (p.code === selectedPanelCode) return
                        setShowLink(false)
                        setAmountLabel(undefined)
                        setPaymentLinkId(null)
                        setPaymentLinkUrl(null)
                        onChange({ panelProductCode: p.code, paymentLinkId: "" })
                      }}
                      className={`w-full rounded-[14px] px-4 py-3 text-left ${selected ? "bg-[#EEF4FF]" : "bg-[#F5F6F6]"}`}
                    >
                      <div className="text-[15px] font-medium leading-[18px] text-black/70">
                        {p.title}{p.description ? ` (${p.description})` : ""}
                      </div>
                      {p.params ? (
                        <div className="mt-1 text-[13px] leading-[16px] text-[#9AA4AF]">{p.params}</div>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
