import { httpClient } from '@/src/services/http/http-client'
import type { EnvioFormularioContext, EnvioFormularioDetail, EnvioFormularioFilters, EnvioFormularioListResponse } from '@/src/features/consultas-envios-formularios/services/envios-formularios-types'

function buildParams(filters: EnvioFormularioFilters) {
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

export const enviosFormulariosClient = {
	getContext() {
		return httpClient<{ data: EnvioFormularioContext }>('/api/consultas/envios-de-formularios?mode=context', {
			method: 'GET',
			cache: 'no-store',
		})
	},
	list(filters: EnvioFormularioFilters) {
		return httpClient<EnvioFormularioListResponse>(`/api/consultas/envios-de-formularios?${buildParams(filters).toString()}`, {
			method: 'GET',
			cache: 'no-store',
		})
	},
	getById(id: string) {
		return httpClient<{ data: EnvioFormularioDetail }>(`/api/consultas/envios-de-formularios/${encodeURIComponent(id)}`, {
			method: 'GET',
			cache: 'no-store',
		})
	},
	exportByForm(formId: string) {
		return httpClient<{ data: Record<string, string>[] }>(`/api/consultas/envios-de-formularios/export?id_formulario=${encodeURIComponent(formId)}`, {
			method: 'GET',
			cache: 'no-store',
		})
	},
}
