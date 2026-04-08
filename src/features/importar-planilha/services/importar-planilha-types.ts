export type ImportarPlanilhaFilters = {
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

export type ProcessoArquivoRecord = {
  id: string
  usuarioNome: string
  createdAt: string
  status: string
  statusLabel: string
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  arquivo: string
  canStart: boolean
  canCancel: boolean
  canReprocess: boolean
}

export type ProcessoArquivoLogRecord = {
  id: string
  tipo: string
  tipoLabel: string
  tipoTone: 'success' | 'warning' | 'danger' | 'neutral'
  createdAt: string
  mensagem: string
}

export type ProcessoArquivoDetail = {
  id: string
  usuarioNome: string
  codigo: string
  arquivo: string
  status: string
  statusLabel: string
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  processado: boolean
  dataProcessado: string
  logs: ProcessoArquivoLogRecord[]
}

export type ImportarPlanilhaResponse = {
  data: ProcessoArquivoRecord[]
  meta: {
    total: number
    from: number
    to: number
    page: number
    pages: number
    perPage: number
  }
}
