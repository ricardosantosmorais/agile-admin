'use client'

import {
  buildParametroSavePayload,
  createEmptyParametroFormValues,
  normalizeParametroFormRecord,
  normalizeParametroViewRecord,
  normalizeParametrosListResponse,
} from '@/src/features/parametros/services/parametros-mappers'
import type {
  ParametroFormRecord,
  ParametroFormValues,
  ParametroListFilters,
  ParametroListResponse,
  ParametroViewRecord,
} from '@/src/features/parametros/services/parametros-types'
import { httpClient } from '@/src/services/http/http-client'

export const parametrosClient = {
  async list(filters: ParametroListFilters): Promise<ParametroListResponse> {
    const params = new URLSearchParams({
      page: String(filters.page),
      perpage: String(filters.perPage),
      field: filters.orderBy,
      sort: filters.sort,
      id: filters.id,
      chave: filters.chave,
      filial: filters.filial,
      descricao: filters.descricao,
      parametros: filters.parametros,
      posicao: filters.posicao,
      permissao: filters.permissao,
      ativo: filters.ativo,
    })

    const payload = await httpClient<unknown>(`/api/configuracoes/parametros?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeParametrosListResponse(payload, filters)
  },
  async get(id?: string): Promise<ParametroFormRecord> {
    const payload = await httpClient<unknown>(`/api/configuracoes/parametros/${id || 'novo'}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeParametroFormRecord(payload)
  },
  async view(id: string): Promise<ParametroViewRecord> {
    const payload = await httpClient<unknown>(`/api/configuracoes/parametros/${id}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeParametroViewRecord(payload)
  },
  async save(id: string | undefined, values: ParametroFormValues) {
    const payload = buildParametroSavePayload(values)
    return httpClient(`/api/configuracoes/parametros/${id || 'novo'}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
  createEmptyValues: createEmptyParametroFormValues,
}
