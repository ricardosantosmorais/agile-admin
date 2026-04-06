export type RelatorioListFilters = {
  page: number
  perPage: number
  orderBy: 'codigo' | 'grupo' | 'nome'
  sort: 'asc' | 'desc'
  codigo: string
  grupo: string
  nome: string
}

export type RelatorioListRecord = {
  id: string
  codigo: string
  grupo: string
  nome: string
  descricao: string
  api: string
}

export type RelatorioListResponse = {
  data: RelatorioListRecord[]
  meta: {
    total: number
    from: number
    to: number
    page: number
    pages: number
    perPage: number
  }
}

export type RelatorioFiltroDinamico = {
  campo: string
  titulo: string
  tipo: string
  ordenacao?: 'asc' | 'desc' | ''
  posicaoOrdenacao?: number | null
}

export type RelatorioDetail = {
  id: string
  codigo: string
  nome: string
  grupo: string
  descricao: string
  api: string
  filtros: RelatorioFiltroDinamico[]
}

export type RelatorioProcessosFilters = {
  page: number
  perPage: number
  orderBy: 'id' | 'usuario' | 'created_at' | 'status'
  sort: 'asc' | 'desc'
  id: string
  usuario: string
  data_inicio: string
  data_fim: string
  status: string
}

export type RelatorioProcessoCampo = {
  campo: string
  tipo: string
  titulo: string
  operador: string
  valor: string
}

export type RelatorioProcessoRecord = {
  id: string
  usuarioNome: string
  campos: RelatorioProcessoCampo[]
  camposResumo: string
  createdAt: string
  status: string
  statusLabel: string
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  arquivo: string
  canCancel: boolean
  canReprocess: boolean
  canDownload: boolean
}

export type RelatorioProcessosResponse = {
  data: RelatorioProcessoRecord[]
  meta: {
    total: number
    from: number
    to: number
    page: number
    pages: number
    perPage: number
  }
}

export type RelatorioProcessoLogRecord = {
  id: string
  createdAt: string
  tipo: string
  tipoLabel: string
  tipoTone: 'success' | 'warning' | 'danger' | 'neutral'
  mensagem: string
}

export type RelatorioProcessoLogsResponse = {
  data: RelatorioProcessoLogRecord[]
  meta: {
    total: number
    from: number
    to: number
    page: number
    pages: number
    perPage: number
  }
}
