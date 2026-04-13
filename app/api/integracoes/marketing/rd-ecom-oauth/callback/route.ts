import { createHmac } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

const RD_ECOM_OAUTH_COOKIE = 'admin_v2_rd_ecom_oauth'
const RD_ECOM_OAUTH_TTL_MS = 60 * 15 * 1000

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

function decodeContext(value: string): RdEcomOauthContext | null {
  const [payload, signature] = value.split('.')
  if (!payload || !signature || sign(payload) !== signature) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as RdEcomOauthContext
  } catch {
    return null
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function popupResponse(request: NextRequest, payload: Record<string, unknown>) {
  const origin = request.nextUrl.origin
  const body = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>RD Station</title>
  </head>
  <body>
    <p>${escapeHtml(String(payload.message ?? 'Processando retorno da RD Station.'))}</p>
    <script>
      (function () {
        var payload = ${JSON.stringify(payload)};
        if (window.opener) {
          window.opener.postMessage(payload, ${JSON.stringify(origin)});
        }
        window.close();
      }());
    </script>
  </body>
</html>`

  const response = new NextResponse(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
  response.cookies.set({
    name: RD_ECOM_OAUTH_COOKIE,
    value: '',
    path: '/api/integracoes/marketing/rd-ecom-oauth',
    maxAge: 0,
  })
  return response
}

function extractTokenMessage(payload: unknown) {
  if (typeof payload === 'object' && payload !== null) {
    if ('error_description' in payload && typeof payload.error_description === 'string') {
      return payload.error_description
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }

    if (
      'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }
  }

  return 'Não foi possível concluir a conexão com a RD Station.'
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state')?.trim() ?? ''
  const code = request.nextUrl.searchParams.get('code')?.trim() ?? ''
  const error = request.nextUrl.searchParams.get('error')?.trim() ?? ''
  const errorDescription = request.nextUrl.searchParams.get('error_description')?.trim() ?? ''

  if (error) {
    return popupResponse(request, {
      type: 'rd_ecom_oauth_result',
      success: false,
      message: errorDescription || 'A autorização na RD Station foi cancelada ou recusada.',
    })
  }

  const context = decodeContext(request.cookies.get(RD_ECOM_OAUTH_COOKIE)?.value ?? '')
  if (!context || !state || !code || context.state !== state) {
    return popupResponse(request, {
      type: 'rd_ecom_oauth_result',
      success: false,
      message: 'Não foi possível validar a conexão com a RD Station. Refaça a conexão.',
    })
  }

  if (!context.createdAt || Date.now() - context.createdAt > RD_ECOM_OAUTH_TTL_MS) {
    return popupResponse(request, {
      type: 'rd_ecom_oauth_result',
      success: false,
      message: 'A conexão expirou. Inicie novamente a conexão com a RD Station.',
    })
  }

  const callbackUrl = new URL('/api/integracoes/marketing/rd-ecom-oauth/callback', request.nextUrl.origin).toString()
  let response: Response
  try {
    response = await fetch('https://api.rd.services/auth/token?token_by=code', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: context.clientId,
        client_secret: context.clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
      cache: 'no-store',
    })
  } catch {
    return popupResponse(request, {
      type: 'rd_ecom_oauth_result',
      success: false,
      message: 'Erro ao conectar com a RD Station.',
    })
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : { message: await response.text() }
  const refreshToken = typeof payload === 'object' && payload !== null && 'refresh_token' in payload
    ? String(payload.refresh_token ?? '').trim()
    : ''

  if (!response.ok || !refreshToken) {
    return popupResponse(request, {
      type: 'rd_ecom_oauth_result',
      success: false,
      message: extractTokenMessage(payload),
    })
  }

  return popupResponse(request, {
    type: 'rd_ecom_oauth_result',
    success: true,
    refresh_token: refreshToken,
    message: 'Conexão com a RD Station realizada com sucesso.',
  })
}
