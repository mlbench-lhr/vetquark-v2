'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Stepper from './Stepper'
import { NewReadingDraft, NewReadingStep, ReviewResultDraft, ReviewSelectionMap } from './types'
import IdentificationStep from './IdentificationStep'
import TimerStep from './TimerStep'
import ReviewStep from './ReviewStep'
import ReportStep from './ReportStep'
import { toast } from 'react-toastify'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store/store'
import Pusher from 'pusher-js'
import { useTranslation } from 'react-i18next'

export default function NewReadingWizard() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const profile = useAppSelector((s: RootState) => s.userProfile.profile)
  const userId = profile?.id || ''
  const [unreadCount, setUnreadCount] = useState(0)
  const [step, setStep] = useState<NewReadingStep>('identification')
  const [submitting, setSubmitting] = useState(false)
  const [paymentLinkStatus, setPaymentLinkStatus] = useState<"unknown" | "pending" | "paid" | "expired">("unknown")
  const [signatureImageUrl, setSignatureImageUrl] = useState<string>("")

  const [draft, setDraft] = useState<NewReadingDraft>(() => ({
    identification: {
      patientId: '',
      paymentLinkId: '',
      panelProductCode: 'VETQ_MASTER_360',
      collectionMethod: '',
      collectionAt: '',
      stripLot: '',
      stripExpiry: '',
    },
    timer: {
      selectedSeconds: 120,
      analyzedAt: '',
      analysis: null,
    },
    reviewSelections: {},
    results: [],
    report: {
      summaryAndInterpretation: '',
      otherInformation: '',
      veterinarianNotes: '',
    },
  }))

  const STORAGE_KEY = 'new_reading_draft_v1'

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { draft?: Partial<NewReadingDraft>; step?: NewReadingStep; signatureImageUrl?: string }
      if (!saved || typeof saved !== 'object') return
      const sd = saved.draft || {}
      const sStep = saved.step
      const sSig = saved.signatureImageUrl
      setDraft((prev) => ({
        identification: {
          patientId: String(sd?.identification?.patientId ?? prev.identification.patientId ?? ''),
          paymentLinkId: String(sd?.identification?.paymentLinkId ?? prev.identification.paymentLinkId ?? ''),
          panelProductCode: String(sd?.identification?.panelProductCode ?? prev.identification.panelProductCode ?? 'VETQ_MASTER_360'),
          collectionMethod: String(sd?.identification?.collectionMethod ?? prev.identification.collectionMethod ?? ''),
          collectionAt: String(sd?.identification?.collectionAt ?? prev.identification.collectionAt ?? ''),
          stripLot: String(sd?.identification?.stripLot ?? prev.identification.stripLot ?? ''),
          stripExpiry: String(sd?.identification?.stripExpiry ?? prev.identification.stripExpiry ?? ''),
        },
        timer: {
          selectedSeconds: Number(sd?.timer?.selectedSeconds ?? prev.timer.selectedSeconds ?? 120),
          analyzedAt: String(sd?.timer?.analyzedAt ?? prev.timer.analyzedAt ?? ''),
          analysis: sd?.timer?.analysis ?? prev.timer.analysis ?? null,
        },
        reviewSelections: (sd?.reviewSelections as ReviewSelectionMap) ?? prev.reviewSelections ?? {},
        results: Array.isArray(sd?.results) ? (sd.results as ReviewResultDraft[]) : prev.results ?? [],
        report: {
          summaryAndInterpretation: String(sd?.report?.summaryAndInterpretation ?? prev.report.summaryAndInterpretation ?? ''),
          otherInformation: String(sd?.report?.otherInformation ?? prev.report.otherInformation ?? ''),
          veterinarianNotes: String(sd?.report?.veterinarianNotes ?? prev.report.veterinarianNotes ?? ''),
        },
      } as NewReadingDraft))
      if (sStep === 'identification' || sStep === 'timer' || sStep === 'review' || sStep === 'report') {
        setStep(sStep)
      }
      if (typeof sSig === 'string') {
        setSignatureImageUrl(sSig)
      }
    } catch {
    }
  }, [])

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const payload = JSON.stringify({ draft, step, signatureImageUrl })
      window.localStorage.setItem(STORAGE_KEY, payload)
    } catch {
    }
  }, [draft, step, signatureImageUrl])

  const [patientPreview, setPatientPreview] = useState<{
    animalName: string
    breed: string
    species: string
    guardianName: string
  } | null>(null)

  const patientIdFromQuery = useMemo(() => (searchParams.get('patientId') || '').trim(), [searchParams])
  const paymentLinkIdFromQuery = useMemo(() => (searchParams.get('paymentLinkId') || '').trim(), [searchParams])
  const stepFromQuery = useMemo(() => (searchParams.get('step') || '').trim(), [searchParams])

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread_count', { method: 'GET' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setUnreadCount(0)
        return
      }
      const next = Number(data?.count || 0)
      setUnreadCount(Number.isFinite(next) && next > 0 ? next : 0)
    } catch {
      setUnreadCount(0)
    }
  }, [])

  useEffect(() => {
    refreshUnread()
  }, [refreshUnread, userId])

  useEffect(() => {
    if (!userId) return
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) return

    const pusher = new Pusher(key, { cluster, authEndpoint: '/api/pusher/auth' })
    const channelName = `private-notifications-${userId}`
    const channel = pusher.subscribe(channelName)

    const handler = () => {
      setUnreadCount((prev) => (prev > 0 ? prev + 1 : 1))
    }
    channel.bind('notification:new', handler)

    return () => {
      channel.unbind('notification:new', handler)
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [userId])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshUnread()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [refreshUnread])

  useEffect(() => {
    if (!patientIdFromQuery) return
    setDraft((prev) => ({
      ...prev,
      identification: { ...prev.identification, patientId: patientIdFromQuery },
    }))
  }, [patientIdFromQuery])

  useEffect(() => {
    if (!paymentLinkIdFromQuery) return
    setDraft((prev) => ({
      ...prev,
      identification: { ...prev.identification, paymentLinkId: paymentLinkIdFromQuery },
    }))
  }, [paymentLinkIdFromQuery])

  useEffect(() => {
    if (stepFromQuery !== 'identification' && stepFromQuery !== 'timer' && stepFromQuery !== 'review' && stepFromQuery !== 'report') return
    setStep(stepFromQuery)
  }, [stepFromQuery])

  useEffect(() => {
    const patientId = draft.identification.patientId
    if (!patientId) {
      setPatientPreview(null)
      return
    }
    ; (async () => {
      try {
        const res = await fetch(`/api/patient/get_patient_details?patientId=${encodeURIComponent(patientId)}`)
        const data = await res.json().catch(() => null)
        const item = data?.item
        if (!res.ok || !item) return
        setPatientPreview({
          animalName: String(item.animalName || ''),
          breed: String(item.breed || ''),
          species: String(item.species || ''),
          guardianName: String(item.guardian?.fullName || ''),
        })
      } catch {
      }
    })()
  }, [draft.identification.patientId])

  const paymentLinkId = useMemo(() => (draft.identification.paymentLinkId || '').trim(), [draft.identification.paymentLinkId])

  useEffect(() => {
    let mounted = true
    let interval: any = null
    const fetchStatus = async () => {
      if (!paymentLinkId) {
        if (mounted) setPaymentLinkStatus("unknown")
        return
      }
      try {
        const res = await fetch(`/api/payment_links/get/${encodeURIComponent(paymentLinkId)}`)
        const data = await res.json().catch(() => null)
        if (!mounted) return
        if (!res.ok) {
          setPaymentLinkStatus("unknown")
          return
        }
        const statusRaw = String(data?.item?.status || "")
        if (statusRaw === "paid" || statusRaw === "pending" || statusRaw === "expired") {
          setPaymentLinkStatus(statusRaw)
        } else {
          setPaymentLinkStatus("unknown")
        }
      } catch {
        if (mounted) setPaymentLinkStatus("unknown")
      }
    }

    fetchStatus()
    if (paymentLinkId) {
      interval = setInterval(fetchStatus, 5000)
    }
    return () => {
      mounted = false
      if (interval) clearInterval(interval)
    }
  }, [paymentLinkId])

  const canSubmit = useMemo(() => {
    const i = draft.identification
    const todayStr = new Date().toISOString().slice(0, 10)
    const expiryStr = (i.stripExpiry || '').trim()
    const expiryValid = !!expiryStr && expiryStr >= todayStr
    return !!i.patientId && !!i.collectionMethod && !!i.collectionAt && !!i.stripLot && expiryValid && !!draft.timer.analysis && draft.results.length > 0 && !!signatureImageUrl
  }, [draft.identification, draft.timer.analysis, draft.results.length, signatureImageUrl])

  function makeDummyAnalysis(): { analyzedAt: string; analysis: { summary: string; confidence: number; flags: string[] } } {
    const analyzedAt = new Date().toISOString()
    const confidence = Number((0.65 + Math.random() * 0.3).toFixed(2))
    return {
      analyzedAt,
      analysis: {
        summary: "Dummy analysis result generated (replace with real analyzer).",
        confidence,
        flags: ["dummy"],
      },
    }
  }

  async function submitReading() {
    if (submitting) return
    if (!canSubmit) {
      toast.error(t("reading.wizard.pleaseCompleteBeforeSigning"))
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch("/api/reading/new_reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: draft.identification.patientId,
          paymentLinkId: paymentLinkId || undefined,
          identification: {
            collectionMethod: draft.identification.collectionMethod,
            collectionAt: draft.identification.collectionAt,
            stripLot: draft.identification.stripLot,
            stripExpiry: draft.identification.stripExpiry,
          },
          timer: {
            selectedSeconds: draft.timer.selectedSeconds,
            analyzedAt: draft.timer.analyzedAt,
            analysis: draft.timer.analysis,
          },
          results: draft.results,
          report: draft.report,
          signatureImageUrl,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : t("reading.wizard.failedToSaveReading"))
        return
      }
      toast.success(t("reading.wizard.savedReading"))
      setDraft((prev) => ({
        ...prev,
        identification: { patientId: "", paymentLinkId: "", collectionMethod: "", collectionAt: "", stripLot: "", stripExpiry: "" },
        timer: { selectedSeconds: 45, analyzedAt: "", analysis: null },
        reviewSelections: {},
        results: [],
        report: { summaryAndInterpretation: "", otherInformation: "", veterinarianNotes: "" },
      }))
      setSignatureImageUrl("")
      setStep("identification")
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
      }
    } catch {
      toast.error("Network error while saving reading")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-medium">{t("reading.wizard.newUrineTest")}</div>
      </div>
      <Stepper active={step} />

      {step === 'identification' && (
        <IdentificationStep
          value={draft.identification}
          onChange={(patch: Partial<NewReadingDraft["identification"]>) =>
            setDraft((prev) => ({ ...prev, identification: { ...prev.identification, ...patch } }))
          }
          onNext={() => setStep('timer')}
        />
      )}

      {step === 'timer' && (
        <TimerStep
          selectedSeconds={draft.timer.selectedSeconds}
          onChangeSelectedSeconds={(next: number) =>
            setDraft((prev) => ({ ...prev, timer: { ...prev.timer, selectedSeconds: next } }))
          }
          onBack={() => setStep('identification')}
          onAnalyzeAndProceed={(results: ReviewSelectionMap) => {
            const dummy = makeDummyAnalysis()
            setDraft((prev) => ({
              ...prev,
              timer: { ...prev.timer, analyzedAt: dummy.analyzedAt, analysis: dummy.analysis },
              reviewSelections: results
            }))
            setStep('review')
          }}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          selectedByKey={draft.reviewSelections}
          onChangeSelectedByKey={(next: NewReadingDraft["reviewSelections"]) =>
            setDraft((prev) => ({ ...prev, reviewSelections: next }))
          }
          onBack={() => setStep('timer')}
          onIssueReport={(results: ReviewResultDraft[]) => {
            setDraft((prev) => ({ ...prev, results }))
            setStep('report')
          }}
        />
      )}

      {step === 'report' && (
        <ReportStep
          patientPreview={patientPreview}
          collectionAt={draft.identification.collectionAt}
          report={draft.report}
          onChangeReport={(patch: Partial<NewReadingDraft["report"]>) =>
            setDraft((prev) => ({ ...prev, report: { ...prev.report, ...patch } }))
          }
          onBack={() => setStep('review')}
          onComplete={submitReading}
          signatureImageUrl={signatureImageUrl}
          onChangeSignatureUrl={setSignatureImageUrl}
          submitting={submitting}
        />
      )}
    </div>
  )
}
