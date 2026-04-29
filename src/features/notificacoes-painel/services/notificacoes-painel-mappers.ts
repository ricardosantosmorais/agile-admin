import type { CrudRecord } from '@/src/components/crud-base/types'
import { normalizeLookupState } from '@/src/lib/lookup-options'
import { asBoolean, asString } from '@/src/lib/api-payload'

export const NOTIFICACAO_PAINEL_CHANNEL_OPTIONS = [
  { value: 'todos', labelKey: 'panelNotifications.channels.all', label: 'Todos' },
  { value: 'admin', labelKey: 'panelNotifications.channels.admin', label: 'Admin' },
  { value: 'email', labelKey: 'panelNotifications.channels.email', label: 'E-mail' },
  { value: 'novidades', labelKey: 'panelNotifications.channels.news', label: 'Novidades' },
] as const

export function getNotificacaoPainelChannelLabel(value: unknown) {
  const normalized = asString(value).trim()
  return NOTIFICACAO_PAINEL_CHANNEL_OPTIONS.find((option) => option.value === normalized)?.label ?? (normalized || '-')
}

function formatApiDateToInput(value: unknown) {
  const normalized = asString(value).trim()
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

function formatInputDateToApi(value: unknown, endOfDay = false) {
  const normalized = asString(value).trim()
  if (!normalized) return null
  return `${normalized} ${endOfDay ? '23:59:59' : '00:00:00'}`
}

function normalizeEmpresas(record: CrudRecord) {
  const empresas = Array.isArray(record.empresas) ? record.empresas : []
  return empresas.map((item) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const empresa = row.empresa && typeof row.empresa === 'object' ? row.empresa as Record<string, unknown> : {}
    const id = asString(row.id).trim()
    const idEmpresa = asString(row.id_empresa ?? empresa.id).trim()
    const nomeEmpresa = empresa.nome_fantasia
      ?? empresa.razao_social
      ?? empresa.nome
      ?? row.nome_fantasia
      ?? row.razao_social
      ?? row.nome_empresa
      ?? row.empresa_nome
      ?? row.nome
    return {
      id,
      id_notificacao: asString(row.id_notificacao).trim(),
      id_empresa: idEmpresa,
      nome: asString(nomeEmpresa ?? idEmpresa).trim(),
      codigo: asString(empresa.codigo ?? row.codigo_empresa ?? row.codigo).trim(),
    }
  }).filter((empresa) => empresa.id)
}

export function normalizeNotificacaoPainelRecord(record: CrudRecord): CrudRecord {
  return {
    ...record,
    titulo: asString(record.titulo),
    canal: asString(record.canal),
    mensagem: asString(record.mensagem),
    ativo: record.ativo === undefined ? true : asBoolean(record.ativo),
    publicado: asBoolean(record.publicado),
    registrar_changelog: asBoolean(record.registrar_changelog),
    data_inicio: formatApiDateToInput(record.data_inicio),
    data_fim: formatApiDateToInput(record.data_fim),
    empresas: normalizeEmpresas(record),
    ...normalizeLookupState(record, 'empresa_selecionada', 'empresa', 'empresa_selecionada_lookup'),
  }
}

export function buildNotificacaoPainelPayload(record: CrudRecord): CrudRecord {
  return {
    id: asString(record.id).trim() || undefined,
    titulo: asString(record.titulo).trim(),
    canal: asString(record.canal).trim() || null,
    mensagem: asString(record.mensagem).trim() || null,
    data_inicio: formatInputDateToApi(record.data_inicio),
    data_fim: formatInputDateToApi(record.data_fim, true),
    ativo: asBoolean(record.ativo),
    registrar_changelog: asBoolean(record.registrar_changelog),
    publicado: asBoolean(record.publicado),
  }
}

export function isPublished(value: unknown) {
  return asBoolean(value)
}
