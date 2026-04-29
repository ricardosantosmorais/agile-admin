import { describe, expect, it } from 'vitest'
import { analyzeLegacyComponentContent } from '@/src/features/agile-ferramentas/services/sincronizar-modulos-parser'

describe('analyzeLegacyComponentContent', () => {
	it('maps legacy get calls, embedded loops and getValue fields', () => {
		const result = analyzeLegacyComponentContent(`
			$pedidos = get('pedidos', '?embed=itens&perpage=1', URL_API_V3);
			$pedido = $pedidos['data'][0];
			foreach ($pedido['itens'] as $item) {
				echo $item['sku'];
			}
			echo $pedido['id'];
			echo getValue($pedido, 'status');
		`)

		expect(result.pedidos).toEqual({ table: 'pedidos', fields: ['id', 'status'] })
		expect(result.itens).toEqual({ table: 'itens', fields: ['sku'] })
	})
})
