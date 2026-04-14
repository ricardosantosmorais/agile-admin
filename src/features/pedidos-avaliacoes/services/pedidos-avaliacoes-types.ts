export type PedidoAvaliacaoFilters = {
	page: number
	perPage: number
	orderBy: string
	sort: 'asc' | 'desc'
	id_pedido: string
	cliente: string
	nota: string
	motivos: string
	canal: string
	origem: string
	data_inicio: string
	data_fim: string
	updated_at_inicio: string
	updated_at_fim: string
}

export type PedidoAvaliacaoRecord = {
	id: string
	idPedido: string
	nota: number
	motivo: string
	comentario: string
	canal: string
	origem: string
	createdAt: string
	updatedAt: string
	cliente: {
		nome: string
		codigo: string
		email: string
		documento: string
	}
}

export type PedidoAvaliacaoListResponse = {
	data: PedidoAvaliacaoRecord[]
	meta: {
		page: number
		pages: number
		perPage: number
		from: number
		to: number
		total: number
	}
}

export type PedidoAvaliacaoDashboard = {
	data?: {
		metricas?: Record<string, unknown>
		notas?: Array<Record<string, unknown>>
		motivos?: Array<Record<string, unknown>>
	}
}
