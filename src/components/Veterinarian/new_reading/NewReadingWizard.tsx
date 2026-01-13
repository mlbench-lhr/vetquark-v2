'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Stepper from './Stepper'
import { NewReadingStep } from './types'
import IdentificationStep from './IdentificationStep'
import TimerStep from './TimerStep'
import ReviewStep from './ReviewStep'
import ReportStep from './ReportStep'

export default function NewReadingWizard() {
  const [step, setStep] = useState<NewReadingStep>('identification')

  return (
    <div className="min-h-screen p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-medium">New Urine Test</div>
        <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <Image src={"/images/home/bell.svg"} alt="Bell icon" width={24} height={24} />
        </button>
      </div>

      <Stepper active={step} />

      {step === 'identification' && (
        <IdentificationStep onNext={() => setStep('timer')} />
      )}

      {step === 'timer' && (
        <TimerStep onBack={() => setStep('identification')} onNext={() => setStep('review')} />
      )}

      {step === 'review' && (
        <ReviewStep onBack={() => setStep('timer')} onNext={() => setStep('report')} />
      )}

      {step === 'report' && (
        <ReportStep onBack={() => setStep('review')} onComplete={() => setStep('identification')} />
      )}
    </div>
  )
}