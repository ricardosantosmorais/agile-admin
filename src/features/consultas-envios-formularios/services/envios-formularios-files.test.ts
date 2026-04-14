import { describe, expect, it } from 'vitest'
import { buildEnvioArquivoUrl } from '@/src/features/consultas-envios-formularios/services/envios-formularios-files'

describe('envios-formularios-files', () => {
	it('prioriza a URL explícita do admin', () => {
		expect(buildEnvioArquivoUrl('arquivo.pdf', 'https://admin.exemplo.com.br/', 'https://api.exemplo.com.br/api/v1/')).toBe(
			'https://admin.exemplo.com.br/components/visualizar-arquivo.php?arquivo=arquivo.pdf',
		)
	})

	it('deriva a URL do admin a partir da api painelb2b', () => {
		expect(buildEnvioArquivoUrl('pasta/arquivo.pdf', '', 'https://admin.exemplo.com.br/api/v1/')).toContain(
			'https://admin.exemplo.com.br/components/visualizar-arquivo.php?arquivo=pasta%2Farquivo.pdf',
		)
	})
})
