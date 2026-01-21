'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  selectedSeconds: number
  onChangeSelectedSeconds: (nextSeconds: number) => void
  onBack: () => void
  onAnalyzeAndProceed: () => void
}

const marks = [30, 40, 45, 60, 120]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function TimerStep({ selectedSeconds, onChangeSelectedSeconds, onBack, onAnalyzeAndProceed }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(selectedSeconds)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    setSecondsLeft(selectedSeconds)
    setRunning(true)
  }, [selectedSeconds])

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
        <div className='flex justify-start items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="15" viewBox="0 0 17 15" fill="none">
            <path d="M1.66667 1.66667H4.16667L5.83333 0H10.8333L12.5 1.66667H15C15.442 1.66667 15.8659 1.84226 16.1785 2.15482C16.4911 2.46738 16.6667 2.89131 16.6667 3.33333V13.3333C16.6667 13.7754 16.4911 14.1993 16.1785 14.5118C15.8659 14.8244 15.442 15 15 15H1.66667C1.22464 15 0.800716 14.8244 0.488155 14.5118C0.175595 14.1993 0 13.7754 0 13.3333V3.33333C0 2.89131 0.175595 2.46738 0.488155 2.15482C0.800716 1.84226 1.22464 1.66667 1.66667 1.66667ZM8.33333 4.16667C7.22826 4.16667 6.16846 4.60565 5.38705 5.38705C4.60565 6.16846 4.16667 7.22826 4.16667 8.33333C4.16667 9.4384 4.60565 10.4982 5.38705 11.2796C6.16846 12.061 7.22826 12.5 8.33333 12.5C9.4384 12.5 10.4982 12.061 11.2796 11.2796C12.061 10.4982 12.5 9.4384 12.5 8.33333C12.5 7.22826 12.061 6.16846 11.2796 5.38705C10.4982 4.60565 9.4384 4.16667 8.33333 4.16667ZM8.33333 5.83333C8.99637 5.83333 9.63226 6.09672 10.1011 6.56557C10.5699 7.03441 10.8333 7.67029 10.8333 8.33333C10.8333 8.99637 10.5699 9.63226 10.1011 10.1011C9.63226 10.5699 8.99637 10.8333 8.33333 10.8333C7.67029 10.8333 7.03441 10.5699 6.56557 10.1011C6.09672 9.63226 5.83333 8.99637 5.83333 8.33333C5.83333 7.67029 6.09672 7.03441 6.56557 6.56557C7.03441 6.09672 7.67029 5.83333 8.33333 5.83333Z" fill="#3F78D8" />
          </svg>
          <div className="text-sm font-medium text-gray-900">Camera Ready</div>
        </div>
        <div className="text-sm text-tertiary">Position the strip and start the timer.</div>
      </div>

      <div className="mt-4 flex items-center justify-between bg-[#F5F6F6] rounded-full pe-4">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-6 py-3 rounded-full bg-primary text-white font-medium"
        >
          {running ? 'Capturing' : 'Paused'}
        </button>
        <div className="text-2xl font-semibold text-gray-900">{timeLabel}</div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap w-full justify-between">
        {marks.map((m) => {
          const isSelected = m === selectedSeconds
          const isCompleted = m <= selectedSeconds
          return (
            <button
              key={m}
              onClick={() => onChangeSelectedSeconds(m)}
              className={`px-4 py-2 rounded-xl border text-sm flex justify-start items-center gap-1 font-medium ${isCompleted
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
            >
              {
                isCompleted ?
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="10" viewBox="0 0 13 10" fill="none">
                    <path d="M4.54601 10L0 5.25988L1.1365 4.07484L4.54601 7.62994L11.8635 0L13 1.18503L4.54601 10Z" fill="#17803D" />
                  </svg>
                  :
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" viewBox="0 0 15 18" fill="none">
                    <path d="M5 1.66667V0H10V1.66667H5ZM6.66667 10.8333H8.33333V5.83333H6.66667V10.8333ZM7.5 17.5C6.47222 17.5 5.50333 17.3022 4.59333 16.9067C3.68333 16.5111 2.88833 15.9728 2.20833 15.2917C1.52833 14.6106 0.990278 13.8153 0.594167 12.9058C0.198056 11.9964 0 11.0278 0 10C0 8.97222 0.198056 8.00333 0.594167 7.09333C0.990278 6.18333 1.52833 5.38833 2.20833 4.70833C2.88833 4.02833 3.68361 3.49028 4.59417 3.09417C5.50472 2.69806 6.47333 2.5 7.5 2.5C8.36111 2.5 9.1875 2.63889 9.97917 2.91667C10.7708 3.19444 11.5139 3.59722 12.2083 4.125L13.375 2.95833L14.5417 4.125L13.375 5.29167C13.9028 5.98611 14.3056 6.72917 14.5833 7.52083C14.8611 8.3125 15 9.13889 15 10C15 11.0278 14.8019 11.9967 14.4058 12.9067C14.0097 13.8167 13.4717 14.6117 12.7917 15.2917C12.1117 15.9717 11.3164 16.51 10.4058 16.9067C9.49528 17.3033 8.52667 17.5011 7.5 17.5ZM7.5 15.8333C9.11111 15.8333 10.4861 15.2639 11.625 14.125C12.7639 12.9861 13.3333 11.6111 13.3333 10C13.3333 8.38889 12.7639 7.01389 11.625 5.875C10.4861 4.73611 9.11111 4.16667 7.5 4.16667C5.88889 4.16667 4.51389 4.73611 3.375 5.875C2.23611 7.01389 1.66667 8.38889 1.66667 10C1.66667 11.6111 2.23611 12.9861 3.375 14.125C4.51389 15.2639 5.88889 15.8333 7.5 15.8333Z" fill="#839297" />
                  </svg>
              }

              {m}s
            </button>
          )
        })}
      </div>

      <div className="mt-6 space-y-3">
        <button onClick={onAnalyzeAndProceed} className="w-full py-4 rounded-full bg-primary text-white font-medium">
          Analyse & Proceed
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          Go Back
        </button>
      </div>
    </div>
  )
}
