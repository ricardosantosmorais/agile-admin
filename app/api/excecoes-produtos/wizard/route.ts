import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { ExcecaoProdutoApiRow } from '@/src/features/excecoes-produtos/services/excecoes-produtos-types'
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

function normalizeWeekdayTime(value: unknown, fallback: string) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) return fallback
  if (/^\d{2}:\d{2}$/.test(normalized)) return `${normalized}:00`
  return normalized
}

function sanitizeRow(row: ExcecaoProdutoApiRow, parentId: string, tenantId: string, index: number) {
  const next: Record<string, unknown> = {
    ...row,
    id: typeof row.id === 'string' && row.id.trim() ? row.id : index === 0 ? parentId : generateNumericId(),
    id_pai: index === 0 ? null : parentId,
    id_empresa: tenantId,
    ativo: row.ativo === 0 || row.ativo === '0' || row.ativo === false ? 0 : 1,
    orcamento: row.orcamento === 1 || row.orcamento === '1' || row.orcamento === true ? 1 : 0,
  }

  const nullableKeys = [
    'metadata',
    'id_cliente', 'id_filial', 'id_grupo', 'id_canal_distribuicao_cliente', 'id_rede', 'id_segmento', 'id_tabela_preco', 'id_praca', 'uf', 'tipo_cliente',
    'id_supervisor', 'id_vendedor', 'id_produto', 'id_marca', 'id_produto_pai', 'id_fornecedor', 'id_canal_distribuicao_produto', 'id_colecao',
    'id_departamento', 'id_promocao', 'id_forma_pagamento', 'id_condicao_pagamento', 'tipo_entrega', 'motivo',
    'seg_horario_de', 'seg_horario_ate', 'ter_horario_de', 'ter_horario_ate', 'qua_horario_de', 'qua_horario_ate',
    'qui_horario_de', 'qui_horario_ate', 'sex_horario_de', 'sex_horario_ate', 'sab_horario_de', 'sab_horario_ate', 'dom_horario_de', 'dom_horario_ate',
  ]

  for (const key of nullableKeys) {
    const value = typeof next[key] === 'string' ? (next[key] as string) : ''
    if (!value || !value.trim()) next[key] = null
  }

  for (const key of ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const) {
    const isActive = next[key] === 0 || next[key] === '0' || next[key] === false ? 0 : 1
    next[key] = isActive
    if (isActive) {
      const fromKey = `${key}_horario_de`
      const toKey = `${key}_horario_ate`
      next[fromKey] = normalizeWeekdayTime(next[fromKey], '00:00:00')
      next[toKey] = normalizeWeekdayTime(next[toKey], '23:59:00')
    } else {
      next[`${key}_horario_de`] = null
      next[`${key}_horario_ate`] = null
    }
  }

  return next
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = (await request.json()) as { id?: string; rows?: ExcecaoProdutoApiRow[]; deleteIds?: string[] }
  const rows = Array.isArray(body.rows) ? body.rows : []
  const deleteIds = Array.isArray(body.deleteIds) ? body.deleteIds : []

  if (!rows.length) {
    return NextResponse.json({ message: 'Nenhuma combinação foi gerada para salvar.' }, { status: 400 })
  }

  const parentId = typeof body.id === 'string' && body.id.trim() ? body.id : generateNumericId()

  if (deleteIds.length) {
    const deleteResult = await serverApiFetch('excecoes_produtos', {
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
  const result = await serverApiFetch('excecoes_produtos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível salvar a exceção.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true, id: parentId })
}
