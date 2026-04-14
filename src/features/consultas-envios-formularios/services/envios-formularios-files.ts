export function buildEnvioArquivoUrl(path: string, adminAppUrl?: string, painelb2bApiUrl?: string) {
	const normalizedPath = String(path || '').trim()
	if (!normalizedPath) {
		return ''
	}

	const explicit = String(adminAppUrl || '').trim()
	if (explicit) {
		return `${explicit.replace(/\/+$/, '')}/components/visualizar-arquivo.php?arquivo=${encodeURIComponent(normalizedPath)}`
	}

	const painelb2b = String(painelb2bApiUrl || '').trim()
	if (painelb2b) {
		const adminBase = painelb2b.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '')
		return `${adminBase}/components/visualizar-arquivo.php?arquivo=${encodeURIComponent(normalizedPath)}`
	}

	return `https://admin.agileb2b.com.br/components/visualizar-arquivo.php?arquivo=${encodeURIComponent(normalizedPath)}`
}
