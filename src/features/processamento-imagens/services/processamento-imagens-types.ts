export type ProcessamentoImagensFilters = {
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

export type ProcessoImagemRecord = {
  id: string
  usuarioNome: string
  createdAt: string
  status: string
  statusLabel: string
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  arquivo: string
  canCancel: boolean
  canReprocess: boolean
}

export type ProcessoImagemLogRecord = {
  id: string
  tipo: string
  tipoLabel: string
  tipoTone: 'success' | 'warning' | 'danger' | 'neutral'
  createdAt: string
  mensagem: string
}

export type ProcessoImagemDetail = {
  id: string
  usuarioNome: string
  codigo: string
  arquivo: string
  status: string
  statusLabel: string
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  processado: boolean
  dataProcessado: string
  logs: ProcessoImagemLogRecord[]
}

export type ProcessamentoImagensResponse = {
  data: ProcessoImagemRecord[]
  meta: {
    total: number
    from: number
    to: number
    page: number
    pages: number
    perPage: number
  }
}
