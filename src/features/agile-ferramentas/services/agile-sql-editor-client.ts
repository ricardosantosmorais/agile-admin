import { httpClient } from '@/src/services/http/http-client'

export type AgileSqlEditorEmpresaOption = {
	id: string
	nome: string
	codigo: string
	label: string
	description?: string
}

export const agileSqlEditorClient = {
	async listEmpresas(query = '', page = 1, perPage = 15) {
		const params = new URLSearchParams({
			q: query,
			page: String(page),
			perPage: String(perPage),
		})
		const response = await httpClient<{ data: AgileSqlEditorEmpresaOption[] }>(`/api/agile/ferramentas/editor-sql/empresas?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		})
		return response.data
	},
}
