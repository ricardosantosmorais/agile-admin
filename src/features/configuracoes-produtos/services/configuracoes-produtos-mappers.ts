import type {
  ConfiguracoesProdutosFieldDefinition,
  ConfiguracoesProdutosFieldKey,
  ConfiguracoesProdutosFormValues,
  ConfiguracoesProdutosRecord,
} from '@/src/features/configuracoes-produtos/types/configuracoes-produtos'

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

export function getConfiguracoesProdutosFieldDefinitions(t: Translate): ConfiguracoesProdutosFieldDefinition[] {
  const yesNoOptions = [
    { value: '1', label: t('common.yes', 'Sim') },
    { value: '0', label: t('common.no', 'Não') },
  ] as const

  return [
    { key: 'aviseme', section: 'catalog', type: 'enum', label: t('configuracoes.products.fields.aviseme.label', 'Avise-me quando chegar'), helper: t('configuracoes.products.fields.aviseme.helper', 'Ativa o recurso de aviso quando o produto voltar ao estoque.'), options: [...yesNoOptions] },
    { key: 'produtos_sem_imagem', section: 'catalog', type: 'enum', label: t('configuracoes.products.fields.produtos_sem_imagem.label', 'Disponibilizar produtos sem imagem'), helper: t('configuracoes.products.fields.produtos_sem_imagem.helper', 'Indica se produtos sem imagem podem aparecer disponíveis.'), options: [{ value: 'S', label: t('common.yes', 'Sim') }, { value: 'N', label: t('common.no', 'Não') }] },
    { key: 'layout_padrao', section: 'catalog', type: 'enum', label: t('configuracoes.products.fields.layout_padrao.label', 'Visualização padrão'), helper: t('configuracoes.products.fields.layout_padrao.helper', 'Modo padrão de exibição nas vitrines da loja.'), options: [{ value: 'list', label: t('configuracoes.products.options.layout_padrao.list', 'Lista') }, { value: 'grid', label: 'Grid' }] },
    { key: 'seleciona_embalagem', section: 'catalog', type: 'enum', label: t('configuracoes.products.fields.seleciona_embalagem.label', 'Seleciona embalagem'), helper: t('configuracoes.products.fields.seleciona_embalagem.helper', 'Permite selecionar embalagens de um produto.'), options: [...yesNoOptions] },
    { key: 'versao_restricao', section: 'catalog', type: 'enum', label: t('configuracoes.products.fields.versao_restricao.label', 'Versão de restrição'), helper: t('configuracoes.products.fields.versao_restricao.helper', 'Versão usada para regras de restrição.'), options: [{ value: 'v2', label: 'V2' }, { value: 'v1', label: t('configuracoes.products.options.legacy', 'V1 (legado)') }] },
    { key: 'comprar', section: 'availability', type: 'enum', label: t('configuracoes.products.fields.comprar.label', 'Exibição de preços e compra'), helper: t('configuracoes.products.fields.comprar.helper', 'Controla a visibilidade de preços e a possibilidade de compra.'), options: [{ value: 'restrito', label: t('configuracoes.products.options.comprar.restricted', 'Restrito (apenas logado)') }, { value: 'publico', label: t('configuracoes.products.options.comprar.public', 'Público (disponível para todos)') }, { value: 'oculto', label: t('configuracoes.products.options.comprar.hidden', 'Oculto (não exibe preços e compra)') }] },
    { key: 'estoque', section: 'availability', type: 'enum', label: t('configuracoes.products.fields.estoque.label', 'Exibição de produtos'), helper: t('configuracoes.products.fields.estoque.helper', 'Filtra produtos conforme estoque disponível.'), options: [{ value: '1', label: t('configuracoes.products.options.estoque.onlyAvailable', 'Apenas com estoque') }, { value: '0', label: t('configuracoes.products.options.estoque.all', 'Todos (com ou sem estoque)') }] },
    { key: 'exibe_precos_filial', section: 'availability', type: 'enum', label: t('configuracoes.products.fields.exibe_precos_filial.label', 'Exibe estoque e preço por filial'), helper: t('configuracoes.products.fields.exibe_precos_filial.helper', 'Controla a exibição de estoque e preços de outras filiais.'), options: [{ value: 'cliente', label: t('configuracoes.products.options.audience.customer', 'Cliente') }, { value: 'vendedor', label: t('configuracoes.products.options.audience.seller', 'Vendedor') }, { value: 'todos', label: t('configuracoes.products.options.audience.all', 'Todos') }, { value: 'nao', label: t('common.no', 'Não') }] },
    { key: 'exibe_estoque_assistente_pesquisa', section: 'availability', type: 'enum', label: t('configuracoes.products.fields.exibe_estoque_assistente_pesquisa.label', 'Exibição de estoque no assistente'), helper: t('configuracoes.products.fields.exibe_estoque_assistente_pesquisa.helper', 'Controla como o assistente de pesquisa mostra estoques.'), options: [{ value: 'todos', label: t('configuracoes.products.options.audience.all', 'Todos') }, { value: 'cliente', label: t('configuracoes.products.options.audience.customer', 'Cliente') }, { value: 'vendedor', label: t('configuracoes.products.options.audience.seller', 'Vendedor') }, { value: 'nao', label: t('common.no', 'Não') }] },
    { key: 'exibicao_estoque', section: 'availability', type: 'enum', label: t('configuracoes.products.fields.exibicao_estoque.label', 'Exibição de produtos sem estoque'), helper: t('configuracoes.products.fields.exibicao_estoque.helper', 'Posição dos produtos sem estoque na vitrine.'), options: [{ value: '1', label: t('configuracoes.products.options.exibicao_estoque.together', 'Junto dos produtos com estoque') }, { value: '0', label: t('configuracoes.products.options.exibicao_estoque.after', 'Depois dos produtos com estoque') }] },
    { key: 'exibicao_estoque_busca', section: 'availability', type: 'enum', label: t('configuracoes.products.fields.exibicao_estoque_busca.label', 'Exibição sem estoque na busca'), helper: t('configuracoes.products.fields.exibicao_estoque_busca.helper', 'Posição dos produtos sem estoque nos resultados de busca.'), options: [{ value: '1', label: t('configuracoes.products.options.exibicao_estoque.together', 'Junto dos produtos com estoque') }, { value: '0', label: t('configuracoes.products.options.exibicao_estoque.after', 'Depois dos produtos com estoque') }] },
    { key: 'setar_quantidade_maxima', section: 'availability', type: 'enum', label: t('configuracoes.products.fields.setar_quantidade_maxima.label', 'Setar quantidade máxima'), helper: t('configuracoes.products.fields.setar_quantidade_maxima.helper', 'Define se a quantidade máxima disponível é aplicada automaticamente.'), options: [{ value: 'S', label: t('common.yes', 'Sim') }, { value: 'N', label: t('common.no', 'Não') }] },
    { key: 'mecanismo_busca', section: 'search', type: 'enum', label: t('configuracoes.products.fields.mecanismo_busca.label', 'Mecanismo de busca'), helper: t('configuracoes.products.fields.mecanismo_busca.helper', 'Mecanismo utilizado pela plataforma para pesquisa de produtos.'), options: [{ value: 'elasticsearch', label: 'Elastic Search' }, { value: 'sql_and', label: t('configuracoes.products.options.mecanismo_busca.sqlAnd', 'SQL (AND)') }, { value: 'sql_or', label: t('configuracoes.products.options.mecanismo_busca.sqlOr', 'SQL (OR)') }] },
    { key: 'precisao_quantidade', section: 'search', type: 'text', label: t('configuracoes.products.fields.precisao_quantidade.label', 'Precisão de quantidade'), helper: t('configuracoes.products.fields.precisao_quantidade.helper', 'Precisão decimal aplicada às quantidades dos produtos.'), inputMode: 'numeric' },
  ]
}

