import { NextResponse } from 'next/server'
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const query = new URLSearchParams({
    id_empresa: session.currentTenantId,
    id,
    tipo: 'imagens',
    embed: 'usuario,logs',
    perpage: '1',
  })

  const result = await serverApiFetch(`processos?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível carregar o processo de imagens.') },
      { status: result.status || 400 },
    )
  }

  const payload = result.payload
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return NextResponse.json({ message: 'Processo não encontrado.' }, { status: 404 })
  }

  const process = payload.data[0]
  if (!process || typeof process !== 'object') {
    return NextResponse.json({ message: 'Processo não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(process)
}
