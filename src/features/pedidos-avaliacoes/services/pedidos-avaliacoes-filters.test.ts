import { describe, expect, it } from 'vitest'
import {
	buildPedidoAvaliacaoClienteQuery,
	buildPedidoAvaliacaoMotivosQuery,
	buildPedidoAvaliacaoOrigemQuery,
	normalizeMotivoToken,
} from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-filters'

describe('pedidos-avaliacoes-filters', () => {
	it('normaliza motivo com acento e espaços', () => {
		expect(normalizeMotivoToken('Troca Devolução')).toBe('troca_devolucao')
		expect(normalizeMotivoToken('Preço')).toBe('preco')
	})

	it('gera filtro de cliente por documento ou código quando vier só número', () => {
		expect(buildPedidoAvaliacaoClienteQuery('123456')).toContain('cliente.codigo')
		expect(buildPedidoAvaliacaoClienteQuery('12.345.678/0001-90')).toContain('cliente.cnpj_cpf')
	})

	it('gera filtro de origem com alias legado', () => {
		expect(buildPedidoAvaliacaoOrigemQuery('confirmacao')).toContain('confirmacao')
		expect(buildPedidoAvaliacaoOrigemQuery('detalhe')).toContain('detalhe')
	})

	it('expande aliases de motivos para a query', () => {
		const query = buildPedidoAvaliacaoMotivosQuery('facilidade_site,troca')
		expect(query).toContain('facilidade_no_site')
		expect(query).toContain('troca_devolucao')
	})
})
