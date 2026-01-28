'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Pencil, X } from 'lucide-react'
import { ReviewResultDraft, ReviewSelectionMap } from './types'
import { useTranslation } from 'react-i18next'

type Props = {
  selectedByKey: ReviewSelectionMap
  onChangeSelectedByKey: (next: ReviewSelectionMap) => void
  onBack: () => void
  onIssueReport: (results: ReviewResultDraft[]) => void
}

type ResultStatus = 'Normal' | 'Abnormal'

type DotOption = {
  topLabel: string
  topSubLabel?: string
  bottomLabel?: string
  color: string
}

type ResultRowConfig = {
  key: string
  label: string
  status: ResultStatus
  unit: string
  subUnit?: string
  options: DotOption[]
  defaultIndex: number
}

export const RESULT_ROWS: ResultRowConfig[] = [
  {
    key: 'leukocytes',
    label: 'Leukocytes',
    status: 'Normal',
    unit: 'cells/µL',
    defaultIndex: 2,
    options: [
      { topLabel: 'Neg', color: 'white' },
      { topLabel: '15', color: '#CC93BA', bottomLabel: "Trace" },
      { topLabel: '70', color: '#966D94', bottomLabel: "Low" },
      { topLabel: '125', color: '#8F678C', bottomLabel: "Moderate" },
      { topLabel: '500', color: '#845883', bottomLabel: "High" },
    ],
  },
  {
    key: 'nitrite',
    label: 'Nitrite',
    status: 'Normal',
    unit: '',
    defaultIndex: 1,
    options: [
      { topLabel: 'Neg', color: 'white' },
      { topLabel: 'Positive', color: '#E780AF' },
    ],
  },
  {
    key: 'urobilinogen',
    label: 'Urobilinogen',
    status: 'Normal',
    unit: 'µmol/L',
    defaultIndex: 2,
    options: [
      { topLabel: '3.3', color: '#FBE8D4' },
      { topLabel: '16', color: '#F8D5CA' },
      { topLabel: '33++', color: '#F6CECE' },
      { topLabel: '66++', color: '#F3BAC3' },
      { topLabel: '131+++', color: '#EE9FA4' },
    ],
  },
  {
    key: 'protein',
    label: 'Protein',
    status: 'Normal',
    unit: 'g/L',
    defaultIndex: 2,
    options: [
      { topLabel: 'Neg', color: '#FFF6AD' },
      { topLabel: 'Trace±', color: '#F5F2AC' },
      { topLabel: '0.3+', color: '#E5EAAC' },
      { topLabel: '1.0++', color: '#C1DDBC' },
      { topLabel: '3.0+++', color: '#9BCEC2' },
      { topLabel: '≥10.0++++', color: '#7DBBBF' },
    ],
  },
  {
    key: 'ph',
    label: 'pH',
    status: 'Abnormal',
    unit: '',
    defaultIndex: 0,
    options: [
      { topLabel: '5.0', color: '#F6B641' },
      { topLabel: '6.0', color: '#F9C551' },
      { topLabel: '6.5', color: '#FCD469' },
      { topLabel: '7.0', color: '#EDD56B' },
      { topLabel: '7.5', color: '#C3C474' },
      { topLabel: '8.0', color: '#B0B872' },
      { topLabel: '8.5', color: '#8FA971' },
    ],
  },
  {
    key: 'blood',
    label: 'Blood',
    status: 'Normal',
    unit: 'cells/µL',
    defaultIndex: 2,
    options: [
      { topLabel: 'Neg', color: '#F9CD8A' },
      { topLabel: '0', color: '#CFC69D' },
      { topLabel: '10', color: '#B0B99B' },
      { topLabel: '25', color: '#708E85' },
      { topLabel: '80', color: '#5C8075' },
      { topLabel: '200', color: '#336F73' },
    ],
  },
  {
    key: 'specific-gravity',
    label: 'Specific Gravity',
    status: 'Abnormal',
    unit: '',
    defaultIndex: 0,
    options: [
      { topLabel: '1.000', color: '#3C7F9D' },
      { topLabel: '1.005', color: '#899264' },
      { topLabel: '1.010', color: '#AAA661' },
      { topLabel: '1.015', color: '#B9B062' },
      { topLabel: '1.020', color: '#C9B64F' },
      { topLabel: '1.025', color: '#D3B94F' },
      { topLabel: '1.030', color: '#DAB54C' },
    ],
  },
  {
    key: 'ascorbic-acid',
    label: 'Ascorbic Acid',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 0,
    options: [
      { topLabel: '0', color: '#0098BF' },
      { topLabel: '0.6', color: '#6FB6CD' },
      { topLabel: '1.4', color: '#A7D2D8' },
      { topLabel: '2.8', color: '#D3E4D4' },
      { topLabel: '5.6', color: '#FDFAD4' },
    ],
  },
  {
    key: 'ketone-bodies',
    label: 'Ketone Bodies',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 1,
    options: [
      { topLabel: 'Neg', color: '#FAE0C7' },
      { topLabel: '0.5', bottomLabel: "Trace", color: '#F5C7BD' },
      { topLabel: '4.0', bottomLabel: "Moderate", color: '#DC99A2' },
      { topLabel: '8.0', bottomLabel: "High", color: '#C9728E' },
      { topLabel: '16', color: '#861459' },
    ],
  },
  {
    key: 'bilirubin',
    label: 'Bilirubin',
    status: 'Normal',
    unit: 'µmol/L',
    defaultIndex: 1,
    options: [
      { topLabel: 'Neg', color: 'white' },
      { topLabel: '17', color: '#F8DFEC' },
      { topLabel: '50', color: '#EFAFCE' },
      { topLabel: '100', color: '#E780AF' },
    ],
  },
  {
    key: 'glucose',
    label: 'Glucose',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 2,
    options: [
      { topLabel: 'Neg', color: '#B4DDE7' },
      { topLabel: '2.8', color: '#ADD4BA' },
      { topLabel: '5.6', color: '#BDDAB2' },
      { topLabel: '14++', color: '#C3DAA0' },
      { topLabel: '28++', color: '#CED292' },
      { topLabel: '56+++', color: '#BFA471' },
    ],
  },
  {
    key: 'microalbumin',
    label: 'Microalbumin',
    status: 'Normal',
    unit: 'g/L',
    defaultIndex: 0,
    options: [
      { topLabel: '0', color: '#CCE6E2' },
      { topLabel: '0.03', color: '#B4DCDF' },
      { topLabel: '0.08', color: '#9AD1DC' },
      { topLabel: '0.15', color: '#7FC7D9' },
    ],
  },
  {
    key: 'creatine',
    label: 'Creatine',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 1,
    options: [
      { topLabel: '0.9', color: '#E9DF9D' },
      { topLabel: '4.4', color: '#D4D39A' },
      { topLabel: '8.8', color: '#BDC597' },
      { topLabel: '17.7', color: '#AABD96' },
      { topLabel: '26.5', color: '#9EB995' },
    ],
  },
  {
    key: 'calcium',
    label: 'Calcium',
    status: 'Normal',
    unit: 'mmol/L',
    defaultIndex: 1,
    options: [
      { topLabel: '0', color: '#A7C5D9' },
      { topLabel: '2.5', color: '#919FC7' },
      { topLabel: '7.5', color: '#7679AE' },
      { topLabel: '15', color: '#828BBA' },
    ],
  },
  {
    key: 'magnesium',
    label: 'Magnesium',
    status: 'Normal',
    unit: 'mg/dL',
    subUnit: 'mmol/L',
    defaultIndex: 2,
    options: [
      { topLabel: '0', topSubLabel: '0', color: '#0077AB' },
      { topLabel: '1.5', topSubLabel: "0.625", color: '#4378A8' },
      { topLabel: '6.0', topSubLabel: "1.25", color: '#45669B' },
      { topLabel: '3.0', topSubLabel: "2.5", color: '#78578D' },
      { topLabel: '15', topSubLabel: "5", color: '#A85288' },
      { topLabel: '15', topSubLabel: "10", color: '#B6558A' },
    ],
  },
  {
    key: 'ammonium-chloride',
    label: 'Ammonium Chloride',
    status: 'Normal',
    unit: 'mg/L',
    subUnit: 'g/L',
    defaultIndex: 0,
    options: [
      { topLabel: '0', topSubLabel: '0', color: '#FFF' },
      { topLabel: '50', topSubLabel: '0.5', color: '#EEE' },
      { topLabel: '100', topSubLabel: '1.0', color: '#DDD' },
      { topLabel: '150', topSubLabel: '1.5', color: '#CCC' },
      { topLabel: '200', topSubLabel: '2.0', color: '#BBB' },
      { topLabel: '250', topSubLabel: '2.5', color: '#AAA' },
      { topLabel: '300', topSubLabel: '3.0', color: '#999' },
    ],
  },
]

