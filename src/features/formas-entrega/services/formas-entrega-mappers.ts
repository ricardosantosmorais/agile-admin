'use client'

import type { CrudRecord } from '@/src/components/crud-base/types'
import { parseCurrencyInput } from '@/src/lib/input-masks'
import { toLookupOption } from '@/src/lib/lookup-options'
import { formatLocalizedDecimal, normalizeCurrencyInputValue, normalizeInteger, parseLocalizedNumber } from '@/src/lib/value-parsers'

export type FormaEntregaOcorrencia =
  | 'canal_distribuicao'
  | 'cliente'
  | 'departamento'
  | 'filial'
  | 'fornecedor'
  | 'grupo'
  | 'marca'
  | 'produto'
  | 'produto_pai'
  | 'rede'
  | 'segmento'
  | 'tipo_cliente'
  | 'uf'
  | 'todos'

export type FormaEntregaRegraTipo = 'cep' | 'km' | 'local'

export type FormaEntregaLocalidadeDraft = {
  estados: string[]
  cidades: string[]
  bairros: string[]
}

type LocalidadeCidadeOption = {
  id_cidade: string
  uf: string
}

type LocalidadeBairroOption = {
  id_bairro: string
  id_cidade: string
}

export type FormaEntregaRegraDraft = {
  id?: string
  nome: string
  tipo: FormaEntregaRegraTipo
  cep_de: string
  cep_ate: string
  km_de: string
  km_ate: string
  valor_de: string
  valor_ate: string
  peso_de: string
  peso_ate: string
  peso_maximo: string
  dimensao_de: string
  dimensao_ate: string
  dimensao_maxima: string
  perimetro_maximo: string
  maximo_itens: string
  maximo_produtos: string
  valor: string
  valor_adicional: string
  ad_valorem: string
  kg_adicional: string
  prazo: string
  localidades: FormaEntregaLocalidadeDraft
}

export type FormaEntregaRegraRecord = {
  id: string
  nome?: string | null
  tipo: FormaEntregaRegraTipo
  cep_de?: string | null
  cep_ate?: string | null
  km_de?: string | number | null
  km_ate?: string | number | null
  valor?: string | number | null
  prazo?: string | number | null
  valor_de?: string | number | null
  valor_ate?: string | number | null
  peso_de?: string | number | null
  peso_ate?: string | number | null
  peso_maximo?: string | number | null
  dimensao_de?: string | number | null
  dimensao_ate?: string | number | null
  dimensao_maxima?: string | number | null
  perimetro_maximo?: string | number | null
  maximo_itens?: string | number | null
  maximo_produtos?: string | number | null
  valor_adicional?: string | number | null
  ad_valorem?: string | number | null
  kg_adicional?: string | number | null
  ceps?: Array<{
    id?: string
    id_uf?: string | null
    id_cidade?: string | null
    id_bairro?: string | null
    estado?: { uf?: string; estado?: string | null } | null
    cidade?: { id_cidade?: string; cidade?: string | null; uf?: string | null } | null
    bairro?: { id_bairro?: string; bairro?: string | null; id_cidade?: string | null } | null
  }> | null
}

export type FormaEntregaDataRecord = {
  id: string
  data?: string | null
  descricao?: string | null
  restricao?: boolean | number | string
}

export type FormaEntregaDataDraft = {
  id?: string
  data: string
  descricao: string
  restricao: boolean
}

export type FormaEntregaOcorrenciaRecord = {
  id: string
  ocorrencia: FormaEntregaOcorrencia
  id_objeto?: string | null
  canal_distribuicao?: { id?: string; nome?: string | null } | null
  cliente?: { id?: string; nome_fantasia?: string | null; razao_social?: string | null } | null
  departamento?: { id?: string; nome?: string | null } | null
  filial?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  fornecedor?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  grupo?: { id?: string; nome?: string | null } | null
  marca?: { id?: string; nome?: string | null } | null
  produto?: { id?: string; nome?: string | null } | null
  rede?: { id?: string; nome?: string | null } | null
  segmento?: { id?: string; nome?: string | null } | null
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function normalizeOptionalString(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || ''
}

const normalizeCurrency = normalizeCurrencyInputValue

function normalizeDateInput(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  }

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  }

  return ''
}

