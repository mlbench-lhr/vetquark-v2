'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Stepper from './Stepper'
import { CapturedReadingImageDraft, NewReadingDraft, NewReadingStep, ReviewResultDraft, ReviewSelectionMap } from './types'
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
  if (!i.patientId || !i.collectionMethod || !i.collectionAt) return 'identification'
  if (!draft.timer.analysis) return 'timer'
  if (!draft.results || draft.results.length === 0) return 'review'
  if (!signatureImageUrl) return 'report'
  return 'report'
}

export default function NewReadingWizard() {
  const { t, i18n } = useTranslation()
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
  const [processSingleRawResults, setProcessSingleRawResults] = useState<Array<{ atSeconds: number; time: string; response: any }>>([])
  const [capturedImages, setCapturedImages] = useState<CapturedReadingImageDraft[]>([])
  const [existingCapturedImages, setExistingCapturedImages] = useState<Array<{ cloudinaryUrl: string; captureSecond: number; capturedAt: string | null }>>([])
  const existingImagesFetchedForRef = useRef<string>('')

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
          setCapturedImages([])
          setExistingCapturedImages([])
          existingImagesFetchedForRef.current = ''
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
    setCapturedImages([])
    setExistingCapturedImages([])
    existingImagesFetchedForRef.current = ''
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
    // Do not save draft if still on step 1 (identification)
    // Only start saving from step 2 (timer) onwards
    if (step === 'identification') return
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

  useEffect(() => {
    if (!draftId) return
    if (step !== 'timer') return
    if (existingImagesFetchedForRef.current === draftId) return
    existingImagesFetchedForRef.current = draftId
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch(`/api/reading/get_reading_images/${encodeURIComponent(draftId)}`, { method: 'GET' })
          const data = await res.json().catch(() => null)
          if (!mounted) return
          if (!res.ok) return
          const imgs = Array.isArray(data?.images) ? data.images : []
          if (imgs.length > 0) {
            setExistingCapturedImages(imgs.map((img: any) => ({
              cloudinaryUrl: String(img.cloudinaryUrl || ''),
              captureSecond: Number(img.captureSecond ?? 0),
              capturedAt: img.capturedAt ? String(img.capturedAt) : null,
            })))
          }
        } catch {
        }
      })()
    return () => { mounted = false }
  }, [draftId, step])

  const canSubmit = useMemo(() => {
    const i = draft.identification
    return !!i.patientId && !!i.collectionMethod && !!i.collectionAt && !!draft.timer.analysis && draft.results.length > 0 && !!signatureImageUrl
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

  function extractPrimaryResultText(payload: any) {
    const primary = payload?.primary_result
    if (!primary || typeof primary !== 'object') {
      return { interpretation: '', recommendation: '' }
    }
    const language = String(i18n.language || 'en').toLowerCase()
    const preferredLocales = language.startsWith('pt') ? ['pt', 'en'] : ['en', 'pt']
    for (const locale of preferredLocales) {
      const localized = primary?.[locale]
      if (!localized || typeof localized !== 'object') continue
      const interpretation = String(localized?.assisted_interpretation || '').trim()
      const recommendation = String(localized?.recommendations || '').trim()
      if (interpretation || recommendation) {
        return { interpretation, recommendation }
      }
    }
    return {
      interpretation: String(primary?.assisted_interpretation || '').trim(),
      recommendation: String(primary?.recommendations || '').trim(),
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
          capturedImages: capturedImages.map((img) => ({
            atSeconds: Number(img.atSeconds),
            dataUrl: String(img.dataUrl || ''),
            capturedAt: String(img.capturedAt || ''),
          })),
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
      setCapturedImages([])
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
      {/* Page Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          {step !== 'identification' && (
            <button
              type="button"
              aria-label="Voltar"
              onClick={() => {
                if (step === 'timer') setStep('identification')
                else if (step === 'review') setStep('timer')
                else if (step === 'report') setStep('review')
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 text-gray-700"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <span className="text-[22px] font-bold text-primary leading-tight">
            {t('reading.wizard.pageTitle')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="w-9 h-9 flex items-center justify-center text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="relative w-9 h-9 bg-primary rounded-full flex items-center justify-center">
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border border-primary text-primary text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <Stepper active={step} />

      {step === 'identification' && (
        <IdentificationStep
          value={draft.identification}
          onChange={(patch: Partial<NewReadingDraft["identification"]>) =>
            setDraft((prev) => ({ ...prev, identification: { ...prev.identification, ...patch } }))
          }
          onNext={() => setStep('timer')}
          paymentLinkStatus={paymentLinkStatus}
        />
      )}

      {step === 'timer' && (
        <TimerStep
          selectedSeconds={draft.timer.selectedSeconds}
          onChangeSelectedSeconds={(next: number) =>
            setDraft((prev) => ({ ...prev, timer: { ...prev.timer, selectedSeconds: next } }))
          }
          onBack={() => setStep('identification')}
          existingImages={existingCapturedImages}
          onAnalyzeAndProceed={(results: ReviewSelectionMap, rawApiResults, nextCapturedImages) => {
            const dummy = makeDummyAnalysis()
            setDraft((prev) => ({
              ...prev,
              timer: { ...prev.timer, analyzedAt: dummy.analyzedAt, analysis: dummy.analysis },
              reviewSelections: results
            }))
            setProcessSingleRawResults(Array.isArray(rawApiResults) ? rawApiResults : [])
            const imgs = Array.isArray(nextCapturedImages) ? nextCapturedImages : []
            setCapturedImages(imgs)
            setStep('review')
            if (draftId && imgs.length > 0) {
              fetch('/api/reading/save_draft_images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  draftId,
                  capturedImages: imgs.map((img) => ({
                    atSeconds: Number(img.atSeconds),
                    dataUrl: String(img.dataUrl || ''),
                    capturedAt: String(img.capturedAt || ''),
                  })),
                }),
              }).catch(() => { })
            }
          }}
          onNextWithExistingImages={() => {
            const dummy = makeDummyAnalysis()
            setDraft((prev) => ({
              ...prev,
              timer: { ...prev.timer, analyzedAt: dummy.analyzedAt, analysis: dummy.analysis },
            }))
            setStep('review')
          }}
          onImagesChange={(imgs) => {
            const id = draftId
            if (!id || imgs.length === 0) return
            fetch('/api/reading/save_draft_images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                draftId: id,
                capturedImages: imgs.map((img) => ({
                  atSeconds: Number(img.atSeconds),
                  dataUrl: String(img.dataUrl || ''),
                  capturedAt: String(img.capturedAt || ''),
                })),
              }),
            }).catch(() => { })
          }}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          selectedByKey={draft.reviewSelections}
          rawProcessSingleResults={processSingleRawResults}
          onChangeSelectedByKey={(next: NewReadingDraft["reviewSelections"]) =>
            setDraft((prev) => ({ ...prev, reviewSelections: next }))
          }
          onBack={() => setStep('timer')}
          onIssueReport={async (results: ReviewResultDraft[]) => {
            const panelType = String((draft.identification.panelProductCode || defaultPanelProductCode || '')).trim() || 'VETQ_MASTER_360'
            let nextInterpretation = ''
            let nextRecommendation = ''

            try {
              const res = await fetch('/api/strip/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  panel_type: panelType,
                  results,
                }),
              })
              const data = await res.json().catch(() => null)
              if (!res.ok) {
                throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`)
              }
              const extracted = extractPrimaryResultText(data)
              nextInterpretation = extracted.interpretation
              nextRecommendation = extracted.recommendation
            } catch {
              toast.info(t('reading.wizard.interpretationUnavailable'))
            }

            setDraft((prev) => ({
              ...prev,
              results,
              report: {
                ...prev.report,
                summaryAndInterpretation: nextInterpretation || prev.report.summaryAndInterpretation,
                otherInformation: nextRecommendation || prev.report.otherInformation,
              },
            }))
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
          reviewResults={draft.results}
          panelName={(() => {
            const code = (draft.identification.panelProductCode || defaultPanelProductCode || '').trim()
            return code || undefined
          })()}
          veterinarian={profile ? {
            fullName: profile.fullName,
            crmv: profile.crmv,
            crmvState: profile.crmvState,
            clinicLogoUrl: profile.clinicLogoUrl,
            tradeName: profile.tradeName,
            reportHeaderAddress: profile.reportHeaderAddress,
          } : undefined}
        />
      )}
    </div>
  )
}
