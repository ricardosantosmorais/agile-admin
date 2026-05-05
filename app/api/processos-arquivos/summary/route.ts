import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

const STATUSES = ['rascunho', 'criado', 'iniciado', 'sucesso', 'erro'] as const

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

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

function appendSearchFilters(query: URLSearchParams, search: URLSearchParams) {
  const id = String(search.get('id') || '').trim()
  const usuario = String(search.get('usuario') || '').trim()
  const dataInicio = String(search.get('data_inicio') || '').trim()
  const dataFim = String(search.get('data_fim') || '').trim()

  if (id) query.set('id', id)
  if (usuario) query.set('usuario:nome::like', usuario)
  if (dataInicio) query.set('created_at::ge', `${dataInicio} 00:00:00`)
  if (dataFim) query.set('created_at::le', `${dataFim} 23:59:59`)
}

async function countProcesses(input: {
  token: string
  tenantId: string
  search: URLSearchParams
  status?: string
}) {
  const query = new URLSearchParams({
    page: '1',
    perpage: '1',
    id_empresa: input.tenantId,
    tipo: 'importacao_planilha',
  })

  appendSearchFilters(query, input.search)
  if (input.status) query.set('status', input.status)

  const result = await serverApiFetch(`processos?${query.toString()}`, {
    method: 'GET',
    token: input.token,
    tenantId: input.tenantId,
  })

  if (!result.ok) {
    throw new Error(getErrorMessage(result.payload, 'Não foi possível carregar o resumo dos processos.'))
  }

  return asNumber(asRecord(asRecord(result.payload).meta).total, 0)
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  try {
    const [total, ...statusCounts] = await Promise.all([
      countProcesses({
        token: session.token,
        tenantId: session.currentTenantId,
        search: request.nextUrl.searchParams,
      }),
      ...STATUSES.map((status) => countProcesses({
        token: session.token,
        tenantId: session.currentTenantId,
        search: request.nextUrl.searchParams,
        status,
      })),
    ])

    const byStatus = Object.fromEntries(STATUSES.map((status, index) => [status, statusCounts[index] ?? 0]))

    return NextResponse.json({
      total,
      draft: byStatus.rascunho,
      running: (byStatus.criado || 0) + (byStatus.iniciado || 0),
      success: byStatus.sucesso,
      error: byStatus.erro,
      byStatus,
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível carregar o resumo dos processos.' },
      { status: 400 },
    )
  }
}
