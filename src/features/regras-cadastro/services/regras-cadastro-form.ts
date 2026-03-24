import type { CrudRecord } from '@/src/components/crud-base/types'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { cepMask, parseCurrencyInput } from '@/src/lib/input-masks'

type LookupOption = {
  id: string
  label: string
}

function toLookupOption(value: unknown, labelKeys: string[], fallbackId?: unknown) {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const id = String(record.id || fallbackId || '')
  const label = labelKeys.map((key) => String(record[key] || '')).find(Boolean) || id
  return id ? { id, label } satisfies LookupOption : null
}

function toBooleanChoice(value: unknown) {
  if (value === true || value === 1 || value === '1' || value === 'S') {
    return '1'
  }
  if (value === false || value === 0 || value === '0' || value === 'N') {
    return '0'
  }
  return ''
}

function digitsOnly(value: unknown) {
  return String(value || '').replace(/\D/g, '')
}

function nullableLookupId(value: unknown) {
  if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    return String((value as { id: unknown }).id || '') || null
  }

  const normalized = String(value || '').trim()
  return normalized || null
}

export function createEmptyRegraCadastroForm(): CrudRecord {
  return {
    id: '',
    ativo: true,
    nome: '',
    codigo: '',
    contribuinte: '',
    tipo: '',
    tipo_cliente: '',
    inscricao_estadual: '',
    uf: '',
    cep_de: '',
    cep_ate: '',
    codigo_cnae: '',
    valida_limite: false,
    valida_multiplo: false,
    id_filial: '',
    id_filial_pedido: '',
    id_filial_estoque: '',
    id_vendedor: '',
    id_praca: '',
    id_tabela_preco: '',
    id_canal_distribuicao: '',
    id_cliente_filial: '',
    id_tabela_preco_filial: '',
    limite_credito: '',
    id_cliente_canal_distribuicao: '',
    id_tabela_canal_distribuicao: '',
    id_vendedor_canal_distribuicao: '',
    id_cliente_vendedor: '',
  }
}

export function mapRegraCadastroDetail(payload: unknown): CrudRecord {
  if (!payload || typeof payload !== 'object') {
    return createEmptyRegraCadastroForm()
  }

  const record = payload as Record<string, unknown>
  const normalizedUf = String(record.uf || '').toUpperCase()

  return {
    id: String(record.id || ''),
    ativo: record.ativo === true || record.ativo === 1 || record.ativo === '1',
    nome: String(record.nome || ''),
    codigo: String(record.codigo || ''),
    contribuinte: toBooleanChoice(record.contribuinte),
    tipo: String(record.tipo || ''),
    tipo_cliente: String(record.tipo_cliente || ''),
    inscricao_estadual: String(record.inscricao_estadual || ''),
    uf: BRAZILIAN_STATES.includes(normalizedUf as never) ? normalizedUf : '',
    cep_de: cepMask(String(record.cep_de || '')),
    cep_ate: cepMask(String(record.cep_ate || '')),
    codigo_cnae: String(record.codigo_cnae || ''),
    valida_limite: record.valida_limite === true || record.valida_limite === 1 || record.valida_limite === '1',
    valida_multiplo: record.valida_multiplo === true || record.valida_multiplo === 1 || record.valida_multiplo === '1',
    id_filial: toLookupOption(record.filial, ['nome_fantasia', 'nome'], record.id_filial),
    id_filial_lookup: toLookupOption(record.filial, ['nome_fantasia', 'nome'], record.id_filial),
    id_filial_pedido: toLookupOption(record.filial_pedido, ['nome_fantasia', 'nome'], record.id_filial_pedido),
    id_filial_pedido_lookup: toLookupOption(record.filial_pedido, ['nome_fantasia', 'nome'], record.id_filial_pedido),
    id_filial_estoque: toLookupOption(record.filial_estoque, ['nome_fantasia', 'nome'], record.id_filial_estoque),
    id_filial_estoque_lookup: toLookupOption(record.filial_estoque, ['nome_fantasia', 'nome'], record.id_filial_estoque),
    id_vendedor: toLookupOption(record.vendedor, ['nome'], record.id_vendedor),
    id_vendedor_lookup: toLookupOption(record.vendedor, ['nome'], record.id_vendedor),
    id_praca: toLookupOption(record.praca, ['nome'], record.id_praca),
    id_praca_lookup: toLookupOption(record.praca, ['nome'], record.id_praca),
    id_tabela_preco: toLookupOption(record.tabela_preco, ['nome'], record.id_tabela_preco),
    id_tabela_preco_lookup: toLookupOption(record.tabela_preco, ['nome'], record.id_tabela_preco),
    id_canal_distribuicao: toLookupOption(record.canal_distribuicao, ['nome'], record.id_canal_distribuicao),
    id_canal_distribuicao_lookup: toLookupOption(record.canal_distribuicao, ['nome'], record.id_canal_distribuicao),
    id_cliente_filial: toLookupOption(record.cliente_filial, ['nome_fantasia', 'nome'], record.id_cliente_filial),
    id_cliente_filial_lookup: toLookupOption(record.cliente_filial, ['nome_fantasia', 'nome'], record.id_cliente_filial),
    id_tabela_preco_filial: toLookupOption(record.tabela_preco_filial, ['nome'], record.id_tabela_preco_filial),
    id_tabela_preco_filial_lookup: toLookupOption(record.tabela_preco_filial, ['nome'], record.id_tabela_preco_filial),
    limite_credito: record.limite_credito ? Number(record.limite_credito).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
    id_cliente_canal_distribuicao: toLookupOption(record.cliente_canal_distribuicao, ['nome'], record.id_cliente_canal_distribuicao),
    id_cliente_canal_distribuicao_lookup: toLookupOption(record.cliente_canal_distribuicao, ['nome'], record.id_cliente_canal_distribuicao),
    id_tabela_canal_distribuicao: toLookupOption(record.tabela_canal_distribuicao, ['nome'], record.id_tabela_canal_distribuicao),
    id_tabela_canal_distribuicao_lookup: toLookupOption(record.tabela_canal_distribuicao, ['nome'], record.id_tabela_canal_distribuicao),
    id_vendedor_canal_distribuicao: toLookupOption(record.vendedor_canal_distribuicao, ['nome'], record.id_vendedor_canal_distribuicao),
    id_vendedor_canal_distribuicao_lookup: toLookupOption(record.vendedor_canal_distribuicao, ['nome'], record.id_vendedor_canal_distribuicao),
    id_cliente_vendedor: toLookupOption(record.cliente_vendedor, ['nome'], record.id_cliente_vendedor),
    id_cliente_vendedor_lookup: toLookupOption(record.cliente_vendedor, ['nome'], record.id_cliente_vendedor),
  }
}

