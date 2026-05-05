import { formatCpfCnpj } from '@/src/lib/formatters'
import { getPedidoStatusMeta } from '@/src/features/pedidos/services/pedidos-meta'
import type { PedidoDetail, PedidoListRecord } from '@/src/features/pedidos/services/pedidos-types'

function toNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function resolvePersonName(person: unknown) {
  if (!person || typeof person !== 'object') return '-'
  const record = person as Record<string, unknown>
  const razaoSocial = String(record.razao_social || '').trim()
  const nomeFantasia = String(record.nome_fantasia || '').trim()
  const nome = String(record.nome || '').trim()
  return razaoSocial || nomeFantasia || nome || '-'
}

function hasCorte(produtos: unknown) {
  if (!Array.isArray(produtos)) return false
  return produtos.some((produto) => {
    if (!produto || typeof produto !== 'object') return false
    const record = produto as Record<string, unknown>
    return toNumber(record.quantidade_atendida) < toNumber(record.quantidade)
  })
}

function resolveCanApprovePayment(record: Record<string, unknown>) {
  const status = String(record.status || '')
  const internalizado = Boolean(record.internalizado)
  const pagamento = typeof record.pagamento === 'object' && record.pagamento !== null
    ? record.pagamento as Record<string, unknown>
    : null
  const formaTipo = String(pagamento?.forma_pagamento_convertida_tipo || pagamento?.forma_pagamento_tipo || '')
  return !internalizado && ['pagamento_em_analise', 'aguardando_pagamento'].includes(status) && formaTipo !== 'boleto_faturado'
}

function resolveCanCancel(record: Record<string, unknown>) {
  const status = String(record.status || '')
  return !['carrinho', 'rascunho', 'cancelado'].includes(status) && record.brinde !== true
}

export function isTechnicalPedidoLog(log: unknown) {
  const record = log && typeof log === 'object' ? log as Record<string, unknown> : {}
  const codigo = String(record.codigo || '').trim()
  return codigo.startsWith('processing_') || codigo === 'origin_trace_snapshot'
}

export function filterPedidoLogsByAccess(logs: unknown, isMasterUser: boolean) {
  const rows = Array.isArray(logs) ? logs as Array<Record<string, unknown>> : []
  return isMasterUser ? rows : rows.filter((log) => !isTechnicalPedidoLog(log))
}

function normalizeJsonArtifact(value: unknown) {
  if (!value) return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2)
    } catch {
      return trimmed
    }
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return ''
}

export function getPedidoProductTechnicalArtifacts(product: unknown) {
  const record = product && typeof product === 'object' ? product as Record<string, unknown> : {}
  const metadata = record.metadata && typeof record.metadata === 'object'
    ? record.metadata as Record<string, unknown>
    : {}

  return {
    priceMemory: normalizeJsonArtifact(record.memoria_preco),
    originTrace: normalizeJsonArtifact(metadata.origin_trace),
  }
}

export function normalizePedidoListRecord(item: unknown): PedidoListRecord {
  const record = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
  const statusMeta = getPedidoStatusMeta(record.status)
  const produtos = Array.isArray(record.produtos) ? record.produtos : []

  return {
    id: String(record.id || ''),
    id_transacao: String(record.id_transacao || ''),
    codigo: String(record.codigo || ''),
    data: typeof record.data === 'string' ? record.data : '',
    valor_total_atendido: toNumber(record.valor_total_atendido),
    status: String(record.status || ''),
    status_label: statusMeta.label,
    status_tone: statusMeta.tone,
    cliente_nome: resolvePersonName(record.cliente),
    vendedor_nome: resolvePersonName(record.vendedor),
    forma_entrega_nome: typeof record.entrega === 'object' && record.entrega !== null
      ? String((record.entrega as Record<string, unknown>).forma_entrega_nome || '')
      : '',
    brinde: Boolean(record.brinde),
    orcamento: Boolean(record.orcamento),
    canal: String(record.canal || ''),
    utm_source: String(record.utm_source || ''),
    utm_medium: String(record.utm_medium || ''),
    utm_campaign: String(record.utm_campaign || ''),
    utm_id: String(record.utm_id || ''),
    utm_term: String(record.utm_term || ''),
    venda_assistida: Boolean(record.venda_assistida),
    internalizado: Boolean(record.internalizado),
    hasCorte: hasCorte(produtos),
    canApprovePayment: resolveCanApprovePayment(record),
    canCancel: resolveCanCancel(record),
  }
}

export function normalizePedidoDetail(item: unknown): PedidoDetail {
  const record = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
  const statusMeta = getPedidoStatusMeta(record.status)
  const produtos = Array.isArray(record.produtos) ? record.produtos as Array<Record<string, unknown>> : []
  const totalAtendidoTributos = Boolean(record.total_atendido_tributos)
  const valorTributos = toNumber(record.valor_st) + toNumber(record.valor_ipi) + toNumber(record.valor_fecoep) + toNumber(record.valor_partilha)

  return {
    ...record,
    id: String(record.id || ''),
    status_label: statusMeta.label,
    status_tone: statusMeta.tone,
    valor_produtos_atendido_ajustado: totalAtendidoTributos ? toNumber(record.valor_produtos_atendido) : toNumber(record.valor_produtos_atendido) + valorTributos,
    valor_total_atendido_ajustado: totalAtendidoTributos ? toNumber(record.valor_total_atendido) : toNumber(record.valor_total_atendido) + valorTributos,
    hasCorte: hasCorte(produtos),
    canApprovePayment: resolveCanApprovePayment(record),
    canCancel: resolveCanCancel(record),
    produtos,
    eventos: Array.isArray(record.eventos) ? record.eventos : [],
    logs: Array.isArray(record.logs) ? record.logs : [],
  }
}

export function formatClienteDocumento(cliente: unknown) {
  if (!cliente || typeof cliente !== 'object') return '-'
  const record = cliente as Record<string, unknown>
  return formatCpfCnpj(record.cnpj_cpf)
}
