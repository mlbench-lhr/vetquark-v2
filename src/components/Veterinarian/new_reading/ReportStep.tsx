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
      {/* Page header */}
      <h2 className="text-[20px] font-bold text-black/70">Pré-visualização e Edição Final do Laudo</h2>
      <p className="mt-1 text-[13px] text-[#6B7280] leading-[18px]">Revise e edite o laudo abaixo. Após a assinatura, ele não poderá ser alterado.</p>

      {/* Formal Report Preview Card */}
      <div className="mt-4 bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden">

        {/* Clinic header */}
        <div className="px-5 pt-5 pb-4 text-center border-b border-[#F3F4F6]">
          {veterinarian?.clinicLogoUrl ? (
            <Image
              src={veterinarian.clinicLogoUrl}
              alt="logo"
              width={100}
              height={50}
              className="mx-auto object-contain mb-1"
            />
          ) : (
            <div className="text-[20px] font-bold italic text-black/70 tracking-[0.18em]">
              {veterinarian?.tradeName || 'XE IL XTE'}
            </div>
          )}
          <div className="mt-1 text-[13px] font-bold text-black/70">
            {veterinarian?.tradeName || 'StripScan - Laboratório Veterinário'}
          </div>
          {veterinarian?.reportHeaderAddress ? (
            <div className="mt-0.5 text-[10px] text-[#6B7280] leading-[14px]">{veterinarian.reportHeaderAddress}</div>
          ) : null}
        </div>

        {/* Patient info table */}
        <div className="px-5 py-4 border-b border-[#F3F4F6]">
          <div className="space-y-[6px]">
            {(
              [
                [t('reading.report.breedLabel'), breed],
                [t('reading.report.speciesLabel'), species],
                ['Paciente', patientName],
                ['Tutor', guardianName],
                [t('reading.report.appointmentLabel'), appointment],
                ['Clínica', veterinarian?.tradeName || '—'],
                ['Solicitante', `Dr(a). ${veterinarian?.fullName || 'Vet'}`],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-start text-[12px] leading-[17px]">
                <span className="font-bold text-black/70 min-w-[80px] flex-shrink-0">{label}:</span>
                <span className="text-[#374151]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Certification line */}
        <div className="px-5 py-3 border-b border-[#F3F4F6]">
          <div className="h-px bg-[#D1D5DB] mb-3" />
          <div className="text-[11px] font-bold text-black/70">Conferido, liberado e assinado:</div>
          <div className="mt-1 text-[10px] leading-[14px] text-[#6B7280] italic">
            A interpretação dos exames laboratoriais deverá ser realizada pelo médico veterinário responsável, mediante a sintomatologia clínica do animal.
          </div>
        </div>

        {/* Observations section */}
        <div className="px-5 py-4 border-b border-[#F3F4F6]">
          <div className="text-[14px] font-bold text-black/70 mb-3">Observações e Interpretação</div>

          <div className="mb-3">
            <div className="text-[12px] text-[#374151] mb-1.5">{t('reading.report.veterinarianNotes')}:</div>
            <textarea
              value={report.veterinarianNotes}
              onChange={(e) => onChangeReport({ veterinarianNotes: e.target.value })}
              placeholder="Nenhuma observação adicional."
              rows={3}
              className="w-full px-3 py-2.5 bg-[#F5F6F6] rounded-xl text-[12px] text-[#374151] placeholder-[#9CA3AF] resize-none border-0 outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <div className="text-[12px] text-[#374151] mb-1.5">{t('reading.report.summaryInterpretation')}:</div>
            <textarea
              value={report.summaryAndInterpretation}
              onChange={(e) => onChangeReport({ summaryAndInterpretation: e.target.value })}
              placeholder={t('reading.report.enterSummaryInterpretation')}
              rows={4}
              className="w-full px-3 py-2.5 bg-[#F5F6F6] rounded-xl text-[12px] text-[#374151] placeholder-[#9CA3AF] resize-none border-0 outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Signature pad + vet info */}
        <div className="px-5 py-4">
          <div className="rounded-xl bg-[#F5F6F6] p-1.5 mb-4">
            <canvas ref={canvasRef} width={320} height={100} className="w-full h-[100px] bg-white rounded-lg" />
            <div className="mt-1.5 flex items-center gap-2 px-1">
              {!signatureImageUrl && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3 py-1.5 rounded-full bg-white text-[#374151] text-[11px] font-medium border border-[#E5E7EB]"
                  disabled={uploading || !!submitting}
                >
                  {t('reading.report.clear')}
                </button>
              )}
              <button
                type="button"
                onClick={ensureSignatureUploaded}
                className="px-3 py-1.5 rounded-full bg-primary text-white text-[11px] font-medium disabled:opacity-70"
                disabled={uploading || !!submitting}
              >
                {uploading ? t('reading.report.uploading') : signatureImageUrl ? t('reading.report.signatureReady') : t('reading.report.save')}
              </button>
              {!!signatureImageUrl && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3 py-1.5 rounded-full bg-white text-primary text-[11px] font-medium border border-primary"
                  disabled={uploading || !!submitting}
                >
                  {t('reading.report.retake')}
                </button>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[14px] font-bold text-black/70">{veterinarian?.fullName || 'Dr. Vet'}</div>
            <div className="text-[12px] text-[#6B7280] mt-0.5">
              {veterinarian?.crmvState && veterinarian?.crmv
                ? `CRMV-${veterinarian.crmvState} ${veterinarian.crmv}`
                : veterinarian?.crmv
                  ? `CRMV ${veterinarian.crmv}`
                  : 'CRMV'}
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-0.5">{t('reading.report.generatedOnPrefix')} {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <button
          onClick={async () => {
            const ok = await ensureSignatureUploaded()
            if (!ok) return
            onComplete()
          }}
          disabled={!!submitting || uploading || !signatureImageUrl}
          className="w-full py-4 rounded-full bg-primary text-white font-semibold text-[15px] disabled:opacity-70 shadow-sm"
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
