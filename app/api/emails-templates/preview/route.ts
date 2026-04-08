import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return fallback
}

function toHtml(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed)
        return typeof parsed === 'string' ? parsed : trimmed
      } catch {
        return trimmed
      }
    }

    return value
  }

  if (typeof value === 'object' && value !== null && 'html' in value && typeof value.html === 'string') {
    return value.html
  }

  return ''
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const template = typeof body === 'object' && body !== null && 'emailTemplate' in body
    ? String(body.emailTemplate || '')
    : ''
  const payload = typeof body === 'object' && body !== null && 'payload' in body
    ? body.payload
    : null

  if (!template.trim()) {
    return NextResponse.json({ message: 'Informe o template para gerar a pre-visualizacao.' }, { status: 400 })
  }

  const payloadAsString = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {})
  const attempts = [
    {
      path: 'emails_templates/preview',
      body: {
        id_empresa: session.currentTenantId,
        email_template: template,
        payload: payloadAsString,
      },
    },
    {
      path: `emails_templates/preview?id_empresa=${encodeURIComponent(session.currentTenantId)}`,
      body: {
        email_template: template,
        payload: payloadAsString,
      },
    },
    {
      path: 'emails_templates/preview',
      body: {
        id_empresa: session.currentTenantId,
        email_template: template,
        payload: payload ?? {},
      },
    },
  ] as const

  let result = null as Awaited<ReturnType<typeof serverApiFetch>> | null
  for (const attempt of attempts) {
    const response = await serverApiFetch(attempt.path, {
      method: 'POST',
      token: session.token,
      tenantId: session.currentTenantId,
      body: attempt.body,
    })

    if (response.ok) {
      result = response
      break
    }

    if (response.status === 401 || response.status === 403) {
      result = response
      break
    }

    result = response
  }

  if (!result || !result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result?.payload, 'Nao foi possivel renderizar a pre-visualizacao do template.') },
      { status: result?.status || 400 },
    )
  }

  return NextResponse.json({
    html: toHtml(result.payload),
  })
}
