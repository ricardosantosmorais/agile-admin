import type {
  ConfiguracoesPrecosFieldDefinition,
  ConfiguracoesPrecosFieldKey,
  ConfiguracoesPrecosFormValues,
  ConfiguracoesPrecosOption,
  ConfiguracoesPrecosRecord,
} from '@/src/features/configuracoes-precos/types/configuracoes-precos'

type ApiRecord = Record<string, unknown>
type Translate = (key: string, fallback: string) => string

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

export function getConfiguracoesPrecosFieldDefinitions(t: Translate): ConfiguracoesPrecosFieldDefinition[] {
  const yesNoOptions = [
    { value: '1', label: t('common.yes', 'Sim') },
    { value: '0', label: t('common.no', 'Não') },
  ] as const

  return [
    { key: 'aplica_partilha_contribuinte', section: 'taxes', type: 'enum', label: t('configuracoes.pricing.fields.aplica_partilha_contribuinte.label', 'Aplica DIFAL'), helper: t('configuracoes.pricing.fields.aplica_partilha_contribuinte.helper', 'Indica para que tipo de cliente a plataforma deve calcular DIFAL.'), options: [{ value: 'contribuinte', label: t('configuracoes.pricing.options.aplica_partilha_contribuinte.taxpayer', 'Contribuinte') }, { value: 'nao_contribuinte', label: t('configuracoes.pricing.options.aplica_partilha_contribuinte.nonTaxpayer', 'Não contribuinte') }, { value: 'todos', label: t('configuracoes.pricing.options.all', 'Todos') }] },
    { key: 'aplica_tributo_revenda', section: 'taxes', type: 'enum', label: t('configuracoes.pricing.fields.aplica_tributo_revenda.label', 'Aplica tributos apenas para revendas'), helper: t('configuracoes.pricing.fields.aplica_tributo_revenda.helper', 'Calcula tributos apenas para clientes do tipo revenda.'), options: [...yesNoOptions] },
    { key: 'calculo_reverso_fecoep', section: 'taxes', type: 'enum', label: t('configuracoes.pricing.fields.calculo_reverso_fecoep.label', 'Aplica cálculo reverso de FECOEP'), helper: t('configuracoes.pricing.fields.calculo_reverso_fecoep.helper', 'Remove do preço de venda o valor de FECOEP para encontrar o preço base.'), options: [...yesNoOptions] },
    { key: 'calculo_reverso_ipi', section: 'taxes', type: 'enum', label: t('configuracoes.pricing.fields.calculo_reverso_ipi.label', 'Aplica cálculo reverso de IPI'), helper: t('configuracoes.pricing.fields.calculo_reverso_ipi.helper', 'Remove do preço de venda o valor de IPI para encontrar o preço base.'), options: [...yesNoOptions] },
    { key: 'calculo_reverso_st', section: 'taxes', type: 'enum', label: t('configuracoes.pricing.fields.calculo_reverso_st.label', 'Aplica cálculo reverso de ST'), helper: t('configuracoes.pricing.fields.calculo_reverso_st.helper', 'Remove do preço de venda o valor de ST para encontrar o preço base.'), options: [...yesNoOptions] },
    { key: 'icms_externo_fixo', section: 'taxes', type: 'text', label: t('configuracoes.pricing.fields.icms_externo_fixo.label', 'ICMS externo produtos importados'), helper: t('configuracoes.pricing.fields.icms_externo_fixo.helper', 'Valor fixo do ICMS externo para produtos importados.'), inputMode: 'decimal' },
    { key: 'precisao_tributos', section: 'taxes', type: 'text', label: t('configuracoes.pricing.fields.precisao_tributos.label', 'Precisão tributos'), helper: t('configuracoes.pricing.fields.precisao_tributos.helper', 'Precisão decimal aplicada aos tributos.'), inputMode: 'numeric' },
    { key: 'modo_arredondamento', section: 'rounding', type: 'enum', label: t('configuracoes.pricing.fields.modo_arredondamento.label', 'Arredondamento de valores'), helper: t('configuracoes.pricing.fields.modo_arredondamento.helper', 'Modo de arredondamento usado pela plataforma.'), options: [{ value: '1', label: t('configuracoes.pricing.options.modo_arredondamento.up', 'Acima') }, { value: '0', label: t('configuracoes.pricing.options.modo_arredondamento.default', 'Padrão') }] },
    { key: 'arredonda_valores_embalagem', section: 'rounding', type: 'enum', label: t('configuracoes.pricing.fields.arredonda_valores_embalagem.label', 'Arredonda valores de embalagem'), helper: t('configuracoes.pricing.fields.arredonda_valores_embalagem.helper', 'Calcula o valor das embalagens antes do arredondamento unitário.'), options: [...yesNoOptions] },
    { key: 'arredonda_valores_financeiro', section: 'rounding', type: 'enum', label: t('configuracoes.pricing.fields.arredonda_valores_financeiro.label', 'Arredonda valores do financeiro'), helper: t('configuracoes.pricing.fields.arredonda_valores_financeiro.helper', 'Arredonda valores após acréscimo e desconto financeiro.'), options: [...yesNoOptions] },
    { key: 'precisao_round', section: 'rounding', type: 'text', label: t('configuracoes.pricing.fields.precisao_round.label', 'Precisão do arredondamento'), helper: t('configuracoes.pricing.fields.precisao_round.helper', 'Precisão decimal usada no arredondamento.'), inputMode: 'numeric' },
    { key: 'precisao_valor', section: 'rounding', type: 'text', label: t('configuracoes.pricing.fields.precisao_valor.label', 'Precisão do valor'), helper: t('configuracoes.pricing.fields.precisao_valor.helper', 'Precisão decimal aplicada aos valores.'), inputMode: 'numeric' },
    { key: 'aplicacao_cupom_desconto', section: 'defaults', type: 'enum', label: t('configuracoes.pricing.fields.aplicacao_cupom_desconto.label', 'Aplicação de cupom desconto'), helper: t('configuracoes.pricing.fields.aplicacao_cupom_desconto.helper', 'Define se o cupom é aplicado no subtotal ou no valor unitário.'), options: [{ value: 'subtotal', label: t('configuracoes.pricing.options.aplicacao_cupom_desconto.subtotal', 'Subtotal dos produtos') }, { value: 'unidade', label: t('configuracoes.pricing.options.aplicacao_cupom_desconto.unit', 'Valor unitário dos produtos') }] },
    { key: 'id_forma_pagamento_padrao', section: 'defaults', type: 'lookup', label: t('configuracoes.pricing.fields.id_forma_pagamento_padrao.label', 'Forma de pagamento padrão'), helper: t('configuracoes.pricing.fields.id_forma_pagamento_padrao.helper', 'Será usada na precificação padrão dos produtos.'), lookupCollection: 'paymentMethods', lookupResource: 'formas_pagamento' },
    { key: 'id_condicao_pagamento_padrao', section: 'defaults', type: 'lookup', label: t('configuracoes.pricing.fields.id_condicao_pagamento_padrao.label', 'Prazo de pagamento padrão'), helper: t('configuracoes.pricing.fields.id_condicao_pagamento_padrao.helper', 'Será usada na precificação padrão dos produtos.'), lookupCollection: 'paymentConditions', lookupResource: 'condicoes_pagamento' },
    { key: 'id_tabela_preco_padrao', section: 'defaults', type: 'lookup', label: t('configuracoes.pricing.fields.id_tabela_preco_padrao.label', 'Tabela de preço padrão'), helper: t('configuracoes.pricing.fields.id_tabela_preco_padrao.helper', 'Tabela padrão caso o cliente não tenha regra vinculada.'), lookupCollection: 'priceTables', lookupResource: 'tabelas_preco' },
    { key: 'id_tabela_preco_pf', section: 'defaults', type: 'lookup', label: t('configuracoes.pricing.fields.id_tabela_preco_pf.label', 'Tabela de preço padrão PF'), helper: t('configuracoes.pricing.fields.id_tabela_preco_pf.helper', 'Tabela padrão para cadastro de clientes pessoa física.'), lookupCollection: 'priceTables', lookupResource: 'tabelas_preco' },
    { key: 'id_tabela_preco_pj', section: 'defaults', type: 'lookup', label: t('configuracoes.pricing.fields.id_tabela_preco_pj.label', 'Tabela de preço padrão PJ'), helper: t('configuracoes.pricing.fields.id_tabela_preco_pj.helper', 'Tabela padrão para cadastro de clientes pessoa jurídica.'), lookupCollection: 'priceTables', lookupResource: 'tabelas_preco' },
    { key: 'preco_base', section: 'defaults', type: 'enum', label: t('configuracoes.pricing.fields.preco_base.label', 'Preços base'), helper: t('configuracoes.pricing.fields.preco_base.helper', 'Fonte de dados dos preços base de produtos.'), options: [{ value: 'embalagem', label: t('configuracoes.pricing.options.preco_base.packaging', 'Produtos x Embalagens') }, { value: 'filial', label: t('configuracoes.pricing.options.preco_base.branch', 'Produtos x Filiais') }, { value: 'tabela', label: t('configuracoes.pricing.options.preco_base.table', 'Produtos x Tabelas Preço') }] },
    { key: 'versao_precificador', section: 'defaults', type: 'enum', label: t('configuracoes.pricing.fields.versao_precificador.label', 'Versão do precificador'), helper: t('configuracoes.pricing.fields.versao_precificador.helper', 'Versão usada para exibição de preços e compra.'), options: [{ value: 'v2', label: 'V2' }, { value: 'v1', label: t('configuracoes.pricing.options.legacy', 'V1 (legado)') }] },
  ]
}

