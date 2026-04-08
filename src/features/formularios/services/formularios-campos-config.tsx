'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'

const FORM_FIELD_TYPE_OPTIONS = [
  { value: 'arquivo', labelKey: 'maintenance.formFields.options.type.file', label: 'Arquivo' },
  { value: 'celular', labelKey: 'maintenance.formFields.options.type.mobile', label: 'Celular' },
  { value: 'cep', labelKey: 'maintenance.formFields.options.type.cep', label: 'CEP' },
  { value: 'checar', labelKey: 'maintenance.formFields.options.type.check', label: 'Checar' },
  { value: 'cnpj', labelKey: 'maintenance.formFields.options.type.cnpj', label: 'CNPJ' },
  { value: 'cpf', labelKey: 'maintenance.formFields.options.type.cpf', label: 'CPF' },
  { value: 'data', labelKey: 'maintenance.formFields.options.type.date', label: 'Data' },
  { value: 'email', labelKey: 'maintenance.formFields.options.type.email', label: 'E-mail' },
  { value: 'numero', labelKey: 'maintenance.formFields.options.type.number', label: 'Número' },
  { value: 'seletor', labelKey: 'maintenance.formFields.options.type.selector', label: 'Seletor' },
  { value: 'senha', labelKey: 'maintenance.formFields.options.type.password', label: 'Senha' },
  { value: 'sim_nao', labelKey: 'maintenance.formFields.options.type.yesNo', label: 'Sim/Não' },
  { value: 'telefone', labelKey: 'maintenance.formFields.options.type.phone', label: 'Telefone' },
  { value: 'texto', labelKey: 'maintenance.formFields.options.type.text', label: 'Texto' },
  { value: 'valor', labelKey: 'maintenance.formFields.options.type.value', label: 'Valor' },
  { value: 'oculto', labelKey: 'maintenance.formFields.options.type.hidden', label: 'Oculto' },
] as const

const SELECTOR_SOURCE_OPTIONS = [
  { value: 'segmento', labelKey: 'maintenance.formFields.options.selectorSource.segment', label: 'Segmentos' },
  { value: 'vendedor', labelKey: 'maintenance.formFields.options.selectorSource.seller', label: 'Vendedores' },
  { value: 'personalizado', labelKey: 'maintenance.formFields.options.selectorSource.custom', label: 'Personalizado' },
] as const

function toTrimmedString(value: unknown) {
  return String(value ?? '').trim()
}

function toNullableString(value: unknown) {
  const normalized = toTrimmedString(value)
  return normalized ? normalized : null
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'sim'
  }
  return false
}

function isProtectedField(form: CrudRecord) {
  return toBoolean(form.protegido)
}

export function normalizeFormularioCampoRecord(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ativo: toBoolean(record.ativo),
    obrigatorio: toBoolean(record.obrigatorio),
    quebra_linha: toBoolean(record.quebra_linha),
    protegido: toBoolean(record.protegido),
  }
}

export function serializeFormularioCampoRecord(record: CrudRecord): CrudRecord {
  const tipo = toNullableString(record.tipo)
  const tipoSeletor = tipo === 'seletor' ? toNullableString(record.tipo_seletor) : null

  return {
    ...record,
    ativo: toBoolean(record.ativo),
    obrigatorio: toBoolean(record.obrigatorio),
    quebra_linha: toBoolean(record.quebra_linha),
    id_formulario: toTrimmedString(record.id_formulario),
    codigo: toNullableString(record.codigo),
    nome: toTrimmedString(record.nome),
    titulo: toTrimmedString(record.titulo),
    nome2: toNullableString(record.nome2),
    titulo2: toNullableString(record.titulo2),
    campo_igual: toNullableString(record.campo_igual),
    mensagem_validacao: toNullableString(record.mensagem_validacao),
    evento_change: toNullableString(record.evento_change),
    campo_vinculado: toNullableString(record.campo_vinculado),
    instrucoes: toNullableString(record.instrucoes),
    valor: toNullableString(record.valor),
    tipo,
    tipo_seletor: tipoSeletor,
    json_seletor: tipoSeletor === 'personalizado' ? toNullableString(record.json_seletor) : null,
    tipo_cliente: toNullableString(record.tipo_cliente),
    mascara: tipo === 'texto' ? toNullableString(record.mascara) : null,
    minimo: tipo === 'numero' ? toNullableString(record.minimo) : null,
    maximo: tipo === 'numero' ? toNullableString(record.maximo) : null,
    posicao: toTrimmedString(record.posicao),
  }
}

