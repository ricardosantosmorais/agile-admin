'use client'

import { httpClient } from '@/src/services/http/http-client'
import type { CrudDataClient, CrudListFilters, CrudListResponse, CrudOption, CrudRecord, CrudResource } from '@/src/components/crud-base/types'

const CRUD_OPTIONS_PATHS: Record<CrudResource, string> = {
  formularios: '/api/formularios',
  formularios_campos: '/api/formularios-campos',
  produtos_precificadores: '/api/produtos-x-precificadores',
  tributos: '/api/tributos',
  tributos_partilha: '/api/tributos-partilha',
  'produtos/filiais': '/api/produtos-x-filiais',
  tabelas_preco: '/api/lookups/tabelas_preco',
  formas_pagamento: '/api/lookups/formas_pagamento',
  condicoes_pagamento: '/api/lookups/condicoes_pagamento',
  limites_credito: '/api/limites-credito',
  grupos_filiais: '/api/grupos-filiais',
  termos_pesquisa: '/api/termos-pesquisa',
  sequenciais: '/api/sequenciais',
  'implantacao/fases': '/api/fases',
  formas_entrega: '/api/formas-entrega',
  transportadoras: '/api/transportadoras',
  portos: '/api/portos',
  areas_atuacao: '/api/areas-de-atuacao',
  pracas: '/api/pracas',
  rotas: '/api/rotas',
  banners: '/api/banners',
  clientes: '/api/lookups/clientes',
  contatos: '/api/contatos',
  campanhas: '/api/campanhas',
  cupons_desconto: '/api/cupons-desconto',
  notificacoes: '/api/notificacoes',
  linhas: '/api/linhas',
  cores: '/api/cores',
  areas_banner: '/api/areas-banner',
  emails: '/api/emails',
  emails_templates: '/api/emails-templates',
  paginas: '/api/paginas',
  areas_pagina: '/api/areas-paginas',
  usuarios: '/api/usuarios',
  supervisores: '/api/supervisores',
  vendedores: '/api/vendedores',
  grupos: '/api/grupos-clientes',
  regras_cadastro: '/api/regras-cadastro',
  colecoes: '/api/colecoes',
  listas: '/api/listas',
  marcas: '/api/marcas',
  departamentos: '/api/departamentos',
  fornecedores: '/api/fornecedores',
  grades: '/api/grades',
  grupos_promocao: '/api/lookups/grupos_promocao',
  redes: '/api/lookups/redes',
  segmentos: '/api/lookups/segmentos',
  filiais: '/api/lookups/filiais',
  canais_distribuicao: '/api/lookups/canais_distribuicao',
  perfis_administradores: '/api/administradores/perfis',
  'integracao-aplicativos': '/api/integracao-aplicativos',
  produtos: '/api/lookups/produtos',
  promocoes: '/api/lookups/promocoes',
  compre_ganhe: '/api/compre-e-ganhe',
  brindes: '/api/lookups/brindes',
}

function buildParams(filters: CrudListFilters, embed?: string) {
  const params = new URLSearchParams({
    page: String(filters.page),
    perPage: String(filters.perPage),
    orderBy: filters.orderBy,
    sort: filters.sort,
  })

  if (embed) {
    params.set('embed', embed)
  }

  for (const [key, value] of Object.entries(filters)) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || key.endsWith('_label')) {
      continue
    }

    const normalizedValue = typeof value === 'number' ? String(value) : value.trim()
    if (!normalizedValue) {
      continue
    }

    params.set(key, normalizedValue)
  }

  return params
}

export function sanitizeCrudPayload(payload: CrudRecord) {
  const result: CrudRecord = {}

  for (const [key, value] of Object.entries(payload)) {
    if (['created_at', 'updated_at', 'deleted_at'].includes(key)) {
      continue
    }

    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      continue
    }

    if (value !== null && typeof value === 'object') {
      continue
    }

    result[key] = value
  }

  return result
}

type LookupItem = {
  id?: string | number | null
  value?: string | number | null
  nome?: string | null
  nome_fantasia?: string | null
  titulo?: string | null
  email?: string | null
  label?: string | null
  description?: string | null
}

const LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000

type LookupCacheEntry = {
  expiresAt: number
  data: CrudOption[]
}

const lookupOptionsCache = new Map<string, LookupCacheEntry>()

