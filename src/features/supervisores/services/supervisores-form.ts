import type { LookupOption } from '@/src/components/ui/lookup-select'
import type { SupervisorFormRecord, SupervisorType } from '@/src/features/supervisores/types/supervisores'
import { cnpjMask, cpfMask, phoneMask } from '@/src/lib/input-masks'

function toLookupOption(value: unknown, labelKeys: string[], fallbackId?: unknown): LookupOption | null {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const id = String(record.id || fallbackId || '')
  const label = labelKeys.map((key) => String(record[key] || '')).find(Boolean) || id

  return id ? { id, label } : null
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function createEmptySupervisorForm(): SupervisorFormRecord {
  return {
    id: '',
    ativo: true,
    bloqueado: false,
    codigo: '',
    codigo_ativacao: '',
    tipo: 'PF',
    cpf: '',
    cnpj: '',
    nome: '',
    nome_fantasia: '',
    id_filial: null,
    id_canal_distribuicao: null,
    email: '',
    telefone: '',
    celular: '',
  }
}

export function mapSupervisorDetail(payload: unknown): SupervisorFormRecord {
  if (!payload || typeof payload !== 'object') {
    return createEmptySupervisorForm()
  }

  const record = payload as Record<string, unknown>
  const cnpjCpf = String(record.cnpj_cpf || '')
  const tipo = (String(record.tipo || '').toUpperCase() === 'PJ' ? 'PJ' : 'PF') as SupervisorType

  return {
    id: String(record.id || ''),
    ativo: record.ativo === true || record.ativo === 1 || record.ativo === '1',
    bloqueado: record.bloqueado === true || record.bloqueado === 1 || record.bloqueado === '1',
    codigo: String(record.codigo || ''),
    codigo_ativacao: String(record.codigo_ativacao || ''),
    tipo,
    cpf: tipo === 'PF' ? cpfMask(cnpjCpf) : '',
    cnpj: tipo === 'PJ' ? cnpjMask(cnpjCpf) : '',
    nome: tipo === 'PF' ? String(record.nome || '') : '',
    nome_fantasia: tipo === 'PJ' ? String(record.nome || '') : '',
    id_filial: toLookupOption(record.filial, ['nome_fantasia', 'nome'], record.id_filial),
    id_canal_distribuicao: toLookupOption(record.canal_distribuicao, ['nome'], record.id_canal_distribuicao),
    email: String(record.email || ''),
    telefone: phoneMask(`${String(record.ddd || '')}${String(record.telefone || '')}`, false),
    celular: phoneMask(`${String(record.ddd_celular || '')}${String(record.celular || '')}`, true),
  }
}

export function toSupervisorPayload(form: SupervisorFormRecord) {
  const telefone = digitsOnly(form.telefone)
  const celular = digitsOnly(form.celular)
  const payload: Record<string, unknown> = {
    id: form.id || undefined,
    ativo: form.ativo,
    bloqueado: form.bloqueado,
    codigo: form.codigo || null,
    codigo_ativacao: form.codigo_ativacao || null,
    tipo: form.tipo,
    cnpj_cpf: digitsOnly(form.tipo === 'PF' ? form.cpf : form.cnpj),
    nome: form.tipo === 'PF' ? form.nome : form.nome_fantasia,
    id_filial: form.id_filial?.id || null,
    id_canal_distribuicao: form.id_canal_distribuicao?.id || null,
    email: form.email || null,
    ddd: telefone ? telefone.slice(0, 2) : null,
    telefone: telefone ? telefone.slice(2) : null,
    ddd_celular: celular ? celular.slice(0, 2) : null,
    celular: celular ? celular.slice(2) : null,
  }

  return payload
}
