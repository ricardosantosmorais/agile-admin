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
  canReplaceFile: boolean
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

export type ProcessoArquivoSpreadsheetColumn = {
  letter: string
  name: string
}

export type ProcessoArquivoSpreadsheetPreview = {
  sheetName: string
  columns: ProcessoArquivoSpreadsheetColumn[]
  rows: string[][]
  previewRows: number
  warning: string
}

export type ProcessoArquivoDictionaryField = {
  id: string
  name: string
  type: string
  nullable: boolean
  required: boolean
  position: number
}

export type ProcessoArquivoDictionaryTable = {
  id: string
  name: string
  fields: ProcessoArquivoDictionaryField[]
}

export type ProcessoArquivoMappingRecord = {
  id: string
  tableId: string
  sourceColumn: string
  targetFieldId: string
}

export type ProcessoArquivoMappingDetail = {
  processo: ProcessoArquivoDetail
  tables: ProcessoArquivoDictionaryTable[]
  mappings: ProcessoArquivoMappingRecord[]
  preview: ProcessoArquivoSpreadsheetPreview
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

export type ImportarPlanilhaSummary = {
  total: number
  draft: number
  running: number
  success: number
  error: number
}
