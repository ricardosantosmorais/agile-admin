import { NextResponse } from 'next/server'
import { buildWizardDraftFromApi } from '@/src/features/excecoes-produtos/services/excecoes-produtos-mappers'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapError(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallback
}

const EMBED_QUERY = 'cliente,produto,produto_pai,marca,grupo,tabela_preco,filial,canal_distribuicao_cliente,canal_distribuicao_produto,colecao,departamento,filhos,fornecedor,rede,segmento,praca,supervisor,vendedor,promocao,forma_pagamento,condicao_pagamento'

async function fetchChildren(parentId: string, token: string, tenantId: string) {
  const result = await serverApiFetch(
    `excecoes_produtos?id_pai=${encodeURIComponent(parentId)}&page=1&perpage=200&order=created_at&sort=asc&embed=${EMBED_QUERY}`,
    {
      method: 'GET',
      token,
      tenantId,
    },
  )

  if (!result.ok) return []
  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  return Array.isArray(payload.data) ? payload.data : []
}

function hasResolvedClient(row: Record<string, unknown>) {
  const cliente = row.cliente
  if (!cliente || typeof cliente !== 'object') return false
  const entity = cliente as Record<string, unknown>
  return Boolean(String(entity.nome_fantasia || entity.razao_social || entity.nome || '').trim())
}

async function fetchClientMap(rows: Array<Record<string, unknown>>, token: string, tenantId: string) {
  const ids = [...new Set(
    rows
      .map((row) => (typeof row.id_cliente === 'string' ? row.id_cliente.trim() : ''))
      .filter(Boolean),
  )]

  const entries = await Promise.all(
    ids.map(async (id) => {
      const result = await serverApiFetch(`clientes?id=${encodeURIComponent(id)}&page=1&perpage=1`, {
        method: 'GET',
        token,
        tenantId,
      })

      if (!result.ok) return [id, null] as const
      const payload = result.payload as { data?: Array<Record<string, unknown>> }
      const record = Array.isArray(payload.data) && payload.data[0] ? payload.data[0] : null
      return [id, record] as const
    }),
  )

  return new Map(entries)
}

async function enrichRows(rows: Array<Record<string, unknown>>, token: string, tenantId: string) {
  const clientMap = await fetchClientMap(rows, token, tenantId)

  return rows.map((row) => {
    const clientId = typeof row.id_cliente === 'string' ? row.id_cliente.trim() : ''
    if (!clientId || hasResolvedClient(row)) return row

    const client = clientMap.get(clientId)
    if (!client) return row

    return {
      ...row,
      cliente: client,
    }
  })
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`excecoes_produtos?id=${encodeURIComponent(id)}&page=1&perpage=1&embed=${EMBED_QUERY}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível carregar a exceção.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  const record = Array.isArray(payload.data) ? payload.data[0] : null
  if (!record) {
    return NextResponse.json({ message: 'Exceção não encontrada.' }, { status: 404 })
  }

  const parentId = typeof record.id_pai === 'string' ? record.id_pai.trim() : ''
  const normalizedRecord = parentId
    ? await (async () => {
        const parentResult = await serverApiFetch(`excecoes_produtos?id=${encodeURIComponent(parentId)}&page=1&perpage=1&embed=${EMBED_QUERY}`, {
          method: 'GET',
          token: session.token,
          tenantId: session.currentTenantId,
        })

        if (!parentResult.ok) return record
        const parentPayload = parentResult.payload as { data?: Array<Record<string, unknown>> }
        return Array.isArray(parentPayload.data) && parentPayload.data[0] ? parentPayload.data[0] : record
      })()
    : record

  const normalizedParentId = typeof normalizedRecord.id === 'string' ? normalizedRecord.id.trim() : ''
  const filhos = normalizedParentId ? await fetchChildren(normalizedParentId, session.token, session.currentTenantId) : []
  const [enrichedParent, ...enrichedChildren] = await enrichRows(
    [normalizedRecord, ...filhos],
    session.token,
    session.currentTenantId,
  )
  const recordWithChildren = {
    ...enrichedParent,
    filhos: enrichedChildren,
  }

  const { draft, originalRows } = buildWizardDraftFromApi(recordWithChildren)
  return NextResponse.json({ record: recordWithChildren, draft, originalRows })
}
