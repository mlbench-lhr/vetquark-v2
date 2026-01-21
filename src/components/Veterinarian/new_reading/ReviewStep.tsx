'use client'

import React, { useEffect, useMemo } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { ReviewResultDraft, ReviewSelectionMap } from './types'

type Props = {
  selectedByKey: ReviewSelectionMap
  onChangeSelectedByKey: (next: ReviewSelectionMap) => void
  onBack: () => void
  onIssueReport: (results: ReviewResultDraft[]) => void
}

type ResultStatus = 'Normal' | 'Abnormal'

type DotOption = {
  topLabel: string
  color: string
}

type ResultRowConfig = {
  key: string
  label: string
  status: ResultStatus
  unit: string
  options: DotOption[]
  defaultIndex: number
}

const RESULT_ROWS: ResultRowConfig[] = [
  {
    key: 'leukocytes',
    label: 'Leukocytes',
    status: 'Normal',
    unit: 'cells/µL',
    defaultIndex: 2,
    options: [
      { topLabel: 'Neg', color: '#E9D5FF' },
      { topLabel: '15', color: '#D8B4FE' },
      { topLabel: '70', color: '#C084FC' },
      { topLabel: '125', color: '#A855F7' },
      { topLabel: '500', color: '#7E22CE' },
    ],
  },
  {
    key: 'nitrite',
    label: 'Nitrite',
    status: 'Normal',
    unit: '',
    defaultIndex: 1,
    options: [
      { topLabel: 'Neg', color: '#FBCFE8' },
      { topLabel: 'Pos', color: '#EC4899' },
    ],
  },
  {
    key: 'urobilinogen',
    label: 'Urobilinogen',
    status: 'Normal',
    unit: 'µmol/L',
    defaultIndex: 2,
    options: [
      { topLabel: '0.1', color: '#FCE7F3' },
      { topLabel: '1', color: '#FBCFE8' },
      { topLabel: '2', color: '#F9A8D4' },
      { topLabel: '4', color: '#F472B6' },
      { topLabel: '8', color: '#EC4899' },
    ],
  },
  {
    key: 'protein',
    label: 'Protein',
    status: 'Normal',
    unit: 'g/L',
    defaultIndex: 2,
    options: [
      { topLabel: 'Neg', color: '#FEF9C3' },
      { topLabel: '0.3', color: '#FDE68A' },
      { topLabel: '1.0', color: '#FCD34D' },
      { topLabel: '3.0', color: '#A7F3D0' },
      { topLabel: '10.0', color: '#34D399' },
    ],
  },
  {
    key: 'ph',
    label: 'pH',
    status: 'Abnormal',
    unit: '',
    defaultIndex: 0,
    options: [
      { topLabel: '5.0', color: '#F59E0B' },
      { topLabel: '6.0', color: '#FBBF24' },
      { topLabel: '6.5', color: '#A3E635' },
      { topLabel: '7.0', color: '#22C55E' },
      { topLabel: '8.5', color: '#16A34A' },
    ],
  },
  {
    key: 'blood',
    label: 'Blood',
    status: 'Normal',
    unit: 'cells/µL',
    defaultIndex: 2,
    options: [
      { topLabel: 'Neg', color: '#DCFCE7' },
      { topLabel: '10', color: '#BBF7D0' },
      { topLabel: '80', color: '#86EFAC' },
      { topLabel: '200', color: '#4ADE80' },
      { topLabel: '250', color: '#16A34A' },
    ],
  },
  {
    key: 'specific-gravity',
    label: 'Specific Gravity',
    status: 'Abnormal',
    unit: '',
    defaultIndex: 0,
    options: [
      { topLabel: '1.000', color: '#FEF9C3' },
      { topLabel: '1.005', color: '#FDE68A' },
      { topLabel: '1.010', color: '#FCD34D' },
      { topLabel: '1.020', color: '#F59E0B' },
      { topLabel: '1.030', color: '#B45309' },
    ],
  },
  {
    key: 'ascorbic-acid',
    label: 'Ascorbic Acid',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 0,
    options: [
      { topLabel: '0', color: '#CFFAFE' },
      { topLabel: '10', color: '#A5F3FC' },
      { topLabel: '20', color: '#67E8F9' },
      { topLabel: '40', color: '#22D3EE' },
      { topLabel: '80', color: '#0891B2' },
    ],
  },
  {
    key: 'ketone-bodies',
    label: 'Ketone Bodies',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 1,
    options: [
      { topLabel: 'Neg', color: '#FFEDD5' },
      { topLabel: '0.5', color: '#FED7AA' },
      { topLabel: '1.5', color: '#FBCFE8' },
      { topLabel: '4.0', color: '#D8B4FE' },
      { topLabel: '8.0', color: '#7C3AED' },
    ],
  },
  {
    key: 'bilirubin',
    label: 'Bilirubin',
    status: 'Normal',
    unit: 'µmol/L',
    defaultIndex: 1,
    options: [
      { topLabel: 'Neg', color: '#FCE7F3' },
      { topLabel: '17', color: '#FBCFE8' },
      { topLabel: '50', color: '#F9A8D4' },
      { topLabel: '100', color: '#F472B6' },
      { topLabel: '250', color: '#DB2777' },
    ],
  },
  {
    key: 'glucose',
    label: 'Glucose',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 2,
    options: [
      { topLabel: 'Neg', color: '#DCFCE7' },
      { topLabel: '2.8', color: '#BBF7D0' },
      { topLabel: '5.6', color: '#86EFAC' },
      { topLabel: '14', color: '#4ADE80' },
      { topLabel: '55', color: '#16A34A' },
    ],
  },
  {
    key: 'microalbumin',
    label: 'Microalbumin',
    status: 'Normal',
    unit: 'g/L',
    defaultIndex: 0,
    options: [
      { topLabel: '0', color: '#ECFEFF' },
      { topLabel: '0.3', color: '#CFFAFE' },
      { topLabel: '1.0', color: '#A5F3FC' },
      { topLabel: '3.0', color: '#67E8F9' },
      { topLabel: '15', color: '#22D3EE' },
    ],
  },
  {
    key: 'creatinine',
    label: 'Creatinine',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 1,
    options: [
      { topLabel: '0', color: '#FEF9C3' },
      { topLabel: '0.3', color: '#FDE68A' },
      { topLabel: '1.0', color: '#FCD34D' },
      { topLabel: '3.0', color: '#F59E0B' },
      { topLabel: '10', color: '#B45309' },
    ],
  },
  {
    key: 'calcium',
    label: 'Calcium',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 1,
    options: [
      { topLabel: '0', color: '#BFDBFE' },
      { topLabel: '2.5', color: '#93C5FD' },
      { topLabel: '7.5', color: '#60A5FA' },
      { topLabel: '15', color: '#6366F1' },
      { topLabel: '25', color: '#4338CA' },
    ],
  },
  {
    key: 'magnesium',
    label: 'Magnesium',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 2,
    options: [
      { topLabel: '0', color: '#DBEAFE' },
      { topLabel: '1.5', color: '#93C5FD' },
      { topLabel: '3.0', color: '#3B82F6' },
      { topLabel: '6.0', color: '#1D4ED8' },
      { topLabel: '15', color: '#7C3AED' },
    ],
  },
  {
    key: 'ammonium-chloride',
    label: 'Ammonium Chloride',
    status: 'Normal',
    unit: 'mg/L',
    defaultIndex: 0,
    options: [
      { topLabel: '0', color: '#F3F4F6' },
      { topLabel: '50', color: '#E5E7EB' },
      { topLabel: '100', color: '#D1D5DB' },
      { topLabel: '200', color: '#9CA3AF' },
      { topLabel: '300', color: '#6B7280' },
    ],
  },
]

