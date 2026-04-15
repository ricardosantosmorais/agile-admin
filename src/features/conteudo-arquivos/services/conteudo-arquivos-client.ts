import { httpClient } from '@/src/services/http/http-client'
import { normalizeConteudoArquivosResponse } from '@/src/features/conteudo-arquivos/services/conteudo-arquivos-mappers'
import type { ConteudoArquivosFilters, ConteudoArquivosListResponse } from '@/src/features/conteudo-arquivos/services/conteudo-arquivos-types'

function appendFilters(params: URLSearchParams, values: Record<string, unknown>, skipKeys: string[] = []) {
	for (const [key, value] of Object.entries(values)) {
		if (skipKeys.includes(key)) {
			continue
		}

		const normalized = String(value || '').trim()
		if (!normalized) {
			continue
		}

		params.set(key, normalized)
	}
}

export const conteudoArquivosClient = {
	async list(filters: ConteudoArquivosFilters): Promise<ConteudoArquivosListResponse> {
		const params = new URLSearchParams({
			page: String(filters.page),
			perPage: String(filters.perPage),
			orderBy: filters.orderBy,
			sort: filters.sort,
		})

		appendFilters(params, filters, ['page', 'perPage', 'orderBy', 'sort'])

		const payload = await httpClient<unknown>(`/api/arquivos?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		})

		return normalizeConteudoArquivosResponse(payload, { page: filters.page, perPage: filters.perPage })
	},

	async create(arquivo: string) {
		return httpClient<{ success?: boolean }>('/api/arquivos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ arquivo }),
		})
	},

	async delete(ids: string[]) {
		return httpClient<{ success?: boolean }>('/api/arquivos', {
			method: 'DELETE',
			cache: 'no-store',
			body: JSON.stringify({ ids }),
		})
	},
}
