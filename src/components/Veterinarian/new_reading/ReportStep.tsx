'use client'

import React from 'react'
import { ReportDraft } from './types'

type Props = {
  patientPreview: {
    animalName: string
    breed: string
    species: string
    guardianName: string
  } | null
  collectionAt: string
  report: ReportDraft
  onChangeReport: (patch: Partial<ReportDraft>) => void
  onBack: () => void
  onComplete: () => void | Promise<void>
  submitting?: boolean
}

export default function ReportStep({ patientPreview, collectionAt, report, onChangeReport, onBack, onComplete, submitting }: Props) {
  const patientName = patientPreview?.animalName || '—'
  const breed = patientPreview?.breed || '—'
  const species = patientPreview?.species || '—'
  const guardianName = patientPreview?.guardianName || '—'
  const appointment = collectionAt ? new Date(collectionAt).toLocaleString() : '—'

  return (
    <div className="">
      <h2 className="text-lg font-medium text-gray-900">Final Preview and Editing of the Report</h2>
      <p className="text-sm text-tertiary">Review and edit the report below. Once signed, it cannot be altered.</p>

      <div className="mt-6 rounded-3xl border border-gray-200 overflow-hidden bg-white p-4">
        <div className="text-center font-bold text-gray-900 text-lg">XEILXTE</div>
        <div className="text-center text-sm text-gray-700">StripScan - Laboratório Veterinário</div>
        <div className="text-center text-xs text-gray-500 mt-1">Rua Fictícia, 123 · Cidade, Estado · CEP 00000-000</div>

        <div className="mt-4 border-t border-gray-200 pt-3 text-sm space-y-1">
          <div><span className="font-semibold">Paciente:</span> {patientName}</div>
          <div><span className="font-semibold">Raça:</span> {breed}</div>
          <div><span className="font-semibold">Espécie:</span> {species}</div>
          <div><span className="font-semibold">Guardian:</span> {guardianName}</div>
          <div><span className="font-semibold">Atendimento:</span> {appointment}</div>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-foreground font-semibold text-center">
          Conferido, liberado e assinado.
          <br />
          <span className='text-xs font-normal'>A interpretação dos exames laboratoriais deverá ser realizada pelo médico veterinário responsável, mediante a sintomatologia clínica do animal.</span>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm text-gray-900 mb-2">Summary and Interpretation</div>
        <textarea
          value={report.summaryAndInterpretation}
          onChange={(e) => onChangeReport({ summaryAndInterpretation: e.target.value })}
          placeholder="Enter your summary and interpretation"
          rows={2}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 resize-none"
        />
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-900 mb-2">Other Information</div>
        <textarea
          value={report.otherInformation}
          onChange={(e) => onChangeReport({ otherInformation: e.target.value })}
          placeholder="Enter any other info"
          rows={2}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 resize-none"
        />
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-900 mb-2">Veterinarian&apos;s Notes:</div>
        <textarea
          value={report.veterinarianNotes}
          onChange={(e) => onChangeReport({ veterinarianNotes: e.target.value })}
          placeholder="Enter your veterinarian's notes"
          rows={2}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 resize-none"
        />
      </div>
      <div className="bg-[#F5F6F6] w-[100vw] -ms-4 h-2 my-4"></div>
      <div className="w-full bg-red-30 flex justify-start items-center flex-col gap-0 px-4">
        <h1 className="text-[18px] font-medium">Dr. Vet</h1>
        <h2 className="text-[14px] font-normal">CRMV-SP 12345</h2>
        <p className="text-[14px] font-normal text-black/60">Report generated on 05/12/2025, 11:12:47</p>
      </div>
      <div className="mt-6 space-y-3">
        <button
          onClick={onComplete}
          disabled={!!submitting}
          className="w-full py-4 rounded-full bg-primary text-white font-medium disabled:opacity-70"
        >
          {submitting ? 'Signing...' : 'Sign & Complete'}
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          Go Back
        </button>
      </div>
    </div>
  )
}
