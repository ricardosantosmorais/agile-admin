'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { cepMask, cnpjMask, cpfMask, phoneMask } from '@/src/lib/input-masks'

function splitPhone(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return { ddd: '', number: '' }
  return {
    ddd: digits.slice(0, 2),
    number: digits.slice(2),
  }
}

export const TRANSPORTADORAS_CONFIG: CrudModuleConfig = {
  key: 'transportadoras',
  resource: 'transportadoras',
  routeBase: '/transportadoras',
  featureKey: 'transportadoras',
  listTitleKey: 'logistics.transportadoras.title',
  listTitle: 'Transportadoras',
  listDescriptionKey: 'logistics.transportadoras.listDescription',
  listDescription: 'Listagem com código, documento, nome e status ativo.',
  formTitleKey: 'logistics.transportadoras.formTitle',
  formTitle: 'Transportadora',
  breadcrumbSectionKey: 'routes.logistica',
  breadcrumbSection: 'Logística',
  breadcrumbModuleKey: 'routes.transportadoras',
  breadcrumbModule: 'Transportadoras',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome_fantasia', sort: 'asc', id: '', codigo: '', cnpj_cpf: '', 'nome_fantasia::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'cnpj_cpf', labelKey: 'logistics.transportadoras.fields.document', label: 'CPF/CNPJ', sortKey: 'cnpj_cpf', thClassName: 'w-[160px]', filter: { kind: 'text', key: 'cnpj_cpf' } },
    { id: 'nome_fantasia', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome_fantasia', tdClassName: 'font-semibold text-slate-950', render: (record) => String(record.nome_fantasia || record.razao_social || '-'), filter: { kind: 'text', key: 'nome_fantasia::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome_fantasia || record.razao_social || '-'),
  mobileSubtitle: (record) => String(record.cnpj_cpf || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'logistics.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        {
          key: 'tipo',
          labelKey: 'logistics.transportadoras.fields.personType',
          label: 'Tipo',
          type: 'select',
          defaultValue: 'PF',
          options: [
            { value: 'PF', labelKey: 'people.personType.pf', label: 'Pessoa Física' },
            { value: 'PJ', labelKey: 'people.personType.pj', label: 'Pessoa Jurídica' },
          ],
        },
        { key: 'cpf', labelKey: 'logistics.transportadoras.fields.cpf', label: 'CPF', type: 'text', mask: 'cpf', required: true, hidden: ({ form }) => String(form.tipo || 'PF') !== 'PF' },
        { key: 'nome', labelKey: 'logistics.transportadoras.fields.fullName', label: 'Nome completo', type: 'text', required: true, hidden: ({ form }) => String(form.tipo || 'PF') !== 'PF' },
        { key: 'cnpj', labelKey: 'logistics.transportadoras.fields.cnpj', label: 'CNPJ', type: 'text', mask: 'cnpj', required: true, hidden: ({ form }) => String(form.tipo || 'PF') !== 'PJ' },
        { key: 'nome_fantasia', labelKey: 'logistics.transportadoras.fields.tradeName', label: 'Nome fantasia', type: 'text', required: true, hidden: ({ form }) => String(form.tipo || 'PF') !== 'PJ' },
        { key: 'razao_social', labelKey: 'logistics.transportadoras.fields.companyName', label: 'Razão social', type: 'text', hidden: ({ form }) => String(form.tipo || 'PF') !== 'PJ' },
        { key: 'pessoa_contato', labelKey: 'logistics.transportadoras.fields.contactPerson', label: 'Pessoa de contato', type: 'text', hidden: ({ form }) => String(form.tipo || 'PF') !== 'PJ' },
        { key: 'email', labelKey: 'simpleCrud.fields.email', label: 'E-mail', type: 'email' },
        { key: 'telefone1', labelKey: 'logistics.transportadoras.fields.phone1', label: 'Telefone 1', type: 'text', mask: 'phone' },
        { key: 'telefone2', labelKey: 'logistics.transportadoras.fields.phone2', label: 'Telefone 2', type: 'text', mask: 'phone' },
        { key: 'celular', labelKey: 'logistics.transportadoras.fields.mobile', label: 'Celular', type: 'text', mask: 'mobile' },
        { key: 'cep', labelKey: 'logistics.transportadoras.fields.zipCode', label: 'CEP', type: 'text', mask: 'cep' },
        { key: 'endereco', labelKey: 'logistics.transportadoras.fields.address', label: 'Endereço', type: 'text' },
        { key: 'numero', labelKey: 'logistics.transportadoras.fields.number', label: 'Número', type: 'text' },
        { key: 'complemento', labelKey: 'logistics.transportadoras.fields.complement', label: 'Complemento', type: 'text' },
        { key: 'bairro', labelKey: 'logistics.transportadoras.fields.district', label: 'Bairro', type: 'text' },
        { key: 'cidade', labelKey: 'logistics.transportadoras.fields.city', label: 'Cidade', type: 'text' },
        { key: 'uf', labelKey: 'logistics.transportadoras.fields.state', label: 'UF', type: 'select', options: BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf })) },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => {
    const document = String(record.cnpj_cpf || '')
    const phone1 = splitPhone(`${String(record.ddd1 || '')}${String(record.telefone1 || '')}`)
    const phone2 = splitPhone(`${String(record.ddd2 || '')}${String(record.telefone2 || '')}`)
    const mobile = splitPhone(`${String(record.ddd_celular || '')}${String(record.celular || '')}`)
    const isPessoaFisica = document.replace(/\D/g, '').length <= 11

    return {
      ...record,
      tipo: isPessoaFisica ? 'PF' : 'PJ',
      cpf: isPessoaFisica ? cpfMask(document) : '',
      cnpj: isPessoaFisica ? '' : cnpjMask(document),
      nome: isPessoaFisica ? String(record.nome_fantasia || '') : '',
      pessoa_contato: String(record.pessoa_contato || record.contato || ''),
      telefone1: phoneMask(`${phone1.ddd}${phone1.number}`),
      telefone2: phoneMask(`${phone2.ddd}${phone2.number}`),
      celular: phoneMask(`${mobile.ddd}${mobile.number}`, true),
      cep: cepMask(String(record.cep || '')),
    }
  },
  beforeSave: (record: CrudRecord) => {
    const tipo = String(record.tipo || 'PF')
    const document = tipo === 'PF' ? String(record.cpf || '').replace(/\D/g, '') : String(record.cnpj || '').replace(/\D/g, '')
    const tel1 = splitPhone(String(record.telefone1 || ''))
    const tel2 = splitPhone(String(record.telefone2 || ''))
    const mobile = splitPhone(String(record.celular || ''))

    return {
      ...record,
      cnpj_cpf: document,
      nome_fantasia: tipo === 'PF' ? String(record.nome || '') : String(record.nome_fantasia || ''),
      razao_social: tipo === 'PF' ? '' : String(record.razao_social || ''),
      pessoa_contato: tipo === 'PF' ? '' : String(record.pessoa_contato || ''),
      ddd1: tel1.ddd,
      telefone1: tel1.number,
      ddd2: tel2.ddd,
      telefone2: tel2.number,
      ddd_celular: mobile.ddd,
      celular: mobile.number,
      cep: String(record.cep || '').replace(/\D/g, ''),
      tipo: undefined,
      cpf: undefined,
      cnpj: undefined,
      nome: undefined,
      contato: undefined,
    }
  },
}