export function toRegraCadastroPayload(form: CrudRecord) {
  return {
    id: String(form.id || '') || undefined,
    ativo: form.ativo === true,
    nome: String(form.nome || '').trim(),
    codigo: String(form.codigo || '').trim() || null,
    contribuinte: form.contribuinte === '' ? null : form.contribuinte === '1',
    tipo: String(form.tipo || '').trim() || null,
    tipo_cliente: String(form.tipo_cliente || '').trim() || null,
    inscricao_estadual: String(form.inscricao_estadual || '').trim() || null,
    uf: String(form.uf || '').trim() || null,
    cep_de: digitsOnly(form.cep_de) || null,
    cep_ate: digitsOnly(form.cep_ate) || null,
    codigo_cnae: String(form.codigo_cnae || '').trim() || null,
    valida_limite: form.valida_limite === true,
    valida_multiplo: form.valida_multiplo === true,
    id_filial: nullableLookupId(form.id_filial_lookup ?? form.id_filial),
    id_filial_pedido: nullableLookupId(form.id_filial_pedido_lookup ?? form.id_filial_pedido),
    id_filial_estoque: nullableLookupId(form.id_filial_estoque_lookup ?? form.id_filial_estoque),
    id_vendedor: nullableLookupId(form.id_vendedor_lookup ?? form.id_vendedor),
    id_praca: nullableLookupId(form.id_praca_lookup ?? form.id_praca),
    id_tabela_preco: nullableLookupId(form.id_tabela_preco_lookup ?? form.id_tabela_preco),
    id_canal_distribuicao: nullableLookupId(form.id_canal_distribuicao_lookup ?? form.id_canal_distribuicao),
    id_cliente_filial: nullableLookupId(form.id_cliente_filial_lookup ?? form.id_cliente_filial),
    id_tabela_preco_filial: nullableLookupId(form.id_tabela_preco_filial_lookup ?? form.id_tabela_preco_filial),
    limite_credito: parseCurrencyInput(String(form.limite_credito || '')),
    id_cliente_canal_distribuicao: nullableLookupId(form.id_cliente_canal_distribuicao_lookup ?? form.id_cliente_canal_distribuicao),
    id_tabela_canal_distribuicao: nullableLookupId(form.id_tabela_canal_distribuicao_lookup ?? form.id_tabela_canal_distribuicao),
    id_vendedor_canal_distribuicao: nullableLookupId(form.id_vendedor_canal_distribuicao_lookup ?? form.id_vendedor_canal_distribuicao),
    id_cliente_vendedor: nullableLookupId(form.id_cliente_vendedor_lookup ?? form.id_cliente_vendedor),
  }
}
