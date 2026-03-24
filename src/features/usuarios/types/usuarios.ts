export type UsuarioListFilters = {
  page: number
  perPage: number
  orderBy: 'email' | 'perfil' | 'codigo' | 'ultimo_acesso' | 'ultimo_pedido' | 'ativo'
  sort: 'asc' | 'desc'
  'email::like': string
  perfil: string
  'codigo::like': string
  'ultimo_acesso::ge': string
  'ultimo_acesso::le': string
  'ultimo_pedido::ge': string
  'ultimo_pedido::le': string
  ativo: '' | '1' | '0'
}

export type UsuarioListItem = {
  id: string
  email: string
  perfil: string
  perfilLabel: string
  codigoVendedor: string
  ultimoAcesso: string
  ipUltimoAcesso: string
  ultimoPedido: string
  ativo: boolean
  vendedorId: string
}

export type UsuarioListResponse = {
  data: UsuarioListItem[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
  }
}

export type UsuarioLinkedClient = {
  idCliente: string
  codigo: string
  codigoAtivacao: string
  cnpjCpf: string
  nomeFantasia: string
  razaoSocial: string
  dataAtivacao: string
}

export type UsuarioLinkedSeller = {
  id: string
  codigo: string
  codigoAtivacao: string
  cnpjCpf: string
  nome: string
}

export type UsuarioAccessFilters = {
  page: number
  perPage: number
  orderBy: 'ultimo_acesso' | 'ip_ultimo_acesso'
  sort: 'asc' | 'desc'
  'ultimo_acesso::ge': string
  'ultimo_acesso::le': string
  ip_ultimo_acesso: string
}

export type UsuarioAccessItem = {
  id: string
  ultimoAcesso: string
  ipUltimoAcesso: string
}

export type UsuarioAccessResponse = {
  data: UsuarioAccessItem[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
  }
}

export type UsuarioPasswordRecord = {
  id: string
  email: string
  perfil: string
  senha: string
  confirmacao: string
}
