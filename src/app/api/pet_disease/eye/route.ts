import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_EYE_URL = 'https://pet-disease-334819527847.europe-west1.run.app/eye'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const imageBase64 = typeof (body as any)?.image_base64 === 'string' ? String((body as any).image_base64).trim() : ''

  if (!imageBase64) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const url = String(process.env.PET_DISEASE_EYE_URL || DEFAULT_EYE_URL).trim()
  const bearer = String(process.env.PET_DISEASE_EYE_BEARER || '').trim()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (bearer) {
    headers.Authorization = bearer.startsWith('Bearer ') ? bearer : `Bearer ${bearer}`
  }

  const upstream = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image_base64: imageBase64 }),
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
      },
      { status: 502 },
    )
  }

  const json = await upstream.json().catch(() => null)
  return NextResponse.json(json, { status: upstream.status })
}
