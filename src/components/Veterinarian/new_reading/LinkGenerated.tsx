'use client'

import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

type Props = {
  amountLabel?: string
  paymentUrl?: string | null
  onSend: () => void
  onBack: () => void
  sending?: boolean
}

export default function LinkGenerated({ amountLabel = 'R$ 5.00', paymentUrl, onSend, onBack, sending }: Props) {
  const { t } = useTranslation()
  const [shareOpen, setShareOpen] = useState(false)

  const safeUrl = useMemo(() => {
    const v = typeof paymentUrl === 'string' ? paymentUrl.trim() : ''
    return v || null
  }, [paymentUrl])

  const copyLabel = useMemo(() => t('reading.identification.copyPaymentLink'), [t])
  const shareLabel = useMemo(() => t('reading.identification.sharePaymentLink'), [t])

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
    } catch {
    }

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
    } catch {
    }

    setShareOpen(true)
  }

  const handleShareWhatsApp = () => {
    if (!safeUrl) return
    const text = `${t('reading.identification.shareTextPrefix')} ${safeUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    setShareOpen(false)
  }

  const handleShareEmail = () => {
    if (!safeUrl) return
    const subject = t('reading.identification.emailSubject')
    const body = `${t('reading.identification.emailBodyPrefix')} ${safeUrl}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setShareOpen(false)
  }
  return (
    <div className="">
      <h2 className="text-lg font-medium text-gray-900">{t('reading.identification.linkGeneratedTitle')}</h2>
      <p className="text-sm text-tertiary">{t('reading.identification.linkGeneratedDesc')}</p>

      <div className="mt-6 rounded-2xl bg-linear-to-r to-[#EBF2FF] from-[#F5F6F6] px-5 py-4">
        <div className="text-sm text-gray-700">{t('reading.identification.amountToBePaid')}</div>
        <div className="text-4xl font-bold text-primary mt-2">{amountLabel}</div>
      </div>
      {/* show while its generating... */}
      {/* <div className="mt-10 flex items-center justify-center">
        <div className="w-44 h-44 rounded-full border-10 border-[#EBF2FF] border-t-primary animate-spin" />
        <div className="absolute text-gray-700 text-sm">Please Wait...</div>
      </div> */}
      {/* show while its done... */}
      <div className="mt-10 flex items-center justify-center">
        <div className="w-44 h-44 rounded-full border-10 border-[#EBF2FF] border-primary animate-spi" />
        <div className="absolute text-gray-700 text-sm"><svg xmlns="http://www.w3.org/2000/svg" width="70" height="50" viewBox="0 0 70 50" fill="none">
          <path d="M68.2841 1.1124C69.7386 2.5669 69.7386 4.92435 68.2841 6.37885L26.0897 48.5733C24.6352 50.0278 22.2778 50.0278 20.8233 48.5733L1.07698 28.827C-0.36821 27.3632 -0.354246 25.0057 1.10956 23.5606C2.5594 22.127 4.89358 22.127 6.34343 23.5606L23.4576 40.6748L63.02 1.11473C64.4745 -0.337444 66.8296 -0.337444 68.2841 1.11473V1.1124ZM68.2818 1.0868C69.7363 2.5413 69.7363 4.89875 68.2818 6.35325L26.0874 48.5477C24.6329 50.0022 22.2754 50.0022 20.8209 48.5477L1.07465 28.8014C-0.370537 27.3376 -0.356572 24.9801 1.10723 23.535C2.55708 22.1014 4.89126 22.1014 6.3411 23.535L23.4553 40.6492L63.0177 1.08913C64.4722 -0.363043 66.8273 -0.363043 68.2818 1.08913V1.0868Z" fill="#3F78D8" />
        </svg></div>
      </div>

      <div className="mt-10 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!safeUrl}
            className="w-full py-4 rounded-full bg-gray-100 text-gray-700 font-medium disabled:opacity-60"
          >
            {copyLabel}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={!safeUrl}
            className="w-full py-4 rounded-full bg-gray-100 text-gray-700 font-medium disabled:opacity-60"
          >
            {shareLabel}
          </button>
        </div>
        <button
          onClick={onSend}
          disabled={!!sending}
          className="w-full py-4 rounded-full bg-primary text-white font-medium disabled:opacity-70"
        >
          {sending ? t('reading.identification.sending') : t('reading.identification.sendPaymentLink')}
        </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
