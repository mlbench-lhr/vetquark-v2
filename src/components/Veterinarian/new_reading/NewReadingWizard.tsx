'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Stepper from './Stepper'
import { NewReadingDraft, NewReadingStep, ReviewResultDraft } from './types'
import IdentificationStep from './IdentificationStep'
import TimerStep from './TimerStep'
import ReviewStep from './ReviewStep'
import ReportStep from './ReportStep'
import { toast } from 'react-toastify'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function NewReadingWizard() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<NewReadingStep>('identification')
  const [submitting, setSubmitting] = useState(false)

  const [draft, setDraft] = useState<NewReadingDraft>(() => ({
    identification: {
      patientId: '',
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

  const [patientPreview, setPatientPreview] = useState<{
    animalName: string
    breed: string
    species: string
    guardianName: string
  } | null>(null)

  const patientIdFromQuery = useMemo(() => (searchParams.get('patientId') || '').trim(), [searchParams])

  useEffect(() => {
    if (!patientIdFromQuery) return
    setDraft((prev) => ({
      ...prev,
      identification: { ...prev.identification, patientId: patientIdFromQuery },
    }))
  }, [patientIdFromQuery])

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

  const canSubmit = useMemo(() => {
    const i = draft.identification
    return !!i.patientId && !!i.collectionMethod && !!i.collectionAt && !!i.stripLot && !!i.stripExpiry && !!draft.timer.analysis && draft.results.length > 0
  }, [draft.identification, draft.timer.analysis, draft.results.length])

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
      toast.error("Please complete all steps before signing.")
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch("/api/reading/new_reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: draft.identification.patientId,
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
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Failed to save reading")
        return
      }
      toast.success("Reading saved successfully")
      setDraft((prev) => ({
        ...prev,
        identification: { patientId: "", collectionMethod: "", collectionAt: "", stripLot: "", stripExpiry: "" },
        timer: { selectedSeconds: 45, analyzedAt: "", analysis: null },
        reviewSelections: {},
        results: [],
        report: { summaryAndInterpretation: "", otherInformation: "", veterinarianNotes: "" },
      }))
      setStep("identification")
    } catch {
      toast.error("Network error while saving reading")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-medium">New Urine Test</div>
        <Link href={"/Veterinarian/notifications"} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <Image src={"/images/home/bell.svg"} alt="Bell icon" width={24} height={24} />
        </Link>
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
          onAnalyzeAndProceed={() => {
            const dummy = makeDummyAnalysis()
            setDraft((prev) => ({ ...prev, timer: { ...prev.timer, analyzedAt: dummy.analyzedAt, analysis: dummy.analysis } }))
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
          submitting={submitting}
        />
      )}
    </div>
  )
}
