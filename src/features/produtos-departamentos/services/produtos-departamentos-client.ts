import { httpClient } from '@/src/services/http/http-client'

export type ProdutoDepartamentoRecord = {
  id_produto: string
  id_departamento: string
  produto?: { id?: string; nome?: string }
  departamento?: { id?: string; nome?: string }
}

export type ProdutoSelectionRecord = {
  id: string
  codigo?: string
  nome?: string
  id_departamento?: string | null
}

export type ProdutoSelectionResponse = {
  data: ProdutoSelectionRecord[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
  }
}

export type DepartamentoTreeRecord = {
  id: string
  nome: string
  nivel?: number
  posicao?: number
  ativo?: boolean
  icone?: string | null
  id_departamento_pai?: string | null
}

export type ProdutoDepartamentoFilters = {
  page: number
  perPage: number
  orderBy: string
  sort: 'asc' | 'desc'
  id_produto?: string
  id_departamento?: string
  'produto:nome::like'?: string
  'departamento:nome::like'?: string
}

export type ProdutoDepartamentoListResponse = {
  data: ProdutoDepartamentoRecord[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
    order?: string
    sort?: string
  }
}

export const produtosDepartamentosClient = {
  list(filters: ProdutoDepartamentoFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    for (const [key, value] of Object.entries(filters)) {
      if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value) continue
      params.set(key, String(value))
    }

    return httpClient<ProdutoDepartamentoListResponse>(`/api/produtos-departamentos?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  create(items: Array<{ id_produto: string; id_departamento: string }>) {
    return httpClient('/api/produtos-departamentos', {
      method: 'POST',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
  delete(items: Array<{ id_produto: string; id_departamento: string }>) {
    return httpClient('/api/produtos-departamentos', {
      method: 'DELETE',
      body: JSON.stringify({ items }),
      cache: 'no-store',
    })
  },
  listSelectableProducts(filters: {
    page: number
    perPage: number
    q?: string
    onlyWithoutDepartment?: boolean
  }) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      q: filters.q || '',
      onlyWithoutDepartment: filters.onlyWithoutDepartment ? '1' : '0',
    })

    return httpClient<ProdutoSelectionResponse>(`/api/produtos-departamentos/products?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  listDepartmentsTree() {
    return httpClient<{ data: DepartamentoTreeRecord[] }>('/api/produtos-departamentos/departments', {
      method: 'GET',
      cache: 'no-store',
    })
  },
}
