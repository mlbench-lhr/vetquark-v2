'use client'

import React from 'react'
import { CreditCard, FileText, Timer, User } from 'lucide-react'
import { NewReadingStep } from './types'

type Props = {
  active: NewReadingStep
}

const steps: Array<{ key: NewReadingStep; label: string; Icon: React.ElementType }> = [
  { key: 'identification', label: 'Identification', Icon: User },
  { key: 'timer', label: 'Timer', Icon: Timer },
  { key: 'review', label: 'Review', Icon: CreditCard },
  { key: 'report', label: 'Report', Icon: FileText },
]

export default function Stepper({ active }: Props) {
  const activeIndex = steps.findIndex((s) => s.key === active)

  return (
    <div className="w-full px-1">
      {/* Icons and connector lines */}
      <div className="flex items-center relative gap-1">
        {steps.map((s, idx) => {
          const isActive = idx === activeIndex
          const isDone = idx < activeIndex
          const iconColor = isActive || isDone ? 'text-blue-600' : 'text-gray-400'
          const bgColor = isActive || isDone ? 'bg-blue-100' : 'bg-gray-200'
          
          return (
            <React.Fragment key={s.key}>
              <div className="flex justify-center" style={{ width: '48px' }}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor}`}>
                  <s.Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
              </div>
              
              {idx !== steps.length - 1 && (
                <div className={`h-0.5 flex-1 ${idx < activeIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
      
      {/* Labels */}
      <div className='flex items-center relative'>
        {steps.map((s, idx) => {
          const isActive = idx === activeIndex
          const textColor = isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
          
          return (
            <React.Fragment key={s.key}>
              <div className="flex justify-center" style={{ width: '48px' }}>
                <div className={`mt-3 text-sm ${textColor} whitespace-nowrap text-center`}>{s.label}</div>
              </div>
              {idx !== steps.length - 1 && <div className="flex-1"></div>}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
