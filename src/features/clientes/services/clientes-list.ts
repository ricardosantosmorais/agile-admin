import type {
  ClientLinkedSellerListItem,
  ClientLinkedUser,
  ClientListFilters,
  ClientListItem,
} from '@/src/features/clientes/types/clientes'

export const CLIENTES_LIST_STORAGE_KEY = 'clientes-list-state'

export const DEFAULT_CLIENT_LIST_FILTERS: ClientListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'razao_social',
  sort: 'asc',
  codigo: '',
  cnpjCpf: '',
  nomeRazaoSocial: '',
  dataAtivacaoFrom: '',
  dataAtivacaoTo: '',
  ultimoPedidoFrom: '',
  ultimoPedidoTo: '',
  qtdPedidosFrom: '',
  qtdPedidosTo: '',
  bloqueado: '',
  bloqueadoPlataforma: '',
  ativo: '',
}

export const CLIENT_LIST_SORT_LABELS: Partial<Record<ClientListFilters['orderBy'], string>> = {
  codigo: 'clientes.columns.codigo',
  cnpj_cpf: 'clientes.columns.cnpjCpf',
  data_ativacao: 'clientes.columns.dataAtivacao',
  ultimo_pedido: 'clientes.columns.ultimoPedido',
  qtd_pedidos: 'clientes.columns.qtdPedidos',
  bloqueado: 'clientes.columns.bloqueado',
  bloqueado_plataforma: 'clientes.columns.plataforma',
  ativo: 'clientes.columns.ativo',
  razao_social: 'clientes.columns.nomeRazaoSocial',
}

export type PersistedClientListState = {
  filters: ClientListFilters
  filtersDraft: ClientListFilters
  filtersExpanded: boolean
}

export type ClientListLoadState = {
  isLoading: boolean
  error: Error | null
}

export type ClientesModalState =
  | { type: 'none' }
  | { type: 'view'; client: ClientListItem }
  | { type: 'linked-users'; client: ClientListItem }
  | { type: 'linked-sellers'; client: ClientListItem }
  | { type: 'unlock'; client: ClientListItem; platform: boolean }

export type ClientListConfirmState =
  | null
  | { kind: 'delete-users-link'; clientId: string; userId: string }
  | { kind: 'delete-client'; ids: string[] }

export type ClientListModalPayload = {
  modal: ClientesModalState
  modalLoading: boolean
  modalError: string
  linkedUsers: ClientLinkedUser[]
  linkedSellers: ClientLinkedSellerListItem[]
  unlockDescription: string
  confirmState: ClientListConfirmState
}
