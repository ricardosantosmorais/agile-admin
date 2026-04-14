const MOTIVO_LABELS: Record<string, string> = {
	preco: 'Preço',
	frete: 'Frete',
	prazo: 'Prazo',
	pagamento: 'Pagamento',
	facilidade_site: 'Facilidade no site',
	facilidade_no_site: 'Facilidade no site',
	facilidade_do_site: 'Facilidade no site',
	fs: 'Facilidade no site',
	confianca: 'Confiança',
	cf: 'Confiança',
	atendimento: 'Atendimento',
	outro: 'Outro',
	prazo_entrega: 'Prazo de entrega',
	embalagem: 'Embalagem',
	rastreamento: 'Rastreamento',
	troca_devolucao: 'Troca e devolução',
	troca: 'Troca e devolução',
	pos_venda: 'Pós-venda',
	posvenda: 'Pós-venda',
}

const NOTA_LABELS: Record<number, string> = {
	1: 'Muito ruim',
	2: 'Ruim',
	3: 'Bom',
	4: 'Muito bom',
	5: 'Excelente',
}

function normalizeToken(value: string) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[ -]+/g, '_')
		.replace(/[^a-z0-9_,;|]/g, '')
}

export function formatPedidoAvaliacaoMotivos(value: string) {
	const normalized = String(value || '').trim()
	if (!normalized) {
		return '-'
	}

	const labels = normalized
		.split(/[,;|]/)
		.map((token) => normalizeToken(token).trim())
		.filter(Boolean)
		.map((token) => MOTIVO_LABELS[token] || token.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))

	return Array.from(new Set(labels)).join(', ') || '-'
}

export function formatPedidoAvaliacaoNotaLabel(value: number) {
	return NOTA_LABELS[value] || '-'
}

export function formatPedidoAvaliacaoOrigem(value: string) {
	const normalized = normalizeToken(String(value || ''))
	if (!normalized) return '-'
	if (normalized === 'confirmacao') return 'Confirmação'
	if (normalized === 'detalhe') return 'Detalhe'
	return normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatPedidoAvaliacaoCanal(value: string) {
	const normalized = String(value || '').trim().toLowerCase()
	if (!normalized) return '-'
	if (normalized === 'app') return 'App'
	if (normalized === 'pc') return 'PC'
	return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}
