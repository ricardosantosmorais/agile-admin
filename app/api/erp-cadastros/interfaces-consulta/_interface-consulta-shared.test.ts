import { describe, expect, it } from 'vitest'
import { normalizeGatewayConsultaMap } from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

describe('interface consulta shared bridge helpers', () => {
	it('normalizes legacy consulta map fields with remote defaults', () => {
		expect(normalizeGatewayConsultaMap({
			id_tabela_campo: '55',
			permite_filtro: true,
			permite_ordenacao: false,
		}, '900')).toMatchObject({
			id_gateway_endpoint: '900',
			id_tabela_campo: '55',
			permite_filtro: true,
			modo_aplicacao_filtro: 'remoto',
			permite_ordenacao: false,
			modo_aplicacao_ordenacao: 'remoto',
			resolucao_valor_config: '',
		})
	})
})
