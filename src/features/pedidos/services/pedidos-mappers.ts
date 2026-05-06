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

type OriginTraceRuleMeta = {
  label: string
  description: string
}

export type PedidoOriginTraceSummaryRow = {
  fieldCode: string
  fieldLabel: string
  value: string
  ruleCode: string
  ruleLabel: string
  sourcePath: string
  sourceLabel: string
  description: string
}

const ORIGIN_TRACE_RULE_CATALOG: Record<string, OriginTraceRuleMeta> = {
  pedido_itens_consenso: {
    label: 'Consenso entre itens',
    description: 'O pedido herdou esse valor porque todos os produtos chegaram exatamente ao mesmo resultado para esse campo.',
  },
  pedido_filial_resolvida: {
    label: 'Filial resolvida no pedido',
    description: 'A filial final já estava resolvida no pedido e o rastreamento não encontrou indício suficiente para classificá-la como filial do cliente ou como resultado de regra de entrega.',
  },
  filial_cliente_pedido: {
    label: 'Filial do cliente',
    description: 'A filial do pedido foi classificada como vinda da filial do cliente porque o valor final do pedido coincide com a filial do cliente gravada no próprio pedido.',
  },
  forma_entrega_filial_pedido: {
    label: 'Filial por regra de entrega',
    description: 'A filial do pedido foi classificada como dependente da regra de forma de entrega, porque o pedido ficou associado a uma regra de entrega persistida no contexto final.',
  },
  pedido_filial_estoque_resolvida: {
    label: 'Filial de estoque resolvida',
    description: 'A filial de estoque já estava resolvida diretamente no pedido e permaneceu diferente da filial principal.',
  },
  fallback_filial_pedido: {
    label: 'Uso da filial principal do pedido',
    description: 'A filial de estoque do pedido usou a própria filial principal do pedido, mantendo o mesmo valor da filial principal.',
  },
  filial_nf_pedido: {
    label: 'Filial de faturamento',
    description: 'A filial de faturamento foi lida diretamente do pedido, sem outra reclassificação no rastreamento.',
  },
  forma_entrega_filial_retira: {
    label: 'Filial de retirada',
    description: 'A filial de retirada foi lida diretamente do pedido e associada ao contexto final de retirada ou entrega persistido.',
  },
  pedido_vendedor_resolvido: {
    label: 'Vendedor resolvido no pedido',
    description: 'O vendedor final já estava resolvido no pedido e o rastreamento não o classificou como simples espelho do vendedor enviado na requisição.',
  },
  request_vendedor: {
    label: 'Vendedor da requisição',
    description: 'O vendedor final coincidiu com o valor enviado na requisição.',
  },
  pedido_pagamento_persistido: {
    label: 'Pagamento persistido',
    description: 'A forma de pagamento foi lida do pagamento já persistido no pedido e não foi classificada como cópia direta da requisição.',
  },
  request_forma_pagamento: {
    label: 'Forma de pagamento da requisição',
    description: 'A forma de pagamento final coincidiu com a forma enviada na requisição.',
  },
  pedido_condicao_pagamento_persistida: {
    label: 'Condição persistida',
    description: 'A condição de pagamento foi lida do pagamento já persistido no pedido.',
  },
  request_condicao_pagamento: {
    label: 'Condição da requisição',
    description: 'A condição de pagamento final coincidiu com a condição enviada na requisição.',
  },
  pedido_forma_entrega_persistida: {
    label: 'Forma de entrega persistida',
    description: 'A forma de entrega foi lida da entrega persistida do pedido e não foi classificada nem como valor da requisição nem como parâmetro padrão da empresa.',
  },
  request_forma_entrega: {
    label: 'Forma de entrega da requisição',
    description: 'A forma de entrega final coincidiu com a forma enviada na requisição.',
  },
  parametro_forma_entrega_padrao: {
    label: 'Parâmetro padrão da empresa',
    description: 'A forma de entrega final coincidiu com a forma padrão parametrizada para a empresa.',
  },
  pedido_forma_entrega_regra_persistida: {
    label: 'Regra de entrega persistida',
    description: 'A regra de forma de entrega foi lida da entrega persistida do pedido.',
  },
  request_forma_entrega_regra: {
    label: 'Regra de entrega da requisição',
    description: 'A regra de forma de entrega final coincidiu com a regra enviada na requisição.',
  },
  pedido_transportadora_persistida: {
    label: 'Transportadora persistida',
    description: 'A transportadora foi lida da entrega persistida do pedido.',
  },
  request_transportadora: {
    label: 'Transportadora da requisição',
    description: 'A transportadora final coincidiu com a transportadora enviada na requisição.',
  },
  produto_filial_resolvida: {
    label: 'Filial resolvida no produto',
    description: 'A filial final do item já estava resolvida no produto e o rastreamento não a classificou como simples espelho da filial do cliente enviada na requisição.',
  },
  request_filial_cliente: {
    label: 'Filial do cliente na requisição',
    description: 'A filial final do item coincidiu com a filial do cliente enviada na requisição.',
  },
  produto_filial_estoque_resolvida: {
    label: 'Filial de estoque resolvida',
    description: 'A filial de estoque do item já estava resolvida no produto e permaneceu diferente tanto da filial de estoque do cliente quanto do uso da filial principal do item.',
  },
  cliente_filial_estoque: {
    label: 'Filial de estoque do cliente',
    description: 'A filial de estoque do item foi classificada como vinda da filial de estoque do cliente.',
  },
  fallback_filial_produto: {
    label: 'Uso da filial principal do produto',
    description: 'A filial de estoque do item usou a própria filial principal do item.',
  },
  produto_vendedor_resolvido: {
    label: 'Vendedor resolvido no produto',
    description: 'O vendedor final do item já estava resolvido no produto, sem correspondência direta com os atalhos conhecidos da requisição, o vendedor principal do cliente ou o vendedor por canal.',
  },
  cliente_vendedor: {
    label: 'Vendedor principal do cliente',
    description: 'O vendedor final do item coincidiu com o vendedor principal do cliente carregado no contexto.',
  },
  cliente_vendedor_por_canal: {
    label: 'Vendedor por canal',
    description: 'O vendedor final do item foi classificado como vindo do vendedor associado a um dos canais de distribuição do cliente.',
  },
  supervisor_do_vendedor: {
    label: 'Supervisor do vendedor',
    description: 'O supervisor do item foi atribuído a partir do vendedor resolvido para esse item. Quando o valor coincide com o supervisor do vendedor principal do cliente, o rastreamento explicita essa origem.',
  },
  produto_tabela_preco_resolvida: {
    label: 'Tabela resolvida no produto',
    description: 'A tabela de preço final do item já estava resolvida no produto e o rastreamento não a classificou como vinda dos atalhos conhecidos da requisição, do cliente, da filial do cliente ou da tabela por filial.',
  },
  request_tabela_preco: {
    label: 'Tabela da requisição',
    description: 'A tabela de preço final do item coincidiu com a tabela enviada na requisição.',
  },
  cliente_tabela_preco: {
    label: 'Tabela padrão do cliente',
    description: 'A tabela de preço final do item coincidiu com a tabela padrão do cliente carregado no contexto.',
  },
  cliente_filial_tabela_preco: {
    label: 'Tabela da filial do cliente',
    description: 'A tabela de preço final do item coincidiu com uma tabela configurada em uma das filiais do cliente.',
  },
  tabela_preco_filial: {
    label: 'Tabela por filial',
    description: 'A tabela de preço foi classificada como derivada do contexto de filial usado na composição do item, quando não houve correspondência com a requisição, a tabela padrão do cliente ou a tabela da filial do cliente.',
  },
}