export function normalizeTimeInput(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  const match = raw.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

function toApiDate(value: unknown, endOfDay = false) {
  const raw = normalizeDateInput(value)
  return raw ? `${raw} ${endOfDay ? '23:59:59' : '00:00:00'}` : null
}

function toNullableInteger(value: unknown) {
  const digits = normalizeInteger(value)
  return digits ? Number(digits) : null
}

function toNullableDecimal(value: unknown) {
  return parseLocalizedNumber(value)
}

function toNullableCep(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits || null
}

function splitTransportRestrictions(value: unknown) {
  const entries = String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    inflamavel: entries.includes('S'),
    resfriado: entries.includes('R'),
    transportadora: entries.includes('T'),
  }
}

function mapLookup(value: unknown, labelField: string) {
  return toLookupOption(value, [labelField])
}

export function normalizeFormaEntregaRecord(record: CrudRecord): CrudRecord {
  const restrictions = splitTransportRestrictions(record.restrito_transporte)

  return {
    ...record,
    ativo: normalizeBoolean(record.ativo),
    acrescimo_condicao_pagamento: normalizeBoolean(record.acrescimo_condicao_pagamento),
    embarque_maritimo: normalizeBoolean(record.embarque_maritimo),
    app: normalizeBoolean(record.app),
    informa_veiculo: normalizeBoolean(record.informa_veiculo),
    usa_prazo_rota: normalizeBoolean(record.usa_prazo_rota),
    grupo_filial: normalizeBoolean(record.grupo_filial),
    altera_valor: normalizeBoolean(record.altera_valor),
    observacoes: normalizeBoolean(record.observacoes),
    seg: record.seg === undefined ? true : normalizeBoolean(record.seg),
    ter: record.ter === undefined ? true : normalizeBoolean(record.ter),
    qua: record.qua === undefined ? true : normalizeBoolean(record.qua),
    qui: record.qui === undefined ? true : normalizeBoolean(record.qui),
    sex: record.sex === undefined ? true : normalizeBoolean(record.sex),
    sab: record.sab === undefined ? true : normalizeBoolean(record.sab),
    dom: record.dom === undefined ? true : normalizeBoolean(record.dom),
    agendamento: normalizeBoolean(record.agendamento),
    agendamento_seg: normalizeBoolean(record.agendamento_seg),
    agendamento_ter: normalizeBoolean(record.agendamento_ter),
    agendamento_qua: normalizeBoolean(record.agendamento_qua),
    agendamento_qui: normalizeBoolean(record.agendamento_qui),
    agendamento_sex: normalizeBoolean(record.agendamento_sex),
    agendamento_sab: normalizeBoolean(record.agendamento_sab),
    agendamento_dom: normalizeBoolean(record.agendamento_dom),
    data_inicio: normalizeDateInput(record.data_inicio),
    data_fim: normalizeDateInput(record.data_fim),
    desconto: normalizeCurrency(record.desconto),
    acrescimo: normalizeCurrency(record.acrescimo),
    frete_gratis: normalizeCurrency(record.frete_gratis),
    agendamento_horario_corte: normalizeTimeInput(record.agendamento_horario_corte),
    restrito_transporte_inflamavel: restrictions.inflamavel,
    restrito_transporte_resfriado: restrictions.resfriado,
    restrito_transporte_transportadora: restrictions.transportadora,
    id_filial_lookup: mapLookup(record.filial, 'nome_fantasia'),
    id_filial_pedido_lookup: mapLookup(record.filial_pedido, 'nome_fantasia'),
    id_filial_estoque_lookup: mapLookup(record.filial_estoque, 'nome_fantasia'),
    id_filial_retira_lookup: mapLookup(record.filial_retira, 'nome_fantasia'),
    id_filial_expressa_lookup: mapLookup(record.filial_expressa, 'nome_fantasia'),
    id_tabela_preco_lookup: mapLookup(record.tabela_preco, 'nome'),
  }
}

