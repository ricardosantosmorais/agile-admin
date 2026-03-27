import type {
  VendedorCanalDistribuicaoRelation,
  VendedorFormRecord,
  VendedorType,
} from '@/src/features/vendedores/types/vendedores'
import { cnpjMask, cpfMask, phoneMask } from '@/src/lib/input-masks'
import { toLookupOption } from '@/src/lib/lookup-options'
import { digitsOnly } from '@/src/lib/value-parsers'

export function createEmptyVendedorForm(): VendedorFormRecord {
  return {
    id: '',
    ativo: true,
    bloqueado: false,
    codigo: '',
    codigo_ativacao: '',
    tipo: 'PF',
    tipo_vendedor: 'ativo',
    cpf: '',
    cnpj: '',
    nome: '',
    nome_fantasia: '',
    id_filial: null,
    id_supervisor: null,
    id_canal_distribuicao: null,
    email: '',
    telefone: '',
    celular: '',
    canais_distribuicao: [],
  }
}

export function mapVendedorDetail(payload: unknown): VendedorFormRecord {
  if (!payload || typeof payload !== 'object') {
    return createEmptyVendedorForm()
  }

  const record = payload as Record<string, unknown>
  const cnpjCpf = String(record.cnpj_cpf || '')
  const tipo = (String(record.tipo || '').toUpperCase() === 'PJ' ? 'PJ' : 'PF') as VendedorType

  return {
    id: String(record.id || ''),
    ativo: record.ativo === true || record.ativo === 1 || record.ativo === '1',
    bloqueado: record.bloqueado === true || record.bloqueado === 1 || record.bloqueado === '1',
    codigo: String(record.codigo || ''),
    codigo_ativacao: String(record.codigo_ativacao || ''),
    tipo,
    tipo_vendedor: (['ativo', 'externo', 'receptivo'].includes(String(record.tipo_vendedor)) ? String(record.tipo_vendedor) : 'ativo') as VendedorFormRecord['tipo_vendedor'],
    cpf: tipo === 'PF' ? cpfMask(cnpjCpf) : '',
    cnpj: tipo === 'PJ' ? cnpjMask(cnpjCpf) : '',
    nome: tipo === 'PF' ? String(record.nome || '') : '',
    nome_fantasia: tipo === 'PJ' ? String(record.nome || '') : '',
    id_filial: toLookupOption(record.filial, ['nome_fantasia', 'nome']),
    id_supervisor: toLookupOption(record.supervisor, ['nome']),
    id_canal_distribuicao: toLookupOption(record.canal_distribuicao, ['nome']),
    email: String(record.email || ''),
    telefone: phoneMask(`${String(record.ddd || '')}${String(record.telefone || '')}`, false),
    celular: phoneMask(`${String(record.ddd_celular || '')}${String(record.celular || '')}`, true),
    canais_distribuicao: Array.isArray(record.canais_distribuicao)
      ? record.canais_distribuicao as VendedorCanalDistribuicaoRelation[]
      : [],
  }
}

export function toVendedorPayload(form: VendedorFormRecord) {
  const telefone = digitsOnly(form.telefone)
  const celular = digitsOnly(form.celular)

  return {
    id: form.id || undefined,
    ativo: form.ativo,
    bloqueado: form.bloqueado,
    codigo: form.codigo || null,
    codigo_ativacao: form.codigo_ativacao || null,
    tipo: form.tipo,
    tipo_vendedor: form.tipo_vendedor,
    cnpj_cpf: digitsOnly(form.tipo === 'PF' ? form.cpf : form.cnpj),
    nome: form.tipo === 'PF' ? form.nome : form.nome_fantasia,
    id_filial: form.id_filial?.id || null,
    id_supervisor: form.id_supervisor?.id || null,
    id_canal_distribuicao: form.id_canal_distribuicao?.id || null,
    email: form.email || null,
    ddd: telefone ? telefone.slice(0, 2) : null,
    telefone: telefone ? telefone.slice(2) : null,
    ddd_celular: celular ? celular.slice(0, 2) : null,
    celular: celular ? celular.slice(2) : null,
  }
}
