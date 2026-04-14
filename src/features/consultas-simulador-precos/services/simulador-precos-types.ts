export type SimuladorPrecosLookupOption = {
  id: string
  label: string
  subtitle?: string
}

export type SimuladorPrecosContext = {
  filiais: SimuladorPrecosLookupOption[]
  formasPagamento: SimuladorPrecosLookupOption[]
  condicoesPagamento: Array<SimuladorPrecosLookupOption & { indice: string }>
  tabelasPreco: SimuladorPrecosLookupOption[]
}

export type SimuladorPrecosDraft = {
  id_produto: string
  id_embalagem: string
  quantidade: string
  valor_frete_item: string
  id_filial: string
  id_forma_pagamento: string
  id_condicao_pagamento: string
  id_cliente: string
  id_vendedor: string
}

export type SimuladorPrecosRow = {
  label: string
  value: string
}

export type SimuladorPrecosTableRow = Record<string, string>

export type SimuladorPrecosResult = {
  produto: SimuladorPrecosRow[]
  embalagem: SimuladorPrecosRow[]
  valores: SimuladorPrecosRow[]
  pedido: SimuladorPrecosRow[]
  precificadores: SimuladorPrecosTableRow[]
  tributos: SimuladorPrecosTableRow[]
  promocoesQuantidade: SimuladorPrecosTableRow[]
  debug: {
    url: string
    endpoint: string
  } | null
}
