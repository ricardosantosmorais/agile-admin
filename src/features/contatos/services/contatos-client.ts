import { httpClient } from '@/src/services/http/http-client'
import type { ContatoDetail, ContatoEditFormValues, ContatoListFilters, ContatoListItem } from '@/src/features/contatos/types/contatos'

type ListResponse = {
  data: ContatoListItem[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
  }
}

function buildParams(filters: ContatoListFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    perPage: String(filters.perPage),
    orderBy: filters.orderBy,
    sort: filters.sort,
  })

  for (const [key, value] of Object.entries(filters)) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key)) {
      continue
    }

    if (!String(value).trim()) {
      continue
    }

    params.set(key, String(value).trim())
  }

  return params
}

export const DEFAULT_CONTATOS_FILTERS: ContatoListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'created_at',
  sort: 'desc',
  cnpj_cpf: '',
  'nome_fantasia::like': '',
  'pessoa_contato::like': '',
  'email::like': '',
  'telefone1::like': '',
  'celular::like': '',
  'created_at::ge': '',
  'created_at::le': '',
  status: '',
}

export const contatosClient = {
  list(filters: ContatoListFilters) {
    return httpClient<ListResponse>(`/api/contatos?${buildParams(filters).toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  getById(id: string) {
    return httpClient<ContatoDetail>(`/api/contatos/${id}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  updateStatus(id: string, status: 'aprovado' | 'reprovado') {
    return httpClient(`/api/contatos/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
      cache: 'no-store',
    })
  },
  update(id: string, values: ContatoEditFormValues) {
    return httpClient(`/api/contatos/${id}`, {
      method: 'POST',
      body: JSON.stringify(values),
      cache: 'no-store',
    })
  },
}
