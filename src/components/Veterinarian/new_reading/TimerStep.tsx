'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  onBack: () => void
  onNext: () => void
}

const marks = [30, 40, 45, 60, 120]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function TimerStep({ onBack, onNext }: Props) {
  const [selected, setSelected] = useState(45)
  const [secondsLeft, setSecondsLeft] = useState(45)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    setSecondsLeft(selected)
    setRunning(true)
  }, [selected])

  useEffect(() => {
    if (!running) return
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [running, secondsLeft])

  const timeLabel = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return `${pad(m)}:${pad(s)}`
  }, [secondsLeft])

  return (
    <div className="">
      <h2 className="text-lg font-medium text-gray-900">Timers and Capture</h2>
      <p className="text-sm text-tertiary">Follow the steps to complete the analysis.</p>

      <div className="mt-6 rounded-3xl border-2 border-primary overflow-hidden bg-black/10">
        <div className="h-72 bg-linear-to-br from-gray-900 via-gray-700 to-gray-500" />
      </div>

      <div className="mt-3 rounded-2xl bg-[#EBF2FF] px-4 py-3">
        <div className="text-sm font-medium text-gray-900">Camera Ready</div>
        <div className="text-sm text-tertiary">Position the strip and start the timer.</div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-6 py-3 rounded-full bg-primary text-white font-medium"
        >
          {running ? 'Capturing' : 'Paused'}
        </button>
        <div className="text-2xl font-semibold text-gray-900">{timeLabel}</div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {marks.map((m) => {
          const isSelected = m === selected
          const isCompleted = m <= selected
          return (
            <button
              key={m}
              onClick={() => setSelected(m)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium ${
                isSelected
                  ? 'bg-primary text-white border-primary'
                  : isCompleted
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            >
              {m}s
            </button>
          )
        })}
      </div>

      <div className="mt-6 space-y-3">
        <button onClick={onNext} className="w-full py-4 rounded-full bg-primary text-white font-medium">
          Analyse & Proceed
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          Go Back
        </button>
      </div>
    </div>
  )
}