import { createHmac, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildCompanyParametersPath } from '@/src/lib/company-parameters-query'
import { serverApiFetch } from '@/src/services/http/server-api'

const RD_ECOM_OAUTH_COOKIE = 'admin_v2_rd_ecom_oauth'
const RD_ECOM_OAUTH_TTL_SECONDS = 60 * 15

type RdEcomOauthContext = {
  state: string
  tenantId: string
  clientId: string
  clientSecret: string
  createdAt: number
}

function getSecret() {
  return process.env.AUTH_SESSION_SECRET || 'admin-v2-web-dev-secret'
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function encodeContext(context: RdEcomOauthContext) {
  const payload = Buffer.from(JSON.stringify(context)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function shouldUseSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE === 'true') {
    return true
  }

  if (process.env.AUTH_COOKIE_SECURE === 'false') {
    return false
  }

  return process.env.NODE_ENV === 'production'
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if (
      'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  return fallback
}

function extractParameter(payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return ''
  }

  const parameter = payload.data.find((item) => (
    typeof item === 'object'
    && item !== null
    && 'chave' in item
    && item.chave === key
  ))

  return typeof parameter === 'object' && parameter !== null && 'parametros' in parameter
    ? String(parameter.parametros ?? '').trim()
    : ''
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = (await request.json()) as {
    clientId?: string
    clientSecret?: string
    useCurrentSecret?: boolean
  }

  const clientId = String(body.clientId ?? '').trim()
  let clientSecret = String(body.clientSecret ?? '').trim()

  if (!clientId) {
    return NextResponse.json({ message: 'Informe o ID do aplicativo para conectar com a RD Station.' }, { status: 400 })
  }

  if (!clientSecret && body.useCurrentSecret) {
    const currentResult = await serverApiFetch(buildCompanyParametersPath(session.currentTenantId, ['rd_ecom_client_secret']), {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })

    if (!currentResult.ok) {
      return NextResponse.json(
        { message: getErrorMessage(currentResult.payload, 'Não foi possível carregar a senha atual do aplicativo RD Station.') },
        { status: currentResult.status || 400 },
      )
    }

    clientSecret = extractParameter(currentResult.payload, 'rd_ecom_client_secret')
  }

  if (!clientSecret) {
    return NextResponse.json({ message: 'Informe a senha do aplicativo para conectar com a RD Station.' }, { status: 400 })
  }

  const state = randomBytes(16).toString('hex')
  const callbackUrl = new URL('/api/integracoes/marketing/rd-ecom-oauth/callback', request.nextUrl.origin).toString()
  const oauthUrl = new URL('https://api.rd.services/auth/dialog')
  oauthUrl.searchParams.set('client_id', clientId)
  oauthUrl.searchParams.set('redirect_uri', callbackUrl)
  oauthUrl.searchParams.set('response_type', 'code')
  oauthUrl.searchParams.set('state', state)

  const response = NextResponse.json({
    data: {
      oauth_url: oauthUrl.toString(),
      callback_url: callbackUrl,
    },
  })

  response.cookies.set({
    name: RD_ECOM_OAUTH_COOKIE,
    value: encodeContext({
      state,
      tenantId: session.currentTenantId,
      clientId,
      clientSecret,
      createdAt: Date.now(),
    }),
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/api/integracoes/marketing/rd-ecom-oauth',
    maxAge: RD_ECOM_OAUTH_TTL_SECONDS,
  })

  return response
}