export function serializeFormaEntregaRecord(record: CrudRecord): CrudRecord {
  const restricoes: string[] = []
  if (normalizeBoolean(record.restrito_transporte_inflamavel)) restricoes.push('S')
  if (normalizeBoolean(record.restrito_transporte_resfriado)) restricoes.push('R')
  if (normalizeBoolean(record.restrito_transporte_transportadora)) restricoes.push('T')

  const payload: CrudRecord = {
    ...record,
    codigo: normalizeOptionalString(record.codigo) || null,
    nome: normalizeOptionalString(record.nome),
    tipo: normalizeOptionalString(record.tipo) || null,
    perfil: normalizeOptionalString(record.perfil),
    seleciona_transportadora: normalizeOptionalString(record.seleciona_transportadora) || null,
    servico: normalizeOptionalString(record.servico) || null,
    codigo_transportadora: normalizeOptionalString(record.codigo_transportadora) || null,
    servico_transportadora: normalizeOptionalString(record.servico_transportadora) || null,
    id_filial: normalizeOptionalString(record.id_filial) || null,
    id_filial_pedido: normalizeOptionalString(record.id_filial_pedido) || null,
    id_filial_estoque: normalizeOptionalString(record.id_filial_estoque) || null,
    id_filial_retira: normalizeOptionalString(record.id_filial_retira) || null,
    id_filial_expressa: normalizeOptionalString(record.id_filial_expressa) || null,
    id_tabela_preco: normalizeOptionalString(record.id_tabela_preco) || null,
    data_inicio: toApiDate(record.data_inicio),
    data_fim: toApiDate(record.data_fim, true),
    desconto: parseCurrencyInput(String(record.desconto ?? '')),
    acrescimo: parseCurrencyInput(String(record.acrescimo ?? '')),
    frete_gratis: parseCurrencyInput(String(record.frete_gratis ?? '')),
    ativo: normalizeBoolean(record.ativo),
    acrescimo_condicao_pagamento: normalizeBoolean(record.acrescimo_condicao_pagamento),
    embarque_maritimo: normalizeBoolean(record.embarque_maritimo),
    app: normalizeBoolean(record.app),
    informa_veiculo: normalizeBoolean(record.informa_veiculo),
    usa_prazo_rota: normalizeBoolean(record.usa_prazo_rota),
    grupo_filial: normalizeBoolean(record.grupo_filial),
    altera_valor: normalizeBoolean(record.altera_valor),
    observacoes: normalizeBoolean(record.observacoes),
    seg: normalizeBoolean(record.seg),
    ter: normalizeBoolean(record.ter),
    qua: normalizeBoolean(record.qua),
    qui: normalizeBoolean(record.qui),
    sex: normalizeBoolean(record.sex),
    sab: normalizeBoolean(record.sab),
    dom: normalizeBoolean(record.dom),
    agendamento: normalizeBoolean(record.agendamento),
    agendamento_dias_minimo: toNullableInteger(record.agendamento_dias_minimo) ?? 0,
    agendamento_dias_maximo: toNullableInteger(record.agendamento_dias_maximo) ?? 0,
    agendamento_horario_corte: normalizeTimeInput(record.agendamento_horario_corte) ? `${normalizeTimeInput(record.agendamento_horario_corte)}:00` : '00:00:00',
    agendamento_seg: normalizeBoolean(record.agendamento_seg),
    agendamento_ter: normalizeBoolean(record.agendamento_ter),
    agendamento_qua: normalizeBoolean(record.agendamento_qua),
    agendamento_qui: normalizeBoolean(record.agendamento_qui),
    agendamento_sex: normalizeBoolean(record.agendamento_sex),
    agendamento_sab: normalizeBoolean(record.agendamento_sab),
    agendamento_dom: normalizeBoolean(record.agendamento_dom),
    posicao: toNullableInteger(record.posicao),
    prioridade: toNullableInteger(record.prioridade),
    restrito_transporte: restricoes.length ? restricoes.join(',') : null,
  }

  delete payload.restrito_transporte_inflamavel
  delete payload.restrito_transporte_resfriado
  delete payload.restrito_transporte_transportadora
  delete payload.id_filial_lookup
  delete payload.id_filial_pedido_lookup
  delete payload.id_filial_estoque_lookup
  delete payload.id_filial_retira_lookup
  delete payload.id_filial_expressa_lookup
  delete payload.id_tabela_preco_lookup

  return payload
}

export function createEmptyFormaEntregaRegraDraft(): FormaEntregaRegraDraft {
  return {
    nome: '',
    tipo: 'cep',
    cep_de: '',
    cep_ate: '',
    km_de: '',
    km_ate: '',
    valor_de: '',
    valor_ate: '',
    peso_de: '',
    peso_ate: '',
    peso_maximo: '',
    dimensao_de: '',
    dimensao_ate: '',
    dimensao_maxima: '',
    perimetro_maximo: '',
    maximo_itens: '',
    maximo_produtos: '',
    valor: '',
    valor_adicional: '',
    ad_valorem: '',
    kg_adicional: '',
    prazo: '',
    localidades: { estados: [], cidades: [], bairros: [] },
  }
}

