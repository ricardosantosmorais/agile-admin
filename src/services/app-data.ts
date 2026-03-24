import {
  fakeAdminForms,
  fakeAdmins,
  fakeChangelog,
  fakeConfigModules,
  fakePerfis,
  fakeReports,
  fakeTenants,
  fakeUser,
  getDashboardSnapshot,
  type AdminFormRecord,
  type AdminRecord,
  type ChangelogItem,
  type ConfigModule,
  type DashboardRangeKey,
  type ReportRecord,
  type Tenant,
} from '@/src/lib/fake-data'
import type {
  ClientFormRecord,
  ClientListFilters,
  ClientLinkedSellerListItem,
  ClientLinkedUser,
  ClientListResponse,
  ClientLookupOption,
  ClientLookupResource,
} from '@/src/features/clientes/types/clientes'
import type {
  NotificationDetail,
  NotificationReadReceipt,
  NotificationsListResponse,
} from '@/src/features/notifications/types/notifications'
import { HttpError, httpClient } from '@/src/services/http/http-client'

const MOCK_LATENCY_MS = 120
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000

function withLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), MOCK_LATENCY_MS)
  })
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function getDashboardCacheKey(tenantId: string, startDate: string, endDate: string, blocks?: string[]) {
  const blockKey = (blocks ?? ['all']).join(',')
  return `dashboard-v2:${tenantId}:${startDate}:${endDate}:${blockKey}`
}

function readDashboardCache<T>(cacheKey: string) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(cacheKey)
    if (!raw) {
      return null
    }

    const cached = JSON.parse(raw) as { createdAt?: number; data?: T }
    if (!cached.createdAt || Date.now() - cached.createdAt > DASHBOARD_CACHE_TTL_MS) {
      window.localStorage.removeItem(cacheKey)
      return null
    }

    return cached.data ?? null
  } catch {
    return null
  }
}

function writeDashboardCache<T>(cacheKey: string, data: T) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify({ createdAt: Date.now(), data }))
  } catch {
    // noop
  }
}

function clearDashboardCache(tenantId: string, startDate: string, endDate: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const prefix = `dashboard-v2:${tenantId}:${startDate}:${endDate}:`
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(prefix)) {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    // noop
  }
}

const CLIENT_LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000

type ClientLookupCacheEntry<T> = {
  createdAt: number
  data: T
}

const clientLookupCache = new Map<string, ClientLookupCacheEntry<ClientLookupOption[]>>()

function getClientLookupCacheKey(resource: ClientLookupResource, query: string, page: number, perPage: number) {
  return `${resource}::${query.trim().toLowerCase()}::${page}::${perPage}`
}

function readClientLookupCache(key: string) {
  const entry = clientLookupCache.get(key)
  if (!entry) {
    return null
  }

  if (Date.now() - entry.createdAt > CLIENT_LOOKUP_CACHE_TTL_MS) {
    clientLookupCache.delete(key)
    return null
  }

  return entry.data.map((item) => ({ ...item }))
}

function writeClientLookupCache(key: string, data: ClientLookupOption[]) {
  clientLookupCache.set(key, {
    createdAt: Date.now(),
    data: data.map((item) => ({ ...item })),
  })
}

