import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { cepMask, cnpjMask, cpfMask, phoneMask } from '@/src/lib/input-masks'
import { splitPhone } from '@/src/lib/value-parsers'

export const FORNECEDORES_CONFIG: CrudModuleConfig = {
  key: 'fornecedores',
  resource: 'fornecedores',
  routeBase: '/fornecedores',
  featureKey: 'fornecedores',
  listTitleKey: 'catalog.fornecedores.title',
  listTitle: 'Fornecedores',
  listDescriptionKey: 'catalog.fornecedores.description',
  listDescription: 'Listagem de fornecedores.',
  formTitleKey: 'catalog.fornecedores.formTitle',
  formTitle: 'Fornecedor',
  breadcrumbSectionKey: 'simpleCrud.sections.catalog',
  breadcrumbSection: 'Catálogo',
  breadcrumbModuleKey: 'catalog.fornecedores.title',
  breadcrumbModule: 'Fornecedores',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome_fantasia', sort: 'asc', id: '', codigo: '', cnpj_cpf: '', 'nome_fantasia::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'cnpj_cpf', labelKey: 'catalog.fornecedores.fields.document', label: 'CPF/CNPJ', sortKey: 'cnpj_cpf', thClassName: 'w-[160px]', filter: { kind: 'text', key: 'cnpj_cpf' } },
    { id: 'nome_fantasia', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome_fantasia', tdClassName: 'font-semibold text-slate-950', render: (record) => String(record.nome_fantasia || record.razao_social || '-'), filter: { kind: 'text', key: 'nome_fantasia::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome_fantasia || record.razao_social || '-'),
  mobileSubtitle: (record) => String(record.cnpj_cpf || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'catalog.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'menu', labelKey: 'catalog.fields.menu', label: 'Menu', type: 'toggle' },
        { key: 'feed', labelKey: 'catalog.fields.feed', label: 'Feed de dados', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'tipo', labelKey: 'catalog.fornecedores.fields.personType', label: 'Tipo', type: 'select', options: [{ value: 'PF', label: 'Pessoa Física' }, { value: 'PJ', label: 'Pessoa Jurídica' }] },
        { key: 'cpf', labelKey: 'catalog.fornecedores.fields.cpf', label: 'CPF', type: 'text', mask: 'cpf' },
        { key: 'cnpj', labelKey: 'catalog.fornecedores.fields.cnpj', label: 'CNPJ', type: 'text', mask: 'cnpj' },
        { key: 'nome', labelKey: 'catalog.fornecedores.fields.fullName', label: 'Nome completo', type: 'text' },
        { key: 'nome_fantasia', labelKey: 'catalog.fornecedores.fields.tradeName', label: 'Nome fantasia', type: 'text' },
        { key: 'razao_social', labelKey: 'catalog.fornecedores.fields.companyName', label: 'Razão social', type: 'text' },
        { key: 'contato', labelKey: 'catalog.fornecedores.fields.contactPerson', label: 'Pessoa de contato', type: 'text' },
        { key: 'email', labelKey: 'simpleCrud.fields.email', label: 'E-mail', type: 'email', required: true },
        { key: 'telefone1', labelKey: 'catalog.fornecedores.fields.phone1', label: 'Telefone 1', type: 'text', mask: 'phone' },
        { key: 'telefone2', labelKey: 'catalog.fornecedores.fields.phone2', label: 'Telefone 2', type: 'text', mask: 'phone' },
        { key: 'celular', labelKey: 'catalog.fornecedores.fields.mobile', label: 'Celular', type: 'text', mask: 'mobile' },
        { key: 'cep', labelKey: 'catalog.fornecedores.fields.cep', label: 'CEP', type: 'text', mask: 'cep' },
        { key: 'endereco', labelKey: 'catalog.fornecedores.fields.address', label: 'Endereço', type: 'text' },
        { key: 'numero', labelKey: 'catalog.fornecedores.fields.number', label: 'Número', type: 'text' },
        { key: 'complemento', labelKey: 'catalog.fornecedores.fields.complement', label: 'Complemento', type: 'text' },
        { key: 'bairro', labelKey: 'catalog.fornecedores.fields.district', label: 'Bairro', type: 'text' },
        { key: 'cidade', labelKey: 'catalog.fornecedores.fields.city', label: 'Cidade', type: 'text' },
        { key: 'uf', labelKey: 'catalog.fornecedores.fields.state', label: 'UF', type: 'select', options: BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf })) },
        { key: 'imagem', labelKey: 'catalog.fields.banner', label: 'Banner', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'fornecedores' },
        { key: 'imagem_mobile', labelKey: 'catalog.fields.mobileBanner', label: 'Banner mobile', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'fornecedores' },
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
      telefone1: phoneMask(`${phone1.ddd}${phone1.number}`),
      telefone2: phoneMask(`${phone2.ddd}${phone2.number}`),
      celular: phoneMask(`${mobile.ddd}${mobile.number}`, true),
      cep: cepMask(String(record.cep || '')),
    }
  },
  beforeSave: (record: CrudRecord) => {
    const tipo = String(record.tipo || 'PJ')
    const document = tipo === 'PF' ? String(record.cpf || '').replace(/\D/g, '') : String(record.cnpj || '').replace(/\D/g, '')
    const tel1 = splitPhone(String(record.telefone1 || ''))
    const tel2 = splitPhone(String(record.telefone2 || ''))
    const mobile = splitPhone(String(record.celular || ''))

    return {
      ...record,
      cnpj_cpf: document,
      nome_fantasia: tipo === 'PF' ? String(record.nome || '') : String(record.nome_fantasia || ''),
      ddd1: tel1.ddd,
      telefone1: tel1.number,
      ddd2: tel2.ddd,
      telefone2: tel2.number,
      ddd_celular: mobile.ddd,
      celular: mobile.number,
      cep: String(record.cep || '').replace(/\D/g, ''),
    }
  },
}
