'use client'

import React, { useEffect, useRef, useState } from 'react'
import SignaturePad from 'signature_pad'
import Image from 'next/image'
import { ReportDraft, ReviewResultDraft } from './types'
import { useTranslation } from 'react-i18next'

type VeterinarianInfo = {
  fullName?: string
  crmv?: string
  crmvState?: string
  clinicLogoUrl?: string
  tradeName?: string
  reportHeaderAddress?: string
}

type Props = {
  patientPreview: {
    animalName: string
    breed: string
    species: string
    guardianName: string
  } | null
  collectionAt: string
  report: ReportDraft
  onChangeReport: (patch: Partial<ReportDraft>) => void
  onBack: () => void
  onComplete: () => void | Promise<void>
  signatureImageUrl?: string
  onChangeSignatureUrl?: (url: string) => void
  submitting?: boolean
  veterinarian?: VeterinarianInfo
  reviewResults?: ReviewResultDraft[]
  panelName?: string
}

export default function ReportStep({ patientPreview, collectionAt, report, onChangeReport, onBack, onComplete, signatureImageUrl = "", onChangeSignatureUrl, submitting, veterinarian, reviewResults, panelName }: Props) {
  const { t } = useTranslation()
  const patientName = patientPreview?.animalName || '—'
  const breed = patientPreview?.breed || '—'
  const species = patientPreview?.species || '—'
  const guardianName = patientPreview?.guardianName || '—'
  const appointment = collectionAt ? new Date(collectionAt).toLocaleString() : '—'
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sigPadRef = useRef<SignaturePad | null>(null)
  const [uploading, setUploading] = useState(false)
  const SIGNATURE_STORAGE_KEY = 'new_reading_signature_draft_v1'

  useEffect(() => {
    if (!canvasRef.current) return
    sigPadRef.current = new SignaturePad(canvasRef.current)
  }, [])

  useEffect(() => {
    const pad = sigPadRef.current
    if (!pad) return
    const handleEnd = () => {
      try {
        if (typeof window === 'undefined') return
        const url = pad.toDataURL('image/png')
        window.localStorage.setItem(SIGNATURE_STORAGE_KEY, url)
      } catch {
      }
    }
      ; (pad as any).onEnd = handleEnd
    try {
      if (typeof window !== 'undefined' && !signatureImageUrl) {
        const saved = window.localStorage.getItem(SIGNATURE_STORAGE_KEY)
        if (saved) {
          try {
            pad.fromDataURL(saved)
          } catch {
          }
        }
      }
    } catch {
    }
    return () => {
      ; (pad as any).onEnd = undefined
    }
  }, [signatureImageUrl])

  async function ensureSignatureUploaded() {
    if (signatureImageUrl) return true
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return false
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
    if (!CLOUD_NAME || !API_KEY) return false
    setUploading(true)
    try {
      const dataUrl = sigPadRef.current.toDataURL('image/png')
      const resBlob = await fetch(dataUrl)
      const blob = await resBlob.blob()
      const file = new File([blob], 'signature.png', { type: 'image/png' })
      const signRes = await fetch(`/api/cloudinary/upload?folder=reading_signatures`)
      const signJson = await signRes.json().catch(() => null)
      if (!signRes.ok) return false
      const timestamp = String(signJson?.timestamp || '')
      const signature = String(signJson?.signature || '')
      if (!timestamp || !signature) return false
      const data = new FormData()
      data.append('file', file)
      data.append('api_key', API_KEY)
      data.append('timestamp', timestamp)
      data.append('signature', signature)
      data.append('folder', 'reading_signatures')
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data })
      const uploadJson = await uploadRes.json().catch(() => null)
      if (!uploadRes.ok) return false
      const url = String(uploadJson?.secure_url || uploadJson?.url || '')
      if (!url) return false
      onChangeSignatureUrl?.(url)
      try {
        if (typeof window !== 'undefined') window.localStorage.removeItem(SIGNATURE_STORAGE_KEY)
      } catch {
      }
      return true
    } finally {
      setUploading(false)
    }
  }

  function handleRetake() {
    if (uploading || submitting) return
    onChangeSignatureUrl?.('')
    sigPadRef.current?.clear()
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(SIGNATURE_STORAGE_KEY)
    } catch {
    }
  }

  const physicalKeys = ['ph', 'specific-gravity', 'blood', 'leukocytes']
  const physicalResults = Array.isArray(reviewResults)
    ? reviewResults.filter((r) => physicalKeys.includes(r.key))
    : []
  const chemicalResults = Array.isArray(reviewResults)
    ? reviewResults.filter((r) => !physicalKeys.includes(r.key))
    : []

  return (
    <div className="">
      {/* Patient card */}
      <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#EBF2FF] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 20C22.2 20 24 18.2 24 16C24 13.8 22.2 12 20 12C17.8 12 16 13.8 16 16C16 18.2 17.8 20 20 20ZM20 22C17.3 22 12 23.4 12 26V28H28V26C28 23.4 22.7 22 20 22Z" fill="#3F78D8" />
              <circle cx="28" cy="12" r="4" fill="#3F78D8" />
              <circle cx="12" cy="12" r="4" fill="#3F78D8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[20px] font-bold text-[#111827] truncate">{patientName}</div>
            <div className="text-[13px] text-[#6B7280] mt-0.5">{guardianName}</div>
            {panelName && (
              <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBF2FF] text-[11px] font-medium text-[#3F78D8]">
                {panelName}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#F3F4F6] grid grid-cols-2 gap-y-2 text-[13px]">
          <div>
            <span className="text-[#9CA3AF]">{t('reading.report.breedLabel')}: </span>
            <span className="text-[#111827] font-medium">{breed}</span>
          </div>
          <div>
            <span className="text-[#9CA3AF]">{t('reading.report.speciesLabel')}: </span>
            <span className="text-[#111827] font-medium">{species}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[#9CA3AF]">{t('reading.report.appointmentLabel')}: </span>
            <span className="text-[#111827] font-medium">{appointment}</span>
          </div>
        </div>
      </div>

      {/* Physical parameters */}
      {physicalResults.length > 0 && (
        <div className="mt-4 rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-4">
          <div className="text-[14px] font-bold text-[#111827] mb-3">{t('reading.report.physicalParams')}</div>
          <div className="flex flex-wrap gap-3">
            {physicalResults.map((r) => (
              <div key={r.key} className="flex items-center gap-1.5">
                <span className="text-[12px] text-[#6B7280]">{r.label}:</span>
                <span className={`text-[12px] font-semibold ${r.status === 'Normal' ? 'text-[#059669]' : 'text-[#BB4D00]'}`}>
                  {r.valueLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chemical parameters */}
      {chemicalResults.length > 0 && (
        <div className="mt-3 rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-4">
          <div className="text-[14px] font-bold text-[#111827] mb-3">{t('reading.report.chemicalParams')}</div>
          <div className="flex flex-wrap gap-3">
            {chemicalResults.map((r) => (
              <div key={r.key} className="flex items-center gap-1.5">
                <span className="text-[12px] text-[#6B7280]">{r.label}:</span>
                <span className={`text-[12px] font-semibold ${r.status === 'Normal' ? 'text-[#059669]' : 'text-[#BB4D00]'}`}>
                  {r.valueLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Veterinary report section */}
      <div className="mt-4 rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-5">
        <div className="text-[16px] font-bold text-[#111827] mb-4">{t('reading.report.vetReportSection')}</div>

        <div className="space-y-4">
          <div>
            <div className="text-[14px] font-semibold text-[#111827] mb-2">{t('reading.report.summaryInterpretation')}</div>
            <textarea
              value={report.summaryAndInterpretation}
              onChange={(e) => onChangeReport({ summaryAndInterpretation: e.target.value })}
              placeholder={t('reading.report.enterSummaryInterpretation')}
              rows={3}
              className="w-full px-4 py-3.5 bg-[#F5F6F6] rounded-2xl text-[14px] text-[#374151] placeholder-[#9CA3AF] resize-none border-0 outline-none focus:ring-2 focus:ring-[#3F78D8]/20"
            />
          </div>

          <div>
            <div className="text-[14px] font-semibold text-[#111827] mb-2">{t('reading.report.recommendation')}</div>
            <textarea
              value={report.otherInformation}
              onChange={(e) => onChangeReport({ otherInformation: e.target.value })}
              placeholder={t('reading.report.enterRecommendation')}
              rows={2}
              className="w-full px-4 py-3.5 bg-[#F5F6F6] rounded-2xl text-[14px] text-[#374151] placeholder-[#9CA3AF] resize-none border-0 outline-none focus:ring-2 focus:ring-[#3F78D8]/20"
            />
          </div>

          <div>
            <div className="text-[14px] font-semibold text-[#111827] mb-2">{t('reading.report.veterinarianNotes')}</div>
            <textarea
              value={report.veterinarianNotes}
              onChange={(e) => onChangeReport({ veterinarianNotes: e.target.value })}
              placeholder={t('reading.report.enterVeterinarianNotes')}
              rows={2}
              className="w-full px-4 py-3.5 bg-[#F5F6F6] rounded-2xl text-[14px] text-[#374151] placeholder-[#9CA3AF] resize-none border-0 outline-none focus:ring-2 focus:ring-[#3F78D8]/20"
            />
          </div>
        </div>
      </div>

      {/* Signature section */}
      <div className="mt-4 rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-5">
        <div className="text-[14px] font-bold text-[#111827] mb-3">{t('reading.report.signature')}</div>
        <div className="rounded-2xl bg-[#F5F6F6] p-1.5">
          <canvas ref={canvasRef} width={320} height={160} className="w-full h-36 bg-white rounded-xl" />
          <div className="mt-2 flex items-center gap-2 px-1">
            {!signatureImageUrl && (
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-full bg-white text-[#374151] text-[13px] font-medium border border-[#E5E7EB]"
                disabled={uploading || !!submitting}
              >
                {t('reading.report.clear')}
              </button>
            )}
            <button
              type="button"
              onClick={ensureSignatureUploaded}
              className="px-4 py-2 rounded-full bg-[#3F78D8] text-white text-[13px] font-medium disabled:opacity-70"
              disabled={uploading || !!submitting}
            >
              {uploading ? t('reading.report.uploading') : signatureImageUrl ? t('reading.report.signatureReady') : t('reading.report.save')}
            </button>
            {!!signatureImageUrl && (
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-full bg-white text-[#3F78D8] text-[13px] font-medium border border-[#3F78D8]"
                disabled={uploading || !!submitting}
              >
                {t('reading.report.retake')}
              </button>
            )}
          </div>
        </div>

        {/* Vet signature info */}
        <div className="mt-4 pt-4 border-t border-[#F3F4F6] text-center">
          <div className="text-[16px] font-semibold text-[#111827]">{veterinarian?.fullName || 'Dr. Vet'}</div>
          <div className="text-[13px] text-[#6B7280] mt-0.5">
            {veterinarian?.crmvState && veterinarian?.crmv
              ? `CRMV-${veterinarian.crmvState} ${veterinarian.crmv}`
              : veterinarian?.crmv
                ? `CRMV ${veterinarian.crmv}`
                : 'CRMV'}
          </div>
          <div className="text-[12px] text-[#9CA3AF] mt-1">{t('reading.report.generatedOnPrefix')} {new Date().toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <button
          onClick={async () => {
            const ok = await ensureSignatureUploaded()
            if (!ok) return
            onComplete()
          }}
          disabled={!!submitting || uploading || !signatureImageUrl}
          className="w-full py-4 rounded-full bg-[#3F78D8] text-white font-semibold text-[15px] disabled:opacity-70 shadow-sm"
        >
          {submitting ? t('reading.report.signing') : t('reading.report.signComplete')}
        </button>
        <button
          onClick={onBack}
          className="w-full py-4 rounded-full border border-[#E5E7EB] bg-white text-[#374151] font-medium text-[15px]"
        >
          {t('reading.report.discard')}
        </button>
      </div>
    </div>
  )
}
