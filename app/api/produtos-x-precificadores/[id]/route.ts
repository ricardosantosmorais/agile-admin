import { NextResponse } from 'next/server'
import { buildWizardDraftFromApi } from '@/src/features/produtos-precificadores/services/produtos-precificadores-mappers'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapError(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallback
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`produtos_precificadores?id=${encodeURIComponent(id)}&page=1&perpage=1&embed=cliente,produto,produto_pai,marca,grupo,tabela_preco,filial,canal_distribuicao_cliente,canal_distribuicao_produto,colecao,departamento,promocao_precificador,forma_pagamento,condicao_pagamento,forma_entrega,filhos,fornecedor,rede,segmento,praca,supervisor,vendedor`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível carregar o precificador.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  const record = Array.isArray(payload.data) ? payload.data[0] : null
  if (!record) {
    return NextResponse.json({ message: 'Precificador não encontrado.' }, { status: 404 })
  }

  const parentId = typeof record.id_pai === 'string' ? record.id_pai.trim() : ''
  const normalizedRecord = parentId
    ? await (async () => {
        const parentResult = await serverApiFetch(`produtos_precificadores?id=${encodeURIComponent(parentId)}&page=1&perpage=1&embed=cliente,produto,produto_pai,marca,grupo,tabela_preco,filial,canal_distribuicao_cliente,canal_distribuicao_produto,colecao,departamento,promocao_precificador,forma_pagamento,condicao_pagamento,forma_entrega,filhos,fornecedor,rede,segmento,praca,supervisor,vendedor`, {
          method: 'GET',
          token: session.token,
          tenantId: session.currentTenantId,
        })

        if (!parentResult.ok) {
          return record
        }

        const parentPayload = parentResult.payload as { data?: Array<Record<string, unknown>> }
        return Array.isArray(parentPayload.data) && parentPayload.data[0] ? parentPayload.data[0] : record
      })()
    : record

  const { draft, originalRows } = buildWizardDraftFromApi(normalizedRecord)
  return NextResponse.json({ record: normalizedRecord, draft, originalRows })
}
