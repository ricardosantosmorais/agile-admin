export type LogAction = 'inclusao' | 'alteracao' | 'exclusao' | ''

export type LogsLookupOption = {
  id: string
  nome: string
}

export type LogsListFilters = {
  page: number
  perPage: number
  orderBy: 'id_registro' | 'modulo' | 'id_usuario' | 'data' | 'acao'
  sort: 'asc' | 'desc'
  id_registro: string
  modulo: string
  id_usuario: string
  'data::ge': string
  'data::le': string
  acao: string
}

export type LogsListRecord = {
  id: string
  id_registro: string
  modulo: string
  modulo_nome: string
  id_usuario: string
  usuario_nome: string
  data: string
  acao: LogAction
}

export type LogsListResponse = {
  data: LogsListRecord[]
  meta: {
    total: number
    from: number
    to: number
    page: number
    pages: number
    perPage: number
  }
  lookups: {
    users: LogsLookupOption[]
  }
}

export type LogDetailRecord = {
  id: string
  id_registro: string
  modulo: string
  modulo_nome: string
  data: string
  acao: LogAction
  descricao: string
  usuario_nome: string
  json_registro_anterior: string | null
  json_registro_novo: string | null
}
