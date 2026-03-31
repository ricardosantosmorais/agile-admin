import { NextRequest, NextResponse } from 'next/server'
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server'
import { extractApiErrorMessage, mapAuthSession } from '@/src/features/auth/services/auth-mappers'
import { writeAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function normalizeLoopbackIp(value: string | null) {
  const candidate = value?.trim()
  if (!candidate) {
    return null
  }

  if (
    candidate === '127.0.0.1'
    || candidate === '::ffff:127.0.0.1'
    || candidate === '0:0:0:0:0:ffff:127.0.0.1'
    || candidate === 'localhost'
  ) {
    return '::1'
  }

  return candidate
}

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0] ?? null
  return (
    normalizeLoopbackIp(forwarded)
    || normalizeLoopbackIp(request.headers.get('x-real-ip'))
    || '::1'
  )
}

function isAuthenticationChallenge(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('autentica') && normalized.includes('e-mail')
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string
    senha?: string
    codigoAutenticacao?: string
    tenantId?: string
  }

  const payload = {
    email: body.email ?? '',
    senha: body.senha ?? '',
    codigo_autenticacao: body.codigoAutenticacao ?? '',
    ip: getRequestIp(request),
  }

  if (body.tenantId) {
    Object.assign(payload, { id_empresa: body.tenantId })
  }

  const result = await serverApiFetch('login/entrar', {
    method: 'POST',
    tenantId: body.tenantId,
    body: payload,
  })

  if (!result.ok) {
    console.error('auth.login.failed', {
      status: result.status,
      apiBaseUrl: process.env.ADMIN_URL_API_V3 || process.env.NEXT_PUBLIC_API_V3_URL || '',
      payloadType: typeof result.payload,
      payload: typeof result.payload === 'string' ? result.payload.slice(0, 500) : result.payload,
    })

    const message = extractApiErrorMessage(result.payload, 'Não foi possível entrar no painel.')

    if (isAuthenticationChallenge(message)) {
      return NextResponse.json({
        requiresTwoFactor: true,
        message,
      })
    }

    return NextResponse.json(
      {
        message,
      },
      { status: result.status || 400 },
    )
  }

  const initialSession = mapAuthSession(result.payload)
  const enrichedPayload = await enrichMasterPayload(
    result.payload,
    initialSession.token,
    body.tenantId || initialSession.currentTenant.id,
  )
  const session = mapAuthSession(enrichedPayload)
  const response = NextResponse.json({
    requiresTwoFactor: false,
    session,
  })
  writeAuthSession(response, {
    token: session.token,
    currentTenantId: session.currentTenant.id,
    currentUserId: session.user.id,
  })
  return response
}
