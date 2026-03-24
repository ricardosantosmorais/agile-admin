import type {
  UsuarioAccessItem,
  UsuarioAccessResponse,
  UsuarioLinkedClient,
  UsuarioLinkedSeller,
  UsuarioListFilters,
  UsuarioListItem,
  UsuarioListResponse,
  UsuarioPasswordRecord,
} from '@/src/features/usuarios/types/usuarios'

function formatDateTime(value: unknown) {
  const source = String(value || '').trim()
  if (!source) {
    return '-'
  }

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) {
    return source
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : []
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function bool(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  return text(value) === '1'
}

function toMeta(payload: unknown) {
  const record = asRecord(payload)
  const meta = asRecord(record.meta)

  return {
    page: Number(meta.page || 1),
    pages: Number(meta.pages || 1),
    perPage: Number(meta.perPage || meta.perpage || 15),
    from: Number(meta.from || 0),
    to: Number(meta.to || 0),
    total: Number(meta.total || 0),
  }
}

function profileLabel(value: string) {
  if (!value) {
    return ''
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const DEFAULT_USUARIOS_LIST_FILTERS: UsuarioListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'email',
  sort: 'asc',
  'email::like': '',
  perfil: '',
  'codigo::like': '',
  'ultimo_acesso::ge': '',
  'ultimo_acesso::le': '',
  'ultimo_pedido::ge': '',
  'ultimo_pedido::le': '',
  ativo: '',
}

export const DEFAULT_USUARIO_ACCESS_FILTERS = {
  page: 1,
  perPage: 10,
  orderBy: 'ultimo_acesso',
  sort: 'desc',
  'ultimo_acesso::ge': '',
  'ultimo_acesso::le': '',
  ip_ultimo_acesso: '',
} as const

export function mapUsuariosListResponse(payload: unknown): UsuarioListResponse {
  const record = asRecord(payload)
  const data = asArray(record.data).map((item): UsuarioListItem => {
    const vendedor = asRecord(item.vendedor)
    const perfil = text(item.perfil)

    return {
      id: text(item.id),
      email: text(item.email),
      perfil,
      perfilLabel: profileLabel(perfil),
      codigoVendedor: text(vendedor.codigo || item.codigo),
      ultimoAcesso: formatDateTime(text(item.ultimo_acesso)),
      ipUltimoAcesso: text(item.ip_ultimo_acesso),
      ultimoPedido: formatDateTime(text(item.ultimo_pedido)),
      ativo: bool(item.ativo),
      vendedorId: text(vendedor.id),
    }
  })

  return {
    data,
    meta: toMeta(payload),
  }
}

export function createEmptyUsuarioPassword(): UsuarioPasswordRecord {
  return {
    id: '',
    email: '',
    perfil: '',
    senha: '',
    confirmacao: '',
  }
}

export function mapUsuarioPasswordDetail(payload: unknown): UsuarioPasswordRecord {
  const item = asRecord(payload)
  return {
    id: text(item.id),
    email: text(item.email),
    perfil: profileLabel(text(item.perfil)),
    senha: '',
    confirmacao: '',
  }
}

export function mapUsuarioLinkedClients(payload: unknown): UsuarioLinkedClient[] {
  const data = asArray(asRecord(payload).data)

  return data.map((item) => {
    const client = asRecord(item.cliente)
    return {
      idCliente: text(item.id_cliente || client.id),
      codigo: text(client.codigo),
      codigoAtivacao: text(client.codigo_ativacao),
      cnpjCpf: text(client.cnpj_cpf),
      nomeFantasia: text(client.nome_fantasia),
      razaoSocial: text(client.razao_social),
      dataAtivacao: formatDateTime(text(item.data_ativacao)),
    }
  })
}

export function mapUsuarioLinkedSeller(payload: unknown): UsuarioLinkedSeller | null {
  const item = asRecord(payload)
  if (!text(item.id)) {
    return null
  }

  return {
    id: text(item.id),
    codigo: text(item.codigo),
    codigoAtivacao: text(item.codigo_ativacao),
    cnpjCpf: text(item.cnpj_cpf),
    nome: text(item.nome),
  }
}

export function mapUsuarioAccessResponse(payload: unknown): UsuarioAccessResponse {
  const data = asArray(asRecord(payload).data).map((item): UsuarioAccessItem => ({
    id: `${text(item.id_usuario)}-${text(item.ultimo_acesso)}-${text(item.ip_ultimo_acesso)}`,
    ultimoAcesso: formatDateTime(text(item.ultimo_acesso)),
    ipUltimoAcesso: text(item.ip_ultimo_acesso),
  }))

  return {
    data,
    meta: toMeta(payload),
  }
}