function StatusPill({ status }: { status: ResultStatus }) {
  const isNormal = status === 'Normal'
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] leading-[12px] font-medium ${isNormal ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FFF7ED] text-[#F97316]'
        }`}
    >
      {isNormal ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {status}
    </div>
  )
}

function ResultRow({
  row,
  selectedIndex,
  onSelect,
}: {
  row: ResultRowConfig
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  const cols = row.options.length
  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div className="text-[14px] leading-[18px] font-medium text-[#111827]">{row.label}</div>
        <StatusPill status={row.status} />
      </div>

      <div
        className="mt-3 grid gap-0"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {row.options.map((opt, idx) => {
          const active = idx === selectedIndex
          return (
            <div key={`${row.key}-${idx}`} className="flex flex-col items-center">
              <div className="text-[10px] leading-[12px] text-[#9CA3AF]">{opt.topLabel}</div>
              <button
                type="button"
                onClick={() => onSelect(idx)}
                className={`mt-2 h-6 w-6 rounded-full ${active ? 'shadow-sm shadow-black' : ''}`}
                style={{ backgroundColor: opt.color }}
              />
            </div>
          )
        })}
      </div>

      {row.unit ? (
        <div className="mt-2 flex justify-end text-[10px] leading-[12px] text-[#9CA3AF]">{row.unit}</div>
      ) : null}
    </div>
  )
}

function parseNumericValueLabel(valueLabel: string): number | undefined {
  const trimmed = valueLabel.trim()
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

export default function ReviewStep({ selectedByKey, onChangeSelectedByKey, onBack, onIssueReport }: Props) {
  useEffect(() => {
    if (Object.keys(selectedByKey).length > 0) return
    const defaults: ReviewSelectionMap = Object.fromEntries(RESULT_ROWS.map((r) => [r.key, r.defaultIndex]))
    onChangeSelectedByKey(defaults)
  }, [onChangeSelectedByKey, selectedByKey])

  const canProceed = useMemo(() => RESULT_ROWS.length > 0, [])

  return (
    <div className="">
      <h2 className="text-[18px] leading-[24px] font-semibold text-[#111827]">Review Of The Results</h2>
      <p className="mt-1 text-[13px] leading-[18px] text-[#6B7280]">
        Adjust the results, add observations and proceed to issue the report.
      </p>

      <div className="mt-5 divide-y divide-[#E5E7EB]">
        {RESULT_ROWS.map((row) => (
          <ResultRow
            key={row.key}
            row={row}
            selectedIndex={selectedByKey[row.key] ?? row.defaultIndex}
            onSelect={(idx) => onChangeSelectedByKey({ ...selectedByKey, [row.key]: idx })}
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={() => {
            const results: ReviewResultDraft[] = RESULT_ROWS.map((row) => {
              const selectedIndex = selectedByKey[row.key] ?? row.defaultIndex
              const opt = row.options[selectedIndex]
              const valueLabel = opt ? opt.topLabel : row.options[row.defaultIndex]?.topLabel ?? ""
              const numericValue = parseNumericValueLabel(valueLabel)
              return {
                key: row.key,
                label: row.label,
                unit: row.unit,
                status: row.status,
                selectedIndex,
                valueLabel,
                ...(numericValue === undefined ? {} : { numericValue }),
              }
            })
            onIssueReport(results)
          }}
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
