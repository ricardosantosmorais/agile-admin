import type { ContatoDetail, ContatoEditFormValues, ContatoStatus } from '@/src/features/contatos/types/contatos'
import { asBoolean, asRecord, asString } from '@/src/lib/api-payload'
import { formatApiDateToInput } from '@/src/lib/date-input'
import { digitsOnly } from '@/src/lib/value-parsers'

const booleanFields = ['whatsapp', 'news', 'ativo'] as const
const digitOnlyFields = ['cnpj_cpf', 'ddd1', 'telefone1', 'ddd2', 'telefone2', 'ddd_celular', 'celular', 'cep'] as const
const statusValues: ContatoStatus[] = ['recebido', 'aprovado', 'reprovado']

export const contatoStatusOptions: ContatoStatus[] = statusValues

function nullableText(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function normalizeStatus(value: unknown): ContatoStatus {
  const normalized = String(value ?? '').trim()
  return statusValues.includes(normalized as ContatoStatus) ? normalized as ContatoStatus : 'recebido'
}

function normalizeBoolean(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['1', 'true', 'sim', 'yes', 'on'].includes(normalized)
  }

  return asBoolean(value)
}

export function mapContatoDetailToEditForm(detail: ContatoDetail): ContatoEditFormValues {
  const segmento = asRecord(detail.segmento)

  return {
    id: asString(detail.id),
    status: normalizeStatus(detail.status),
    codigo: asString(detail.codigo),
    perfil: asString(detail.perfil),
    tipo: asString(detail.tipo),
    tipo_cliente: asString(detail.tipo_cliente),
    cnpj_cpf: asString(detail.cnpj_cpf),
    nome_fantasia: asString(detail.nome_fantasia),
    razao_social: asString(detail.razao_social),
    inscricao_estadual: asString(detail.inscricao_estadual),
    pessoa_contato: asString(detail.pessoa_contato),
    cargo: asString(detail.cargo),
    ramo_atividade: asString(detail.ramo_atividade),
    email: asString(detail.email),
    sexo: asString(detail.sexo),
    rg: asString(detail.rg),
    data_nascimento: formatApiDateToInput(detail.data_nascimento),
    id_segmento: asString(detail.id_segmento) || asString(segmento.id),
    ddd1: asString(detail.ddd1),
    telefone1: asString(detail.telefone1),
    ddd2: asString(detail.ddd2),
    telefone2: asString(detail.telefone2),
    ddd_celular: asString(detail.ddd_celular),
    celular: asString(detail.celular),
    whatsapp: normalizeBoolean(detail.whatsapp),
    news: normalizeBoolean(detail.news),
    ativo: 'ativo' in detail ? normalizeBoolean(detail.ativo) : true,
    endereco: asString(detail.endereco),
    numero: asString(detail.numero),
    complemento: asString(detail.complemento),
    bairro: asString(detail.bairro),
    cidade: asString(detail.cidade),
    uf: asString(detail.uf),
    cep: asString(detail.cep),
    codigo_ibge: String(detail.codigo_ibge ?? '').trim(),
    ponto_referencia: asString(detail.ponto_referencia),
  }
}

export function buildContatoEditPayload(values: ContatoEditFormValues) {
  const payload: Record<string, unknown> = {
    id: values.id,
    edicao_admin: true,
    logs: {
      descricao: 'Contato editado no Admin v2',
    },
  }

  payload.status = normalizeStatus(values.status)

  for (const field of [
    'codigo',
    'perfil',
    'tipo',
    'tipo_cliente',
    'nome_fantasia',
    'inscricao_estadual',
    'razao_social',
    'email',
    'sexo',
    'rg',
    'ramo_atividade',
    'pessoa_contato',
    'cargo',
    'endereco',
    'numero',
    'complemento',
    'bairro',
    'cidade',
    'uf',
    'ponto_referencia',
    'id_segmento',
  ] as const) {
    payload[field] = nullableText(values[field])
  }

  for (const field of digitOnlyFields) {
    const normalized = digitsOnly(values[field])
    payload[field] = normalized || null
  }

  for (const field of booleanFields) {
    payload[field] = normalizeBoolean(values[field])
  }

  payload.codigo_ibge = digitsOnly(values.codigo_ibge) ? Number(digitsOnly(values.codigo_ibge)) : null
  payload.data_nascimento = nullableText(values.data_nascimento)

  return payload
}
