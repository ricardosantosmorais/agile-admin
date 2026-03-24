import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  return typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
      ? payload.error.message
      : fallback
}

function extractRecords(payload: unknown) {
  if (typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data)) {
    return payload.data as Array<Record<string, unknown>>
  }

  return []
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json() as Record<string, unknown>
  const payload = {
    id: body.id,
    id_usuario: body.id,
    email: body.email,
    perfil: body.perfil,
    senha: body.senha,
    confirmacao: body.confirmacao,
    id_empresa: session.currentTenantId,
  }

  let result = await serverApiFetch('usuarios/senha/alterar', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  const message = getErrorMessage(result.payload, '')
  if (!result.ok && message === 'Usuário não encontrado' && typeof body.email === 'string' && body.email.trim()) {
    const lookup = await serverApiFetch(
      `usuarios?perpage=1&id_empresa=${encodeURIComponent(session.currentTenantId)}&email=${encodeURIComponent(body.email.trim())}&perfil::ne=empresa`,
      {
        method: 'GET',
        token: session.token,
        tenantId: session.currentTenantId,
      },
    )

    if (lookup.ok) {
      const found = extractRecords(lookup.payload)[0]
      const resolvedId = typeof found?.id === 'string' ? found.id : ''
      if (resolvedId) {
        result = await serverApiFetch('usuarios/senha/alterar', {
          method: 'POST',
          token: session.token,
          tenantId: session.currentTenantId,
          body: {
            ...payload,
            id: resolvedId,
            id_usuario: resolvedId,
          },
        })
      }
    }
  }

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel alterar a senha.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