export function mapFormaEntregaRegraToDraft(record: FormaEntregaRegraRecord): FormaEntregaRegraDraft {
  const draft = createEmptyFormaEntregaRegraDraft()
  const estados = new Set<string>()
  const cidades = new Set<string>()
  const bairros = new Set<string>()

  for (const cep of record.ceps ?? []) {
    const estadoId = cep.id_uf ?? cep.estado?.uf ?? cep.cidade?.uf ?? null
    const cidadeId = cep.id_cidade ?? cep.cidade?.id_cidade ?? cep.bairro?.id_cidade ?? null
    const bairroId = cep.id_bairro ?? cep.bairro?.id_bairro ?? null

    if (estadoId) estados.add(String(estadoId))
    if (cidadeId) cidades.add(String(cidadeId))
    if (bairroId) bairros.add(String(bairroId))
  }

  return {
    ...draft,
    id: record.id,
    nome: normalizeOptionalString(record.nome),
    tipo: record.tipo,
    cep_de: normalizeOptionalString(record.cep_de),
    cep_ate: normalizeOptionalString(record.cep_ate),
    km_de: normalizeInteger(record.km_de),
    km_ate: normalizeInteger(record.km_ate),
    valor_de: normalizeCurrency(record.valor_de),
    valor_ate: normalizeCurrency(record.valor_ate),
    peso_de: formatLocalizedDecimal(record.peso_de, 3),
    peso_ate: formatLocalizedDecimal(record.peso_ate, 3),
    peso_maximo: formatLocalizedDecimal(record.peso_maximo, 3),
    dimensao_de: normalizeInteger(record.dimensao_de),
    dimensao_ate: normalizeInteger(record.dimensao_ate),
    dimensao_maxima: normalizeInteger(record.dimensao_maxima),
    perimetro_maximo: normalizeInteger(record.perimetro_maximo),
    maximo_itens: normalizeInteger(record.maximo_itens),
    maximo_produtos: normalizeInteger(record.maximo_produtos),
    valor: normalizeCurrency(record.valor),
    valor_adicional: normalizeCurrency(record.valor_adicional),
    ad_valorem: normalizeCurrency(record.ad_valorem),
    kg_adicional: normalizeCurrency(record.kg_adicional),
    prazo: normalizeInteger(record.prazo),
    localidades: {
      estados: [...estados],
      cidades: [...cidades],
      bairros: [...bairros],
    },
  }
}

export function serializeFormaEntregaRegraDraft(draft: FormaEntregaRegraDraft, formaEntregaId: string) {
  return {
    id: draft.id ?? null,
    id_forma_entrega: formaEntregaId,
    nome: normalizeOptionalString(draft.nome),
    tipo: draft.tipo,
    cep_de: draft.tipo === 'cep' ? toNullableCep(draft.cep_de) : null,
    cep_ate: draft.tipo === 'cep' ? toNullableCep(draft.cep_ate) : null,
    km_de: draft.tipo === 'km' ? toNullableInteger(draft.km_de) : null,
    km_ate: draft.tipo === 'km' ? toNullableInteger(draft.km_ate) : null,
    valor_de: parseCurrencyInput(draft.valor_de) ?? null,
    valor_ate: parseCurrencyInput(draft.valor_ate) ?? null,
    peso_de: toNullableDecimal(draft.peso_de),
    peso_ate: toNullableDecimal(draft.peso_ate),
    peso_maximo: toNullableDecimal(draft.peso_maximo),
    dimensao_de: toNullableInteger(draft.dimensao_de),
    dimensao_ate: toNullableInteger(draft.dimensao_ate),
    dimensao_maxima: toNullableInteger(draft.dimensao_maxima),
    perimetro_maximo: toNullableInteger(draft.perimetro_maximo),
    maximo_itens: toNullableInteger(draft.maximo_itens),
    maximo_produtos: toNullableInteger(draft.maximo_produtos),
    valor: parseCurrencyInput(draft.valor) ?? 0,
    valor_adicional: parseCurrencyInput(draft.valor_adicional) ?? 0,
    ad_valorem: parseCurrencyInput(draft.ad_valorem) ?? 0,
    kg_adicional: parseCurrencyInput(draft.kg_adicional) ?? 0,
    prazo: toNullableInteger(draft.prazo),
    ativo: true,
  }
}

