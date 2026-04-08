import { NextResponse } from 'next/server'
import { buildWizardDraftFromApi } from '@/src/features/restricoes-produtos/services/restricoes-produtos-mappers'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapError(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallback
}

const EMBED_QUERY = 'cliente,produto,produto_pai,marca,grupo,tabela_preco,filial,canal_distribuicao_cliente,canal_distribuicao_produto,colecao,departamento,filhos,fornecedor,rede,segmento,praca,supervisor,vendedor,promocao,forma_pagamento,condicao_pagamento'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`restricoes_produtos?id=${encodeURIComponent(id)}&page=1&perpage=1&embed=${EMBED_QUERY}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível carregar a restrição.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  const record = Array.isArray(payload.data) ? payload.data[0] : null
  if (!record) {
    return NextResponse.json({ message: 'Restrição não encontrada.' }, { status: 404 })
  }

  const parentId = typeof record.id_pai === 'string' ? record.id_pai.trim() : ''
  const normalizedRecord = parentId
    ? await (async () => {
        const parentResult = await serverApiFetch(`restricoes_produtos?id=${encodeURIComponent(parentId)}&page=1&perpage=1&embed=${EMBED_QUERY}`, {
          method: 'GET',
          token: session.token,
          tenantId: session.currentTenantId,
        })

        if (!parentResult.ok) return record
        const parentPayload = parentResult.payload as { data?: Array<Record<string, unknown>> }
        return Array.isArray(parentPayload.data) && parentPayload.data[0] ? parentPayload.data[0] : record
      })()
    : record

  const { draft, originalRows } = buildWizardDraftFromApi(normalizedRecord)
  return NextResponse.json({ record: normalizedRecord, draft, originalRows })
}