function StatusPill({ status }: { status: ResultStatus }) {
  const { t } = useTranslation()
  const isNormal = status === 'Normal'
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] leading-[12px] font-medium ${isNormal ? 'bg-[#ECFDF5] text-[#059669] border border-[#D0FAE5]' : 'bg-[#FFF7ED] text-[#BB4D00] border border-[#FEF3C6]'
        }`}
    >
      {isNormal ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {isNormal ? t('reading.review.statusNormal') : t('reading.review.statusAbnormal')}
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
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const handleStartEdit = () => {
    setPrevIndex(selectedIndex)
    setEditing(true)
  }
  const handleCancel = () => {
    if (prevIndex != null) onSelect(prevIndex)
    setEditing(false)
    setPrevIndex(null)
  }
  const handleSave = () => {
    setEditing(false)
    setPrevIndex(null)
  }
  const cols = row.unit ? row.options.length + 1 : row.options.length
  return (
    <div className={`py-4 px-3 ${editing ? 'bg-[#F5F6F6] rounded-xl' : ''}`}>
      <div className="flex items-center opa justify-between">
        <div className="text-[14px] leading-[18px] font-medium text-[#111827]">{row.label}</div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <span className='text-xs text-muted-foreground me-1'>
                {t('reading.review.selectValue')}
              </span>
              <button
                type="button"
                className="p-1 rounded-full border text-gray-700"
                onClick={handleCancel}
                aria-label={t('common.cancel')}
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-1 rounded-full bg-primary text-white"
                onClick={handleSave}
                aria-label={t('common.save')}
              >
                <Check className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="p-1 text-primary text-[12px] leading-[14px]"
              onClick={handleStartEdit}
            >
              <Pencil size={14} />
            </button>
          )}
          <StatusPill status={row.status} />
        </div>
      </div>

      <div
        className="mt-3 grid gap-"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {row.options.map((opt, idx) => {
          const active = idx === selectedIndex
          return (
            <div key={`${row.key}-${idx}`} className="flex flex-col items-center justify-start">
              <div className="text-[10px] leading-[12px] text-[#9CA3AF]">{opt.topLabel}</div>
              {
                opt.topSubLabel &&
                <div className={`text-[8px] leading-[8px] ${opt.topSubLabel === "0" ? "text-transparent" : "text-[#839297]"}`}>({opt.topSubLabel})</div>
              }
              <div
                className={`mt-2 h-7 ${opt.topLabel === "Positive" ? " w-[200px] " : " w-7 "} relative rounded-full ${opt.topLabel === "Neg" ? "border" : ""} ${active ? 'border-2 border-primary ring-2 ring-primary ring-offset-2 ring-offset-white shadow-theme-xs scale-[1.03] transition-transform' : ''} ${editing ? 'cursor-pointer' : ''}`}
                style={{ background: opt.topLabel === "Positive" ? "linear-gradient(180deg, #F7E9EE 0%, #E780AF 100%)" : opt.color }}
                onClick={() => {
                  if (!editing) return
                  onSelect(idx)
                }}
              >
                {
                  opt.topLabel === "Positive" &&
                  <div className='text-[10px] flex justify-center text-white items-center text-center leading-[10px] h-full' >
                    {t('reading.review.uniformPinkNote')}
                  </div>
                }
                {active && (
                  opt.topLabel === "Positive" ? (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className={`h-3 w-3 ${opt.topLabel === 'Neg' ? 'text-primary' : 'text-white'}`} />
                    </div>
                  )
                )}
              </div>
              {
                opt.bottomLabel &&
                <div className="text-[10px] leading-[12px] text-[#9CA3AF] mt-1">{opt.bottomLabel}</div>
              }
            </div>
          )
        })}
        {row.unit ?
          <div className="border-l mt-2 flex justify-end gap-1 items-center pb-2 flex-col text-[10px] leading-[12px] text-[#9CA3AF]">{row.unit}
            {row.subUnit && (
              <div className="text-[8px] leading-[10px] text-[#9CA3AF]">({row.subUnit})
              </div>
            )}
          </div>
          : null}
      </div>


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
  const { t } = useTranslation()
  useEffect(() => {
    if (Object.keys(selectedByKey).length > 0) return
    const defaults: ReviewSelectionMap = Object.fromEntries(RESULT_ROWS.map((r) => [r.key, r.defaultIndex]))
    onChangeSelectedByKey(defaults)
  }, [onChangeSelectedByKey, selectedByKey])

  const canProceed = useMemo(() => RESULT_ROWS.length > 0, [])

  return (
    <div className="">
      <h2 className="text-[18px] leading-[24px] font-semibold text-[#111827]">{t('reading.review.title')}</h2>
      <p className="mt-1 text-[13px] leading-[18px] text-[#6B7280]">
        {t('reading.review.desc')}
      </p>

      <div className="mt-5 divide-y divide-[#F1F5F9] border border-[#F1F5F9] rounded-[16px] shadow-2xs">
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
          {t('reading.review.issueReport')}
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
