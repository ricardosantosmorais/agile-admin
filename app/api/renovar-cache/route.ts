import { NextResponse } from 'next/server'
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server'
import { extractApiErrorMessage, mapAuthSession } from '@/src/features/auth/services/auth-mappers'
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

function resolvePlatformToken(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return ''
  }

  const first = payload.data[0]
  if (typeof first !== 'object' || first === null || !('parametros' in first) || typeof first.parametros !== 'string') {
    return ''
  }

  return first.parametros.trim()
}

export async function POST() {
  const storedSession = await readAuthSession()
  if (!storedSession) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { token, currentTenantId } = storedSession

  const validated = await serverApiFetch('login/validar', {
    method: 'POST',
    token,
    tenantId: currentTenantId,
  })

  if (!validated.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(validated.payload, 'Sessão inválida.') },
      { status: 401 },
    )
  }

  const enrichedPayload = await enrichMasterPayload(validated.payload, token, currentTenantId)
  const session = mapAuthSession(enrichedPayload)
  const clusterApi = (session.currentTenant.clusterApi || '').replace(/\/+$/, '')

  const tokenResponse = await serverApiFetch(
    `empresas/parametros?id_empresa=${encodeURIComponent(currentTenantId)}&chave=agileecommerce_api_token_empresa&order=chave,posicao&perpage=1`,
    {
      method: 'GET',
      token,
      tenantId: currentTenantId,
    },
  )

  const platformToken = resolvePlatformToken(tokenResponse.payload)

  async function clearByV3Fallback() {
    return serverApiFetch('cache/clear', {
      method: 'POST',
      token,
      tenantId: currentTenantId,
    })
  }

  let result: Awaited<ReturnType<typeof clearByV3Fallback>>

  if (!clusterApi) {
    result = await clearByV3Fallback()
  } else {
    const response = await fetch(`${clusterApi}/cache/clear`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Perfil: 'administrador',
        Empresa: currentTenantId,
        'X-Id-Empresa': currentTenantId,
        Authorization: `Bearer ${platformToken || token}`,
      },
      cache: 'no-store',
    })

    const contentType = response.headers.get('content-type') ?? ''
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    if (response.status === 404) {
      result = await clearByV3Fallback()
    } else {
      result = {
        ok: response.ok,
        status: response.status,
        payload,
      }
    }
  }

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível renovar o cache.') },
      { status: result.status || 400 },
    )
  }

  const message = getErrorMessage(result.payload, 'Cache renovado com sucesso.')
  return NextResponse.json({ message })
}
