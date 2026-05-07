import { configModules, type ConfigModule } from '@/src/features/configuracoes/data/config-modules';
import { shellChangelog, type ChangelogItem } from '@/src/features/shell/data/changelog';
import type { DashboardRangeKey, DashboardSnapshot } from '@/src/features/dashboard/types/dashboard';
import type {
	ClientFormRecord,
	ClientListFilters,
	ClientLinkedSellerListItem,
	ClientLinkedUser,
	ClientListResponse,
	ClientLookupOption,
	ClientLookupResource,
} from '@/src/features/clientes/types/clientes';
import type { NotificationDetail, NotificationReadReceipt, NotificationsListResponse } from '@/src/features/notifications/types/notifications';
import { HttpError, httpClient } from '@/src/services/http/http-client';

const MOCK_LATENCY_MS = 120;
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

export type TenantDebugInfo = {
	platformToken: string;
};

type DashboardSnapshotOptions = {
	forceRefresh?: boolean;
	previousStart?: string | null;
	previousEnd?: string | null;
	signal?: AbortSignal;
};

function withLatency<T>(value: T): Promise<T> {
	return new Promise((resolve) => {
		window.setTimeout(() => resolve(value), MOCK_LATENCY_MS);
	});
}

function clone<T>(value: T): T {
	return structuredClone(value);
}

function getDashboardCacheKey(tenantId: string, startDate: string, endDate: string, blocks?: string[], previousStart?: string | null, previousEnd?: string | null) {
	const blockKey = (blocks ?? ['all']).join(',');
	const prevKey = previousStart && previousEnd ? `:${previousStart}:${previousEnd}` : '';
	return `dashboard-v2:${tenantId}:${startDate}:${endDate}${prevKey}:${blockKey}`;
}

function readDashboardCache<T>(cacheKey: string) {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const raw = window.localStorage.getItem(cacheKey);
		if (!raw) {
			return null;
		}

		const cached = JSON.parse(raw) as { createdAt?: number; data?: T };
		if (!cached.createdAt || Date.now() - cached.createdAt > DASHBOARD_CACHE_TTL_MS) {
			window.localStorage.removeItem(cacheKey);
			return null;
		}

		return cached.data ?? null;
	} catch {
		return null;
	}
}

function writeDashboardCache<T>(cacheKey: string, data: T) {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		window.localStorage.setItem(cacheKey, JSON.stringify({ createdAt: Date.now(), data }));
	} catch {
		// noop
	}
}

function clearDashboardCache(tenantId: string, startDate: string, endDate: string) {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		const prefix = `dashboard-v2:${tenantId}:${startDate}:${endDate}:`;
		for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
			const key = window.localStorage.key(index);
			if (key?.startsWith(prefix)) {
				window.localStorage.removeItem(key);
			}
		}
	} catch {
		// noop
	}
}

const CLIENT_LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000;
const NOTIFICATIONS_CACHE_TTL_MS = 5 * 60 * 1000;

type ClientLookupCacheEntry<T> = {
	createdAt: number;
	data: T;
};

const clientLookupCache = new Map<string, ClientLookupCacheEntry<ClientLookupOption[]>>();
const notificationsCache = new Map<string, ClientLookupCacheEntry<NotificationsListResponse>>();
const NOTIFICATIONS_STORAGE_PREFIX = 'admin-v2-web:notifications:';

function getClientLookupCacheKey(resource: ClientLookupResource, query: string, page: number, perPage: number) {
	return `${resource}::${query.trim().toLowerCase()}::${page}::${perPage}`;
}

function readClientLookupCache(key: string) {
	const entry = clientLookupCache.get(key);
	if (!entry) {
		return null;
	}

	if (Date.now() - entry.createdAt > CLIENT_LOOKUP_CACHE_TTL_MS) {
		clientLookupCache.delete(key);
		return null;
	}

	return entry.data.map((item) => ({ ...item }));
}

function writeClientLookupCache(key: string, data: ClientLookupOption[]) {
	clientLookupCache.set(key, {
		createdAt: Date.now(),
		data: data.map((item) => ({ ...item })),
	});
}

