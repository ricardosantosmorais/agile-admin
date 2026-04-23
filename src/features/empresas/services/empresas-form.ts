import { cnpjMask, cepMask, phoneMask } from '@/src/lib/input-masks'
import { formatCpfCnpj } from '@/src/lib/formatters'
import { nullableLookupId, toLookupOption } from '@/src/lib/lookup-options'
import { digitsOnly, splitPhone } from '@/src/lib/value-parsers'

function toDateInputValue(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function trimUrlPrefix(value: unknown, prefix: string) {
  return String(value ?? '').trim().replace(new RegExp(`^${prefix}`, 'i'), '')
}

function trimBucket(value: unknown) {
  return trimUrlPrefix(String(value ?? '').replace(/\.agilecdn\.com\.br\/?$/i, ''), 'https?://')
}

function resolveLookupId(value: unknown) {
  return nullableLookupId(value) || ''
}

export function mapEmpresaDetail(payload: unknown) {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const clusterLookup = toLookupOption(record.cluster, ['nome'], record.id_cluster)
  const templateLookup = toLookupOption(record.template, ['nome', 'titulo'], record.id_template)
  const gerenteLookup = toLookupOption(
    record.implantacao_gerente ?? record.gerente_implantacao ?? record.administrador_implantacao_gerente,
    ['nome', 'email'],
    record.id_implantacao_gerente,
  )
  const analistaLookup = toLookupOption(
    record.implantacao_analista ?? record.analista_implantacao ?? record.administrador_implantacao_analista,
    ['nome', 'email'],
    record.id_implantacao_analista,
  )

  return {
    id: String(record.id || ''),
    ativo: normalizeBoolean(record.ativo),
    manutencao: normalizeBoolean(record.manutencao),
    bloqueado: normalizeBoolean(record.bloqueado),
    intercom: normalizeBoolean(record.intercom),
    fatura_totvs: normalizeBoolean(record.fatura_totvs),
    tipo: String(record.tipo || ''),
    status: String(record.status || ''),
    codigo: String(record.codigo || ''),
    cnpj: record.cnpj ? cnpjMask(String(record.cnpj)) : formatCpfCnpj(record.cnpj, ''),
    nome_fantasia: String(record.nome_fantasia || ''),
    razao_social: String(record.razao_social || ''),
    cep: cepMask(String(record.cep || '')),
    endereco: String(record.endereco || ''),
    numero: String(record.numero || ''),
    complemento: String(record.complemento || ''),
    bairro: String(record.bairro || ''),
    cidade: String(record.cidade || ''),
    uf: String(record.uf || ''),
    email: String(record.email || ''),
    telefone: phoneMask(`${String(record.ddd || '')}${String(record.telefone || '')}`),
    celular: phoneMask(`${String(record.ddd_celular || '')}${String(record.celular || '')}`, true),
    contato_comercial: String(record.contato_comercial || ''),
    email_comercial: String(record.email_comercial || ''),
    telefone_comercial: phoneMask(`${String(record.ddd_comercial || '')}${String(record.telefone_comercial || '')}`, true),
    contato_financeiro: String(record.contato_financeiro || ''),
    email_financeiro: String(record.email_financeiro || ''),
    telefone_financeiro: phoneMask(`${String(record.ddd_financeiro || '')}${String(record.telefone_financeiro || '')}`, true),
    contato_tecnico: String(record.contato_tecnico || ''),
    email_tecnico: String(record.email_tecnico || ''),
    telefone_tecnico: phoneMask(`${String(record.ddd_tecnico || '')}${String(record.telefone_tecnico || '')}`, true),
    url: trimUrlPrefix(record.url, 'https?://'),
    id_cluster: resolveLookupId(record.id_cluster || record.cluster),
    id_cluster_lookup: clusterLookup,
    s3_bucket: trimBucket(record.s3_bucket),
    erp: String(record.erp || ''),
    id_template: resolveLookupId(record.id_template || record.template),
    id_template_lookup: templateLookup,
    token_integrador: String(record.token_integrador || ''),
    id_implantacao_gerente: resolveLookupId(record.id_implantacao_gerente || record.implantacao_gerente || record.gerente_implantacao || record.administrador_implantacao_gerente),
    id_implantacao_gerente_lookup: gerenteLookup,
    id_implantacao_analista: resolveLookupId(record.id_implantacao_analista || record.implantacao_analista || record.analista_implantacao || record.administrador_implantacao_analista),
    id_implantacao_analista_lookup: analistaLookup,
    monday_url: String(record.monday_url || ''),
    data_inicio_implantacao: toDateInputValue(record.data_inicio_implantacao),
    dias_previsao_implantacao: String(record.dias_previsao_implantacao || ''),
    data_fim_implantacao: toDateInputValue(record.data_fim_implantacao),
  }
}

function formatDatePayload(value: unknown) {
  const raw = String(value ?? '').trim()
  return raw ? `${raw} 00:00:00` : null
}

function normalizeOptionalText(value: unknown) {
  const raw = String(value ?? '').trim()
  return raw || null
}

function normalizeOptionalDigits(value: unknown) {
  const raw = digitsOnly(value)
  return raw || null
}

function buildPhonePayload(value: unknown) {
  const { ddd, number } = splitPhone(value)
  return {
    ddd: ddd || null,
    number: number || null,
  }
}

export function buildEmpresaPayload(payload: Record<string, unknown>) {
  const telefone = buildPhonePayload(payload.telefone)
  const celular = buildPhonePayload(payload.celular)
  const telefoneComercial = buildPhonePayload(payload.telefone_comercial)
  const telefoneFinanceiro = buildPhonePayload(payload.telefone_financeiro)
  const telefoneTecnico = buildPhonePayload(payload.telefone_tecnico)

  return {
    id: normalizeOptionalText(payload.id) || undefined,
    ativo: normalizeBoolean(payload.ativo),
    manutencao: normalizeBoolean(payload.manutencao),
    bloqueado: normalizeBoolean(payload.bloqueado),
    intercom: normalizeBoolean(payload.intercom),
    fatura_totvs: normalizeBoolean(payload.fatura_totvs),
    tipo: normalizeOptionalText(payload.tipo),
    status: normalizeOptionalText(payload.status),
    codigo: normalizeOptionalText(payload.codigo),
    cnpj: normalizeOptionalDigits(payload.cnpj),
    nome_fantasia: normalizeOptionalText(payload.nome_fantasia),
    razao_social: normalizeOptionalText(payload.razao_social),
    cep: normalizeOptionalDigits(payload.cep),
    endereco: normalizeOptionalText(payload.endereco),
    numero: normalizeOptionalText(payload.numero),
    complemento: normalizeOptionalText(payload.complemento),
    bairro: normalizeOptionalText(payload.bairro),
    cidade: normalizeOptionalText(payload.cidade),
    uf: normalizeOptionalText(payload.uf),
    email: normalizeOptionalText(payload.email),
    ddd: telefone.ddd,
    telefone: telefone.number,
    ddd_celular: celular.ddd,
    celular: celular.number,
    contato_comercial: normalizeOptionalText(payload.contato_comercial),
    email_comercial: normalizeOptionalText(payload.email_comercial),
    ddd_comercial: telefoneComercial.ddd,
    telefone_comercial: telefoneComercial.number,
    contato_financeiro: normalizeOptionalText(payload.contato_financeiro),
    email_financeiro: normalizeOptionalText(payload.email_financeiro),
    ddd_financeiro: telefoneFinanceiro.ddd,
    telefone_financeiro: telefoneFinanceiro.number,
    contato_tecnico: normalizeOptionalText(payload.contato_tecnico),
    email_tecnico: normalizeOptionalText(payload.email_tecnico),
    ddd_tecnico: telefoneTecnico.ddd,
    telefone_tecnico: telefoneTecnico.number,
    url: payload.url ? `https://${trimUrlPrefix(payload.url, 'https?://')}` : null,
    id_cluster: nullableLookupId(payload.id_cluster_lookup ?? payload.id_cluster),
    s3_bucket: payload.s3_bucket ? `https://${trimBucket(payload.s3_bucket)}.agilecdn.com.br` : null,
    erp: normalizeOptionalText(payload.erp),
    id_template: nullableLookupId(payload.id_template_lookup ?? payload.id_template),
    token_integrador: normalizeOptionalText(payload.token_integrador),
    id_implantacao_gerente: nullableLookupId(payload.id_implantacao_gerente_lookup ?? payload.id_implantacao_gerente),
    id_implantacao_analista: nullableLookupId(payload.id_implantacao_analista_lookup ?? payload.id_implantacao_analista),
    monday_url: normalizeOptionalText(payload.monday_url),
    data_inicio_implantacao: formatDatePayload(payload.data_inicio_implantacao),
    dias_previsao_implantacao: normalizeOptionalDigits(payload.dias_previsao_implantacao),
    data_fim_implantacao: formatDatePayload(payload.data_fim_implantacao),
  }
}
