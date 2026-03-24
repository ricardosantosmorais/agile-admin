import { NextRequest, NextResponse } from 'next/server'
import { mapDashboardPayloadToSnapshot } from '@/src/features/dashboard/services/dashboard-mappers'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function extractMessage(payload: unknown) {
  if (typeof payload === 'string' && payload) {
    return payload
  }

  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = payload.message
    return typeof message === 'string' && message ? message : ''
  }

  return ''
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()

  if (!session?.token || !session.currentTenantId) {
    return NextResponse.json({ message: 'Sessão não encontrada.' }, { status: 401 })
  }

  const body = (await request.json()) as {
    startDate?: string
    endDate?: string
    rangeLabel?: string
    tenantId?: string
    blocks?: string[]
    forceRefresh?: boolean
  }

  const tenantId = body.tenantId || session.currentTenantId
  const result = await serverApiFetch('relatorios/dashboard-v2', {
    method: 'POST',
    token: session.token,
    tenantId,
    body: {
      data_inicio: body.startDate ?? '',
      data_fim: body.endDate ?? '',
      ...(body.blocks?.length ? { blocos: body.blocks.join(',') } : {}),
      ...(body.forceRefresh ? { sem_cache: 1 } : {}),
    },
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: extractMessage(result.payload) || 'Não foi possível carregar o dashboard.' },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(mapDashboardPayloadToSnapshot(result.payload, body.rangeLabel ?? 'Período selecionado'))
}
