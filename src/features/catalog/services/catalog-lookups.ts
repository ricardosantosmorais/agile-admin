'use client'

import { httpClient } from '@/src/services/http/http-client'
import type { LookupOption } from '@/src/components/ui/lookup-select'

export type CatalogLookupResource =
  | 'produtos'
  | 'departamentos'
  | 'filiais'
  | 'tabelas_preco'
  | 'canais_distribuicao'
  | 'grupos'
  | 'redes'
  | 'segmentos'
  | 'marcas'
  | 'colecoes'
  | 'listas'
  | 'grades'
  | 'fornecedores'

type LookupResponse = {
  data?: Array<{
    id?: string
    label?: string
    description?: string
  }>
}

const LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000

type LookupCacheEntry = {
  expiresAt: number
  data: LookupOption[]
}

const catalogLookupCache = new Map<string, LookupCacheEntry>()

function cloneLookupOptions(options: LookupOption[]) {
  return options.map((option) => ({ ...option }))
}

function getCacheKey(resource: CatalogLookupResource, query: string, page: number, perPage: number) {
  return `${resource}::${query.trim().toLowerCase()}::${page}::${perPage}`
}

function readLookupCache(key: string) {
  const entry = catalogLookupCache.get(key)
  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    catalogLookupCache.delete(key)
    return null
  }

  return cloneLookupOptions(entry.data)
}

function writeLookupCache(key: string, data: LookupOption[]) {
  catalogLookupCache.set(key, {
    expiresAt: Date.now() + LOOKUP_CACHE_TTL_MS,
    data: cloneLookupOptions(data),
  })
}

export async function loadCatalogLookupOptions(resource: CatalogLookupResource, query: string, page: number, perPage: number) {
  const cacheKey = getCacheKey(resource, query, page, perPage)
  const cached = readLookupCache(cacheKey)
  if (cached) {
    return cached
  }

  const params = new URLSearchParams({
    q: query,
    page: String(page),
    perPage: String(perPage),
  })

  const response = await httpClient<LookupResponse | LookupResponse['data']>(`/api/lookups/${resource}?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })

  const items = Array.isArray(response) ? response : (response?.data ?? [])
  const options = items.map((item) => ({
    id: String(item.id || ''),
    label: String(item.label || item.id || ''),
    description: typeof item.description === 'string' ? item.description : undefined,
  })) satisfies LookupOption[]

  writeLookupCache(cacheKey, options)
  return cloneLookupOptions(options)
}

export function clearCatalogLookupCache() {
  catalogLookupCache.clear()
}
