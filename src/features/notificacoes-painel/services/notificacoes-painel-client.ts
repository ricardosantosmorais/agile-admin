import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import type { CrudListFilters, CrudListRecord, CrudListResponse, CrudRecord } from '@/src/components/crud-base/types'
import type { LookupOption } from '@/src/components/ui/lookup-select'

export type NotificacaoPainelUsuarioRecord = CrudListRecord & {
  usuario?: { nome?: string | null } | null
  empresa?: { nome_fantasia?: string | null; nome?: string | null } | null
  data?: string | null
}

export type NotificacaoPainelUsuariosResponse = CrudListResponse & {
  data: NotificacaoPainelUsuarioRecord[]
}

const baseClient = createCrudClient('/api/notificacoes-painel')

export const notificacoesPainelClient = {
  ...baseClient,
  duplicate(id: string) {
    return httpClient<CrudRecord[]>(`/api/notificacoes-painel/${id}/duplicar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },
  publish(id: string) {
    return httpClient<CrudRecord[]>(`/api/notificacoes-painel/${id}/publicar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },
  addEmpresa(id: string, idEmpresa: string, titulo: string) {
    return httpClient<CrudRecord[]>(`/api/notificacoes-painel/${id}/empresas`, {
      method: 'POST',
      body: JSON.stringify({ id_empresa: idEmpresa, titulo }),
      cache: 'no-store',
    })
  },
  removeEmpresas(id: string, ids: string[]) {
    return httpClient<{ success: true }>(`/api/notificacoes-painel/${id}/empresas`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },
  usuarios(id: string, filters: CrudListFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    return httpClient<NotificacaoPainelUsuariosResponse>(`/api/notificacoes-painel/${id}/usuarios?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  async loadEmpresaOptions(query: string, page: number, perPage: number): Promise<LookupOption[]> {
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      q: query,
    })
    const rows = await httpClient<Array<{ value?: string; id?: string; label?: string }>>(`/api/lookups/empresas?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return rows.map((item) => ({
      id: String(item.value ?? item.id ?? ''),
      label: String(item.label ?? item.value ?? item.id ?? ''),
    })).filter((option) => option.id)
  },
}
