import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { cepMask, cnpjMask, currencyMask, parseCurrencyInput, phoneMask } from '@/src/lib/input-masks'
import { validateCepLength } from '@/src/lib/validators'
import { formatLocalizedDecimal, parseInteger, parseLocalizedNumber, splitPhone } from '@/src/lib/value-parsers'

export const FILIAIS_CONFIG: CrudModuleConfig = {
  key: 'filiais',
  resource: 'filiais',
  routeBase: '/filiais',
  featureKey: 'filiais',
  listTitleKey: 'basicRegistrations.branches.title',
  listTitle: 'Filiais',
  listDescriptionKey: 'basicRegistrations.branches.listDescription',
  listDescription: 'Listagem com código, CNPJ, nome fantasia e status ativo.',
  formTitleKey: 'basicRegistrations.branches.formTitle',
  formTitle: 'Filial',
  breadcrumbSectionKey: 'routes.cadastrosBasicos',
  breadcrumbSection: 'Cadastros Básicos',
  breadcrumbModuleKey: 'routes.filiais',
  breadcrumbModule: 'Filiais',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome_fantasia', sort: 'asc', id: '', codigo: '', cnpj: '', 'nome_fantasia::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'cnpj', labelKey: 'basicRegistrations.branches.fields.document', label: 'CNPJ', sortKey: 'cnpj', thClassName: 'w-[170px]', render: (record) => cnpjMask(String(record.cnpj || '')), filter: { kind: 'text', key: 'cnpj' } },
    { id: 'nome_fantasia', labelKey: 'basicRegistrations.branches.fields.tradeName', label: 'Nome fantasia', sortKey: 'nome_fantasia', tdClassName: 'font-semibold text-[color:var(--app-text)]', render: (record) => String(record.nome_fantasia || '-'), filter: { kind: 'text', key: 'nome_fantasia::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome_fantasia || '-'),
  mobileSubtitle: (record) => cnpjMask(String(record.cnpj || '')),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [{
    id: 'main',
    titleKey: 'basicRegistrations.sections.general',
    title: 'Dados gerais',
    layout: 'rows',
    fields: [
      { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
      { key: 'calcula_ipi', labelKey: 'basicRegistrations.branches.fields.calculateIpi', label: 'Calcula IPI', type: 'toggle' },
      { key: 'padrao', labelKey: 'basicRegistrations.branches.fields.default', label: 'Padrão', type: 'toggle' },
      { key: 'feed', labelKey: 'basicRegistrations.branches.fields.feed', label: 'Feed', type: 'toggle' },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
      { key: 'id_grupo', labelKey: 'basicRegistrations.branches.fields.group', label: 'Grupo', type: 'lookup', optionsResource: 'grupos_filiais', lookupStateKey: 'id_grupo_lookup' },
      { key: 'nome_fantasia', labelKey: 'basicRegistrations.branches.fields.tradeName', label: 'Nome fantasia', type: 'text', required: true },
      { key: 'razao_social', labelKey: 'basicRegistrations.branches.fields.companyName', label: 'Razão social', type: 'text' },
      { key: 'cnpj', labelKey: 'basicRegistrations.branches.fields.document', label: 'CNPJ', type: 'text', mask: 'cnpj', required: true },
      { key: 'contato', labelKey: 'basicRegistrations.branches.fields.contactPerson', label: 'Pessoa de contato', type: 'text' },
      { key: 'email', labelKey: 'simpleCrud.fields.email', label: 'E-mail', type: 'email' },
      { key: 'telefone', labelKey: 'basicRegistrations.branches.fields.phone', label: 'Telefone', type: 'text', mask: 'phone' },
      { key: 'celular', labelKey: 'basicRegistrations.branches.fields.mobile', label: 'Celular', type: 'text', mask: 'mobile' },
      { key: 'cep', labelKey: 'basicRegistrations.branches.fields.zipCode', label: 'CEP', type: 'text', mask: 'cep', validate: ({ value }) => validateCepLength(value) },
      { key: 'endereco', labelKey: 'basicRegistrations.branches.fields.address', label: 'Endereço', type: 'text' },
      { key: 'numero', labelKey: 'basicRegistrations.branches.fields.number', label: 'Número', type: 'text' },
      { key: 'complemento', labelKey: 'basicRegistrations.branches.fields.complement', label: 'Complemento', type: 'text' },
      { key: 'bairro', labelKey: 'basicRegistrations.branches.fields.district', label: 'Bairro', type: 'text' },
      { key: 'cidade', labelKey: 'basicRegistrations.branches.fields.city', label: 'Cidade', type: 'text' },
      { key: 'uf', labelKey: 'basicRegistrations.branches.fields.state', label: 'UF', type: 'select', options: BRAZILIAN_STATES.map((state) => ({ value: state, label: state })) },
      { key: 'latitude', labelKey: 'basicRegistrations.branches.fields.latitude', label: 'Latitude', type: 'text', helperTextKey: 'basicRegistrations.branches.fields.latitudeHint', helperText: 'Use ponto para decimais.' },
      { key: 'longitude', labelKey: 'basicRegistrations.branches.fields.longitude', label: 'Longitude', type: 'text', helperTextKey: 'basicRegistrations.branches.fields.longitudeHint', helperText: 'Use ponto para decimais.' },
      { key: 'pedido_minimo', labelKey: 'basicRegistrations.branches.fields.minimumOrder', label: 'Pedido mínimo', type: 'text', mask: 'currency', prefixText: 'R$' },
      { key: 'peso_minimo', labelKey: 'basicRegistrations.branches.fields.minimumWeight', label: 'Peso mínimo', type: 'text', mask: 'decimal', suffixText: 'kg' },
      { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', type: 'number' },
      { key: 'desconto_retira', labelKey: 'basicRegistrations.branches.fields.pickupDiscount', label: 'Desconto retira', type: 'text', suffixText: '%' },
      { key: 'acrescimo_retira', labelKey: 'basicRegistrations.branches.fields.pickupAdditional', label: 'Acréscimo retira', type: 'text', suffixText: '%' },
      { key: 'limite_itens_pedido', labelKey: 'basicRegistrations.branches.fields.orderItemsLimit', label: 'Limite de itens por pedido', type: 'number' },
    ],
  }],
  normalizeRecord: (record) => {
    const phone = splitPhone(`${String(record.ddd || '')}${String(record.telefone || '')}`)
    const mobile = splitPhone(`${String(record.ddd_celular || '')}${String(record.celular || '')}`)

    return {
      ...record,
      cnpj: cnpjMask(String(record.cnpj || '')),
      contato: String(record.contato || record.pessoa_contato || ''),
      pessoa_contato: String(record.contato || record.pessoa_contato || ''),
      telefone: phoneMask(`${phone.ddd}${phone.number}`),
      celular: phoneMask(`${mobile.ddd}${mobile.number}`, true),
      cep: cepMask(String(record.cep || '')),
      pedido_minimo: record.pedido_minimo === null || record.pedido_minimo === undefined ? '' : currencyMask(String(record.pedido_minimo)),
      peso_minimo: formatLocalizedDecimal(record.peso_minimo, 3),
      desconto_retira: record.desconto_retira === null || record.desconto_retira === undefined ? '' : formatLocalizedDecimal(record.desconto_retira, 2),
      acrescimo_retira: record.acrescimo_retira === null || record.acrescimo_retira === undefined ? '' : formatLocalizedDecimal(record.acrescimo_retira, 2),
      id_grupo_lookup: record.id_grupo ? { id: String(record.id_grupo), label: String(record.id_grupo) } : null,
    }
  },
  beforeSave: (record: CrudRecord) => {
    const rest = { ...record }
    delete rest.pessoa_contato
    const phone = splitPhone(record.telefone)
    const mobile = splitPhone(record.celular)

    return {
      ...rest,
      id_grupo: String(record.id_grupo || '').trim() || null,
      cnpj: String(record.cnpj || '').replace(/\D/g, '') || null,
      ddd: phone.ddd || null,
      telefone: phone.number || null,
      ddd_celular: mobile.ddd || null,
      celular: mobile.number || null,
      cep: String(record.cep || '').replace(/\D/g, '') || null,
      pedido_minimo: parseCurrencyInput(String(record.pedido_minimo || '')),
      peso_minimo: parseCurrencyInput(String(record.peso_minimo || '')),
      desconto_retira: parseLocalizedNumber(record.desconto_retira),
      acrescimo_retira: parseLocalizedNumber(record.acrescimo_retira),
      limite_itens_pedido: parseInteger(record.limite_itens_pedido),
      posicao: parseInteger(record.posicao),
      contato: String(record.contato || record.pessoa_contato || '').trim() || null,
      id_grupo_lookup: undefined,
    }
  },
}
