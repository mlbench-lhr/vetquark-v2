import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_INTERPRET_URL = 'https://dataset-api-334819527847.europe-west1.run.app/interpret'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const panelType = typeof (body as any)?.panel_type === 'string' ? String((body as any).panel_type).trim() : ''
  const fastingRaw = (body as any)?.fasting
  const fasting: string | undefined =
    fastingRaw === 'fast' || fastingRaw === 'non-fast' ? fastingRaw : undefined
  const resultsRaw = Array.isArray((body as any)?.results) ? ((body as any).results as any[]) : []

  if (!panelType || !resultsRaw.length) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const results = resultsRaw.map((item) => {
    const out: Record<string, unknown> = {
      key: String(item?.key || '').trim(),
      label: String(item?.label || '').trim(),
      unit: String(item?.unit || ''),
      status: String(item?.status || '').trim(),
      selectedIndex: Number(item?.selectedIndex),
      valueLabel: String(item?.valueLabel || '').trim(),
    }
    const numericValue = item?.numericValue
    out.numericValue = numericValue == null ? null : Number(numericValue)
    return out
  })

  const hasInvalid = results.some(
    (r) =>
      !String(r.key || '') ||
      !String(r.label || '') ||
      !String(r.status || '') ||
      !Number.isFinite(Number(r.selectedIndex)) ||
      !String(r.valueLabel || ''),
  )
  if (hasInvalid) {
    return NextResponse.json({ error: 'Invalid results payload' }, { status: 400 })
  }

  const url = String(process.env.STRIP_INTERPRET_URL || DEFAULT_INTERPRET_URL).trim()
  const bearer = String(
    process.env.STRIP_INTERPRET_BEARER || process.env.STRIP_PROCESS_SINGLE_BEARER || '',
  ).trim()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (bearer) {
    headers.Authorization = bearer.startsWith('Bearer ') ? bearer : `Bearer ${bearer}`
  }

  const upstream = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ panel_type: panelType, ...(fasting !== undefined ? { fasting } : {}), results }),
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
