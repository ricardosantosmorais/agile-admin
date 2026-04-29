import { httpClient } from '@/src/services/http/http-client'
import type { CrudListFilters, CrudListResponse, CrudOption, CrudRecord } from '@/src/components/crud-base/types'
import type { LookupOption } from '@/src/components/ui/lookup-select'
import {
  mapAgileAdministradorDetail,
  mapAgileAdministradorListResponse,
  mapAgileAdministradorPasswordDetail,
  toAgileAdministradorPayload,
  type AgileAdministradorEmpresaLink,
  type AgileAdministradorListFilters,
  type AgileAdministradorPasswordRecord,
  type AgileAdministradorRecord,
} from '@/src/features/agile-administradores/services/agile-administradores-mappers'

function buildListParams(filters: CrudListFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    perPage: String(filters.perPage),
    orderBy: String(filters.orderBy),
    sort: filters.sort,
  })

  for (const [key, value] of Object.entries(filters)) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || key.endsWith('_label')) {
      continue
    }

    const normalized = typeof value === 'number' ? String(value) : value.trim()
    if (normalized) {
      params.set(key, normalized)
    }
  }

  return params
}

function mapLookupRows(rows: Array<{ value?: string; id?: string; label?: string; description?: string }>): LookupOption[] {
  return rows
    .map((item) => ({
      id: String(item.value ?? item.id ?? ''),
      label: String(item.label ?? item.value ?? item.id ?? ''),
      description: item.description ? String(item.description) : undefined,
    }))
    .filter((option) => option.id)
}

export const agileAdministradoresClient = {
  async list(filters: AgileAdministradorListFilters): Promise<CrudListResponse> {
    const response = await httpClient<unknown>(`/api/agile/administradores?${buildListParams(filters).toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return mapAgileAdministradorListResponse(response)
  },

  async getById(id: string): Promise<AgileAdministradorRecord> {
    const response = await httpClient<unknown>(`/api/agile/administradores/${id}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return mapAgileAdministradorDetail(response)
  },

  async getPasswordById(id: string): Promise<AgileAdministradorPasswordRecord | null> {
    const response = await httpClient<unknown>(`/api/agile/administradores/${id}?embed=perfil`, {
      method: 'GET',
      cache: 'no-store',
    })
    return response ? mapAgileAdministradorPasswordDetail(response) : null
  },

  async save(form: CrudRecord): Promise<CrudRecord[]> {
    const response = await httpClient<CrudRecord[] | CrudRecord>(`/api/agile/administradores`, {
      method: 'POST',
      body: JSON.stringify(toAgileAdministradorPayload(form)),
      cache: 'no-store',
    })
    return Array.isArray(response) ? response : [response]
  },

  async delete(ids: string[]) {
    return httpClient<{ success: true }>(`/api/agile/administradores`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      cache: 'no-store',
    })
  },

  async listOptions(resource: string): Promise<CrudOption[]> {
    if (resource !== 'perfis_administradores') return []
    const rows = await this.loadPerfilOptions('', 1, 1000)
    return rows.map((option) => ({ value: option.id, label: option.label }))
  },

  async loadEmpresaOptions(query: string, page: number, perPage: number): Promise<LookupOption[]> {
    const params = new URLSearchParams({ q: query, page: String(page), perPage: String(perPage) })
    const rows = await httpClient<Array<{ value?: string; id?: string; label?: string; description?: string }>>(`/api/lookups/empresas?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return mapLookupRows(rows)
  },

  async loadPerfilOptions(query: string, page: number, perPage: number, idEmpresa?: string): Promise<LookupOption[]> {
    const params = new URLSearchParams({ q: query, page: String(page), perPage: String(perPage) })
    if (idEmpresa) {
      params.set('idEmpresa', idEmpresa)
    }
    const response = await httpClient<{ data?: Array<{ id?: string; label?: string; description?: string }> }>(`/api/agile/administradores/perfis?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return mapLookupRows(response.data ?? [])
  },

  async addEmpresa(idUsuario: string, idEmpresa: string, idPerfil: string) {
    return httpClient<CrudRecord[]>(`/api/agile/administradores/${idUsuario}/empresas`, {
      method: 'POST',
      body: JSON.stringify({ id_empresa: idEmpresa, id_perfil: idPerfil }),
      cache: 'no-store',
    })
  },

  async removeEmpresas(idUsuario: string, links: AgileAdministradorEmpresaLink[]) {
    return httpClient<{ success: true }>(`/api/agile/administradores/${idUsuario}/empresas`, {
      method: 'DELETE',
      body: JSON.stringify({ links }),
      cache: 'no-store',
    })
  },

  async changePassword(payload: AgileAdministradorPasswordRecord): Promise<void> {
    await httpClient(`/api/agile/administradores/password`, {
      method: 'POST',
      body: JSON.stringify({
        id: payload.id,
        senha: payload.senha,
        confirmacao: payload.confirmacao,
      }),
      cache: 'no-store',
    })
  },
}