const ORIGIN_TRACE_FIELD_CATALOG: Record<string, string> = {
  id_filial: 'Filial',
  id_filial_estoque: 'Filial de estoque',
  id_filial_nf: 'Filial de faturamento',
  id_filial_retira: 'Filial de retirada',
  id_filial_entrega: 'Filial de entrega',
  id_vendedor: 'Vendedor',
  id_supervisor: 'Supervisor',
  id_tabela_preco: 'Tabela de preço',
  id_forma_pagamento: 'Forma de pagamento',
  id_condicao_pagamento: 'Condição de pagamento',
  id_forma_entrega: 'Forma de entrega',
  id_forma_entrega_regra: 'Regra de forma de entrega',
  id_transportadora: 'Transportadora',
}

const ORIGIN_TRACE_SOURCE_CATALOG: Record<string, string> = {
  'pedido.id_filial': 'Filial principal do pedido',
  'pedido.id_filial_cliente': 'Filial do cliente no pedido',
  'pedido.id_filial_estoque': 'Filial de estoque do pedido',
  'pedido.id_filial_nf': 'Filial de faturamento do pedido',
  'pedido.id_filial_retira': 'Filial de retirada do pedido',
  'pedido.id_vendedor': 'Vendedor persistido no pedido',
  'request.id_vendedor': 'Vendedor enviado na requisição',
  'pedido.pagamento.id_forma_pagamento': 'Forma de pagamento persistida no pedido',
  'request.pagamento.id_forma_pagamento': 'Forma de pagamento enviada na requisição',
  'pedido.pagamento.id_condicao_pagamento': 'Condição de pagamento persistida no pedido',
  'request.pagamento.id_condicao_pagamento': 'Condição de pagamento enviada na requisição',
  'pedido.entrega.id_forma_entrega': 'Forma de entrega persistida no pedido',
  'request.entrega.id_forma_entrega': 'Forma de entrega enviada na requisição',
  'empresa_parametro.id_forma_entrega_padrao': 'Parâmetro padrão de forma de entrega da empresa',
  'pedido.entrega.id_forma_entrega_regra': 'Regra de forma de entrega persistida no pedido',
  'request.entrega.id_forma_entrega_regra': 'Regra de forma de entrega enviada na requisição',
  'pedido.entrega.id_transportadora': 'Transportadora persistida no pedido',
  'request.entrega.id_transportadora': 'Transportadora enviada na requisição',
  'request.id_filial_cliente': 'Filial do cliente enviada na requisição',
  'produto.id_filial': 'Filial resolvida do produto',
  'produto.id_filial_estoque': 'Filial de estoque resolvida do produto',
  'cliente.id_filial_estoque': 'Filial de estoque do cliente',
  'produto.id_vendedor': 'Vendedor resolvido do produto',
  'cliente.vendedor.id': 'Vendedor principal do cliente',
  'cliente.canais_distribuicao[].id_vendedor': 'Vendedor do canal de distribuição do cliente',
  'vendedor.id_supervisor': 'Supervisor vinculado ao vendedor',
  'cliente.vendedor.id_supervisor': 'Supervisor do vendedor principal do cliente',
  'produto.id_tabela_preco': 'Tabela de preço resolvida do produto',
  'request.id_tabela_preco': 'Tabela de preço enviada na requisição',
  'cliente.id_tabela_preco': 'Tabela de preço padrão do cliente',
  'cliente.filiais[].id_tabela_preco': 'Tabela de preço em filial do cliente',
  'tabela_preco_filial.id_tabela_preco': 'Tabela de preço definida por filial',
  'pedido_produtos.metadata.origin_trace.fields.id_tabela_preco': 'Consenso entre produtos para tabela de preço',
  'pedido_produtos.metadata.origin_trace.fields.id_vendedor': 'Consenso entre produtos para vendedor',
  'pedido_produtos.metadata.origin_trace.fields.id_supervisor': 'Consenso entre produtos para supervisor',
  'pedido_produtos.metadata.origin_trace.fields.id_filial': 'Consenso entre produtos para filial',
  'pedido_produtos.metadata.origin_trace.fields.id_filial_estoque': 'Consenso entre produtos para filial de estoque',
}

