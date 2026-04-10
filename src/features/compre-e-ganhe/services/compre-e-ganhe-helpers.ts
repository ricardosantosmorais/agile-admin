import { httpClient } from '@/src/services/http/http-client'

export type OptionItem = {
  id: string
  label: string
}

export function getBrindeScopeLabel(value: string, t: (key: string, fallback: string) => string) {
  switch (value) {
    case 'produto_pai':
      return t('marketing.buyAndGet.rules.options.parentProduct', 'Produto pai')
    case 'produto':
      return t('marketing.buyAndGet.rules.options.product', 'Produto')
    case 'departamento':
      return t('marketing.buyAndGet.rules.options.department', 'Departamento')
    case 'fornecedor':
      return t('marketing.buyAndGet.rules.options.supplier', 'Fornecedor')
    case 'colecao':
      return t('marketing.buyAndGet.rules.options.collection', 'Coleção')
    default:
      return value || '-'
  }
}

export function getBrindeRuleTypeLabel(value: string, t: (key: string, fallback: string) => string) {
  switch (value) {
    case 'quantidade':
      return t('marketing.buyAndGet.rules.options.quantity', 'Quantidade')
    case 'valor':
      return t('marketing.buyAndGet.rules.options.value', 'Valor')
    case 'peso':
      return t('marketing.buyAndGet.rules.options.weight', 'Peso')
    case 'mix':
      return t('marketing.buyAndGet.rules.options.mix', 'Mix')
    default:
      return value || '-'
  }
}

export function getBrindeUniverseLabel(value: string, t: (key: string, fallback: string) => string) {
  switch (value) {
    case 'contribuinte':
      return t('marketing.buyAndGet.universe.options.taxpayer', 'Contribuinte')
    case 'classe':
      return t('marketing.buyAndGet.universe.options.class', 'Classe')
    case 'cliente':
      return t('marketing.buyAndGet.universe.options.customer', 'Cliente')
    case 'filial':
      return t('marketing.buyAndGet.universe.options.branch', 'Filial')
    case 'grupo':
      return t('marketing.buyAndGet.universe.options.group', 'Grupo')
    case 'praca':
      return t('marketing.buyAndGet.universe.options.square', 'Praça')
    case 'rede':
      return t('marketing.buyAndGet.universe.options.network', 'Rede')
    case 'segmento':
      return t('marketing.buyAndGet.universe.options.segment', 'Segmento')
    case 'supervisor':
      return t('marketing.buyAndGet.universe.options.supervisor', 'Supervisor')
    case 'tabela_preco':
      return t('marketing.buyAndGet.universe.options.priceTable', 'Tabela de preço')
    case 'tipo_cliente':
      return t('marketing.buyAndGet.universe.options.customerType', 'Tipo de cliente')
    case 'uf':
      return t('marketing.buyAndGet.universe.options.state', 'UF')
    case 'vendedor':
      return t('marketing.buyAndGet.universe.options.seller', 'Vendedor')
    case 'todos':
      return t('common.all', 'Todos')
    default:
      return value || '-'
  }
}

export async function loadProdutoEmbalagemOptions(productId: string) {
  if (!productId) {
    return [] satisfies OptionItem[]
  }

  const response = await httpClient<Array<{ value?: string; label?: string }>>(
    `/api/lookups/produtos-embalagens?id_produto=${encodeURIComponent(productId)}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  )

  return response
    .filter((item) => typeof item.value === 'string' && typeof item.label === 'string')
    .map((item) => ({ id: item.value as string, label: item.label as string }))
}