export const configuracoesPrecosFieldDefinitions = getConfiguracoesPrecosFieldDefinitions((_, fallback) => fallback)
export const configuracoesPrecosParameterKeys = configuracoesPrecosFieldDefinitions.map((field) => field.key)

export function createEmptyConfiguracoesPrecosForm(): ConfiguracoesPrecosFormValues {
  return configuracoesPrecosFieldDefinitions.reduce((accumulator, field) => {
    accumulator[field.key] = ''
    return accumulator
  }, {} as ConfiguracoesPrecosFormValues)
}

function normalizeLookupOptions(payload: unknown, labelKeys: string[]): ConfiguracoesPrecosOption[] {
  return asArray(asRecord(payload).data)
    .map((item) => {
      const record = asRecord(item)
      const id = toStringValue(record.id)
      if (!id) {
        return null
      }

      const labelParts = labelKeys.map((key) => toStringValue(record[key])).filter(Boolean)
      return { value: id, label: labelParts.length ? `${labelParts.join(' - ')} - ${id}` : id }
    })
    .filter((item): item is ConfiguracoesPrecosOption => item !== null)
}

export function normalizeConfiguracoesPrecosRecord(payload: unknown): ConfiguracoesPrecosRecord {
  const record = asRecord(payload)
  const rows = asArray(asRecord(record.parameters).data)
  const values = createEmptyConfiguracoesPrecosForm()
  const metadata: ConfiguracoesPrecosRecord['metadata'] = {}

  for (const item of rows) {
    const parameter = asRecord(item)
    const key = toStringValue(parameter.chave) as ConfiguracoesPrecosFieldKey
    if (!(key in values)) {
      continue
    }

    values[key] = toStringValue(parameter.parametros)

    const updatedAt = toStringValue(parameter.created_at)
    const updatedBy = toStringValue(asRecord(parameter.usuario).nome)
    if (updatedAt && updatedBy) {
      metadata[key] = { updatedAt, updatedBy }
    }
  }

  return {
    values,
    metadata,
    lookups: {
      paymentMethods: normalizeLookupOptions(record.paymentMethods, ['nome']),
      paymentConditions: normalizeLookupOptions(record.paymentConditions, ['nome']),
      priceTables: normalizeLookupOptions(record.priceTables, ['nome']),
    },
  }
}

export function buildDirtyConfiguracoesPrecosPayload(
  initialValues: ConfiguracoesPrecosFormValues,
  currentValues: ConfiguracoesPrecosFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const changedFields = configuracoesPrecosFieldDefinitions.filter((field) => {
    const initialValue = String(initialValues[field.key] ?? '').trim()
    const currentValue = String(currentValues[field.key] ?? '').trim()
    return initialValue !== currentValue
  })

  if (!changedFields.length) {
    return []
  }

  return [
    { id_filial: null, chave: 'versao', parametros: version },
    ...changedFields.map((field) => ({
      id_filial: null,
      chave: field.key,
      parametros: String(currentValues[field.key] ?? '').trim(),
    })),
  ]
}


