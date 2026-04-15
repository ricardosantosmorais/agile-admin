import { describe, expect, it } from 'vitest'
import {
	getConteudoArquivoNome,
	getConteudoArquivoPasta,
	isConteudoArquivoPreviewable,
	normalizeConteudoArquivosResponse,
} from '@/src/features/conteudo-arquivos/services/conteudo-arquivos-mappers'

describe('conteudo-arquivos-mappers', () => {
	it('extrai nome e pasta do arquivo no bucket do tenant', () => {
		const url = 'https://bucket.exemplo.com.br/arquivos/campanhas/banner-final.pdf'

		expect(getConteudoArquivoNome(url)).toBe('banner-final.pdf')
		expect(getConteudoArquivoPasta(url)).toBe('campanhas')
	})

	it('identifica extensões com preview', () => {
		expect(isConteudoArquivoPreviewable('https://bucket/arquivos/manual.pdf')).toBe(true)
		expect(isConteudoArquivoPreviewable('https://bucket/arquivos/planilha.xlsx')).toBe(false)
	})

	it('normaliza a resposta da listagem', () => {
		const response = normalizeConteudoArquivosResponse(
			{
				data: [
					{
						id: 12,
						arquivo: 'https://bucket.exemplo.com.br/arquivos/contratos/termo.docx',
						data_envio: '2026-04-15 10:30:00',
					},
				],
				meta: {
					page: 2,
					pages: 4,
					perPage: 15,
					from: 16,
					to: 30,
					total: 53,
				},
			},
			{ page: 1, perPage: 15 },
		)

		expect(response.meta.total).toBe(53)
		expect(response.data[0]).toMatchObject({
			id: '12',
			arquivoNome: 'termo.docx',
			pasta: 'contratos',
			extensao: 'docx',
			isPreviewable: false,
		})
		expect(response.data[0].dataEnvioLabel).toContain('15/04/2026')
	})
})