function readNotificationsCache(key: string) {
	const entry = notificationsCache.get(key);
	if (!entry) {
		if (typeof window === 'undefined') {
			return null;
		}

		try {
			const raw = window.sessionStorage.getItem(`${NOTIFICATIONS_STORAGE_PREFIX}${key}`);
			if (!raw) {
				return null;
			}

			const parsed = JSON.parse(raw) as ClientLookupCacheEntry<NotificationsListResponse>;
			if (Date.now() - parsed.createdAt > NOTIFICATIONS_CACHE_TTL_MS) {
				window.sessionStorage.removeItem(`${NOTIFICATIONS_STORAGE_PREFIX}${key}`);
				return null;
			}

			notificationsCache.set(key, {
				createdAt: parsed.createdAt,
				data: structuredClone(parsed.data),
			});

			return structuredClone(parsed.data);
		} catch {
			return null;
		}
	}

	if (Date.now() - entry.createdAt > NOTIFICATIONS_CACHE_TTL_MS) {
		notificationsCache.delete(key);
		return null;
	}

	return structuredClone(entry.data);
}

function writeNotificationsCache(key: string, data: NotificationsListResponse) {
	const entry = {
		createdAt: Date.now(),
		data: structuredClone(data),
	};

	notificationsCache.set(key, entry);

	if (typeof window === 'undefined') {
		return;
	}

	try {
		window.sessionStorage.setItem(`${NOTIFICATIONS_STORAGE_PREFIX}${key}`, JSON.stringify(entry));
	} catch {
		// noop
	}
}

function invalidateNotificationsCache(key?: string) {
	if (key) {
		notificationsCache.delete(key);
		if (typeof window !== 'undefined') {
			try {
				window.sessionStorage.removeItem(`${NOTIFICATIONS_STORAGE_PREFIX}${key}`);
			} catch {
				// noop
			}
		}
		return;
	}

	notificationsCache.clear();

	if (typeof window === 'undefined') {
		return;
	}

	try {
		for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
			const storageKey = window.sessionStorage.key(index);
			if (storageKey?.startsWith(NOTIFICATIONS_STORAGE_PREFIX)) {
				window.sessionStorage.removeItem(storageKey);
			}
		}
	} catch {
		// noop
	}
}

