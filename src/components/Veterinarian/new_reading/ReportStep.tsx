'use client'

import React, { useEffect, useRef, useState } from 'react'
import SignaturePad from 'signature_pad'
import Image from 'next/image'
import { ReportDraft } from './types'
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
}

export default function ReportStep({ patientPreview, collectionAt, report, onChangeReport, onBack, onComplete, signatureImageUrl = "", onChangeSignatureUrl, submitting, veterinarian }: Props) {
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

  return (
    <div className="">
      <h2 className="text-lg font-medium text-gray-900">{t('reading.report.title')}</h2>
      <p className="text-sm text-tertiary">{t('reading.report.desc')}</p>

      <div className="mt-6 rounded-3xl border border-gray-200 overflow-hidden bg-white p-4">
        <div className="flex justify-center mb-2">
          <Image
            src="/Logos VetQuark-03.png"
            alt="VetQuark"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </div>
        <div className="text-center text-sm text-gray-700 font-medium">
          {veterinarian?.tradeName || veterinarian?.fullName || t('reading.report.labName')}
        </div>
        <div className="text-center text-xs text-gray-500 mt-1">
          {veterinarian?.reportHeaderAddress || t('reading.report.labAddress')}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3 text-sm space-y-1">
          <div><span className="font-semibold">{t('reading.report.patientLabel')}:</span> {patientName}</div>
          <div><span className="font-semibold">{t('reading.report.breedLabel')}:</span> {breed}</div>
          <div><span className="font-semibold">{t('reading.report.speciesLabel')}:</span> {species}</div>
          <div><span className="font-semibold">{t('reading.report.guardianLabel')}:</span> {guardianName}</div>
          <div><span className="font-semibold">{t('reading.report.appointmentLabel')}:</span> {appointment}</div>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-foreground font-semibold text-center">
          {t('reading.report.disclaimerTitle')}
          <br />
          <span className='text-xs font-normal'>{t('reading.report.disclaimerNote')}</span>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm text-gray-900 mb-2">{t('reading.report.signature')}</div>
        <div className="rounded-2xl bg-gray-100 p-1">
          <canvas ref={canvasRef} width={320} height={160} className="w-full h-40 bg-white rounded-xl" />
          <div className="mt-1 flex items-center gap-1">
            {
              !signatureImageUrl &&
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-full bg-white text-gray-700 font-medium"
                disabled={uploading || !!submitting}
              >
                {t('reading.report.clear')}
              </button>
            }
            <button
              type="button"
              onClick={ensureSignatureUploaded}
              className="px-4 py-2 rounded-full bg-primary text-white font-medium disabled:opacity-70"
              disabled={uploading || !!submitting}
            >
              {uploading ? t('reading.report.uploading') : signatureImageUrl ? t('reading.report.signatureReady') : t('reading.report.save')}
            </button>
            {
              !!signatureImageUrl && (
                <>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-4 py-2 rounded-full bg-white text-primary font-medium border border-primary"
                    disabled={uploading || !!submitting}
                  >
                    {t('reading.report.retake')}
                  </button>
                </>
              )
            }
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm text-gray-900 mb-2">{t('reading.report.summaryInterpretation')}</div>
        <textarea
          value={report.summaryAndInterpretation}
          onChange={(e) => onChangeReport({ summaryAndInterpretation: e.target.value })}
          placeholder={t('reading.report.enterSummaryInterpretation')}
          rows={2}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 resize-none"
        />
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-900 mb-2">{t('reading.report.otherInformation')}</div>
        <textarea
          value={report.otherInformation}
          onChange={(e) => onChangeReport({ otherInformation: e.target.value })}
          placeholder={t('reading.report.enterOtherInformation')}
          rows={2}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 resize-none"
        />
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-900 mb-2">{t("reading.report.veterinarianNotes")}</div>
        <textarea
          value={report.veterinarianNotes}
          onChange={(e) => onChangeReport({ veterinarianNotes: e.target.value })}
          placeholder={t('reading.report.enterVeterinarianNotes')}
          rows={2}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 resize-none"
        />
      </div>
      <div className="bg-[#F5F6F6] w-[100vw] -ms-4 h-2 my-4"></div>
      <div className="w-full flex justify-start items-center flex-col gap-0 px-4">
        <h1 className="text-[18px] font-medium">{veterinarian?.fullName || 'Dr. Vet'}</h1>
        <h2 className="text-[14px] font-normal">
          {veterinarian?.crmvState && veterinarian?.crmv
            ? `CRMV-${veterinarian.crmvState} ${veterinarian.crmv}`
            : veterinarian?.crmv
              ? `CRMV ${veterinarian.crmv}`
              : 'CRMV'}
        </h2>
        <p className="text-[14px] font-normal text-black/60">{t('reading.report.generatedOnPrefix')} {new Date().toLocaleString()}</p>
      </div>
      <div className="mt-6 space-y-3">
        <button
          onClick={async () => {
            const ok = await ensureSignatureUploaded()
            if (!ok) return
            onComplete()
          }}
          disabled={!!submitting || uploading || !signatureImageUrl}
          className="w-full py-4 rounded-full bg-primary text-white font-medium disabled:opacity-70"
        >
          {submitting ? t('reading.report.signing') : t('reading.report.signComplete')}
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
