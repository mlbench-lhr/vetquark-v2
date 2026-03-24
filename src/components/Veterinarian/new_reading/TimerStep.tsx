'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { transformTestBoxes } from '../../../lib/helper/transformRespose'
import { RESULT_ROWS } from './ReviewStep'
import { ReviewSelectionMap } from './types'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

type Props = {
  selectedSeconds: number
  onChangeSelectedSeconds: (nextSeconds: number) => void
  onBack: () => void
  onAnalyzeAndProceed: (results: ReviewSelectionMap) => void
}

const marks = [30, 40, 60, 120]
const autoCaptureAtSeconds = [30, 40, 60, 120]
const requiredTotalSeconds = autoCaptureAtSeconds[autoCaptureAtSeconds.length - 1] ?? 120

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function buildDemoAnalysisResponse(times: string[]) {
  const selectionIndexes = RESULT_ROWS.map((r) => r.defaultIndex)
  const testBoxes = selectionIndexes.map((selectedIndex, idx) => {
    const testNum = idx + 1
    return {
      best_match: {
        best_box_label: `R${100 + testNum}${selectedIndex}`,
        roi: { x1: 0, x2: 1, y1: 0, y2: 1 },
      },
      test_box_label: `T${testNum}`,
      test_box_roi: { x1: 0, x2: 1, y1: 0, y2: 1 }
    }
  })

  return {
    success: true,
    results: (times.length ? times : ['0']).map((time) => ({
      time: String(time),
      test_boxes: testBoxes,
    })),
  }
}

type CapturedImage = {
  atSeconds: number
  dataUrl: string
  capturedAt: string
}

async function normalizeCameraStream(stream: MediaStream) {
  const [track] = stream.getVideoTracks()
  if (!track) return
  const anyTrack = track as any
  if (typeof anyTrack.getCapabilities !== 'function' || typeof anyTrack.applyConstraints !== 'function') return

  const caps = anyTrack.getCapabilities?.()
  const advanced: any[] = []

  if (caps?.zoom) {
    const minZoom = typeof caps.zoom?.min === 'number' ? caps.zoom.min : 1
    advanced.push({ zoom: minZoom })
  }

  if (Array.isArray(caps?.focusMode) && caps.focusMode.includes('continuous')) {
    advanced.push({ focusMode: 'continuous' })
  }

  if (!advanced.length) return
  await anyTrack.applyConstraints({ advanced })
}

async function getBackCameraStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' } },
      audio: false,
    })
  } catch {
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
  } catch {
  }

  const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoInputs = devices.filter((d) => d.kind === 'videoinput')
    const backCandidates = videoInputs.filter((d) => /back|rear|environment/i.test(d.label))
    const candidates = backCandidates.length ? backCandidates : videoInputs
    const preferred =
      candidates.find((d) => /wide|ultra|1x|0\.5x/i.test(d.label) && !/tele|2x|3x/i.test(d.label)) ||
      candidates.find((d) => !/tele|2x|3x/i.test(d.label)) ||
      candidates[0]
    if (!preferred?.deviceId) throw new Error('Back camera not found.')
    return await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: preferred.deviceId } },
      audio: false,
    })
  } finally {
    tmp.getTracks().forEach((t) => t.stop())
  }
}

