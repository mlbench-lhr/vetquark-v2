'use client'

import React from 'react'
import { Camera, Check, FileText, Timer, User } from 'lucide-react'
import { NewReadingStep } from './types'
import { useTranslation } from 'react-i18next'

type Props = {
  active: NewReadingStep
  mode?: 'urine' | 'image'
}

function IdentificationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 9v4l2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ReviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 6h8M8 10h5M8 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="3" fill="currentColor" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const stepIcons: Record<NewReadingStep, React.ElementType> = {
  identification: IdentificationIcon,
  timer: TimerIcon,
  review: ReviewIcon,
  report: ReportIcon,
  image_capture: CameraIcon,
  image_result: FileText,
}

export default function Stepper({ active, mode = 'urine' }: Props) {
  const { t } = useTranslation()
  const steps: Array<{ key: NewReadingStep; label: string; Icon: React.ElementType }> = mode === 'urine' ? [
    { key: 'identification', label: t('reading.steps.identification'), Icon: stepIcons.identification },
    { key: 'timer', label: t('reading.steps.timer'), Icon: stepIcons.timer },
    { key: 'review', label: t('reading.steps.review'), Icon: stepIcons.review },
    { key: 'report', label: t('reading.steps.report'), Icon: stepIcons.report },
  ] : [
    { key: 'identification', label: t('reading.steps.identification'), Icon: stepIcons.identification },
    { key: 'image_capture', label: t('reading.steps.capture'), Icon: stepIcons.image_capture },
    { key: 'image_result', label: t('reading.steps.result'), Icon: stepIcons.image_result },
  ]
  const activeIndex = steps.findIndex((s) => s.key === active)

  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((s, idx) => {
          const isActive = idx === activeIndex
          const isDone = idx < activeIndex

          return (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isDone
                    ? 'bg-primary'
                    : isActive
                      ? 'bg-white border border-primary'
                      : 'bg-white border border-[#D1D5DB]'
                    }`}
                >
                  {isDone ? (
                    <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                  ) : (
                    <s.Icon
                      className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-[#9CA3AF]'}`}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] leading-[12px] whitespace-nowrap font-medium ${isActive ? 'text-black/70' : isDone ? 'text-primary' : 'text-[#9CA3AF]'
                    }`}
                >
                  {s.label}
                </span>
              </div>

              {idx !== steps.length - 1 && (
                <div
                  className={`h-[2px] flex-1 mb-4 mx-1 rounded-full transition-all ${idx < activeIndex ? 'bg-primary' : 'bg-[#E5E7EB]'
                    }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