function mapCrudOption(item: LookupItem): CrudOption {
  const value = String(item.id ?? '')
  const primaryLabel = item.label || item.nome_fantasia || item.nome || item.titulo || item.email || value
  const suffix = item.label ? '' : value && primaryLabel !== value ? ` - ${value}` : ''

  return {
    value,
    label: `${String(primaryLabel)}${suffix}`,
  }
}

function cloneCrudOptions(options: CrudOption[]) {
  return options.map((option) => ({ ...option }))
}

function getLookupCacheKey(resource: CrudResource, query: string, page: number, perPage: number) {
  return `${resource}::${query.trim().toLowerCase()}::${page}::${perPage}`
}

function readLookupCache(key: string) {
  const entry = lookupOptionsCache.get(key)
  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    lookupOptionsCache.delete(key)
    return null
  }

  return cloneCrudOptions(entry.data)
}

function writeLookupCache(key: string, data: CrudOption[]) {
  lookupOptionsCache.set(key, {
    expiresAt: Date.now() + LOOKUP_CACHE_TTL_MS,
    data: cloneCrudOptions(data),
  })
}

export async function loadCrudLookupOptions(resource: CrudResource, query: string, page: number, perPage: number) {
  const cacheKey = getLookupCacheKey(resource, query, page, perPage)
  const cached = readLookupCache(cacheKey)
  if (cached) {
    return cached
  }

  const response = await httpClient<Array<CrudOption | LookupItem>>(`/api/lookups/${resource}?page=${page}&perPage=${perPage}&q=${encodeURIComponent(query)}`, {
    method: 'GET',
    cache: 'no-store',
  })

  const normalized = response.map((item) => {
    if ('value' in item && typeof item.value === 'string' && 'label' in item && typeof item.label === 'string') {
      return { value: item.value, label: item.label }
    }

    return mapCrudOption(item)
  })

  writeLookupCache(cacheKey, normalized)
  return cloneCrudOptions(normalized)
}

export async function resolveCrudLookupOption(resource: CrudResource, id: string) {
  const normalizedId = id.trim()
  if (!normalizedId) {
    return null
  }

  const response = await httpClient<Array<CrudOption | LookupItem>>(`/api/lookups/${resource}?id=${encodeURIComponent(normalizedId)}`, {
    method: 'GET',
    cache: 'no-store',
  })

  const item = response[0]
  if (!item) {
    return null
  }

  if ('value' in item && typeof item.value === 'string' && 'label' in item && typeof item.label === 'string') {
    return { value: item.value, label: item.label }
  }

  return mapCrudOption(item)
}

export function clearCrudLookupCache() {
  lookupOptionsCache.clear()
}

export function createCrudClient(basePath: string): CrudDataClient {
  return {
    list(filters, embed) {
      const params = buildParams(filters, embed)
      return httpClient<CrudListResponse>(`${basePath}?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      })
    },
    getById(id, embed) {
      const params = new URLSearchParams()
      if (embed) {
        params.set('embed', embed)
      }

      const query = params.size ? `?${params.toString()}` : ''
      return httpClient<CrudRecord>(`${basePath}/${id}${query}`, {
        method: 'GET',
        cache: 'no-store',
      })
    },
    save(payload) {
      return httpClient<CrudRecord[]>(basePath, {
        method: 'POST',
        body: JSON.stringify(sanitizeCrudPayload(payload)),
        cache: 'no-store',
      })
    },
    delete(ids) {
      return httpClient<{ success: true }>(basePath, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
        cache: 'no-store',
      })
    },
    async listOptions(resource: CrudResource) {
      const basePath = CRUD_OPTIONS_PATHS[resource]
      const orderBy = resource === 'formularios' ? 'titulo' : 'nome'
      const query = basePath.startsWith('/api/lookups/')
        ? '?page=1&perPage=1000&q='
        : `?page=1&perPage=1000&orderBy=${orderBy}&sort=asc`
      const cacheKey = getLookupCacheKey(resource, '', 1, 1000)
      const cached = readLookupCache(cacheKey)
      if (cached) {
        return cached
      }

      const response = await httpClient<CrudListResponse | LookupItem[]>(`${basePath}${query}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const items = Array.isArray(response) ? response : response.data
      const options = items.map((item) => mapCrudOption(item)) satisfies CrudOption[]
      writeLookupCache(cacheKey, options)
      return cloneCrudOptions(options)
    },
  }
}
