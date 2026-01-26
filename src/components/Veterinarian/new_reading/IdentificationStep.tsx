'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LinkGenerated from './LinkGenerated'
import { IdentificationDraft, PatientListItem } from './types'
import { toast } from 'react-toastify'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CustomDatePicker from '@/components/ui/dropdown/datepicker'

type Props = {
  value: IdentificationDraft
  onChange: (patch: Partial<IdentificationDraft>) => void
  onNext: () => void
}

export default function IdentificationStep({ value, onChange, onNext }: Props) {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [showLink, setShowLink] = useState(false)
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>((value.paymentLinkId || '').trim() || null)
  const [amountLabel, setAmountLabel] = useState<string | undefined>(undefined)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  const collectionRef = useRef<HTMLInputElement | null>(null)

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

  const canProceed = useMemo(() => {
    return !!value.patientId && !!value.collectionMethod && !!value.collectionAt && !!value.stripLot && !!value.stripExpiry
  }, [value.collectionAt, value.collectionMethod, value.patientId, value.stripExpiry, value.stripLot])

  if (showLink) {
    return (
      <LinkGenerated
        amountLabel={amountLabel}
        sending={generating || sending}
        onSend={async () => {
          if (sending || generating) return
          if (!paymentLinkId) {
            toast.error("Payment link is not ready yet")
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
              toast.error(typeof data?.error === "string" ? data.error : "Failed to send payment link")
              return
            }
            toast.success("Payment link sent to guardian")
            onNext()
          } catch {
            toast.error("Network error while sending payment link")
          } finally {
            setSending(false)
          }
        }}
        onBack={() => {
          setShowLink(false)
          setAmountLabel(undefined)
        }}
      />
    )
  }

  return (
    <div className="">
      <h2 className="text-lg font-medium">Test Identification</h2>
      <p className="text-sm text-tertiary">Fill in the basic details to start a new urine test.</p>

      <div className="mt-6 space-y-5">
        <div>
          <div className="text-sm text-gray-900 mb-2">Patient</div>
          <div className="w-full flex justify-start items-center gap-2 relative">
            <button
              type="button"
              onClick={() => router.push(`/Veterinarian/new-reading/select-patient${value.patientId ? `?selected=${encodeURIComponent(value.patientId)}` : ''}`)}
              className="relative w-[calc(100%-64px)] px-4 py-4 bg-gray-100 rounded-2xl text-left text-gray-700"
            >
              {value.patientId
                ? (() => {
                  const p = patients.find((x) => x.id === value.patientId)
                  return p ? `${p.name}${p.owner ? ` — ${p.owner}` : ''}` : 'Select a patient'
                })()
                : 'Select a patient'}
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              onClick={() => router.push('/Veterinarian/patient')}
              className='w-[56px] h-[56px] flex justify-center items-center bg-[#EBF2FF] rounded-[20px]'
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27" fill="none">
                <g clip-path="url(#clip0_517_6337)">
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
          <div className="text-sm text-gray-900 mb-2">Collection Method</div>
          <Select
            value={value.collectionMethod}
            onValueChange={(next) => onChange({ collectionMethod: next as IdentificationDraft["collectionMethod"] })}
          >
            <SelectTrigger className="w-full px-4 py-4 bg-gray-100 rounded-2xl border-0 shadow-none text-gray-700 focus:ring-0 focus:ring-offset-0 [&>svg]:text-primary [&>svg]:opacity-100">
              <SelectValue placeholder="Select a method" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="free_catch">Free catch</SelectItem>
              <SelectItem value="cystocentesis">Cystocentesis</SelectItem>
              <SelectItem value="catheter">Catheter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="text-sm text-gray-900 mb-2">Date and Time of Collection</div>
          <div className="relative">
            <Input
              ref={collectionRef}
              type="datetime-local"
              value={value.collectionAt}
              max={new Date().toISOString().slice(0, 16)}
              onChange={(e) => onChange({ collectionAt: e.target.value })}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl  text-gray-700 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
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
          <div className="text-sm text-gray-900 mb-2">Strip Lot</div>
          <Input
            type='number'
            value={value.stripLot}
            onChange={(e) => onChange({ stripLot: e.target.value })}
            placeholder="Enter Strip Lot Number"
            className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          />
        </div>

        <div className="text-sm text-gray-900 mb-2">Strip Expiry</div>
        <CustomDatePicker
          value={value.stripExpiry}
          onChange={(next) => onChange({ stripExpiry: next })}
          placeholder="Enter Strip Expiry Date"
          min={new Date().toISOString().slice(0, 10)}
          triggerClassName="px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 pr-12"
          iconClassName="right-4 w-5 h-5"
        />

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
                  toast.error(typeof data?.error === "string" ? data.error : "Failed to load payment link")
                  return
                }
                const nextAmountLabel = typeof data?.item?.amountLabel === "string" ? data.item.amountLabel : undefined
                setAmountLabel(nextAmountLabel)
                setPaymentLinkId(existingId)
                setShowLink(true)
              } catch {
                toast.error("Network error while loading payment link")
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
                body: JSON.stringify({ patientId: value.patientId }),
              })
              const data = await res.json().catch(() => null)
              if (!res.ok) {
                toast.error(typeof data?.error === "string" ? data.error : "Failed to generate payment link")
                return
              }
              const id = String(data?.id || "")
              setPaymentLinkId(id)
              onChange({ paymentLinkId: id })
              setAmountLabel(typeof data?.amountLabel === "string" ? data.amountLabel : undefined)
              setShowLink(true)
            } catch {
              toast.error("Network error while generating payment link")
            } finally {
              setGenerating(false)
            }
          }}
          disabled={!canProceed}
          className="w-full py-4 rounded-full bg-primary text-white font-medium disabled:opacity-60"
        >
          {generating ? "Generating..." : (value.paymentLinkId || paymentLinkId ? "View Payment Link" : "Generate Payment Link")}
        </button>
      </div>
    </div>
  )
}
