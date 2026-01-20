'use client'

import React, { useState } from 'react'

type Props = {
  onBack: () => void
  onComplete: () => void
}

export default function ReportStep({ onBack, onComplete }: Props) {
  const [otherInfo, setOtherInfo] = useState('')
  const [vetNotes, setVetNotes] = useState('')

  return (
    <div className="">
      <h2 className="text-lg font-medium text-gray-900">Final Preview and Editing of the Report</h2>
      <p className="text-sm text-tertiary">Review and edit the report below. Once signed, it cannot be altered.</p>

      <div className="mt-6 rounded-3xl border border-gray-200 overflow-hidden bg-white p-4">
        <div className="text-center font-bold text-gray-900 text-lg">XEILXTE</div>
        <div className="text-center text-sm text-gray-700 mt-1">StripScan - Laboratório Veterinário</div>
        <div className="text-center text-xs text-gray-500 mt-2">Rua Fictícia, 123 · Cidade, Estado · CEP 00000-000</div>

        <div className="mt-4 border-t border-gray-200 pt-3 text-sm space-y-1">
          <div><span className="font-semibold">Paciente:</span> Buddy</div>
          <div><span className="font-semibold">Raça:</span> Golden Retriever</div>
          <div><span className="font-semibold">Espécie:</span> Cão</div>
          <div><span className="font-semibold">Guardian:</span> João Silva</div>
          <div><span className="font-semibold">Atendimento:</span> 05/12/2025</div>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500 text-center">
          Conferido, liberado e assinado.
        </div>
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

      <div className="mt-4">
        <div className="text-sm text-gray-900 mb-2">Veterinarian&apos;s Notes:</div>
        <textarea
          value={vetNotes}
          onChange={(e) => setVetNotes(e.target.value)}
          placeholder="Enter your veterinarian's notes"
          rows={4}
          className="w-full px-4 py-4 bg-gray-100 rounded-2xl text-gray-700 resize-none"
        />
      </div>

      <div className="mt-6 space-y-3">
        <button onClick={onComplete} className="w-full py-4 rounded-full bg-primary text-white font-medium">
          Sign & Complete
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          Go Back
        </button>
      </div>
    </div>
  )
}