export const configuracoesProdutosFieldDefinitions = getConfiguracoesProdutosFieldDefinitions((_, fallback) => fallback)
export const configuracoesProdutosParameterKeys = configuracoesProdutosFieldDefinitions.map((field) => field.key)

export function createEmptyConfiguracoesProdutosForm(): ConfiguracoesProdutosFormValues {
  return configuracoesProdutosFieldDefinitions.reduce((accumulator, field) => {
    accumulator[field.key] = ''
    return accumulator
  }, {} as ConfiguracoesProdutosFormValues)
}

function normalizeVisibilityValue(value: string) {
  const normalized = value.toLowerCase()
  if (['1', 'true', 'sim', 'yes', 'on'].includes(normalized)) {
    return 'todos'
  }

  if (['0', 'false', 'nao', 'não', 'off'].includes(normalized)) {
    return 'nao'
  }

  return value
}

export function normalizeConfiguracoesProdutosRecord(payload: unknown): ConfiguracoesProdutosRecord {
  const rows = asArray(asRecord(payload).data)
  const values = createEmptyConfiguracoesProdutosForm()
  const metadata: ConfiguracoesProdutosRecord['metadata'] = {}

  for (const item of rows) {
    const parameter = asRecord(item)
    const key = toStringValue(parameter.chave) as ConfiguracoesProdutosFieldKey
    if (!(key in values)) {
      continue
    }

    let currentValue = toStringValue(parameter.parametros)
    if (key === 'exibe_precos_filial' || key === 'exibe_estoque_assistente_pesquisa') {
      currentValue = normalizeVisibilityValue(currentValue)
    }

    values[key] = currentValue

    const updatedAt = toStringValue(parameter.created_at)
    const updatedBy = toStringValue(asRecord(parameter.usuario).nome)
    if (updatedAt && updatedBy) {
      metadata[key] = { updatedAt, updatedBy }
    }
  }

  return { values, metadata }
}

export function buildDirtyConfiguracoesProdutosPayload(
  initialValues: ConfiguracoesProdutosFormValues,
  currentValues: ConfiguracoesProdutosFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const changedFields = configuracoesProdutosFieldDefinitions.filter((field) => {
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


