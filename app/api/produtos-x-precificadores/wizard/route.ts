import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { ProdutoPrecificadorApiRow } from '@/src/features/produtos-precificadores/services/produtos-precificadores-types'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapError(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallback
}

function generateNumericId() {
  return BigInt(`0x${randomBytes(8).toString('hex')}`).toString()
}

function sanitizeRow(row: ProdutoPrecificadorApiRow, parentId: string, tenantId: string, index: number) {
  const next: Record<string, unknown> = {
    ...row,
    id: typeof row.id === 'string' && row.id.trim() ? row.id : index === 0 ? parentId : generateNumericId(),
    id_pai: index === 0 ? null : parentId,
    id_empresa: tenantId,
  }

  const nullableKeys = [
    'codigo', 'id_filial', 'id_cliente', 'id_canal_distribuicao_cliente', 'id_grupo', 'id_rede', 'id_segmento', 'id_praca', 'uf', 'tipo_cliente',
    'id_forma_pagamento', 'id_condicao_pagamento', 'id_supervisor', 'id_vendedor', 'id_tabela_preco', 'id_departamento', 'id_fornecedor', 'id_marca',
    'id_produto_pai', 'id_produto', 'id_embalagem', 'id_canal_distribuicao_produto', 'id_colecao', 'id_promocao', 'id_forma_entrega',
  ]

  for (const key of nullableKeys) {
    const value = typeof next[key] === 'string' ? next[key] as string : ''
    if (!value || !value.trim()) {
      next[key] = null
    }
  }

  for (const key of ['posicao', 'indice', 'itens_pedido_de', 'itens_pedido_ate', 'prazo_medio']) {
    if (next[key] === '' || next[key] === undefined) {
      next[key] = null
    }
  }

  return next
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as { id?: string; rows?: ProdutoPrecificadorApiRow[]; deleteIds?: string[] }
  const rows = Array.isArray(body.rows) ? body.rows : []
  const deleteIds = Array.isArray(body.deleteIds) ? body.deleteIds : []

  if (!rows.length) {
    return NextResponse.json({ message: 'Nenhuma combinação foi gerada para salvar.' }, { status: 400 })
  }

  const parentId = typeof body.id === 'string' && body.id.trim() ? body.id : generateNumericId()

  if (deleteIds.length) {
    const deleteResult = await serverApiFetch('produtos_precificadores', {
      method: 'DELETE',
      token: session.token,
      tenantId: session.currentTenantId,
      body: deleteIds.map((id) => ({ id, id_empresa: session.currentTenantId })),
    })

    if (!deleteResult.ok) {
      return NextResponse.json({ message: mapError(deleteResult.payload, 'Não foi possível excluir dependentes removidos.') }, { status: deleteResult.status || 400 })
    }
  }

  const payload = rows.map((row, index) => sanitizeRow(row, parentId, session.currentTenantId, index))
  const result = await serverApiFetch('produtos_precificadores', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível salvar o precificador.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true, id: parentId })
}