export const appData = {
	shell: {
		async getNotifications(tenantId?: string): Promise<NotificationsListResponse> {
			const cacheKey = tenantId || 'default';
			const cached = readNotificationsCache(cacheKey);
			if (cached) {
				return cached;
			}

			const response = await httpClient<NotificationsListResponse>('/api/notifications', {
				method: 'GET',
				cache: 'no-store',
			});

			writeNotificationsCache(cacheKey, response);
			return response;
		},
		async markNotificationsAsRead(receipts: NotificationReadReceipt[], tenantId?: string) {
			if (!receipts.length) {
				return;
			}

			await httpClient<{ success?: boolean }>('/api/notifications/read', {
				method: 'POST',
				cache: 'no-store',
				body: JSON.stringify({ receipts }),
			});

			invalidateNotificationsCache(tenantId || 'default');
		},
		async getNotificationById(id: string): Promise<NotificationDetail | null> {
			try {
				return await httpClient<NotificationDetail>(`/api/notifications/${id}`, {
					method: 'GET',
					cache: 'no-store',
				});
			} catch (error) {
				if (error instanceof HttpError && error.status === 404) {
					return null;
				}

				throw error;
			}
		},
		async getChangelog(): Promise<ChangelogItem[]> {
			return withLatency(clone(shellChangelog));
		},
		async getTenantDebugInfo(tenantId: string): Promise<TenantDebugInfo> {
			return httpClient<TenantDebugInfo>(`/api/shell/tenant-debug?tenantId=${encodeURIComponent(tenantId)}`, {
				method: 'GET',
				cache: 'no-store',
			});
		},
	},
	dashboard: {
		async getSnapshot(tenantId: string, startDate: string, endDate: string, selectedRangeLabel: string, options?: DashboardSnapshotOptions) {
			return this.getSnapshotByBlocks(tenantId, startDate, endDate, selectedRangeLabel, undefined, options);
		},
		async getSnapshotByBlocks(
			tenantId: string,
			startDate: string,
			endDate: string,
			selectedRangeLabel: string,
			blocks?: string[],
			options?: DashboardSnapshotOptions,
		) {
			const cacheKey = getDashboardCacheKey(tenantId, startDate, endDate, blocks, options?.previousStart ?? null, options?.previousEnd ?? null);
			const forceRefresh = options?.forceRefresh === true;

			if (forceRefresh) {
				clearDashboardCache(tenantId, startDate, endDate);
			}

			const cached = forceRefresh ? null : readDashboardCache<DashboardSnapshot>(cacheKey);

			if (cached) {
				return cached;
			}

			const response = {
				ok: true,
				json: async () =>
					httpClient<DashboardSnapshot>('/api/dashboard', {
						method: 'POST',
						cache: forceRefresh ? 'no-store' : 'default',
						signal: options?.signal,
						body: JSON.stringify({
							tenantId,
							startDate,
							endDate,
							rangeLabel: selectedRangeLabel,
							blocks,
							forceRefresh,
							previousStart: options?.previousStart ?? null,
							previousEnd: options?.previousEnd ?? null,
						}),
					}),
			};

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message || 'Não foi possível carregar o dashboard.');
			}

			const data = (await response.json()) as DashboardSnapshot;
			writeDashboardCache(cacheKey, data);
			return data;
		},
	},
	clients: {
		async list(filters: ClientListFilters): Promise<ClientListResponse> {
			const params = new URLSearchParams({
				page: String(filters.page),
				perPage: String(filters.perPage),
				orderBy: filters.orderBy,
				sort: filters.sort,
			});

			for (const [key, value] of Object.entries(filters)) {
				if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value) {
					continue;
				}

				params.set(key, String(value));
			}

			return httpClient<ClientListResponse>(`/api/clients?${params.toString()}`, {
				method: 'GET',
				cache: 'no-store',
			});
		},
		async getById(id: string): Promise<ClientFormRecord | null> {
			return httpClient<ClientFormRecord>(`/api/clients/${id}`, {
				method: 'GET',
				cache: 'no-store',
			});
		},
		async save(payload: ClientFormRecord) {
			return httpClient('/api/clients', {
				method: 'POST',
				body: JSON.stringify(payload),
				cache: 'no-store',
			});
		},
		async delete(ids: string[]) {
			return httpClient('/api/clients', {
				method: 'DELETE',
				body: JSON.stringify({ ids }),
				cache: 'no-store',
			});
		},
		async lookup(resource: ClientLookupResource, query: string, page = 1, perPage = 15) {
			const cacheKey = getClientLookupCacheKey(resource, query, page, perPage);
			const cached = readClientLookupCache(cacheKey);
			if (cached) {
				return cached;
			}

			const params = new URLSearchParams();
			if (query) {
				params.set('q', query);
			}
			params.set('page', String(page));
			params.set('perPage', String(perPage));

			const response = await httpClient<ClientLookupOption[]>(`/api/lookups/${resource}?${params.toString()}`, {
				method: 'GET',
				cache: 'no-store',
			});

			writeClientLookupCache(cacheKey, response);
			return response.map((item) => ({ ...item }));
		},
		async createRelation(id: string, relation: 'filiais' | 'vendedores' | 'formas_pagamento' | 'condicoes_pagamento', payload: unknown) {
			return httpClient(`/api/clients/${id}/relations/${relation}`, {
				method: 'POST',
				body: JSON.stringify(payload),
				cache: 'no-store',
			});
		},
		async deleteRelation(id: string, relation: 'filiais' | 'vendedores' | 'formas_pagamento' | 'condicoes_pagamento', payload: unknown) {
			return httpClient(`/api/clients/${id}/relations/${relation}`, {
				method: 'DELETE',
				body: JSON.stringify(payload),
				cache: 'no-store',
			});
		},
		async getLinkedUsers(id: string) {
			return httpClient<ClientLinkedUser[]>(`/api/clients/${id}/linked-users`, {
				method: 'GET',
				cache: 'no-store',
			});
		},
		async unlinkUser(id: string, userId: string) {
			return httpClient(`/api/clients/${id}/linked-users`, {
				method: 'DELETE',
				body: JSON.stringify({ userId }),
				cache: 'no-store',
			});
		},
		async getLinkedSellers(id: string) {
			return httpClient<ClientLinkedSellerListItem[]>(`/api/clients/${id}/linked-sellers`, {
				method: 'GET',
				cache: 'no-store',
			});
		},
		async unlock(id: string, descricao: string, platform = false) {
			return httpClient(`/api/clients/${id}/unlock`, {
				method: 'POST',
				body: JSON.stringify({ descricao, platform }),
				cache: 'no-store',
			});
		},
	},
	config: {
		async listModules(): Promise<ConfigModule[]> {
			return withLatency(clone(configModules));
		},
		async getModule(slug: string): Promise<ConfigModule | null> {
			return withLatency(clone(configModules.find((item) => item.slug === slug) ?? null));
		},
	},
};

export type DashboardPresetId = DashboardRangeKey;
