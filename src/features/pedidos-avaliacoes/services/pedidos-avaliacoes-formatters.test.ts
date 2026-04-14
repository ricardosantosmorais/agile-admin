import { describe, expect, it } from 'vitest'
import {
	formatPedidoAvaliacaoCanal,
	formatPedidoAvaliacaoMotivos,
	formatPedidoAvaliacaoNotaLabel,
	formatPedidoAvaliacaoOrigem,
} from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-formatters'

describe('pedidos-avaliacoes-formatters', () => {
	it('traduz motivos legados para labels amigáveis', () => {
		expect(formatPedidoAvaliacaoMotivos('facilidade_site,troca')).toBe('Facilidade no site, Troca e devolução')
	})

	it('traduz nota para texto operacional', () => {
		expect(formatPedidoAvaliacaoNotaLabel(5)).toBe('Excelente')
		expect(formatPedidoAvaliacaoNotaLabel(2)).toBe('Ruim')
	})

	it('normaliza origem e canal', () => {
		expect(formatPedidoAvaliacaoOrigem('confirmacao')).toBe('Confirmação')
		expect(formatPedidoAvaliacaoCanal('app')).toBe('App')
	})
})