export default function TimerStep({ selectedSeconds, onChangeSelectedSeconds, onBack, onAnalyzeAndProceed }: Props) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const analyzeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const capturedAtSetRef = useRef<Set<number>>(new Set())
  const alertedAtSetRef = useRef<Set<number>>(new Set())
  const processedAtSetRef = useRef<Set<number>>(new Set())
  const analysisChainRef = useRef<Promise<void>>(Promise.resolve())
  const combinedNumericResultsRef = useRef<Record<number, number>>({})
  const combinedMappedResultsRef = useRef<ReviewSelectionMap | null>(null)
  const analysisErrorRef = useRef<unknown>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const prevGrayRef = useRef<Uint8Array | null>(null)
  const analyzeAbortRef = useRef<AbortController | null>(null)
  const analysisProgressTimerRef = useRef<number | null>(null)
  const analysisSessionRef = useRef(0)
  const finalFrameRef = useRef<{ atSeconds: number; time: string; image: string } | null>(null)

  const [cameraError, setCameraError] = useState('')
  const [needsTap, setNeedsTap] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [images, setImages] = useState<CapturedImage[]>([])
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(selectedSeconds, requiredTotalSeconds))
  const [running, setRunning] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisFailed, setAnalysisFailed] = useState(false)
  const [started, setStarted] = useState(false)
  const [qualityOk, setQualityOk] = useState(false)
  const [qualityChecking, setQualityChecking] = useState(false)
  const [qualityIssue, setQualityIssue] = useState<'' | 'dark' | 'bright' | 'focus' | 'motion'>('')

  useEffect(() => {
    analysisSessionRef.current += 1
    if (selectedSeconds < requiredTotalSeconds) {
      onChangeSelectedSeconds(requiredTotalSeconds)
      return
    }
    setSecondsLeft(selectedSeconds)
    setRunning(false)
    setImages([])
    capturedAtSetRef.current = new Set()
    alertedAtSetRef.current = new Set()
    processedAtSetRef.current = new Set()
    combinedNumericResultsRef.current = {}
    combinedMappedResultsRef.current = null
    analysisErrorRef.current = null
    finalFrameRef.current = null
    setStarted(false)
    setAnalysisFailed(false)
    setAnalysisProgress(0)
    setAnalyzing(false)
    const ctrl = analyzeAbortRef.current
    analyzeAbortRef.current = null
    if (ctrl) ctrl.abort()
    analysisChainRef.current = Promise.resolve()
  }, [onChangeSelectedSeconds, selectedSeconds])

  useEffect(() => {
    if (!running) return
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [running, secondsLeft])

  useEffect(() => {
    return () => {
      const ctx = audioCtxRef.current
      audioCtxRef.current = null
      if (ctx && typeof ctx.close === 'function') {
        ctx.close().catch(() => { })
      }
    }
  }, [])

  useEffect(() => {
    if (!analyzing) {
      if (analysisProgressTimerRef.current != null) {
        window.clearInterval(analysisProgressTimerRef.current)
        analysisProgressTimerRef.current = null
      }
      return
    }
  }, [analyzing])

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        setCameraError('')
        setNeedsTap(false)

        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          setCameraError(t('reading.timer.cameraUnavailable'))
          setCameraReady(false)
          return
        }

        const stream = await getBackCameraStream()
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        await normalizeCameraStream(stream).catch(() => { })

        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          try {
            await video.play()
            setNeedsTap(false)
          } catch {
            setNeedsTap(true)
          }
        }
        setCameraReady(true)
      } catch (e) {
        setCameraError(t('reading.timer.cameraUnavailable'))
        setCameraReady(false)
      }
    }

    startCamera()

    return () => {
      cancelled = true
      setCameraReady(false)
      const stream = streamRef.current
      streamRef.current = null
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [t])

  useEffect(() => {
    if (!cameraReady) return
    if (started) return
    let cancelled = false
    let ticking = false
    setQualityChecking(true)
    const tick = () => {
      if (ticking) return
      ticking = true
      try {
        const video = videoRef.current
        if (!video || !video.videoWidth || !video.videoHeight) {
          setQualityOk(false)
          setQualityIssue('')
          return
        }
        let canvas = analyzeCanvasRef.current
        if (!canvas) {
          canvas = document.createElement('canvas')
          analyzeCanvasRef.current = canvas
        }
        const targetW = 160
        const targetH = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * targetW))
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setQualityOk(false)
          setQualityIssue('')
          return
        }
        ctx.drawImage(video, 0, 0, targetW, targetH)
        const img = ctx.getImageData(0, 0, targetW, targetH)
        const data = img.data
        const gray = new Uint8Array(targetW * targetH)
        let sumLum = 0
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
          gray[p] = y
          sumLum += y
        }
        const n = gray.length
        const meanLum = sumLum / n
        const tooDark = meanLum < 40
        const tooBright = meanLum > 220
        let edgeCount = 0
        for (let y = 1; y < targetH - 1; y++) {
          const row = y * targetW
          for (let x = 1; x < targetW - 1; x++) {
            const i = row + x
            const gx =
              -gray[i - targetW - 1] + 0 + gray[i - targetW + 1] +
              -2 * gray[i - 1] + 0 + 2 * gray[i + 1] +
              -gray[i + targetW - 1] + 0 + gray[i + targetW + 1]
            const gy =
              -gray[i - targetW - 1] + -2 * gray[i - targetW] + -gray[i - targetW + 1] +
              0 + 0 + 0 +
              gray[i + targetW - 1] + 2 * gray[i + targetW] + gray[i + targetW + 1]
            const mag = Math.abs(gx) + Math.abs(gy)
            if (mag > 25) edgeCount++
          }
        }
        const edgeRatio = edgeCount / n
        const focusBad = edgeRatio < 0.015
        let motionBad = false
        const prev = prevGrayRef.current
        if (prev && prev.length === gray.length) {
          let diffCount = 0
          for (let i = 0; i < n; i++) {
            if (Math.abs(gray[i] - prev[i]) > 12) diffCount++
          }
          const diffRatio = diffCount / n
          motionBad = diffRatio > 0.08
        }
        prevGrayRef.current = gray
        const ok = !tooDark && !tooBright && !focusBad && !motionBad
        setQualityOk(ok)
        if (ok) {
          setQualityIssue('')
        } else {
          if (tooDark) setQualityIssue('dark')
          else if (tooBright) setQualityIssue('bright')
          else if (focusBad) setQualityIssue('focus')
          else if (motionBad) setQualityIssue('motion')
          else setQualityIssue('')
        }
      } finally {
        setQualityChecking(false)
        ticking = false
      }
    }
    const id = setInterval(() => {
      if (cancelled) return
      tick()
    }, 500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [cameraReady, started])

  function normalizeSingleResponse(raw: any, fallbackTime: string) {
    if (raw && typeof raw === 'object' && Array.isArray(raw.results) && typeof raw.success === 'boolean') {
      return raw
    }
    if (raw && typeof raw === 'object' && Array.isArray(raw.test_boxes)) {
      return { success: true, results: [{ time: String(fallbackTime), test_boxes: raw.test_boxes }] }
    }
    if (raw && typeof raw === 'object' && raw.result && typeof raw.result === 'object' && Array.isArray(raw.result.test_boxes)) {
      const time = raw.result.time == null ? fallbackTime : String(raw.result.time)
      return { success: true, results: [{ time, test_boxes: raw.result.test_boxes }] }
    }
    throw new Error('Invalid response')
  }

  function buildMappedResultsFromNumeric(numericResults: Record<number, number>) {
    const mappedResults: ReviewSelectionMap = {}
    Object.entries(numericResults).forEach(([key, value]) => {
      const index = parseInt(key) - 1
      if (index >= 0 && index < RESULT_ROWS.length) {
        const rowKey = RESULT_ROWS[index].key
        mappedResults[rowKey] = value
      }
    })
    return mappedResults
  }

  function extractApiErrorMessage(payload: any): string | null {
    if (payload == null) return null
    if (typeof payload === 'string') {
      const s = payload.trim()
      return s ? s.slice(0, 200) : null
    }
    if (typeof payload !== 'object') return null
    const err = (payload as any)?.error
    if (typeof err === 'string' && err.trim()) return err.trim()
    const msg = (payload as any)?.message
    if (typeof msg === 'string' && msg.trim()) return msg.trim()
    return null
  }

  function extractUserFacingErrorMessage(e: unknown): string | null {
    if (typeof e === 'string') {
      const s = e.trim()
      return s ? s : null
    }
    if (e instanceof Error) {
      const s = String(e.message || '').trim()
      return s ? s : null
    }
    if (e && typeof e === 'object') {
      const msg = (e as any)?.message
      if (typeof msg === 'string' && msg.trim()) return msg.trim()
    }
    return null
  }

  const processSingleFrame = useCallback(
    async (frame: { atSeconds: number; time: string; image: string }) => {
      if (processedAtSetRef.current.has(frame.atSeconds)) return

      const controller = analyzeAbortRef.current || new AbortController()
      analyzeAbortRef.current = controller
      if (frame.atSeconds === requiredTotalSeconds) {
        setAnalyzing(true)
      }

      const res = await fetch('/api/strip/process_single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: frame.image, time: frame.time }),
        signal: controller.signal,
      })

      const ct = String(res.headers.get('content-type') || '')
      const raw = ct.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => '')

      if (!res.ok) {
        throw new Error(extractApiErrorMessage(raw) || `HTTP ${res.status}`)
      }

      if (raw?.success === false) {
        throw new Error(extractApiErrorMessage(raw) || 'Analysis failed')
      }

      const normalized = normalizeSingleResponse(raw, frame.time)
      const partial = transformTestBoxes(normalized)
      combinedNumericResultsRef.current = { ...combinedNumericResultsRef.current, ...partial }
      processedAtSetRef.current.add(frame.atSeconds)
      combinedMappedResultsRef.current = buildMappedResultsFromNumeric(combinedNumericResultsRef.current)

      const done = processedAtSetRef.current.size
      const total = autoCaptureAtSeconds.length || 1
      const pct = Math.round((done / total) * 100)
      setAnalysisProgress(pct)
      if (pct >= 100) {
        setAnalyzing(false)
        analyzeAbortRef.current = null
      }
    },
    [],
  )

  const enqueueFrameForProcessing = useCallback(
    (frame: { atSeconds: number; time: string; image: string }) => {
      if (processedAtSetRef.current.has(frame.atSeconds)) return
      if (analysisErrorRef.current != null) return
      const session = analysisSessionRef.current
      setAnalysisFailed(false)
      analysisChainRef.current = analysisChainRef.current
        .then(() => processSingleFrame(frame))
        .catch((e) => {
          if (session !== analysisSessionRef.current) return
          const ctrl = analyzeAbortRef.current
          analyzeAbortRef.current = null
          if (ctrl) ctrl.abort()
          analysisErrorRef.current = e
          setAnalysisFailed(true)
          setRunning(false)
          setAnalyzing(false)
          setAnalysisProgress(0)
          toast.error(extractUserFacingErrorMessage(e) || t('reading.timer.failedToAnalyzeImages'))
        })
    },
    [processSingleFrame, t],
  )

  const captureImage = useCallback(
    (atSeconds: number) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      if (!video.videoWidth || !video.videoHeight) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg')
      const imageBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      if (atSeconds === requiredTotalSeconds) {
        finalFrameRef.current = { atSeconds, time: String(atSeconds), image: imageBase64 }
      } else {
        enqueueFrameForProcessing({ atSeconds, time: String(atSeconds), image: imageBase64 })
      }

      setImages((prev) => [
        ...prev,
        {
          atSeconds,
          dataUrl,
          capturedAt: new Date().toISOString(),
        },
      ])
    },
    [enqueueFrameForProcessing],
  )

  const preAlertAtSeconds = useMemo(() => autoCaptureAtSeconds.map((s) => Math.max(0, s - 5)), [])

  const playBeep = useCallback(() => {
    try {
      let ctx = audioCtxRef.current
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!ctx && AC) {
        ctx = new AC()
        audioCtxRef.current = ctx
      }
      if (!ctx) return
      if (typeof ctx.resume === 'function') {
        ctx.resume().catch(() => { })
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.value = 0.06
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      setTimeout(() => {
        try {
          osc.stop()
          osc.disconnect()
          gain.disconnect()
        } catch { }
      }, 800)
    } catch { }
  }, [])

  useEffect(() => {
    if (!running) return
    if (!cameraReady) return

    const elapsed = Math.max(0, selectedSeconds - secondsLeft)
    for (const at of preAlertAtSeconds) {
      if (at > elapsed) continue
      if (alertedAtSetRef.current.has(at)) continue
      alertedAtSetRef.current.add(at)
      playBeep()
      toast.info(t('reading.timer.prepClickImage'), { autoClose: 3000 })
    }
    for (const at of autoCaptureAtSeconds) {
      if (at > elapsed) continue
      if (capturedAtSetRef.current.has(at)) continue
      capturedAtSetRef.current.add(at)
      captureImage(at)
    }
  }, [cameraReady, captureImage, running, secondsLeft, selectedSeconds, playBeep, preAlertAtSeconds, t])

  const elapsedSeconds = useMemo(() => Math.max(0, selectedSeconds - secondsLeft), [selectedSeconds, secondsLeft])

  const captureProgress = useMemo(() => {
    const captured = new Set<number>(images.map((x) => x.atSeconds))
    const total = autoCaptureAtSeconds.length
    const completed = autoCaptureAtSeconds.reduce((acc, s) => acc + (captured.has(s) ? 1 : 0), 0)
    const next = autoCaptureAtSeconds.find((s) => s > elapsedSeconds && !captured.has(s)) ?? null
    const allDone = total === 0 ? true : completed === total
    return { captured, completed, total, next, allDone }
  }, [elapsedSeconds, images])

  const nextCaptureSecondsLeft = useMemo(
    () => (captureProgress.next == null ? 0 : Math.max(0, captureProgress.next - elapsedSeconds)),
    [captureProgress.next, elapsedSeconds],
  )

  const nextCaptureLabel = useMemo(() => {
    const m = Math.floor(nextCaptureSecondsLeft / 60)
    const s = nextCaptureSecondsLeft % 60
    return `${pad(m)}:${pad(s)}`
  }, [nextCaptureSecondsLeft])

  const primaryButtonLabel = useMemo(() => {
    if (!started) return t('reading.timer.start')
    if (captureProgress.total === 0) return running ? t('reading.timer.capturing') : t('reading.timer.resume')
    if (captureProgress.allDone) return t('reading.timer.capturedProgress', { completed: captureProgress.completed, total: captureProgress.total })
    return running
      ? t('reading.timer.capturingProgress', { completed: captureProgress.completed, total: captureProgress.total })
      : t('reading.timer.resume')
  }, [started, captureProgress.allDone, captureProgress.completed, captureProgress.total, running, t])

  const displayTimerLabel = captureProgress.allDone ? '00:00' : nextCaptureLabel
  const qualityMessage = useMemo(() => {
    if (!cameraReady) return t('reading.timer.cameraUnavailable')
    if (qualityChecking) return t('reading.timer.checkingCameraQuality')
    if (qualityOk) return t('reading.timer.cameraQualityOk')
    if (qualityIssue === 'dark') return t('reading.timer.cameraTooDark')
    if (qualityIssue === 'bright') return t('reading.timer.cameraTooBright')
    if (qualityIssue === 'focus') return t('reading.timer.cameraOutOfFocus')
    if (qualityIssue === 'motion') return t('reading.timer.cameraMovingTooMuch')
    return t('reading.timer.cameraUnavailable')
  }, [cameraReady, qualityChecking, qualityIssue, qualityOk, t])
  const handlePrimaryClick = useCallback(() => {
    if (!started) {
      setAnalysisFailed(false)
      setStarted(true)
      setRunning(true)
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (AC) {
        const ctx = audioCtxRef.current || new AC()
        audioCtxRef.current = ctx
        if (typeof ctx.resume === 'function') {
          ctx.resume().catch(() => { })
        }
      }
      return
    }
    setRunning((r) => !r)
  }, [started])

  const handleRetry = useCallback(() => {
    setAnalysisFailed(false)
    setAnalyzing(false)
    setRunning(false)
    setStarted(false)
    setSecondsLeft(selectedSeconds)
    setImages([])
    capturedAtSetRef.current = new Set()
    alertedAtSetRef.current = new Set()
    processedAtSetRef.current = new Set()
    combinedNumericResultsRef.current = {}
    combinedMappedResultsRef.current = null
    analysisErrorRef.current = null
    finalFrameRef.current = null
    setAnalysisProgress(0)
    prevGrayRef.current = null
    const ctrl = analyzeAbortRef.current
    analyzeAbortRef.current = null
    if (ctrl) ctrl.abort()
    analysisChainRef.current = Promise.resolve()
  }, [selectedSeconds])

  const handleCancelAnalyze = useCallback(() => {
    const ctrl = analyzeAbortRef.current
    analyzeAbortRef.current = null
    if (ctrl) ctrl.abort()
    analysisErrorRef.current = new Error('Canceled')
    setAnalysisFailed(false)
    setAnalyzing(false)
    toast.info(t('reading.timer.analysisCanceled'))
  }, [t])

  const handleAnalyze = async () => {
    try {
      setAnalysisFailed(false)
      if (analysisErrorRef.current != null) {
        throw analysisErrorRef.current
      }
      const finalFrame = finalFrameRef.current
      if (finalFrame && !processedAtSetRef.current.has(finalFrame.atSeconds)) {
        setAnalyzing(true)
        enqueueFrameForProcessing(finalFrame)
      }
      try {
        await analysisChainRef.current
      } catch (e) {
        if ((e as any)?.name === 'AbortError') throw e
        throw e
      }

      if (analysisErrorRef.current != null) {
        throw analysisErrorRef.current
      }
      const mappedResults = combinedMappedResultsRef.current
      if (!mappedResults) throw new Error('Analysis failed')
      await new Promise((resolve) => setTimeout(resolve, 200))
      onAnalyzeAndProceed(mappedResults)
    } catch (e) {
      if ((e as any)?.name === 'AbortError') {
        return
      }
      console.error(e)
      setAnalysisFailed(true)
      setRunning(false)
      setAnalysisProgress(0)
      toast.error(extractUserFacingErrorMessage(e) || t('reading.timer.failedToAnalyzeImages'))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="">
      <h2 className="text-lg font-medium text-gray-900">{t('reading.timer.title')}</h2>
      <p className="text-sm text-tertiary">{t('reading.timer.desc')}</p>

      <div className="mt-6 mx-auto w-full max-w-fit rounded-3xl border-2 border-primary overflow-hidden bg-black/10">
        <div className="relative aspect-[3/4] bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover transition ${analyzing ? 'opacity-70 blur-[1px] scale-[1.01]' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {cameraReady && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div className="w-12 h-[90%] rounded-xl border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
            </div>
          )}

          {!cameraReady ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center text-sm text-white/80">
              {cameraError ? cameraError : t('reading.timer.startingCamera')}
            </div>
          ) : null}
          {cameraReady ? (
            <div className="absolute z-20 left-2 bottom-2 text-xs px-2 py-1 rounded bg-black/50 text-white">
              {qualityMessage}
            </div>
          ) : null}

          {analyzing ? (
            <div className="absolute inset-0 z-30 flex items-end p-3">
              <div className="w-full rounded-2xl bg-black/55 backdrop-blur-sm border border-white/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white min-w-0">
                    <div className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                    <div className="text-sm font-medium truncate">{t('reading.timer.analyzing')}</div>
                  </div>
                  {/* <button
                    type="button"
                    onClick={handleCancelAnalyze}
                    className="shrink-0 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-1.5"
                  >
                    {t('reading.timer.cancel')}
                  </button> */}
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white/60 transition-[width] duration-200 ease-linear"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-[#EBF2FF] px-4 py-3">
        <div className='flex justify-start items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="15" viewBox="0 0 17 15" fill="none">
            <path d="M1.66667 1.66667H4.16667L5.83333 0H10.8333L12.5 1.66667H15C15.442 1.66667 15.8659 1.84226 16.1785 2.15482C16.4911 2.46738 16.6667 2.89131 16.6667 3.33333V13.3333C16.6667 13.7754 16.4911 14.1993 16.1785 14.5118C15.8659 14.8244 15.442 15 15 15H1.66667C1.22464 15 0.800716 14.8244 0.488155 14.5118C0.175595 14.1993 0 13.7754 0 13.3333V3.33333C0 2.89131 0.175595 2.46738 0.488155 2.15482C0.800716 1.84226 1.22464 1.66667 1.66667 1.66667ZM8.33333 4.16667C7.22826 4.16667 6.16846 4.60565 5.38705 5.38705C4.60565 6.16846 4.16667 7.22826 4.16667 8.33333C4.16667 9.4384 4.60565 10.4982 5.38705 11.2796C6.16846 12.061 7.22826 12.5 8.33333 12.5C9.4384 12.5 10.4982 12.061 11.2796 11.2796C12.061 10.4982 12.5 9.4384 12.5 8.33333C12.5 7.22826 12.061 6.16846 11.2796 5.38705C10.4982 4.60565 9.4384 4.16667 8.33333 4.16667ZM8.33333 5.83333C8.99637 5.83333 9.63226 6.09672 10.1011 6.56557C10.5699 7.03441 10.8333 7.67029 10.8333 8.33333C10.8333 8.99637 10.5699 9.63226 10.1011 10.1011C9.63226 10.5699 8.99637 10.8333 8.33333 10.8333C7.67029 10.8333 7.03441 10.5699 6.56557 10.1011C6.09672 9.63226 5.83333 8.99637 5.83333 8.33333C5.83333 7.67029 6.09672 7.03441 6.56557 6.56557C7.03441 6.09672 7.67029 5.83333 8.33333 5.83333Z" fill="#3F78D8" />
          </svg>
          <div className="text-sm font-medium text-gray-900">{cameraReady ? t('reading.timer.cameraReady') : t('reading.timer.cameraUnavailable')}</div>
        </div>
        {needsTap ? (
          <button
            type="button"
            onClick={() => videoRef.current?.play()}
            className="mt-1 text-sm text-primary underline"
          >
            {t('reading.timer.tapToStartCamera')}
          </button>
        ) : (
          <div className="text-sm text-tertiary">
            {qualityOk ? t('reading.timer.positionStripStartTimer') : qualityMessage}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between bg-[#F5F6F6] rounded-full pe-4">
        <button
          onClick={handlePrimaryClick}
          disabled={analysisFailed || (!started && (!qualityOk || !cameraReady))}
          className={`px-6 py-3 rounded-full font-medium ${analysisFailed || (!started && (!qualityOk || !cameraReady)) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-primary text-white'}`}
        >
          {primaryButtonLabel}
        </button>
        <div className="flex flex-col items-end">
          <div className="text-2xl font-semibold text-gray-900">{displayTimerLabel}</div>
          <div className="text-xs text-tertiary">
            {captureProgress.allDone
              ? t('reading.timer.allCapturesComplete')
              : captureProgress.next != null
                ? t('reading.timer.nextAt', { seconds: captureProgress.next })
                : '—'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap w-full justify-between">
        {marks.map((m) => {
          const isAutoCaptureMark = autoCaptureAtSeconds.includes(m)
          const isCaptured = isAutoCaptureMark && captureProgress.captured.has(m)
          return (
            <div
              key={m}
              className={`px-4 py-2 rounded-xl border text-sm flex justify-start items-center gap-1 font-medium ${isCaptured
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
            >
              {
                isAutoCaptureMark ? (
                  isCaptured ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M4.54601 10L0 5.25988L1.1365 4.07484L4.54601 7.62994L11.8635 0L13 1.18503L4.54601 10Z" fill="#17803D" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" viewBox="0 0 15 18" fill="none">
                      <path d="M5 1.66667V0H10V1.66667H5ZM6.66667 10.8333H8.33333V5.83333H6.66667V10.8333ZM7.5 17.5C6.47222 17.5 5.50333 17.3022 4.59333 16.9067C3.68333 16.5111 2.88833 15.9728 2.20833 15.2917C1.52833 14.6106 0.990278 13.8153 0.594167 12.9058C0.198056 11.9964 0 11.0278 0 10C0 8.97222 0.198056 8.00333 0.594167 7.09333C0.990278 6.18333 1.52833 5.38833 2.20833 4.70833C2.88833 4.02833 3.68361 3.49028 4.59417 3.09417C5.50472 2.69806 6.47333 2.5 7.5 2.5C8.36111 2.5 9.1875 2.63889 9.97917 2.91667C10.7708 3.19444 11.5139 3.59722 12.2083 4.125L13.375 2.95833L14.5417 4.125L13.375 5.29167C13.9028 5.98611 14.3056 6.72917 14.5833 7.52083C14.8611 8.3125 15 9.13889 15 10C15 11.0278 14.8019 11.9967 14.4058 12.9067C14.0097 13.8167 13.4717 14.6117 12.7917 15.2917C12.1117 15.9717 11.3164 16.51 10.4058 16.9067C9.49528 17.3033 8.52667 17.5011 7.5 17.5ZM7.5 15.8333C9.11111 15.8333 10.4861 15.2639 11.625 14.125C12.7639 12.9861 13.3333 11.6111 13.3333 10C13.3333 8.38889 12.7639 7.01389 11.625 5.875C10.4861 4.73611 9.11111 4.16667 7.5 4.16667C5.88889 4.16667 4.51389 4.73611 3.375 5.875C2.23611 7.01389 1.66667 8.38889 1.66667 10C1.66667 11.6111 2.23611 12.9861 3.375 14.125C4.51389 15.2639 5.88889 15.8333 7.5 15.8333Z" fill="#839297" />
                    </svg>
                  )
                ) : null}

              {m}s
            </div>
          )
        })}
      </div>

      <div className="mt-6 space-y-3">
          <button
            onClick={handleRetry}
            disabled={analyzing}
            className={`w-full py-4 rounded-full font-medium ${!analyzing
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            {t('reading.timer.retry')}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!captureProgress.allDone || analyzing}
            className={`w-full py-4 rounded-full font-medium ${captureProgress.allDone && !analyzing
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            {analyzing ? t('reading.timer.analyzing') : t('reading.timer.analyzeProceed')}
          </button>
        <button onClick={onBack} className="w-full py-4 rounded-full bg-gray-100 text-gray-500 font-medium">
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
