export type CatalogLookupOption = {
  id: string
  label: string
  description?: string
}

export type CatalogProductRelation = {
  id_produto: string
  id_tabela_preco?: string | null
  quantidade?: number | null
  posicao?: number | null
  produto?: {
    id?: string
    nome?: string | null
  } | null
  tabela_preco?: {
    id?: string
    nome?: string | null
  } | null
}

export type CatalogUniverseType =
  | 'canal_distribuicao'
  | 'filial'
  | 'grupo'
  | 'rede'
  | 'segmento'
  | 'tabela_preco'
  | 'uf'

export type CatalogUniverseRecord = {
  id: string
  tipo: CatalogUniverseType
  restricao?: boolean
  uf?: string | null
  canal_distribuicao?: { id?: string; nome?: string | null } | null
  filial?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  grupo?: { id?: string; nome?: string | null } | null
  rede?: { id?: string; nome?: string | null } | null
  segmento?: { id?: string; nome?: string | null } | null
  tabela_preco?: { id?: string; nome?: string | null } | null
}

export type GradeValueRecord = {
  id: string
  codigo?: string | null
  valor: string
  hexa1?: string | null
  hexa2?: string | null
  posicao?: number | null
  ativo?: boolean
}
