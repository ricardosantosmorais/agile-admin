import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }
  return fallback
}

export async function GET() {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const params = new URLSearchParams({
    page: '1',
    perpage: '10000',
    order: 'nivel,posicao,nome',
    sort: 'asc,asc,asc',
    fields: 'departamentos.id,departamentos.nome,departamentos.nivel,departamentos.posicao,departamentos.ativo,departamentos.icone,departamentos.id_departamento_pai',
  })

  const result = await serverApiFetch(`departamentos?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os departamentos.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[] }
  return NextResponse.json({
    data: Array.isArray(payload?.data) ? payload.data : [],
  })
}
