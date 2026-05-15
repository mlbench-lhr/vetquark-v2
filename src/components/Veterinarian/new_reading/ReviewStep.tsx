'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Pencil, X } from 'lucide-react'
import { ReviewResultDraft, ReviewSelectionMap } from './types'
import { useTranslation } from 'react-i18next'
import { translateUrinalysisParameterLabel } from '@/lib/urinalysisParameters'

type Props = {
  selectedByKey: ReviewSelectionMap
  rawProcessSingleResults?: Array<{ atSeconds: number; time: string; response: any }>
  onChangeSelectedByKey: (next: ReviewSelectionMap) => void
  onBack: () => void
  onIssueReport: (results: ReviewResultDraft[]) => void
  visibleKeys?: string[]
}

type ResultStatus = 'Normal' | 'Abnormal'

type NormalRule =
  | { type: 'range'; low: number; high: number }
  | { type: 'exact'; value: number }
  | { type: 'negative' }
  | { type: 'lt'; value: number }
  | { type: 'gt'; value: number }

function parseNumericLoose(valueLabel: string): number | undefined {
  const cleaned = String(valueLabel || '').replace(/[^\d.\-]/g, '')
  if (!cleaned) return undefined
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function numericValueFromLabel(key: string, label: string): number | undefined {
  if (key === 'protein' && /trace/i.test(label)) return 0
  return parseNumericLoose(label)
}

function isNormalByRule(ruleByKey: Record<string, NormalRule | undefined>, key: string, valueLabel: string, numeric?: number): boolean {
  const rule = ruleByKey[key]
  if (!rule) return false
  if (rule.type === 'negative') {
    const v = String(valueLabel || '').toLowerCase()
    return v === 'neg' || v === 'negative'
  }
  if (rule.type === 'exact') {
    if (numeric == null) {
      const n = parseNumericLoose(valueLabel)
      return n != null && Math.abs(n - rule.value) < 1e-6
    }
    return Math.abs(numeric - rule.value) < 1e-6
  }
  if (rule.type === 'lt') {
    const n = numeric ?? parseNumericLoose(valueLabel)
    return n != null && n < rule.value
  }
  if (rule.type === 'gt') {
    const n = numeric ?? parseNumericLoose(valueLabel)
    return n != null && n > rule.value
  }
  if (rule.type === 'range') {
    const n = numeric ?? parseNumericLoose(valueLabel)
    if (n == null) {
      if (/trace/i.test(valueLabel)) return true
      return false
    }
    return n >= rule.low && n <= rule.high
  }
  return false
}

type DotOption = {
  topLabel: string
  topLabelKey?: string
  topSubLabel?: string
  bottomLabel?: string
  bottomLabelKey?: string
  color: string
  showStain?: boolean
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
      { topLabel: '15', color: '#CC93BA', bottomLabelKey: 'reading.review.optionLabels.trace' },
      { topLabel: '70', color: '#966D94', bottomLabelKey: 'reading.review.optionLabels.low' },
      { topLabel: '125', color: '#8F678C', bottomLabelKey: 'reading.review.optionLabels.moderate' },
      { topLabel: '500', color: '#845883', bottomLabelKey: 'reading.review.optionLabels.high' },
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
      { topLabel: 'Positive', topLabelKey: 'reading.review.positiveLabel', color: '#E780AF' },
    ],
  },
  {
    key: 'urobilinogen',
    label: 'Urobilinogen',
    status: 'Normal',
    unit: 'µmol/L',
    defaultIndex: 2,
    options: [
      { topLabel: 'normal', color: '#FBE8D4' },
      { topLabel: '16', color: '#F8D5CA' },
      { topLabel: '33+', color: '#F6CECE' },
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
      { topLabel: '10', color: '#CFC69D', bottomLabelKey: 'reading.review.optionLabels.nonHemolyzed', showStain: true },
      { topLabel: '10', color: '#B0B99B', bottomLabelKey: 'reading.review.optionLabels.hemolyzed' },
      { topLabel: '25', color: '#708E85', bottomLabelKey: 'reading.review.optionLabels.low' },
      { topLabel: '80', color: '#5C8075', bottomLabelKey: 'reading.review.optionLabels.moderate' },
      { topLabel: '200', color: '#336F73', bottomLabelKey: 'reading.review.optionLabels.high' },
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
      { topLabel: '0.5', bottomLabelKey: 'reading.review.optionLabels.trace', color: '#F5C7BD' },
      { topLabel: '1.5', bottomLabelKey: 'reading.review.optionLabels.small', color: '#E9B0B0' },
      { topLabel: '4.0', bottomLabelKey: 'reading.review.optionLabels.moderate', color: '#DC99A2' },
      { topLabel: '8.0', bottomLabelKey: 'reading.review.optionLabels.high', color: '#C9728E' },
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
      { topLabel: '17', color: '#F8DFEC', bottomLabelKey: 'reading.review.optionLabels.small' },
      { topLabel: '50', color: '#EFAFCE', bottomLabelKey: 'reading.review.optionLabels.moderate' },
      { topLabel: '100', color: '#E780AF', bottomLabelKey: 'reading.review.optionLabels.large' },
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
      { topLabel: '3.0', topSubLabel: "1.25", color: '#78578D' },
      { topLabel: '6.0', topSubLabel: "2.5", color: '#45669B' },
      { topLabel: '12', topSubLabel: "5", color: '#A85288' },
      { topLabel: '24', topSubLabel: "10", color: '#B6558A' },
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
      { topLabel: '0', topSubLabel: '0', color: '#4E3122' },
      { topLabel: '50', topSubLabel: '0.5', color: '#724C36' },
      { topLabel: '100', topSubLabel: '1.0', color: '#8F6549' },
      { topLabel: '150', topSubLabel: '1.5', color: '#A27E63' },
      { topLabel: '200', topSubLabel: '2.0', color: '#B59A80' },
      { topLabel: '250', topSubLabel: '2.5', color: '#C9B6A0' },
      { topLabel: '300', topSubLabel: '3.0', color: '#DDD1C2' },
    ]
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
  normalRuleByKey,
}: {
  row: ResultRowConfig
  selectedIndex: number
  onSelect: (index: number) => void
  normalRuleByKey: Record<string, NormalRule | undefined>
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
  const computedStatus: ResultStatus = useMemo(() => {
    const opt = row.options[selectedIndex]
    const label = opt ? opt.topLabel : ''
    const num = numericValueFromLabel(row.key, label)
    return isNormalByRule(normalRuleByKey, row.key, label, num) ? 'Normal' : 'Abnormal'
  }, [normalRuleByKey, row.key, row.options, selectedIndex])
  const translatedLabel = translateUrinalysisParameterLabel(t, row.key, row.label)
  return (
    <div className={`relative rounded-2xl border border-[#EEF0F2] bg-white px-3 py-4 ${editing ? 'bg-[#F5F6F6]' : ''}`}>
      {/* Edit / Save / Cancel controls — absolute top-left, subtle */}
      <div className="absolute left-3 top-3 flex items-center gap-1">
        {editing ? (
          <>
            <button
              type="button"
              className="p-1 rounded-full border border-[#E5E7EB] text-gray-700 bg-white"
              onClick={handleCancel}
              aria-label={t('common.cancel')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded-full bg-primary text-white"
              onClick={handleSave}
              aria-label={t('common.save')}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="p-1 text-[#9CA3AF] hover:text-primary"
            onClick={handleStartEdit}
            aria-label={t('reading.review.selectValue')}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      {/* Status pill — absolute top-right */}
      <div className="absolute right-3 top-3">
        <StatusPill status={computedStatus} />
      </div>

      {/* Centered parameter label */}
      <div className="text-center text-[14px] leading-[18px] font-semibold text-black/70">
        {translatedLabel}
      </div>

      <div
        className="mt-3 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {row.options.map((opt, idx) => {
          const active = idx === selectedIndex
          return (
            <div key={`${row.key}-${idx}`} className={`flex flex-col items-center justify-start px-0.5 pt-1 pb-1 rounded-xl transition-colors ${active ? 'bg-[#F0F2F5]' : ''}`}>
              <div className="text-[10px] leading-[12px] text-[#9CA3AF] text-center">
                {opt.topLabelKey
                  ? t(opt.topLabelKey)
                  : (opt.topSubLabel && opt.topSubLabel !== '0'
                    ? `${opt.topLabel}(${opt.topSubLabel})`
                    : opt.topLabel)
                }
              </div>
              <div
                className={`mt-1.5 h-10 ${opt.topLabel === "Positive" ? " w-full " : " w-10 "} relative rounded-full ${opt.topLabel === "Neg" ? "border border-[#E5E7EB]" : ""} ${active ? 'border-2 border-primary ring-2 ring-primary ring-offset-2 ring-offset-white shadow-sm scale-[1.05] transition-transform' : ''} ${editing ? 'cursor-pointer' : ''}`}
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
                {
                  opt.showStain &&
                  <div
                    className='w-full h-full rounded-full'
                    style={{
                      backgroundImage: `
                        radial-gradient(#7B4F35 2px, transparent 2px),
                        radial-gradient(#A96E4E 1.5px, transparent 1.5px)
                      `,
                      backgroundSize: '12px 12px, 18px 18px',
                      backgroundPosition: '2px 2px, 6px 6px',
                      opacity: 0.4
                    }}
                  />
                }
                {active && (
                  opt.topLabel === "Positive" ? (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )
                )}
              </div>
              {(opt.bottomLabelKey || opt.bottomLabel) && (
                <div className="text-[9px] leading-[11px] text-[#9CA3AF] mt-0.5 text-center">
                  {opt.bottomLabelKey
                    ? t(opt.bottomLabelKey).split('\n').map((line, i) => <div key={i}>{line}</div>)
                    : opt.bottomLabel
                  }
                </div>
              )}
            </div>
          )
        })}
        {row.unit ?
          <div className="border-l mt-2 flex justify-end items-center pb-2 flex-col text-[10px] leading-[12px] text-[#9CA3AF] gap-0.5 pl-1">
            {row.subUnit ? `${row.unit} (${row.subUnit})` : row.unit}
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

export default function ReviewStep({
  selectedByKey,
  rawProcessSingleResults,
  onChangeSelectedByKey,
  onBack,
  onIssueReport,
  visibleKeys,
}: Props) {
  const { t } = useTranslation()
  const [observations, setObservations] = useState('')
  const [normalRuleByKey, setNormalRuleByKey] = useState<Record<string, NormalRule | undefined>>({})
  const visibleRows = useMemo(() => {
    const keys = Array.isArray(visibleKeys) ? visibleKeys : null
    return keys && keys.length ? RESULT_ROWS.filter((r) => keys.includes(r.key)) : RESULT_ROWS
  }, [visibleKeys])
  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch('/api/panels', { method: 'GET' })
          const data = await res.json().catch(() => null)
          if (!mounted) return
          const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : []
          const next: Record<string, NormalRule | undefined> = {}
          for (const p of raw) {
            const ranges = Array.isArray(p?.referenceRanges) ? (p.referenceRanges as any[]) : []
            for (const rr of ranges) {
              const key = String(rr?.key || '').trim()
              if (!key || next[key]) continue
              const rule = rr?.rule
              const type = String(rule?.type || '').trim()
              if (type === 'negative') {
                next[key] = { type: 'negative' }
                continue
              }
              if (type === 'range') {
                const low = Number(rule?.low)
                const high = Number(rule?.high)
                if (Number.isFinite(low) && Number.isFinite(high)) next[key] = { type: 'range', low, high }
                continue
              }
              if (type === 'exact') {
                const value = Number(rule?.value)
                if (Number.isFinite(value)) next[key] = { type: 'exact', value }
                continue
              }
              if (type === 'lt') {
                const value = Number(rule?.value)
                if (Number.isFinite(value)) next[key] = { type: 'lt', value }
                continue
              }
              if (type === 'gt') {
                const value = Number(rule?.value)
                if (Number.isFinite(value)) next[key] = { type: 'gt', value }
                continue
              }
            }
          }
          setNormalRuleByKey(next)
        } catch {
        }
      })()
    return () => {
      mounted = false
    }
  }, [])
  useEffect(() => {
    const next: ReviewSelectionMap = { ...selectedByKey }
    let changed = false
    for (const row of RESULT_ROWS) {
      if (typeof next[row.key] === "number") continue
      next[row.key] = row.defaultIndex
      changed = true
    }
    if (changed) onChangeSelectedByKey(next)
  }, [onChangeSelectedByKey, selectedByKey, visibleRows])
  const canProceed = useMemo(() => visibleRows.length > 0, [visibleRows.length])

  return (
    <div className="">
      <div>
        <h2 className="text-[20px] leading-[24px] font-bold text-black/80">{t('reading.review.title')}</h2>
        <p className="mt-1 text-[13px] leading-[18px] text-[#6B7280]">
          {t('reading.review.desc')}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {visibleRows.map((row) => (
          <ResultRow
            key={row.key}
            row={row}
            selectedIndex={selectedByKey[row.key] ?? row.defaultIndex}
            onSelect={(idx) => onChangeSelectedByKey({ ...selectedByKey, [row.key]: idx })}
            normalRuleByKey={normalRuleByKey}
          />
        ))}
      </div>

      {/* Observations textarea */}
      <div className="mt-5">
        <div className="text-[14px] font-semibold text-black/70 mb-2">{t('reading.review.observationsLabel')}</div>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder={t('reading.review.observationsPlaceholder')}
          rows={3}
          className="w-full px-4 py-3.5 bg-[#F5F6F6] rounded-2xl text-[14px] text-[#374151] placeholder-[#9CA3AF] resize-none border-0 outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mt-5 space-y-2">
        <button
          onClick={() => {
            const results: ReviewResultDraft[] = RESULT_ROWS.map((row) => {
              const selectedIndex = selectedByKey[row.key] ?? row.defaultIndex
              const opt = row.options[selectedIndex]
              const valueLabel = opt ? opt.topLabel : row.options[row.defaultIndex]?.topLabel ?? ""
              const numericValue = numericValueFromLabel(row.key, valueLabel)
              const status: ResultStatus = isNormalByRule(normalRuleByKey, row.key, valueLabel, numericValue) ? 'Normal' : 'Abnormal'
              return {
                key: row.key,
                label: row.label,
                unit: row.unit,
                status,
                selectedIndex,
                valueLabel,
                ...(numericValue === undefined ? {} : { numericValue }),
              }
            })
            onIssueReport(results)
          }}
          disabled={!canProceed}
          className="w-full py-[15px] rounded-xl bg-primary text-white font-bold text-[16px] disabled:opacity-60 shadow-[0_8px_24px_-8px_rgba(63,120,216,0.5)]"
        >
          {t('reading.review.issueReport')}
        </button>
        <button
          onClick={onBack}
          className="w-full py-[15px] rounded-xl bg-transparent text-[#1C1C1E] font-medium text-[15px]"
        >
          {t('reading.review.redo')}
        </button>
      </div>
    </div>
  )
}
