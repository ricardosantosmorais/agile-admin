export type ParametroListFilters = {
  page: number
  perPage: number
  orderBy: 'id' | 'chave' | 'filial:nome_fantasia' | 'descricao' | 'parametros' | 'posicao' | 'permissao' | 'ativo'
  sort: 'asc' | 'desc'
  id: string
  chave: string
  filial: string
  descricao: string
  parametros: string
  posicao: string
  permissao: string
  ativo: string
}

export type ParametroListRecord = {
  id: string
  chave: string
  filial: string
  descricao: string
  parametrosPreview: string
  parametrosRaw: string
  posicao: string
  permissao: 'todos' | 'publico' | 'restrito' | ''
  ativo: boolean
}

export type ParametroListResponse = {
  data: ParametroListRecord[]
  meta: {
    total: number
    from: number
    to: number
    page: number
    pages: number
    perPage: number
  }
}

export type ParametroLookupOption = {
  value: string
  label: string
}

export type ParametroFormValues = {
  id: string
  ativo: string
  chave: string
  id_filial: string
  descricao: string
  parametros: string
  posicao: string
  permissao: 'todos' | 'publico' | 'restrito' | ''
}

export type ParametroFormRecord = {
  values: ParametroFormValues
  filiais: ParametroLookupOption[]
}

export type ParametroViewRecord = {
  id: string
  chave: string
  filial: string
  descricao: string
  parametros: string
  posicao: string
  permissao: string
  ativo: boolean
}
