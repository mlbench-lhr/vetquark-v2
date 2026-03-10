'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LinkGenerated from './LinkGenerated'
import { IdentificationDraft, PatientListItem } from './types'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

type Props = {
  value: IdentificationDraft
  onChange: (patch: Partial<IdentificationDraft>) => void
  onNext: () => void
}

export default function IdentificationStep({ value, onChange, onNext }: Props) {
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
  const stripExpiryRef = useRef<HTMLInputElement | null>(null)

  const selectedPanelCode = (value.panelProductCode || "").trim() || "VETQ_MASTER_360"
  const selectedPanel = useMemo(
    () =>
      panels.find((p) => p.code === selectedPanelCode) ?? {
        code: selectedPanelCode,
        title: selectedPanelCode,
        description: "",
        params: "",
        sortOrder: 0,
      },
    [panels, selectedPanelCode]
  )

  useEffect(() => {
    let mounted = true
    ;(async () => {
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
    const todayStr = new Date().toISOString().slice(0, 10)
    const expiryStr = (value.stripExpiry || '').trim()
    const expiryValid = !!expiryStr && expiryStr >= todayStr
    return !!value.patientId && !!value.collectionMethod && !!value.collectionAt && !!value.stripLot && expiryValid
  }, [value.collectionAt, value.collectionMethod, value.patientId, value.stripExpiry, value.stripLot])

  if (showLink) {
    return (
      <LinkGenerated
        amountLabel={amountLabel}
        paymentUrl={paymentLinkUrl}
        sending={generating || sending}
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
        onBack={() => {
          setShowLink(false)
          setAmountLabel(undefined)
          setPaymentLinkUrl(null)
        }}
      />
    )
  }

  return (
    <div className="">
      <h2 className="text-lg font-medium">{t("reading.identification.title")}</h2>
      <p className="text-sm text-tertiary">{t("reading.identification.desc")}</p>

      <div className="mt-6 space-y-5">
        <div>
          <div className="text-sm text-gray-900 mb-2">{t("reading.identification.patient")}</div>
          <div className="w-full flex justify-start items-center gap-2 relative">
            <button
              type="button"
              onClick={() => router.push(`/Veterinarian/new-reading/select-patient${value.patientId ? `?selected=${encodeURIComponent(value.patientId)}` : ''}`)}
              className="relative w-[calc(100%-64px)] px-4 py-4 bg-gray-100 rounded-2xl text-left text-gray-700"
            >
              {value.patientId
                ? (() => {
                  const p = patients.find((x) => x.id === value.patientId)
                  return p ? `${p.name}${p.owner ? ` — ${p.owner}` : ''}` : t("reading.identification.selectPatient")
                })()
                : t("reading.identification.selectPatient")}
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              onClick={() => router.push('/Veterinarian/patient')}
              className='w-[56px] h-[56px] flex justify-center items-center bg-[#EBF2FF] rounded-[20px]'
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27" fill="none">
                <g clipPath="url(#clip0_517_6337)">
                  <path d="M14.5121 7.42969L15.5949 0.928125C15.6839 0.39375 16.148 0 16.6917 0C17.0433 0 17.3714 0.164062 17.5824 0.445312L18.3746 1.5H20.8167C21.4121 1.5 21.9839 1.73906 22.4058 2.16094L23.2496 3H25.8746C26.498 3 26.9996 3.50156 26.9996 4.125V5.25C26.9996 7.32188 25.3214 9 23.2496 9H20.0011L19.7621 10.4297L14.5121 7.42969ZM19.4996 12.0047V22.5C19.4996 23.3297 18.8292 24 17.9996 24H16.4996C15.6699 24 14.9996 23.3297 14.9996 22.5V17.1C13.8746 17.6766 12.5996 18 11.2496 18C9.89955 18 8.62455 17.6766 7.49955 17.1V22.5C7.49955 23.3297 6.82924 24 5.99955 24H4.49955C3.66987 24 2.99955 23.3297 2.99955 22.5V11.7094C1.64955 11.1984 0.59018 10.0547 0.224555 8.59219L0.0464297 7.86563C-0.155133 7.06406 0.332367 6.24844 1.13862 6.04688C1.94487 5.84531 2.7558 6.33281 2.95737 7.13906L3.14018 7.86563C3.30424 8.53125 3.90424 9 4.5933 9H14.2402L19.4996 12.0047ZM21.7496 3.75C21.7496 3.55109 21.6705 3.36032 21.5299 3.21967C21.3892 3.07902 21.1985 3 20.9996 3C20.8006 3 20.6099 3.07902 20.4692 3.21967C20.3286 3.36032 20.2496 3.55109 20.2496 3.75C20.2496 3.94891 20.3286 4.13968 20.4692 4.28033C20.6099 4.42098 20.8006 4.5 20.9996 4.5C21.1985 4.5 21.3892 4.42098 21.5299 4.28033C21.6705 4.13968 21.7496 3.94891 21.7496 3.75Z" fill="#3F78D8" />
                  <path d="M22.5 15.5C21.1789 15.516 19.9164 16.048 18.9822 16.9822C18.048 17.9164 17.516 19.1789 17.5 20.5C17.516 21.8211 18.048 23.0836 18.9822 24.0178C19.9164 24.952 21.1789 25.484 22.5 25.5C23.8211 25.484 25.0836 24.952 26.0178 24.0178C26.952 23.0836 27.484 21.8211 27.5 20.5C27.484 19.1789 26.952 17.9164 26.0178 16.9822C25.0836 16.048 23.8211 15.516 22.5 15.5ZM25.3571 20.8571H22.8571V23.3571H22.1429V20.8571H19.6429V20.1429H22.1429V17.6429H22.8571V20.1429H25.3571V20.8571Z" fill="#3F78D8" />
                </g>
                <defs>
                  <clipPath id="clip0_517_6337">
                    <rect width="27" height="27" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-900 mb-2">Panel Type</div>
          <button
            type="button"
            onClick={() => setPanelPickerOpen(true)}
            className="relative w-full px-4 py-4 bg-gray-100 rounded-2xl text-left text-gray-700"
          >
            <div className="text-[15px] leading-[18px] text-gray-900">{selectedPanel.title}</div>
            <div className="mt-1 text-[13px] leading-[16px] text-[#9AA4AF]">
              {selectedPanel.description}
            </div>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
          </button>
        </div>

        <div>
          <div className="text-sm text-gray-900 mb-2">{t("reading.identification.collectionMethod")}</div>
          <div className="relative">
            <select
              value={value.collectionMethod}
              onChange={(e) => onChange({ collectionMethod: e.target.value as IdentificationDraft["collectionMethod"] })}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl appearance-none text-gray-700"
            >
              <option value="">{t("reading.identification.selectMethod")}</option>
              <option value="free_catch">{t("reading.identification.freeCatch")}</option>
              <option value="cystocentesis">{t("reading.identification.cystocentesis")}</option>
              <option value="catheter">{t("reading.identification.catheter")}</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-900 mb-2">{t("reading.identification.collectionDateTime")}</div>
          <div className="relative">
            <input
              ref={collectionRef}
              type="datetime-local"
              value={value.collectionAt}
              max={new Date().toISOString().slice(0, 16)}
              onChange={(e) => onChange({ collectionAt: e.target.value })}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl  text-gray-700"
              style={{ colorScheme: 'light' }}
            />
            <Calendar
              color='#3F78D8'
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-00 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200" />

        <div>
          <div className="text-sm text-gray-900 mb-2">{t("reading.identification.stripLot")}</div>
          <input
            type='number'
            value={value.stripLot}
            onChange={(e) => onChange({ stripLot: e.target.value })}
            placeholder={t("reading.identification.enterStripLot")}
            className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700"
          />
        </div>

        <div className="text-sm text-gray-900 mb-2">{t("reading.identification.stripExpiry")}</div>
        <div className="w-full flex justify-start items-center gap-2 relative">
          <div className="relative w-[calc(100%-0px)]">
            <div className="relative">
              <input
                ref={stripExpiryRef}
                type="date"
                value={value.stripExpiry}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const v = (e.target.value || '').trim()
                  const todayStr = new Date().toISOString().slice(0, 10)
                  if (v && v < todayStr) {
                    toast.error(t('reading.identification.stripExpiryMustBeFuture') || 'Strip expiry must be today or future')
                    return
                  }
                  onChange({ stripExpiry: v })
                }}
                placeholder={t("reading.identification.enterStripExpiry")}
                className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 pr-12"
                style={{ colorScheme: 'light' }}
              />
              <Calendar
                color='#3F78D8'
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-00 cursor-pointer"
                onClick={() => {
                  const el = stripExpiryRef.current as any
                  if (!el) return
                  if (typeof el.showPicker === 'function') el.showPicker()
                  else el.click()
                }}
              />
            </div>
          </div>
          {/* <div className='w-[56px] h-[56px] flex justify-center items-center bg-[#EBF2FF] rounded-[20px]'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 11H11V3H3V11ZM5 5H9V9H5V5ZM3 21H11V13H3V21ZM5 15H9V19H5V15ZM13 3V11H21V3H13ZM19 9H15V5H19V9ZM13.01 13H15.01V15H13.01V13ZM15.01 15H17.01V17H15.01V15ZM13.01 17H15.01V19H13.01V17ZM17.01 17H19.01V19H17.01V17ZM19.01 19H21.01V21H19.01V19ZM15.01 19H17.01V21H15.01V19ZM17.01 13H19.01V15H17.01V13ZM19.01 15H21.01V17H19.01V15Z" fill="#3F78D8" />
            </svg>
          </div> */}
        </div>

        <button
          onClick={async () => {
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
          }}
          disabled={!canProceed}
          className="w-full py-4 rounded-full bg-primary text-white font-medium disabled:opacity-60"
        >
          {generating ? t("reading.identification.generating") : (value.paymentLinkId || paymentLinkId ? t("reading.identification.viewPaymentLink") : t("reading.identification.generatePaymentLink"))}
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
              <div className="text-[18px] font-semibold text-gray-900">Panel Type</div>
              <div className="mt-1 text-[13px] leading-[16px] text-[#9AA4AF]">
                Tap to select a panel type, you can only select one at a time
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto px-4 py-3">
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
                      <div className="text-[15px] font-medium leading-[18px] text-[#111827]">
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
