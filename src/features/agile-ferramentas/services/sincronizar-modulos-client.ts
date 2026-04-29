import { httpClient } from '@/src/services/http/http-client'

export type SincronizarModulosResponse = {
	message: string
	componentesPath: string
	arquivosAnalisados: number
	tabelasDetectadas: number
	componentesCriados: number
	vinculosTabelas: number
	vinculosCampos: number
	ignoradosSemTabela: number
	ignoradosSemDicionario: number
}

export const sincronizarModulosClient = {
	async executar() {
		return httpClient<SincronizarModulosResponse>('/api/agile/ferramentas/sincronizar-modulos', {
			method: 'POST',
			body: JSON.stringify({}),
		})
	},
}