export const FORMULARIOS_CAMPOS_CONFIG: CrudModuleConfig = {
  key: 'formularios-campos',
  resource: 'formularios_campos',
  routeBase: '/formularios',
  featureKey: 'formularios',
  listTitleKey: 'maintenance.formFields.title',
  listTitle: 'Campos de Formulários',
  listDescriptionKey: 'maintenance.formFields.listDescription',
  listDescription: 'Listagem com formulário, código, título, tipo e status do campo.',
  formTitleKey: 'maintenance.formFields.formTitle',
  formTitle: 'Campo de Formulário',
  breadcrumbSectionKey: 'routes.manutencao',
  breadcrumbSection: 'Manutenção',
  breadcrumbModuleKey: 'routes.formularios',
  breadcrumbModule: 'Campos de Formulários',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'titulo',
    sort: 'asc',
    id: '',
    codigo: '',
    'titulo::like': '',
    tipo: '',
    protegido: '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[100px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
    { id: 'id_formulario', labelKey: 'maintenance.formFields.fields.formId', label: 'Formulário (ID)', sortKey: 'id_formulario', thClassName: 'w-[160px]', filter: { kind: 'text', key: 'id_formulario', inputMode: 'numeric' } },
    { id: 'codigo', labelKey: 'maintenance.formFields.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'titulo', labelKey: 'maintenance.formFields.fields.title', label: 'Título', sortKey: 'titulo', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'titulo::like' } },
    {
      id: 'tipo',
      labelKey: 'maintenance.formFields.fields.type',
      label: 'Tipo',
      sortKey: 'tipo',
      thClassName: 'w-[160px]',
      filter: {
        kind: 'select',
        key: 'tipo',
        options: FORM_FIELD_TYPE_OPTIONS.map((option) => ({ value: option.value, labelKey: option.labelKey, label: option.label })),
      },
    },
    {
      id: 'protegido',
      labelKey: 'maintenance.formFields.fields.protected',
      label: 'Protegido',
      sortKey: 'protegido',
      thClassName: 'w-[120px]',
      valueKey: 'protegido',
      filter: {
        kind: 'select',
        key: 'protegido',
        options: [
          { value: '1', labelKey: 'common.yes', label: 'Sim' },
          { value: '0', labelKey: 'common.no', label: 'Não' },
        ],
      },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[100px]',
      valueKey: 'ativo',
      filter: {
        kind: 'select',
        key: 'ativo',
        options: [
          { value: '1', labelKey: 'common.yes', label: 'Sim' },
          { value: '0', labelKey: 'common.no', label: 'Não' },
        ],
      },
    },
  ],
  mobileTitle: (record) => String(record.titulo || '-'),
  mobileSubtitle: (record) => String(record.tipo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'main',
      titleKey: 'basicRegistrations.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
        { key: 'obrigatorio', labelKey: 'maintenance.formFields.fields.required', label: 'Obrigatório', type: 'toggle', defaultValue: true },
        { key: 'quebra_linha', labelKey: 'maintenance.formFields.fields.lineBreak', label: 'Quebra de linha', type: 'toggle', defaultValue: false },
        {
          key: 'id_formulario',
          labelKey: 'maintenance.formFields.fields.form',
          label: 'Formulário',
          type: 'select',
          required: true,
          optionsResource: 'formularios',
        },
        {
          key: 'codigo',
          labelKey: 'maintenance.formFields.fields.code',
          label: 'Código',
          type: 'text',
          maxLength: 32,
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'nome',
          labelKey: 'maintenance.formFields.fields.name',
          label: 'Nome',
          type: 'text',
          required: true,
          maxLength: 255,
          disabled: ({ form }) => isProtectedField(form),
        },
        { key: 'titulo', labelKey: 'maintenance.formFields.fields.title', label: 'Título', type: 'text', required: true, maxLength: 255 },
        {
          key: 'nome2',
          labelKey: 'maintenance.formFields.fields.complementaryName',
          label: 'Nome complementar',
          type: 'text',
          maxLength: 255,
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'titulo2',
          labelKey: 'maintenance.formFields.fields.complementaryTitle',
          label: 'Título complementar',
          type: 'text',
          maxLength: 255,
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'campo_igual',
          labelKey: 'maintenance.formFields.fields.validationField',
          label: 'Campo de validação',
          type: 'text',
          maxLength: 255,
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'mensagem_validacao',
          labelKey: 'maintenance.formFields.fields.validationMessage',
          label: 'Mensagem de validação',
          type: 'text',
          maxLength: 255,
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'evento_change',
          labelKey: 'maintenance.formFields.fields.validationEvent',
          label: 'Evento de validação',
          type: 'text',
          maxLength: 255,
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'campo_vinculado',
          labelKey: 'maintenance.formFields.fields.linkedField',
          label: 'Campo vinculado',
          type: 'text',
          maxLength: 255,
          disabled: ({ form }) => isProtectedField(form),
        },
        { key: 'instrucoes', labelKey: 'maintenance.formFields.fields.instructions', label: 'Instruções', type: 'textarea', rows: 4 },
        {
          key: 'valor',
          labelKey: 'maintenance.formFields.fields.defaultValue',
          label: 'Valor padrão',
          type: 'text',
          maxLength: 255,
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'tipo',
          labelKey: 'maintenance.formFields.fields.type',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: FORM_FIELD_TYPE_OPTIONS.map((option) => ({ value: option.value, labelKey: option.labelKey, label: option.label })),
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'tipo_seletor',
          labelKey: 'maintenance.formFields.fields.selectorSource',
          label: 'Fonte de dados',
          type: 'select',
          required: false,
          hidden: ({ form }) => String(form.tipo || '') !== 'seletor',
          options: SELECTOR_SOURCE_OPTIONS.map((option) => ({ value: option.value, labelKey: option.labelKey, label: option.label })),
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'json_seletor',
          labelKey: 'maintenance.formFields.fields.selectorJson',
          label: 'Opções (JSON)',
          type: 'textarea',
          rows: 4,
          hidden: ({ form }) => String(form.tipo || '') !== 'seletor' || String(form.tipo_seletor || '') !== 'personalizado',
          helperTextKey: 'maintenance.formFields.fields.selectorJsonHint',
          helperText: 'Informe um array JSON com itens { "titulo": "...", "valor": "..." }.',
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'tipo_cliente',
          labelKey: 'maintenance.formFields.fields.customerType',
          label: 'Tipo de cliente',
          type: 'select',
          options: [
            { value: 'PJ', label: 'PJ' },
            { value: 'PF', label: 'PF' },
          ],
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'mascara',
          labelKey: 'maintenance.formFields.fields.mask',
          label: 'Máscara',
          type: 'text',
          maxLength: 255,
          hidden: ({ form }) => String(form.tipo || '') !== 'texto',
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'minimo',
          labelKey: 'maintenance.formFields.fields.minimum',
          label: 'Mínimo',
          type: 'number',
          hidden: ({ form }) => String(form.tipo || '') !== 'numero',
          disabled: ({ form }) => isProtectedField(form),
        },
        {
          key: 'maximo',
          labelKey: 'maintenance.formFields.fields.maximum',
          label: 'Máximo',
          type: 'number',
          hidden: ({ form }) => String(form.tipo || '') !== 'numero',
          disabled: ({ form }) => isProtectedField(form),
        },
        { key: 'posicao', labelKey: 'maintenance.formFields.fields.position', label: 'Posição', type: 'number', required: true },
      ],
    },
  ],
  normalizeRecord: normalizeFormularioCampoRecord,
  beforeSave: serializeFormularioCampoRecord,
}


