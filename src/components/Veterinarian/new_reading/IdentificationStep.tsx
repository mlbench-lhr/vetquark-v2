'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import LinkGenerated from './LinkGenerated'
import { PatientListItem } from './types'

type Props = {
  onNext: () => void
}

export default function IdentificationStep({ onNext }: Props) {
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [patientId, setPatientId] = useState('')
  const [collectionMethod, setCollectionMethod] = useState('')
  const [stripLot, setStripLot] = useState('')
  const [stripExpiry, setStripExpiry] = useState('')
  const [collectionAt, setCollectionAt] = useState('')
  const [showLink, setShowLink] = useState(false)

  const collectionRef = useRef<HTMLInputElement | null>(null)
  const stripExpiryRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/patient/get_patients')
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

  const canProceed = useMemo(() => {
    return !!patientId && !!collectionMethod && !!collectionAt && !!stripLot && !!stripExpiry
  }, [patientId, collectionMethod, collectionAt, stripLot, stripExpiry])

  if (showLink) {
    return (
      <LinkGenerated
        onSend={() => onNext()}
        onBack={() => setShowLink(false)}
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
          <div className="relative">
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl appearance-none text-gray-700"
            >
              <option value="">Select a patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.owner ? ` — ${p.owner}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-900 mb-2">Collection Method</div>
          <div className="relative">
            <select
              value={collectionMethod}
              onChange={(e) => setCollectionMethod(e.target.value)}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl appearance-none text-gray-700"
            >
              <option value="">Select a method</option>
              <option value="free_catch">Free catch</option>
              <option value="cystocentesis">Cystocentesis</option>
              <option value="catheter">Catheter</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-900 mb-2">Date and Time of Collection</div>
          <div className="relative">
            <input
              ref={collectionRef}
              type="datetime-local"
              value={collectionAt}
              max={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setCollectionAt(e.target.value)}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl  text-gray-700"
              style={{ colorScheme: 'light' }}
            />
            {/* <Calendar
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer"
              onClick={() => {
                const el = collectionRef.current as any
                if (!el) return
                if (typeof el.showPicker === 'function') el.showPicker()
                else el.click()
              }}
            /> */}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200" />

        <div>
          <div className="text-sm text-gray-900 mb-2">Strip Lot</div>
          <input
            value={stripLot}
            onChange={(e) => setStripLot(e.target.value)}
            placeholder="Enter Strip Lot Number"
            className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700"
          />
        </div>

        <div>
          <div className="text-sm text-gray-900 mb-2">Strip Expiry</div>
          <div className="relative">
            <input
              ref={stripExpiryRef}
              type="date"
              value={stripExpiry}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setStripExpiry(e.target.value)}
              placeholder="Enter Strip Expiry Date"
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 pr-12"
              style={{ colorScheme: 'light' }}
            />
            <Calendar
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer"
              onClick={() => {
                const el = stripExpiryRef.current as any
                if (!el) return
                if (typeof el.showPicker === 'function') el.showPicker()
                else el.click()
              }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowLink(true)}
          disabled={!canProceed}
          className="w-full py-4 rounded-full bg-primary text-white font-medium disabled:opacity-60"
        >
          Generate Payment Link
        </button>
      </div>
    </div>
  )
}