'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { transformTestBoxes } from '../../../lib/helper/transformRespose'
import { RESULT_ROWS } from './ReviewStep'
import { CapturedReadingImageDraft, ReviewSelectionMap } from './types'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

type Props = {
  selectedSeconds: number
  onChangeSelectedSeconds: (nextSeconds: number) => void
  onBack: () => void
  onAnalyzeAndProceed: (
    results: ReviewSelectionMap,
    rawApiResults: Array<{ atSeconds: number; time: string; response: any }>,
    capturedImages: CapturedReadingImageDraft[],
  ) => void
  onImagesChange?: (images: CapturedReadingImageDraft[]) => void
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

function createStorageDataUrl(canvas: HTMLCanvasElement): string {
  const maxWidth = 1280
  if (!canvas.width || !canvas.height) return ''
  if (canvas.width <= maxWidth) return canvas.toDataURL('image/jpeg', 0.82)

  const scale = maxWidth / canvas.width
  const targetWidth = maxWidth
  const targetHeight = Math.max(1, Math.round(canvas.height * scale))
  const resized = document.createElement('canvas')
  resized.width = targetWidth
  resized.height = targetHeight
  const resizedCtx = resized.getContext('2d')
  if (!resizedCtx) return canvas.toDataURL('image/jpeg', 0.82)
  resizedCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
  return resized.toDataURL('image/jpeg', 0.82)
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

export default function TimerStep({ selectedSeconds, onChangeSelectedSeconds, onBack, onAnalyzeAndProceed, onImagesChange }: Props) {
  const onImagesChangeRef = useRef(onImagesChange)
  onImagesChangeRef.current = onImagesChange
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
  const rawApiResultsRef = useRef<Array<{ atSeconds: number; time: string; response: any }>>([])

  const [cameraError, setCameraError] = useState('')
  const [needsTap, setNeedsTap] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [images, setImages] = useState<CapturedReadingImageDraft[]>([])
  const imagesRef = useRef<CapturedReadingImageDraft[]>([])
  imagesRef.current = images
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
    rawApiResultsRef.current = []
    rawApiResultsRef.current = []
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
      rawApiResultsRef.current = [
        ...rawApiResultsRef.current,
        {
          atSeconds: frame.atSeconds,
          time: frame.time,
          response: raw,
        },
      ].sort((a, b) => a.atSeconds - b.atSeconds)
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
      const storageDataUrl = createStorageDataUrl(canvas)
      const imageBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      if (atSeconds === requiredTotalSeconds) {
        finalFrameRef.current = { atSeconds, time: String(atSeconds), image: imageBase64 }
      } else {
        enqueueFrameForProcessing({ atSeconds, time: String(atSeconds), image: imageBase64 })
      }

      const nextImages = [
        ...imagesRef.current,
        {
          atSeconds,
          dataUrl: storageDataUrl || dataUrl,
          capturedAt: new Date().toISOString(),
        },
      ]
      setImages(nextImages)
      onImagesChangeRef.current?.(nextImages)
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
      onAnalyzeAndProceed(mappedResults, rawApiResultsRef.current, images)
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

  const displayElapsed = useMemo(() => {
    const e = Math.max(0, selectedSeconds - secondsLeft)
    return String(e).padStart(2, '0')
  }, [secondsLeft, selectedSeconds])

  return (
    <div className="">
      {/* Title + Camera card */}
      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-[20px] font-bold text-black/70">{t('reading.timer.title')}</h2>
          <p className="mt-1 text-[13px] text-[#6B7280] leading-[18px]">{t('reading.timer.desc')}</p>
        </div>

        {/* Camera view */}
        <div className="relative bg-black" style={{ aspectRatio: '3/4' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover transition ${analyzing ? 'opacity-70 blur-[1px]' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Strip guide overlay */}
          {cameraReady && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div className="w-10 h-[88%] rounded-xl border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
          )}

          {/* Camera not ready */}
          {!cameraReady && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <span className="text-sm text-white/80 px-4 text-center">
                {cameraError || t('reading.timer.startingCamera')}
              </span>
            </div>
          )}

          {/* Tap to play */}
          {needsTap && (
            <button
              type="button"
              onClick={() => videoRef.current?.play()}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black/60 rounded-full text-white text-sm"
            >
              {t('reading.timer.tapToStartCamera')}
            </button>
          )}

          {/* Quality / camera status badge */}
          {cameraReady && !analyzing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
              <div className={`px-4 py-2 rounded-full text-[13px] font-semibold ${qualityOk ? 'bg-[#F5A623] text-white' : 'bg-black/60 text-white/90'}`}>
                {qualityOk
                  ? t('reading.timer.cameraReadyPosition')
                  : cameraError
                    ? cameraError
                    : qualityMessage}
              </div>
            </div>
          )}

          {/* Analyzing overlay */}
          {analyzing && (
            <div className="absolute inset-0 z-30 flex items-end p-3">
              <div className="w-full rounded-2xl bg-black/55 backdrop-blur-sm border border-white/10 px-4 py-3">
                <div className="flex items-center gap-2 text-white">
                  <div className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                  <div className="text-sm font-medium">{t('reading.timer.analyzing')}</div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="progress-bar h-full bg-white/60 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>{/* end white card */}

      {/* Timer row: circle + start button */}
      <div className="mt-4 flex items-center gap-3">
        {/* Circular timer display */}
        <div className="w-[72px] h-[72px] rounded-full border-2 border-[#E5E7EB] bg-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
          <div className="flex items-end gap-0.5">
            <span className="text-[22px] font-bold text-black/70 leading-none">{displayElapsed}</span>
            <span className="text-[11px] font-medium text-[#9CA3AF] mb-0.5">s</span>
          </div>
          <div className="text-[9px] text-[#9CA3AF] font-medium uppercase tracking-wide">
            DE {selectedSeconds}S
          </div>
        </div>

        {/* Start / pause button */}
        <button
          onClick={handlePrimaryClick}
          disabled={analysisFailed || (!started && !cameraReady)}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-[15px] transition-all ${analysisFailed || (!started && !cameraReady)
            ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            : 'bg-primary text-white shadow-sm'
            }`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M7 2L20 12L7 22V2Z" />
          </svg>
          {primaryButtonLabel}
        </button>
      </div>

      {/* Time chips */}
      <div className="mt-3 flex gap-2 justify-center">
        {marks.map((m) => {
          const isAutoCaptureMark = autoCaptureAtSeconds.includes(m)
          const isCaptured = isAutoCaptureMark && captureProgress.captured.has(m)
          const isSelected = m === selectedSeconds
          return (
            <button
              key={m}
              type="button"
              onClick={() => !started && onChangeSelectedSeconds(m)}
              disabled={started}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all ${isCaptured
                ? 'bg-primary border-primary text-white'
                : isSelected && !started
                  ? 'bg-white border-primary text-primary'
                  : 'bg-white border-[#E5E7EB] text-[#6B7280]'
                }`}
            >
              {m}s
            </button>
          )
        })}
      </div>

      <div className="mt-5 space-y-3">
        <button
          onClick={handleAnalyze}
          disabled={!captureProgress.allDone || analyzing}
          className={`w-full py-4 rounded-full font-semibold text-[15px] transition-all ${captureProgress.allDone && !analyzing
            ? 'bg-primary text-white shadow-sm'
            : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
        >
          {analyzing ? t('reading.timer.analyzing') : t('reading.timer.analyzeProceed')}
        </button>

        {(captureProgress.allDone || analysisFailed || started) && (
          <button
            onClick={handleRetry}
            disabled={analyzing}
            className={`w-full py-4 rounded-full font-medium text-[15px] border border-[#E5E7EB] bg-white text-[#374151] transition-all ${analyzing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {t('reading.timer.reiniciar')}
          </button>
        )}

        <button
          onClick={onBack}
          className="w-full py-4 rounded-full border border-[#E5E7EB] bg-white text-[#374151] font-medium text-[15px]"
        >
          {t('reading.timer.cancel')}
        </button>
      </div>
    </div>
  )
}
