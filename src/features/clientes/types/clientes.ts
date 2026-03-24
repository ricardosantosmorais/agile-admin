export type ClientListFilters = {
  page: number
  perPage: number
  orderBy: string
  sort: 'asc' | 'desc'
  codigo: string
  cnpjCpf: string
  nomeRazaoSocial: string
  dataAtivacaoFrom: string
  dataAtivacaoTo: string
  ultimoPedidoFrom: string
  ultimoPedidoTo: string
  qtdPedidosFrom: string
  qtdPedidosTo: string
  bloqueado: string
  bloqueadoPlataforma: string
  ativo: string
}

export type ClientListItem = {
  id: string
  idSync?: string | null
  codigo: string
  codigoAtivacao: string
  cnpjCpf: string
  inscricaoEstadual: string
  nomeRazaoSocial: string
  dataAtivacao: string
  ultimoPedido: string
  qtdPedidos: number
  bloqueado: boolean
  bloqueadoPlataforma: boolean
  ativo: boolean
}

export type ClientLinkedUser = {
  idCliente: string
  idUsuario: string
  email: string
  dataAtivacao: string
}

export type ClientLinkedSellerListItem = {
  idCliente: string
  idVendedor: string
  codigo: string
  nome: string
  email: string
  telefone: string
  celular: string
}

export type ClientListMeta = {
  page: number
  pages: number
  perPage: number
  total: number
  from: number
  to: number
  order: string
  sort: string
}

export type ClientListResponse = {
  data: ClientListItem[]
  meta: ClientListMeta
}

export type ClientLookupOption = {
  id: string
  label: string
  description?: string
}

export type ClientAssociatedBranch = {
  idFilial: string
  nomeFilial: string
  tabelaPreco: string
  limiteCredito: string
  padrao: boolean
  idSync?: string | null
}

export type ClientAssociatedSeller = {
  idVendedor: string
  nomeVendedor: string
  email: string
  telefone: string
  padrao: boolean
  idSync?: string | null
}

export type ClientAssociatedPaymentMethod = {
  idFormaPagamento: string
  nomeFormaPagamento: string
  filialId: string
  filialNome: string
  idSync?: string | null
}

export type ClientAssociatedPaymentCondition = {
  idCondicaoPagamento: string
  nomeCondicaoPagamento: string
  filialId: string
  filialNome: string
  idSync?: string | null
}

export type ClientAdditionalField = {
  label: string
  value: string
  type?: string
  fileUrl?: string
}

export type ClientAdditionalForm = {
  id: string
  title: string
  date: string
  fields: ClientAdditionalField[]
}

export type ClientFormRecord = {
  id: string
  idClasse: string
  ativo: boolean
  bloqueado: boolean
  bloqueadoPlataforma: boolean
  liberado: boolean
  contribuinte: boolean
  codigo: string
  codigoAtivacao: string
  tipo: 'PF' | 'PJ'
  cpf: string
  cnpj: string
  nome: string
  razaoSocial: string
  nomeFantasia: string
  sexo: 'M' | 'F' | 'O'
  rg: string
  dataNascimento: string
  inscricaoEstadual: string
  isentoIe: boolean
  limiteCredito: string
  limiteDisponivel: string
  tipoCliente: string
  ramoAtividade: string
  pessoaContato: string
  email: string
  telefone1: string
  telefone2: string
  celular: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  observacoesBloqueio: string
  observacoesBloqueioPlataforma: string
  classificacao: {
    rede: ClientLookupOption | null
    segmento: ClientLookupOption | null
    canalDistribuicao: ClientLookupOption | null
    filial: ClientLookupOption | null
    vendedor: ClientLookupOption | null
    tabelaPreco: ClientLookupOption | null
    formaPagamento: ClientLookupOption | null
    condicaoPagamento: ClientLookupOption | null
    formaPagamentoPadrao: ClientLookupOption | null
    condicaoPagamentoPadrao: ClientLookupOption | null
  }
  filiais: ClientAssociatedBranch[]
  vendedores: ClientAssociatedSeller[]
  formasPagamento: ClientAssociatedPaymentMethod[]
  condicoesPagamento: ClientAssociatedPaymentCondition[]
  formularios: ClientAdditionalForm[]
}

export type ClientLookupResource =
  | 'clientes'
  | 'grupos'
  | 'redes'
  | 'segmentos'
  | 'canais_distribuicao'
  | 'filiais'
  | 'vendedores'
  | 'tabelas_preco'
  | 'formas_pagamento'
  | 'condicoes_pagamento'