function normalizeOriginTracePayload(value: unknown) {
  let payload = value
  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    if (!trimmed) return null

    try {
      payload = JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (record.origin_trace && typeof record.origin_trace === 'object') {
    return record.origin_trace as Record<string, unknown>
  }

  return record.fields && typeof record.fields === 'object' ? record : null
}

function stringifyOriginTraceValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getOriginTraceRuleMeta(ruleCode: string) {
  return ORIGIN_TRACE_RULE_CATALOG[ruleCode] || {
    label: ruleCode || 'Regra não identificada',
    description: 'Essa regra ainda não tem explicação cadastrada no admin.',
  }
}

function getOriginTraceSourceLabel(sourcePath: string) {
  if (ORIGIN_TRACE_SOURCE_CATALOG[sourcePath]) return ORIGIN_TRACE_SOURCE_CATALOG[sourcePath]
  return sourcePath ? 'Origem técnica não catalogada' : 'Origem técnica não informada'
}

function buildPedidoOriginTraceSummaryRows(value: unknown): PedidoOriginTraceSummaryRow[] {
  const trace = normalizeOriginTracePayload(value)
  const fields = trace?.fields && typeof trace.fields === 'object'
    ? trace.fields as Record<string, unknown>
    : {}

  return Object.entries(fields).flatMap(([fieldCode, node]) => {
    if (!node || typeof node !== 'object') return []
    const record = node as Record<string, unknown>
    const ruleCode = String(record.rule || '').trim()
    const sourcePath = String(record.source_path || '').trim()
    const ruleMeta = getOriginTraceRuleMeta(ruleCode)

    return [{
      fieldCode,
      fieldLabel: ORIGIN_TRACE_FIELD_CATALOG[fieldCode] || fieldCode,
      value: stringifyOriginTraceValue(record.value),
      ruleCode,
      ruleLabel: ruleMeta.label,
      sourcePath,
      sourceLabel: getOriginTraceSourceLabel(sourcePath),
      description: ruleMeta.description,
    }]
  })
}

export function getPedidoProductTechnicalArtifacts(product: unknown) {
  const record = product && typeof product === 'object' ? product as Record<string, unknown> : {}
  const metadata = record.metadata && typeof record.metadata === 'object'
    ? record.metadata as Record<string, unknown>
    : {}

  return {
    priceMemory: normalizeJsonArtifact(record.memoria_preco),
    originTrace: normalizeJsonArtifact(metadata.origin_trace),
    originTraceSummary: buildPedidoOriginTraceSummaryRows(metadata.origin_trace),
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