export const appData = {
  auth: {
    async login(email: string, senha?: string) {
      void senha
      return withLatency({
        ...fakeUser,
        email,
        avatarFallback: email.slice(0, 2).toUpperCase(),
      })
    },
  },
  shell: {
    async getNotifications(): Promise<NotificationsListResponse> {
      return httpClient<NotificationsListResponse>('/api/notifications', {
        method: 'GET',
        cache: 'no-store',
      })
    },
    async markNotificationsAsRead(receipts: NotificationReadReceipt[]) {
      if (!receipts.length) {
        return
      }

      await httpClient<{ success?: boolean }>('/api/notifications/read', {
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({ receipts }),
      })
    },
    async getNotificationById(id: string): Promise<NotificationDetail | null> {
      try {
        return await httpClient<NotificationDetail>(`/api/notifications/${id}`, {
          method: 'GET',
          cache: 'no-store',
        })
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) {
          return null
        }

        throw error
      }
    },
    async getChangelog(): Promise<ChangelogItem[]> {
      return withLatency(clone(fakeChangelog))
    },
  },
  tenants: {
    async list(): Promise<Tenant[]> {
      return withLatency(clone(fakeTenants))
    },
  },
  dashboard: {
    async getSnapshot(
      tenantId: string,
      startDate: string,
      endDate: string,
      selectedRangeLabel: string,
      options?: { forceRefresh?: boolean },
    ) {
      return this.getSnapshotByBlocks(tenantId, startDate, endDate, selectedRangeLabel, undefined, options)
    },
    async getSnapshotByBlocks(
      tenantId: string,
      startDate: string,
      endDate: string,
      selectedRangeLabel: string,
      blocks?: string[],
      options?: { forceRefresh?: boolean },
    ) {
      const cacheKey = getDashboardCacheKey(tenantId, startDate, endDate, blocks)
      const forceRefresh = options?.forceRefresh === true

      if (forceRefresh) {
        clearDashboardCache(tenantId, startDate, endDate)
      }

      const cached = forceRefresh ? null : readDashboardCache<ReturnType<typeof getDashboardSnapshot>>(cacheKey)

      if (cached) {
        return cached
      }

      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: forceRefresh ? 'no-store' : 'default',
        body: JSON.stringify({
          tenantId,
          startDate,
          endDate,
          rangeLabel: selectedRangeLabel,
          blocks,
          forceRefresh,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(payload?.message || 'Não foi possível carregar o dashboard.')
      }

      const data = (await response.json()) as ReturnType<typeof getDashboardSnapshot>
      writeDashboardCache(cacheKey, data)
      return data
    },
  },
  admins: {
    async list(): Promise<AdminRecord[]> {
      return withLatency(clone(fakeAdmins))
    },
    async listPerfis() {
      return withLatency(clone(fakePerfis))
    },
    async getById(id: string): Promise<AdminFormRecord | null> {
      return withLatency(clone(fakeAdminForms.find((item) => item.id === id) ?? null))
    },
  },
  clients: {
    async list(filters: ClientListFilters): Promise<ClientListResponse> {
      const params = new URLSearchParams({
        page: String(filters.page),
        perPage: String(filters.perPage),
        orderBy: filters.orderBy,
        sort: filters.sort,
      })

      for (const [key, value] of Object.entries(filters)) {
        if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value) {
          continue
        }

        params.set(key, String(value))
      }

      return httpClient<ClientListResponse>(`/api/clients?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      })
    },
    async getById(id: string): Promise<ClientFormRecord | null> {
      return httpClient<ClientFormRecord>(`/api/clients/${id}`, {
        method: 'GET',
        cache: 'no-store',
      })
    },
    async save(payload: ClientFormRecord) {
      return httpClient('/api/clients', {
        method: 'POST',
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
    },
    async delete(ids: string[]) {
      return httpClient('/api/clients', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
        cache: 'no-store',
      })
    },
    async lookup(resource: ClientLookupResource, query: string, page = 1, perPage = 15) {
      const cacheKey = getClientLookupCacheKey(resource, query, page, perPage)
      const cached = readClientLookupCache(cacheKey)
      if (cached) {
        return cached
      }

      const params = new URLSearchParams()
      if (query) {
        params.set('q', query)
      }
      params.set('page', String(page))
      params.set('perPage', String(perPage))

      const response = await httpClient<ClientLookupOption[]>(`/api/lookups/${resource}?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      })

      writeClientLookupCache(cacheKey, response)
      return response.map((item) => ({ ...item }))
    },
    async createRelation(id: string, relation: 'filiais' | 'vendedores' | 'formas_pagamento' | 'condicoes_pagamento', payload: unknown) {
      return httpClient(`/api/clients/${id}/relations/${relation}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
    },
    async deleteRelation(id: string, relation: 'filiais' | 'vendedores' | 'formas_pagamento' | 'condicoes_pagamento', payload: unknown) {
      return httpClient(`/api/clients/${id}/relations/${relation}`, {
        method: 'DELETE',
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
    },
    async getLinkedUsers(id: string) {
      return httpClient<ClientLinkedUser[]>(`/api/clients/${id}/linked-users`, {
        method: 'GET',
        cache: 'no-store',
      })
    },
    async unlinkUser(id: string, userId: string) {
      return httpClient(`/api/clients/${id}/linked-users`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
        cache: 'no-store',
      })
    },
    async getLinkedSellers(id: string) {
      return httpClient<ClientLinkedSellerListItem[]>(`/api/clients/${id}/linked-sellers`, {
        method: 'GET',
        cache: 'no-store',
      })
    },
    async unlock(id: string, descricao: string, platform = false) {
      return httpClient(`/api/clients/${id}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ descricao, platform }),
        cache: 'no-store',
      })
    },
  },
  reports: {
    async list(): Promise<ReportRecord[]> {
      return withLatency(clone(fakeReports))
    },
    async getById(id: string): Promise<ReportRecord | null> {
      return withLatency(clone(fakeReports.find((item) => item.id === id) ?? null))
    },
  },
  config: {
    async listModules(): Promise<ConfigModule[]> {
      return withLatency(clone(fakeConfigModules))
    },
    async getModule(slug: string): Promise<ConfigModule | null> {
      return withLatency(clone(fakeConfigModules.find((item) => item.slug === slug) ?? null))
    },
  },
}

export type DashboardPresetId = DashboardRangeKey