export function buildFormaEntregaLocalidadePayload(
  regraId: string,
  localidades: FormaEntregaLocalidadeDraft,
  context?: {
    cidades?: LocalidadeCidadeOption[]
    bairros?: LocalidadeBairroOption[]
  },
) {
  const cityMap = new Map((context?.cidades ?? []).map((cidade) => [cidade.id_cidade, cidade]))
  const districtMap = new Map((context?.bairros ?? []).map((bairro) => [bairro.id_bairro, bairro]))

  if (localidades.bairros.length) {
    return localidades.bairros.map((bairro) => ({
      id_forma_entrega_regra: regraId,
      id_uf: (() => {
        const district = districtMap.get(bairro)
        const city = district ? cityMap.get(district.id_cidade) : null
        return city?.uf ?? null
      })(),
      id_cidade: districtMap.get(bairro)?.id_cidade ?? null,
      id_bairro: bairro,
    }))
  }

  if (localidades.cidades.length) {
    return localidades.cidades.map((cidade) => ({
      id_forma_entrega_regra: regraId,
      id_uf: cityMap.get(cidade)?.uf ?? null,
      id_cidade: cidade,
      id_bairro: null,
    }))
  }

  return localidades.estados.map((estado) => ({
    id_forma_entrega_regra: regraId,
    id_uf: estado,
    id_cidade: null,
    id_bairro: null,
  }))
}

export function createFormaEntregaDataPayload(formaEntregaId: string, draft: FormaEntregaDataDraft) {
  return {
    id: draft.id ?? null,
    id_forma_entrega: formaEntregaId,
    data: toApiDate(draft.data),
    descricao: normalizeOptionalString(draft.descricao) || null,
    restricao: draft.restricao,
  }
}

export function formatFormaEntregaRuleSummary(record: FormaEntregaRegraRecord) {
  const baseName = normalizeOptionalString(record.nome) || 'Regra sem nome'

  if (record.tipo === 'cep') {
    const from = record.cep_de ? String(record.cep_de) : ''
    const to = record.cep_ate ? String(record.cep_ate) : ''
    return from || to ? `${baseName} (${from || '-'} - ${to || '-'})` : baseName
  }

  if (record.tipo === 'km') {
    const from = record.km_de ? String(record.km_de) : ''
    const to = record.km_ate ? String(record.km_ate) : ''
    return from || to ? `${baseName} (${from || '-'} - ${to || '-'})` : baseName
  }

  return baseName
}

export function formatFormaEntregaOccurrenceLabel(record: FormaEntregaOcorrenciaRecord) {
  switch (record.ocorrencia) {
    case 'canal_distribuicao':
      return record.canal_distribuicao?.nome || record.id_objeto || '-'
    case 'cliente':
      return record.cliente?.nome_fantasia || record.cliente?.razao_social || record.id_objeto || '-'
    case 'departamento':
      return record.departamento?.nome || record.id_objeto || '-'
    case 'filial':
      return record.filial?.nome_fantasia || record.filial?.nome || record.id_objeto || '-'
    case 'fornecedor':
      return record.fornecedor?.nome_fantasia || record.fornecedor?.nome || record.id_objeto || '-'
    case 'grupo':
      return record.grupo?.nome || record.id_objeto || '-'
    case 'marca':
      return record.marca?.nome || record.id_objeto || '-'
    case 'produto':
    case 'produto_pai':
      return record.produto?.nome || record.id_objeto || '-'
    case 'rede':
      return record.rede?.nome || record.id_objeto || '-'
    case 'segmento':
      return record.segmento?.nome || record.id_objeto || '-'
    case 'tipo_cliente':
      return record.id_objeto === 'C' ? 'Consumo' : record.id_objeto === 'R' ? 'Revenda' : record.id_objeto === 'F' ? 'Funcionario' : (record.id_objeto || '-')
    case 'uf':
      return record.id_objeto || '-'
    case 'todos':
      return 'Todos'
    default:
      return record.id_objeto || '-'
  }
}
