'use client'

import React from 'react'

type Props = {
  amountLabel?: string
  onSend: () => void
  onBack: () => void
  sending?: boolean
}

export default function LinkGenerated({ amountLabel = 'R$ 5,00', onSend, onBack, sending }: Props) {
  return (
    <div className="">
      <h2 className="text-lg font-medium text-gray-900">Link Generated</h2>
      <p className="text-sm text-tertiary">Send the link to the tutor and wait for payment confirmation.</p>

      <div className="mt-6 rounded-2xl bg-linear-to-r to-[#EBF2FF] from-[#F5F6F6] px-5 py-4">
        <div className="text-sm text-gray-700">Amount to be paid</div>
        <div className="text-4xl font-bold text-primary mt-2">{amountLabel}</div>
      </div>

      <div className="mt-10 flex items-center justify-center">
        <div className="w-44 h-44 rounded-full border-10 border-[#EBF2FF] border-t-primary animate-spin" />
        <div className="absolute text-gray-700 text-sm">Please Wait...</div>
      </div>

      <div className="mt-10 space-y-3">
        <button
          onClick={onSend}
          disabled={!!sending}
          className="w-full py-4 rounded-full bg-primary text-white font-medium disabled:opacity-70"
        >
          Send Payment Link
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          Go Back
        </button>
      </div>
    </div>
  )
}