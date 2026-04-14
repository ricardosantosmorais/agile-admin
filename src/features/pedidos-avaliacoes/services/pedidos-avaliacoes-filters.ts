export function normalizeMotivoToken(token: string) {
	return token
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[ -]+/g, '_')
		.replace(/[^a-z0-9_]/g, '')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '')
}

export function buildPedidoAvaliacaoClienteQuery(value: string) {
	if (!value) return ''

	const digits = value.replace(/\D/g, '')
	const hasLetters = /[a-zA-ZÀ-ÿ]/.test(value)
	if (!hasLetters && digits) {
		if (digits.length >= 11) {
			return `((replace(replace(replace(replace(cliente.cnpj_cpf, '.', ''), '-', ''), '/', ''), ' ', '') like '%${digits}%'))`
		}

		return `((cliente.codigo like '%${digits}%'))`
	}

	const safe = value.replace(/'/g, "''")
	return `((cliente.razao_social like '%${safe}%') or (cliente.nome_fantasia like '%${safe}%') or (cliente.codigo like '%${safe}%'))`
}

export function buildPedidoAvaliacaoOrigemQuery(value: string) {
	if (!value) return ''
	const normalized = value.toLowerCase()
	if (normalized === 'confirmacao') return "((pedidos_avaliacoes.origem like '%confirmacao%'))"
	if (normalized === 'detalhe') return "((pedidos_avaliacoes.origem like '%detalhe%'))"
	return `((pedidos_avaliacoes.origem = '${value.replace(/'/g, "''")}'))`
}

export function buildPedidoAvaliacaoMotivosQuery(raw: string) {
	if (!raw) return ''

	const aliases: Record<string, string[]> = {
		facilidade_site: ['facilidade_site', 'fs', 'facilidade_no_site', 'facilidade_do_site'],
		confianca: ['confianca', 'cf'],
		pos_venda: ['pos_venda', 'posvenda'],
		troca_devolucao: ['troca_devolucao', 'troca'],
		troca: ['troca_devolucao', 'troca'],
	}

	const parts = raw
		.split(/[,;|]/)
		.map((item) => normalizeMotivoToken(item))
		.filter(Boolean)
		.flatMap((token) => aliases[token] || [token])
		.map((token) => `(pedidos_avaliacoes.motivo like '%${token.replace(/'/g, "''")}%')`)

	return parts.length ? `(${Array.from(new Set(parts)).join(' or ')})` : ''
}
