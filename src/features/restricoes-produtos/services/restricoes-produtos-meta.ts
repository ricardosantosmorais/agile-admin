import type { CrudResource } from '@/src/components/crud-base/types'
import type {
  RestricaoProdutoAudienceType,
  RestricaoProdutoProductType,
} from '@/src/features/restricoes-produtos/services/restricoes-produtos-types'

type StaticOption = { id: string; label: string }

export const RESTRICAO_PRODUTO_PROFILE_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'vendedor', label: 'Vendedor' },
] as const

export const RESTRICAO_PRODUTO_AUDIENCE_TYPES: Array<{
  value: RestricaoProdutoAudienceType
  label: string
  resource?: CrudResource
  staticOptions?: StaticOption[]
}> = [
  { value: 'todos', label: 'Todos' },
  { value: 'canal_distribuicao_cliente', label: 'Canal de distribuição', resource: 'canais_distribuicao' },
  { value: 'cliente', label: 'Cliente', resource: 'clientes' },
  { value: 'contribuinte', label: 'Contribuinte', staticOptions: [{ id: '1', label: 'Sim' }, { id: '0', label: 'Não' }] },
  { value: 'filial', label: 'Filial', resource: 'filiais' },
  { value: 'grupo', label: 'Grupo de cliente', resource: 'grupos' },
  { value: 'praca', label: 'Praça', resource: 'pracas' },
  { value: 'rede', label: 'Rede de cliente', resource: 'redes' },
  { value: 'segmento', label: 'Segmento de cliente', resource: 'segmentos' },
  { value: 'supervisor', label: 'Supervisor', resource: 'supervisores' },
  { value: 'tabela_preco', label: 'Tabela de preço', resource: 'tabelas_preco' },
  { value: 'tipo_cliente', label: 'Tipo de cliente', staticOptions: [{ id: 'PF', label: 'Pessoa Física' }, { id: 'PJ', label: 'Pessoa Jurídica' }] },
  {
    value: 'uf',
    label: 'UF',
    staticOptions: [
      ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'],
      ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'],
      ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
      ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
    ].map(([id, label]) => ({ id, label })),
  },
  { value: 'vendedor', label: 'Vendedor', resource: 'vendedores' },
]

export const RESTRICAO_PRODUTO_PRODUCT_TYPES: Array<{
  value: RestricaoProdutoProductType
  label: string
  resource?: CrudResource
}> = [
  { value: 'todos', label: 'Todos' },
  { value: 'canal_distribuicao_produto', label: 'Canal de distribuição', resource: 'canais_distribuicao' },
  { value: 'colecao', label: 'Coleção', resource: 'colecoes' },
  { value: 'departamento', label: 'Departamento', resource: 'departamentos' },
  { value: 'fornecedor', label: 'Fornecedor', resource: 'fornecedores' },
  { value: 'marca', label: 'Marca', resource: 'marcas' },
  { value: 'produto', label: 'Produto', resource: 'produtos' },
  { value: 'produto_pai', label: 'Produto pai', resource: 'produtos' },
  { value: 'promocao', label: 'Promoção', resource: 'promocoes' },
]

export function getAudienceMeta(type: RestricaoProdutoAudienceType) {
  return RESTRICAO_PRODUTO_AUDIENCE_TYPES.find((item) => item.value === type) ?? RESTRICAO_PRODUTO_AUDIENCE_TYPES[0]
}

export function getProductMeta(type: RestricaoProdutoProductType) {
  return RESTRICAO_PRODUTO_PRODUCT_TYPES.find((item) => item.value === type) ?? RESTRICAO_PRODUTO_PRODUCT_TYPES[0]
}
