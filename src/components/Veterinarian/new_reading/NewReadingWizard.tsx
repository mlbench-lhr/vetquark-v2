'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Stepper from './Stepper'
import { NewReadingDraft, NewReadingStep, ReviewResultDraft, ReviewSelectionMap } from './types'
import IdentificationStep from './IdentificationStep'
import TimerStep from './TimerStep'
import ReviewStep from './ReviewStep'
import ReportStep from './ReportStep'
import { toast } from 'react-toastify'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store/store'
import Pusher from 'pusher-js'
import { useTranslation } from 'react-i18next'

function makeEmptyDraft(panelProductCode?: string): NewReadingDraft {
  return {
    identification: {
      patientId: '',
      paymentLinkId: '',
      panelProductCode: String(panelProductCode || '').trim(),
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
  }
}

function inferFirstIncompleteStep(draft: NewReadingDraft, signatureImageUrl: string): NewReadingStep {
  const i = draft.identification
  const todayStr = new Date().toISOString().slice(0, 10)
  const expiryStr = (i.stripExpiry || '').trim()
  const expiryValid = !!expiryStr && expiryStr >= todayStr
  if (!i.patientId || !i.collectionMethod || !i.collectionAt || !i.stripLot || !expiryValid) return 'identification'
  if (!draft.timer.analysis) return 'timer'
  if (!draft.results || draft.results.length === 0) return 'review'
  if (!signatureImageUrl) return 'report'
  return 'report'
}

export default function NewReadingWizard() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const profile = useAppSelector((s: RootState) => s.userProfile.profile)
  const userId = profile?.id || ''
  const [unreadCount, setUnreadCount] = useState(0)
  const [step, setStep] = useState<NewReadingStep>('identification')
  const [submitting, setSubmitting] = useState(false)
  const [paymentLinkStatus, setPaymentLinkStatus] = useState<"unknown" | "pending" | "paid" | "expired">("unknown")
  const [signatureImageUrl, setSignatureImageUrl] = useState<string>("")
  const [draftId, setDraftId] = useState<string>("")
  const lastSavedJsonRef = useRef<string>("")
  const saveTimerRef = useRef<any>(null)
  const creatingDraftRef = useRef(false)

  const [draft, setDraft] = useState<NewReadingDraft>(() => ({
    ...makeEmptyDraft(),
  }))

  const [defaultPanelProductCode, setDefaultPanelProductCode] = useState<string>('')
  const [panelByCode, setPanelByCode] = useState<Map<string, { visibleKeys: string[] | null }>>(new Map())

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch('/api/panels', { method: 'GET' })
          const data = await res.json().catch(() => null)
          if (!mounted) return
          const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : []
          const map = new Map<string, { visibleKeys: string[] | null }>()
          let nextDefaultCode = ''
          for (const p of raw) {
            const code = String(p?.code || '').trim()
            if (!code) continue
            const keys = Array.isArray(p?.visibleKeys) ? (p.visibleKeys as any[]).map((k) => String(k || '').trim()).filter(Boolean) : null
            const normalizedKeys = keys && keys.length ? keys : null
            map.set(code, { visibleKeys: normalizedKeys })
            if (!nextDefaultCode && normalizedKeys === null) nextDefaultCode = code
            if (!nextDefaultCode) nextDefaultCode = code
          }
          setPanelByCode(map)
          setDefaultPanelProductCode(nextDefaultCode)
        } catch {
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!defaultPanelProductCode) return
    setDraft((prev) => {
      const current = String(prev.identification.panelProductCode || '').trim()
      if (current) return prev
      return {
        ...prev,
        identification: {
          ...prev.identification,
          panelProductCode: defaultPanelProductCode,
        },
      }
    })
  }, [defaultPanelProductCode])

  const visibleKeys = useMemo(() => {
    const code = (draft.identification.panelProductCode || '').trim() || defaultPanelProductCode
    const panel = panelByCode.get(code)
    return panel ? panel.visibleKeys : null
  }, [defaultPanelProductCode, draft.identification.panelProductCode, panelByCode])

  const [patientPreview, setPatientPreview] = useState<{
    animalName: string
    breed: string
    species: string
    guardianName: string
  } | null>(null)

  const patientIdFromQuery = useMemo(() => (searchParams.get('patientId') || '').trim(), [searchParams])
  const paymentLinkIdFromQuery = useMemo(() => (searchParams.get('paymentLinkId') || '').trim(), [searchParams])
  const stepFromQuery = useMemo(() => (searchParams.get('step') || '').trim(), [searchParams])
  const draftIdFromQuery = useMemo(() => (searchParams.get('draftId') || '').trim(), [searchParams])

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

    const handler = (payload: any) => {
      setUnreadCount((prev) => (prev > 0 ? prev + 1 : 1))
      const type = String(payload?.type || '')
      const urlStr = String(payload?.url || '')
      if (type === 'payment_received' && urlStr) {
        try {
          const u = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
          const pid = (u.searchParams.get('paymentLinkId') || '').trim()
          if (pid && pid === (draft.identification.paymentLinkId || '').trim()) {
            setPaymentLinkStatus('paid')
          }
        } catch {
        }
      }
    }
    channel.bind('notification:new', handler)

    return () => {
      channel.unbind('notification:new', handler)
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [userId, draft.identification.paymentLinkId])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshUnread()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [refreshUnread])

  useEffect(() => {
    setDraftId(draftIdFromQuery)
  }, [draftIdFromQuery])

  useEffect(() => {
    if (stepFromQuery !== 'identification' && stepFromQuery !== 'timer' && stepFromQuery !== 'review' && stepFromQuery !== 'report') return
    setStep(stepFromQuery)
  }, [stepFromQuery])

  useEffect(() => {
    if (!draftIdFromQuery) return
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch(`/api/reading/get_reading/${encodeURIComponent(draftIdFromQuery)}`, { method: 'GET' })
          const data = await res.json().catch(() => null)
          if (!mounted) return
          if (!res.ok) return
          const r = data?.reading
          if (!r) return
          const nextDraft = makeEmptyDraft()
          nextDraft.identification.patientId = String(r?.patient?.id || '')
          nextDraft.identification.paymentLinkId = String(r?.paymentLinkId || '')
          nextDraft.identification.panelProductCode = String(r?.productCode || '')
          const cm = String(r?.identification?.collectionMethod || '').trim()
          nextDraft.identification.collectionMethod = cm === 'free_catch' || cm === 'cystocentesis' || cm === 'catheter' ? cm : ''
          nextDraft.identification.collectionAt = r?.identification?.collectionAt ? String(r.identification.collectionAt) : ''
          nextDraft.identification.stripLot = String(r?.identification?.stripLot || '')
          nextDraft.identification.stripExpiry = r?.identification?.stripExpiry ? String(r.identification.stripExpiry) : ''
          nextDraft.timer.selectedSeconds = Number(r?.timer?.selectedSeconds || 120)
          nextDraft.timer.analyzedAt = r?.timer?.analyzedAt ? String(r.timer.analyzedAt) : ''
          nextDraft.timer.analysis = r?.timer?.analysis ?? null
          nextDraft.results = Array.isArray(r?.results) ? r.results : []
          nextDraft.report = r?.report ?? nextDraft.report
          setDraft(nextDraft)
          setSignatureImageUrl(typeof r?.signatureImageUrl === 'string' ? r.signatureImageUrl : '')
          const ws = String(r?.wizardStep || '').trim()
          const storedStep =
            ws === 'identification' || ws === 'timer' || ws === 'review' || ws === 'report'
              ? (ws as NewReadingStep)
              : inferFirstIncompleteStep(nextDraft, typeof r?.signatureImageUrl === 'string' ? r.signatureImageUrl : '')
          if (!(stepFromQuery === 'identification' || stepFromQuery === 'timer' || stepFromQuery === 'review' || stepFromQuery === 'report')) {
            setStep(storedStep)
          }
        } catch {
        }
      })()
    return () => {
      mounted = false
    }
  }, [draftIdFromQuery, stepFromQuery])

  useEffect(() => {
    if (draftIdFromQuery) return
    if (!patientIdFromQuery) return
    setDraft((prev) => {
      const prevPatientId = (prev.identification.patientId || '').trim()
      if (prevPatientId && prevPatientId !== patientIdFromQuery) {
        const next = makeEmptyDraft()
        next.identification.patientId = patientIdFromQuery
        next.identification.paymentLinkId = paymentLinkIdFromQuery || ''
        return next
      }
      return {
        ...prev,
        identification: {
          ...prev.identification,
          patientId: patientIdFromQuery,
          paymentLinkId: paymentLinkIdFromQuery || prev.identification.paymentLinkId,
        },
      }
    })
    setSignatureImageUrl('')
    lastSavedJsonRef.current = ''
    creatingDraftRef.current = false
    setDraftId('')
  }, [draftIdFromQuery, patientIdFromQuery, paymentLinkIdFromQuery])

  const saveDraftNow = useCallback(
    async (payload: {
      draftId?: string
      patientId: string
      paymentLinkId?: string
      wizardStep: NewReadingStep
      productCode?: string
      identification: {
        collectionMethod: string
        collectionAt: string
        stripLot: string
        stripExpiry: string
      }
      timer: {
        selectedSeconds: number
        analyzedAt: string
        analysis: any
      }
      results: any[]
      report: any
      signatureImageUrl: string
    }) => {
      try {
        const res = await fetch('/api/reading/save_draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) return null
        const id = String(data?.id || '').trim()
        return id || null
      } catch {
        return null
      }
    },
    [],
  )

  useEffect(() => {
    const patientId = (draft.identification.patientId || '').trim()
    if (!patientId) return
    if (draftId) return
    if (creatingDraftRef.current) return
    if (step === 'identification') {
      const i = draft.identification
      const todayStr = new Date().toISOString().slice(0, 10)
      const expiryStr = (i.stripExpiry || '').trim()
      const expiryValid = !!expiryStr && expiryStr >= todayStr
      const firstStepComplete =
        !!(i.collectionMethod || '').trim() &&
        !!(i.collectionAt || '').trim() &&
        !!(i.stripLot || '').trim() &&
        expiryValid
      if (!firstStepComplete) return
    }
    ; (async () => {
      creatingDraftRef.current = true
      const createdId = await saveDraftNow({
        patientId,
        paymentLinkId: (draft.identification.paymentLinkId || '').trim() || undefined,
        wizardStep: step,
        productCode: String((draft.identification.panelProductCode || defaultPanelProductCode || '')).trim(),
        identification: {
          collectionMethod: String(draft.identification.collectionMethod || ''),
          collectionAt: String(draft.identification.collectionAt || ''),
          stripLot: String(draft.identification.stripLot || ''),
          stripExpiry: String(draft.identification.stripExpiry || ''),
        },
        timer: {
          selectedSeconds: Number(draft.timer.selectedSeconds || 120),
          analyzedAt: String(draft.timer.analyzedAt || ''),
          analysis: draft.timer.analysis,
        },
        results: Array.isArray(draft.results) ? draft.results : [],
        report: draft.report,
        signatureImageUrl: String(signatureImageUrl || ''),
      })
      creatingDraftRef.current = false
      if (!createdId) return
      setDraftId(createdId)
      const params = new URLSearchParams(searchParams.toString())
      params.set('draftId', createdId)
      params.delete('resume')
      // router.replace(`/Veterinarian/new-reading?${params.toString()}`)
    })()
  }, [draft.identification.patientId, draft.identification.paymentLinkId, draft.identification.panelProductCode, draft.report, draft.results, draft.timer, draftId, router, saveDraftNow, searchParams, signatureImageUrl, step])

  useEffect(() => {
    const patientId = (draft.identification.patientId || '').trim()
    if (!patientId) return
    if (!draftId) return
    const payloadObj = {
      draftId,
      patientId,
      paymentLinkId: (draft.identification.paymentLinkId || '').trim() || undefined,
      wizardStep: step,
      productCode: String((draft.identification.panelProductCode || defaultPanelProductCode || '')).trim(),
      identification: {
        collectionMethod: String(draft.identification.collectionMethod || ''),
        collectionAt: String(draft.identification.collectionAt || ''),
        stripLot: String(draft.identification.stripLot || ''),
        stripExpiry: String(draft.identification.stripExpiry || ''),
      },
      timer: {
        selectedSeconds: Number(draft.timer.selectedSeconds || 120),
        analyzedAt: String(draft.timer.analyzedAt || ''),
        analysis: draft.timer.analysis,
      },
      results: Array.isArray(draft.results) ? draft.results : [],
      report: draft.report,
      signatureImageUrl: String(signatureImageUrl || ''),
    }
    const payloadJson = JSON.stringify(payloadObj)
    if (payloadJson === lastSavedJsonRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const id = await saveDraftNow(payloadObj)
      if (id) {
        lastSavedJsonRef.current = payloadJson
      }
    }, 700)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [draft, draftId, saveDraftNow, signatureImageUrl, step])

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
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
      const pusherConfigured = !!key && !!cluster && !!userId
      if (!pusherConfigured) {
        interval = setInterval(fetchStatus, 5000)
      }
    }
    return () => {
      mounted = false
      if (interval) clearInterval(interval)
    }
  }, [paymentLinkId, userId])

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
          draftId: draftId || undefined,
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
      const nextId = String(data?.id || '').trim()
      if (nextId) setDraftId(nextId)
      const destinationReadingId = nextId || draftId
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
      setDraftId("")
      if (destinationReadingId) {
        router.push(`/Veterinarian/history/detail/${encodeURIComponent(destinationReadingId)}`)
      } else {
        router.push('/Veterinarian/history')
      }
    } catch {
      toast.error(t("reading.wizard.networkErrorSavingReading"))
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
          visibleKeys={visibleKeys ?? undefined}
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
