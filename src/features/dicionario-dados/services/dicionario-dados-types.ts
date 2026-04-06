export type DicionarioTabelaTreeNode = {
  id: string
  nome: string
  hasComponents: boolean
  fields: Array<{ id: string; nome: string }>
}

export type DicionarioTabelaComponente = {
  id: string
  nome: string
  arquivo: string
  ativo: boolean
}

export type DicionarioTabelaDetalhe = {
  id: string
  nome: string
  descricao: string
  regra: string
  componentes: DicionarioTabelaComponente[]
}

export type DicionarioCampoStatus = 'encontrado' | 'nao_disponivel' | 'ignorado'

export type DicionarioComponenteCampo = {
  id: string
  nome: string
  posicao: number
  status: DicionarioCampoStatus
  descricao: string
  regra: string
  ignoredRecordId: string
  ignoredObservation: string
}

export type DicionarioComponenteCamposResponse = {
  componente: DicionarioTabelaComponente
  tabela: { id: string; nome: string }
  fields: DicionarioComponenteCampo[]
}
