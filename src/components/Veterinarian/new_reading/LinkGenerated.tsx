'use client'

import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

type Props = {
  amountLabel?: string
  paymentUrl?: string | null
  onSend: () => void
  onContinue?: () => void
  onBack: () => void
  sending?: boolean
  paymentLinkStatus?: "unknown" | "pending" | "paid" | "expired"
}

export default function LinkGenerated({ amountLabel = 'R$ 5,00', paymentUrl, onSend, onContinue, onBack, sending, paymentLinkStatus }: Props) {
  const { t } = useTranslation()

  const safeUrl = useMemo(() => {
    const v = typeof paymentUrl === 'string' ? paymentUrl.trim() : ''
    return v || null
  }, [paymentUrl])

  const isPaid = paymentLinkStatus === 'paid'

  const handleCopy = async () => {
    if (!safeUrl) {
      toast.error(t('reading.identification.paymentLinkNotReady'))
      return
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(safeUrl)
        toast.success(t('reading.identification.paymentLinkCopied'))
        return
      }
    } catch { }
    try {
      const input = document.createElement('input')
      input.value = safeUrl
      input.setAttribute('readonly', 'true')
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      input.setSelectionRange(0, input.value.length)
      const ok = document.execCommand('copy')
      document.body.removeChild(input)
      if (ok) toast.success(t('reading.identification.paymentLinkCopied'))
      else toast.error(t('reading.identification.unableToCopyPaymentLink'))
    } catch {
      toast.error(t('reading.identification.unableToCopyPaymentLink'))
    }
  }

  const handleShare = async () => {
    if (!safeUrl) {
      toast.error(t('reading.identification.paymentLinkNotReady'))
      return
    }
    const shareText = `${t('reading.identification.shareTextPrefix')} ${safeUrl}`
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as any).share({
          title: t('reading.identification.shareTitle'),
          text: shareText,
          url: safeUrl,
        })
        return
      }
    } catch { }
  }

  return (
    <div className="">
      {/* Status card */}
      <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-[#111827]">
              {isPaid ? t('reading.identification.paymentConfirmedTitle') : t('reading.identification.linkGeneratedTitle')}
            </h2>
            <p className="mt-1 text-[13px] text-[#6B7280] leading-[18px]">
              {isPaid
                ? t('reading.identification.paymentConfirmedDesc')
                : t('reading.identification.linkGeneratedDesc')}
            </p>
          </div>
          {!isPaid && amountLabel && (
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] text-[#6B7280]">{t('reading.identification.amountToBePaid')}</div>
              <div className="text-[18px] font-bold text-primary mt-0.5">{amountLabel}</div>
            </div>
          )}
        </div>
      </div>

      {/* Circular animation */}
      <div className="mt-10 flex items-center justify-center relative">
        <div
          className={`w-48 h-48 rounded-full border-[12px] transition-all duration-500 ${isPaid
            ? 'border-[#EBF2FF] border-t-primary border-r-primary'
            : 'border-[#EBF2FF] border-t-primary animate-spin'
            }`}
          style={isPaid ? { transform: 'rotate(-45deg)' } : {}}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {isPaid ? (
            <svg viewBox="0 0 70 50" className="w-16 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M68.2841 1.1124C69.7386 2.5669 69.7386 4.92435 68.2841 6.37885L26.0897 48.5733C24.6352 50.0278 22.2778 50.0278 20.8233 48.5733L1.07698 28.827C-0.36821 27.3632 -0.354246 25.0057 1.10956 23.5606C2.5594 22.127 4.89358 22.127 6.34343 23.5606L23.4576 40.6748L63.02 1.11473C64.4745 -0.337444 66.8296 -0.337444 68.2841 1.11473V1.1124Z" fill="#3F78D8" />
            </svg>
          ) : (
            <span className="text-[15px] font-medium text-[#374151]">{t('reading.identification.waitingLabel')}</span>
          )}
        </div>
      </div>

      <div className="mt-10 space-y-3">
        {isPaid ? (
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-full bg-primary text-white font-semibold text-[15px]"
          >
            {t('common.continue')}
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!!sending}
            className="w-full py-4 rounded-full bg-primary text-white font-semibold text-[15px] disabled:opacity-70"
          >
            {sending ? t('reading.identification.sending') : t('reading.identification.sendBillingLink')}
          </button>
        )}

        <button
          onClick={onBack}
          className="w-full py-4 rounded-full border border-[#E5E7EB] bg-white text-[#374151] font-medium text-[15px]"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
