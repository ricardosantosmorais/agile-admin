import { httpClient } from '@/src/services/http/http-client'
import type { PedidoAvaliacaoDashboard, PedidoAvaliacaoFilters, PedidoAvaliacaoListResponse } from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-types'

function buildParams(filters: PedidoAvaliacaoFilters) {
	const params = new URLSearchParams({
		page: String(filters.page),
		perPage: String(filters.perPage),
		orderBy: filters.orderBy,
		sort: filters.sort,
	})

	for (const [key, value] of Object.entries(filters)) {
		if (['page', 'perPage', 'orderBy', 'sort'].includes(key)) continue
		const normalized = String(value || '').trim()
		if (!normalized) continue
		params.set(key, normalized)
	}

	return params
}

export const pedidosAvaliacoesClient = {
	getDashboard(filters?: Partial<PedidoAvaliacaoFilters>) {
		const params = new URLSearchParams()
		for (const [key, value] of Object.entries(filters || {})) {
			const normalized = String(value || '').trim()
			if (!normalized) continue
			params.set(key, normalized)
		}

		const suffix = params.toString() ? `?${params.toString()}` : ''
		return httpClient<PedidoAvaliacaoDashboard>(`/api/pedidos/avaliacoes/dashboard${suffix}`, {
			method: 'GET',
			cache: 'no-store',
		})
	},
	list(filters: PedidoAvaliacaoFilters) {
		return httpClient<PedidoAvaliacaoListResponse>(`/api/pedidos/avaliacoes?${buildParams(filters).toString()}`, {
			method: 'GET',
			cache: 'no-store',
		})
	},
	getById(id: string) {
		return httpClient(`/api/pedidos/avaliacoes/${encodeURIComponent(id)}`, {
			method: 'GET',
			cache: 'no-store',
		})
	},
}
