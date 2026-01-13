'use client'

import React, { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { ReadingResultItem, ReadingResultLevel } from './types'

type Props = {
  onBack: () => void
  onNext: () => void
}

function ResultRow({
  item,
  onChange,
}: {
  item: ReadingResultItem
  onChange: (level: ReadingResultLevel) => void
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">{item.label}</div>
        <div className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          {item.status}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 overflow-x-auto">
        {item.options.map((o) => {
          const active = item.selected === o.label
          return (
            <button
              key={o.label}
              onClick={() => onChange(o.label)}
              className={`min-w-[92px] px-3 py-2 rounded-xl border text-xs ${
                active ? 'border-primary bg-[#EBF2FF] text-primary' : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              <div className="font-semibold">{o.valueLabel}</div>
              <div className="mt-1">{o.label}</div>
            </button>
          )
        })}
        <div className="text-xs text-gray-500 whitespace-nowrap pl-2">{item.unit}</div>
      </div>
    </div>
  )
}

export default function ReviewStep({ onBack, onNext }: Props) {
  const [otherInfo, setOtherInfo] = useState('')

  const [items, setItems] = useState<ReadingResultItem[]>([
    {
      key: 'leukocytes',
      label: 'Leucócitos',
      unit: 'cells/µL',
      status: 'Normal',
      selected: 'Traces',
      options: [
        { label: 'Neg', valueLabel: 'Neg' },
        { label: 'Traces', valueLabel: '15' },
        { label: 'Low', valueLabel: '70' },
        { label: 'Moderate', valueLabel: '125' },
        { label: 'High', valueLabel: '500' },
      ],
    },
    {
      key: 'erythrocytes',
      label: 'Eritrócitos',
      unit: 'cells/µL',
      status: 'Normal',
      selected: 'Low',
      options: [
        { label: 'Neg', valueLabel: 'Neg' },
        { label: 'Traces', valueLabel: '4.5' },
        { label: 'Low', valueLabel: '5.5' },
        { label: 'Moderate', valueLabel: '6.5' },
        { label: 'High', valueLabel: '7.5' },
      ],
    },
    {
      key: 'glucose',
      label: 'Glicose',
      unit: 'mg/dL',
      status: 'Normal',
      selected: 'Moderate',
      options: [
        { label: 'Neg', valueLabel: 'Neg' },
        { label: 'Traces', valueLabel: '70' },
        { label: 'Low', valueLabel: '100' },
        { label: 'Moderate', valueLabel: '130' },
        { label: 'High', valueLabel: '180' },
      ],
    },
  ])

  const canProceed = useMemo(() => items.length > 0, [items.length])

  return (
    <div className="">
      <h2 className="text-lg font-medium text-gray-900">Review Of The Results</h2>
      <p className="text-sm text-tertiary">Adjust the results, add observations and proceed to issue the report.</p>

      <div className="mt-6 space-y-3">
        {items.map((it) => (
          <ResultRow
            key={it.key}
            item={it}
            onChange={(lvl) => {
              setItems((prev) => prev.map((p) => (p.key === it.key ? { ...p, selected: lvl } : p)))
            }}
          />
        ))}
      </div>

      <div className="mt-6">
        <div className="text-sm text-gray-900 mb-2">Other Information</div>
        <textarea
          value={otherInfo}
          onChange={(e) => setOtherInfo(e.target.value)}
          placeholder="Enter any other info"
          rows={4}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 resize-none"
        />
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="w-full py-4 rounded-full bg-primary text-white font-medium disabled:opacity-60"
        >
          Issue Report
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          Go Back
        </button>
      </div>
    </div>
  )
}