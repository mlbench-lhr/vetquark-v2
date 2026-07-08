'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

type Props = {
  analysisType: 'eye' | 'skin'
  onBack: () => void
  onDone: (payload: { previewDataUrl: string; result: any }) => void
}

export default function ImageCaptureStep({ analysisType, onBack, onDone }: Props) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(t('common.fileTooLarge'))
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setPreviewDataUrl(dataUrl)
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error(t('common.uploadFailed'))
    }
  }

  const getBackCameraStream = useCallback(async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } },
        audio: false,
      })
    } catch {}

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
    } catch {}

    const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter((d) => d.kind === 'videoinput')
      const backCandidates = videoInputs.filter((d) => /back|rear|environment/i.test(d.label))
      const candidates = backCandidates.length ? backCandidates : videoInputs
      const preferred = candidates[0]
      if (!preferred?.deviceId) throw new Error('Back camera not found.')
      return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: preferred.deviceId } },
        audio: false,
      })
    } finally {
      tmp.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraError('')
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError(t('reading.timer.cameraUnavailable'))
        setCameraReady(false)
        return
      }

      const stream = await getBackCameraStream()
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
      }
      setCameraReady(true)
    } catch (e) {
      setCameraError(t('reading.timer.cameraUnavailable'))
      setCameraReady(false)
    }
  }, [getBackCameraStream, t])

  const stopCamera = useCallback(() => {
    const stream = streamRef.current
    streamRef.current = null
    if (stream) stream.getTracks().forEach((t) => t.stop())
    setCameraReady(false)
  }, [])

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
    setPreviewDataUrl(dataUrl)
    stopCamera()
  }, [stopCamera])

  useEffect(() => {
    if (captureMode === 'camera' && !previewDataUrl) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [captureMode, previewDataUrl, startCamera, stopCamera])

  const handleAnalyze = async () => {
    if (!previewDataUrl || analyzing) return

    setAnalyzing(true)
    try {
      const endpoint = analysisType === 'eye' ? '/api/pet_disease/eye' : '/api/pet_disease/skin'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: previewDataUrl }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const errorMessage = typeof data?.error === 'string' ? data.error : t('common.error')
        toast.error(errorMessage)
        return
      }

      if (data?.success === false) {
        const message = typeof data?.message === 'string' ? data.message : t('common.error')
        toast.error(message)
        return
      }

      onDone({ previewDataUrl, result: data })
    } catch {
      toast.error(t('common.networkError'))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl border border-secondary px-5 py-5">
        <h2 className="text-[20px] font-bold text-black/70">{t('reading.image.captureTitle')}</h2>
        <p className="mt-1 text-[13px] text-[#6B7280] leading-[18px]">
          {analysisType === 'eye' ? t('reading.image.captureDescEye') : t('reading.image.captureDescSkin')}
        </p>

        <div className="mt-5 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />

          {!previewDataUrl && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCaptureMode('camera')}
                className={`flex-1 py-3 rounded-lg text-[14px] font-medium transition-all ${captureMode === 'camera'
                  ? 'bg-primary text-white'
                  : 'bg-[#E5E7EB] text-black/70'
                  }`}
              >
                {t('reading.image.captureFromCamera')}
              </button>
              <button
                type="button"
                onClick={() => setCaptureMode('upload')}
                className={`flex-1 py-3 rounded-lg text-[14px] font-medium transition-all ${captureMode === 'upload'
                  ? 'bg-primary text-white'
                  : 'bg-[#E5E7EB] text-black/70'
                  }`}
              >
                {t('reading.image.uploadFromGallery')}
              </button>
            </div>
          )}

          {previewDataUrl ? (
            <div className="relative w-full aspect-video bg-[#F5F6F6] rounded-lg overflow-hidden">
              <img src={previewDataUrl} alt="Preview" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  setPreviewDataUrl('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-600 shadow-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ) : captureMode === 'camera' ? (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center text-white text-[14px]">
                  {cameraError}
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-[14px]">
                      {t('reading.timer.startingCamera')}
                    </div>
                  )}
                  {cameraReady && (
                    <button
                      type="button"
                      onClick={captureFromCamera}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <div className="w-12 h-12 bg-primary rounded-full" />
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-[#E5E7EB] rounded-lg text-center hover:border-primary hover:bg-[#EBF2FF] transition-all"
            >
              <div className="flex flex-col items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#9CA3AF]" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[14px] text-[#6B7280]">{t('common.selectOption')}</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={analyzing}
          className="flex-1 py-4 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all bg-[#E5E7EB] text-black/70"
        >
          {t('common.back')}
        </button>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!previewDataUrl || analyzing}
          className={`flex-1 py-4 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${previewDataUrl && !analyzing
            ? 'bg-primary text-white shadow-sm'
            : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
        >
          {analyzing ? t('reading.image.analyzing') : t('reading.image.analyze')}
        </button>
      </div>
    </div>
  )
}
