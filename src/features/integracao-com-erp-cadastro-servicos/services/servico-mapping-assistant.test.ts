import { describe, expect, it } from 'vitest'
import { buildSamplePayload, buildSampleRowLabel, extractSampleRows } from './servico-mapping-assistant'

describe('servico-mapping-assistant', () => {
	it('prioriza data_array ao extrair amostras do preview do endpoint', () => {
		const rows = extractSampleRows({
			data: {
				response_raw: { ignored: true },
				data_array_sample: { id: 1 },
				data_array: [
					{ id: 10, nome: 'Produto A' },
					{ id: 11, nome: 'Produto B' },
				],
			},
		})

		expect(rows).toEqual([
			{ id: 10, nome: 'Produto A' },
			{ id: 11, nome: 'Produto B' },
		])
	})

	it('usa data_array_sample quando o retorno nao traz lista normalizada', () => {
		expect(extractSampleRows({ data: { data_array_sample: { codigo: 'ABC' } } })).toEqual([{ codigo: 'ABC' }])
	})

	it('monta labels com chaves preferenciais do legado', () => {
		expect(buildSampleRowLabel({ id: 10, nome: 'Produto A', descricao: 'Grande' }, 0)).toBe('#1 | id=10 | nome=Produto A')
		expect(buildSampleRowLabel({ externo: 'X', valor: 99 }, 1)).toBe('#2 | externo=X | valor=99')
	})

	it('monta payload de teste por registro e preserva dataset consolidado', () => {
		expect(buildSamplePayload({ id: 10 }, false)).toEqual({ data: [{ id: 10 }] })
		expect(buildSamplePayload({ lote: [{ id: 10 }] }, true)).toEqual({ lote: [{ id: 10 }] })
	})
})
