import type { CrudResource } from '@/src/components/crud-base/types'
import type {
  ProdutoPrecificadorAudienceType,
  ProdutoPrecificadorProductType,
} from '@/src/features/produtos-precificadores/services/produtos-precificadores-types'

type StaticOption = { id: string; label: string }

export const PRODUTO_PRECIFICADOR_TYPE_OPTIONS = [
  { value: 'composto', label: 'Composto' },
  { value: 'fixo', label: 'Fixo' },
  { value: 'maior', label: 'Maior' },
  { value: 'menor', label: 'Menor' },
  { value: 'simples', label: 'Simples' },
  { value: 'soma', label: 'Soma' },
  { value: 'tributo', label: 'Tributo' },
  { value: 'valor', label: 'Valor' },
] as const

export const PRODUTO_PRECIFICADOR_ORIGIN_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'balcao', label: 'Balcão' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'forca_vendas', label: 'Força de vendas' },
  { value: 'receptivo', label: 'Receptivo' },
  { value: 'retira', label: 'Retira' },
  { value: 'todos', label: 'Todos' },
] as const

export const PRODUTO_PRECIFICADOR_PROFILE_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'vendedor', label: 'Vendedor' },
] as const

export const PRODUTO_PRECIFICADOR_AUDIENCE_TYPES: Array<{
  value: ProdutoPrecificadorAudienceType
  label: string
  resource?: CrudResource
  staticOptions?: StaticOption[]
}> = [
  { value: 'todos', label: 'Todos' },
  { value: 'canal_distribuicao_cliente', label: 'Canal de distribuição', resource: 'canais_distribuicao' },
  { value: 'cliente', label: 'Cliente', resource: 'clientes' },
  { value: 'contribuinte', label: 'Contribuinte', staticOptions: [{ id: '1', label: 'Sim' }, { id: '0', label: 'Não' }] },
  { value: 'filial', label: 'Filial', resource: 'filiais' },
  { value: 'fonte_st', label: 'Fonte ST', staticOptions: [{ id: '1', label: 'Sim' }, { id: '0', label: 'Não' }] },
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

export const PRODUTO_PRECIFICADOR_PRODUCT_TYPES: Array<{
  value: ProdutoPrecificadorProductType
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
  { value: 'promocao_precificador', label: 'Promoção', resource: 'promocoes' },
]

export function getAudienceMeta(type: ProdutoPrecificadorAudienceType) {
  return PRODUTO_PRECIFICADOR_AUDIENCE_TYPES.find((item) => item.value === type) ?? PRODUTO_PRECIFICADOR_AUDIENCE_TYPES[0]
}

export function getProductMeta(type: ProdutoPrecificadorProductType) {
  return PRODUTO_PRECIFICADOR_PRODUCT_TYPES.find((item) => item.value === type) ?? PRODUTO_PRECIFICADOR_PRODUCT_TYPES[0]
}
