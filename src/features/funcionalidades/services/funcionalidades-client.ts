import { createCrudClient } from '@/src/components/crud-base/crud-client'
import type { CrudRecord } from '@/src/components/crud-base/types'
import type { LookupOption } from '@/src/components/ui/lookup-select'
import { httpClient } from '@/src/services/http/http-client'

const crudClient = createCrudClient('/api/funcionalidades')

export const funcionalidadesClient = {
	...crudClient,
	async getById(id: string) {
		return crudClient.getById(id, 'funcionalidade_pai,empresas')
	},
	async listParentOptions(query: string, page: number, perPage: number, currentId?: string) {
		const params = new URLSearchParams({
			q: query,
			page: String(page),
			perPage: String(perPage),
		})
		if (currentId) params.set('currentId', currentId)
		return httpClient<LookupOption[]>(`/api/funcionalidades/parents?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		})
	},
	async loadEmpresaOptions(query: string, page: number, perPage: number) {
		return httpClient<Array<{ value?: string; id?: string; label?: string; nome_fantasia?: string; nome?: string }>>(`/api/lookups/empresas?q=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}`, {
			method: 'GET',
			cache: 'no-store',
		}).then((items) => items.map((item) => ({
			id: String(item.value ?? item.id ?? ''),
			label: String(item.label ?? item.nome_fantasia ?? item.nome ?? item.value ?? item.id ?? ''),
		})).filter((item) => item.id))
	},
	async addEmpresa(id: string, idEmpresa: string) {
		return httpClient<CrudRecord>(`/api/funcionalidades/${id}/empresas`, {
			method: 'POST',
			body: JSON.stringify({ id_empresa: idEmpresa }),
			cache: 'no-store',
		})
	},
	async removeEmpresas(id: string, ids: string[]) {
		return httpClient<{ success: true }>(`/api/funcionalidades/${id}/empresas`, {
			method: 'DELETE',
			body: JSON.stringify({ ids }),
			cache: 'no-store',
		})
	},
}
