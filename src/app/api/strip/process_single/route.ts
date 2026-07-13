import { NextRequest, NextResponse } from 'next/server'

const BUILD_STAMP = 'timer-fix-2026-07-14-a7b3'
const DEFAULT_PROCESS_SINGLE_URL = 'https://test-strip-app-334819527847.europe-west1.run.app/process_single'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const image = typeof (body as any)?.image === 'string' ? String((body as any).image).trim() : ''
  const timeRaw = (body as any)?.time
  const time = typeof timeRaw === 'number' || typeof timeRaw === 'string' ? String(timeRaw).trim() : ''

  if (!image || !time) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: { 'x-ui-build-stamp': BUILD_STAMP } })
  }

  let normalizedImage = image
  const imageLenFromBody = image.length
  let isUrl = false
  let hasDataPrefix = false

  if (image.startsWith('http://') || image.startsWith('https://')) {
    isUrl = true
  } else if (image.startsWith('data:')) {
    hasDataPrefix = true
    normalizedImage = image.split(',')[1] || ''
    if (normalizedImage) {
      normalizedImage = normalizedImage.replace(/\s/g, '')
      normalizedImage = normalizedImage.replace(/-/g, '+').replace(/_/g, '/')
      while (normalizedImage.length % 4 !== 0) {
        normalizedImage += '='
      }
    }
  } else {
    normalizedImage = image.replace(/\s/g, '')
    normalizedImage = normalizedImage.replace(/-/g, '+').replace(/_/g, '/')
    while (normalizedImage.length % 4 !== 0) {
      normalizedImage += '='
    }
  }

  if (!normalizedImage) {
    return NextResponse.json(
      {
        error: 'Invalid image after normalization',
        debug: {
          buildStamp: BUILD_STAMP,
          imageLenFromBody,
          normalizedLen: null,
          isUrl,
          hasDataPrefix,
        },
      },
      { status: 400, headers: { 'x-ui-build-stamp': BUILD_STAMP } }
    )
  }

  const url = String(process.env.STRIP_PROCESS_SINGLE_URL || DEFAULT_PROCESS_SINGLE_URL).trim()
  const bearer = String(process.env.STRIP_PROCESS_SINGLE_BEARER || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjUzMDcyNGQ0OTE3M2EzZWQ2YjRhMDBhYTYzNDQyMDMwMGQ3MmFlNWIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzMjU1NTk0MDU1OS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjMyNTU1OTQwNTU5LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE1MjA2MjQ5NDEwNjc2MzQxMDA5IiwiZW1haWwiOiJtbGJlbmNocHZ0bHRkQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoieG9iQ2oxdlhhYS1JZzlBR1dfLXk4USIsImlhdCI6MTc3MzEzNjI2NiwiZXhwIjoxNzczMTM5ODY2fQ.eQSsvORr_MvDBsKL3IOTFM0URfnHLQsRAq60ysXTx-Y521voAbgK-MzOcHLogqaGw4IAJQu_i_GSjuSNuMqDel2bOkMFDwfjnaTl_WtInceVYuMBmnFbkNNHsXOn4BtQrnlpqVWn_l_PUGOB4VXGOTitLapk5wNd1hnXCwmTegv-lWljvf9DVVi9TCcbssAFWY_G6XzLPxaTIsZinoVbm-trsLtTczTo8HJDK8HT-iS2s-g15-b5pQEcflKXak6IOmU_nFBnevr1bX45Qh9WMXBoW56X5udDQR0cGmIXaJznkDj94Eec9K2P5sxa6VIrUGtRAJH-27gIZsZo53xQ').trim()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (bearer) {
    headers.Authorization = bearer.startsWith('Bearer ') ? bearer : `Bearer ${bearer}`
  }

  const upstream = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image: normalizedImage, time }),
    cache: 'no-store',
  })

  const ct = String(upstream.headers.get('content-type') || '')
  if (!ct.includes('application/json')) {
    const text = await upstream.text().catch(() => '')
    return NextResponse.json(
      {
        error: 'Upstream returned non-JSON response',
        status: upstream.status,
        bodySnippet: text.slice(0, 300),
        debug: {
          buildStamp: BUILD_STAMP,
          imageLenFromBody,
          normalizedLen: normalizedImage.length,
          isUrl,
          hasDataPrefix,
        },
      },
      { status: 502, headers: { 'x-ui-build-stamp': BUILD_STAMP } }
    )
  }

  const json = await upstream.json().catch(() => null)
  return NextResponse.json(json, { status: upstream.status, headers: { 'x-ui-build-stamp': BUILD_STAMP } })
}

