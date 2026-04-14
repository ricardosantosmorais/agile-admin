import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import {
	buildPedidoAvaliacaoClienteQuery,
	buildPedidoAvaliacaoMotivosQuery,
	buildPedidoAvaliacaoOrigemQuery,
} from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-filters'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null) {
		if ('message' in payload && typeof payload.message === 'string') return payload.message
		if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
			return payload.error.message
		}
	}

	return fallback
}

function getString(value: string | null) {
	return String(value || '').trim()
}

function normalizeCliente(cliente: Record<string, unknown>) {
	return {
		nome: String(cliente.razao_social || cliente.nome_fantasia || '').trim(),
		codigo: String(cliente.codigo || '').trim(),
		email: String(cliente.email || cliente.email_contato || '').trim(),
		documento: String(cliente.cnpj_cpf || '').trim(),
	}
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const searchParams = request.nextUrl.searchParams
	const params = new URLSearchParams({
		page: searchParams.get('page') || '1',
		perpage: searchParams.get('perPage') || '15',
		order: searchParams.get('orderBy') || 'updated_at',
		sort: searchParams.get('sort') || 'desc',
		embed: 'cliente',
	})

	const idPedido = getString(searchParams.get('id_pedido'))
	if (idPedido) params.set('id_pedido', idPedido)

	const nota = getString(searchParams.get('nota'))
	if (nota) params.set('nota', nota)

	const canal = getString(searchParams.get('canal'))
	if (canal) params.set('canal', canal)

	const dataInicio = getString(searchParams.get('data_inicio'))
	if (dataInicio) params.set('created_at::ge', `${dataInicio} 00:00:00`)

	const dataFim = getString(searchParams.get('data_fim'))
	if (dataFim) params.set('created_at::le', `${dataFim} 23:59:59`)

	const dataAlteracaoInicio = getString(searchParams.get('updated_at_inicio'))
	if (dataAlteracaoInicio) params.set('updated_at::ge', `${dataAlteracaoInicio} 00:00:00`)

	const dataAlteracaoFim = getString(searchParams.get('updated_at_fim'))
	if (dataAlteracaoFim) params.set('updated_at::le', `${dataAlteracaoFim} 23:59:59`)

	const qParts = [
		buildPedidoAvaliacaoClienteQuery(getString(searchParams.get('cliente'))),
		buildPedidoAvaliacaoOrigemQuery(getString(searchParams.get('origem'))),
		buildPedidoAvaliacaoMotivosQuery(getString(searchParams.get('motivos'))),
	].filter(Boolean)
	if (qParts.length) {
		params.set('q', `(${qParts.join(' and ')})`)
	}

	const result = await serverApiFetch(`pedidos/avaliacoes?${params.toString()}`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	})

	if (!result.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(result.payload, 'Não foi possível carregar os pedidos avaliados.') },
			{ status: result.status || 400 },
		)
	}

	const payload = (typeof result.payload === 'object' && result.payload !== null ? result.payload : {}) as { data?: unknown[]; meta?: Record<string, unknown> }
	return NextResponse.json({
		data: Array.isArray(payload.data)
			? payload.data.map((entry) => {
				const row = (typeof entry === 'object' && entry !== null ? entry : {}) as Record<string, unknown>
				const cliente = normalizeCliente((typeof row.cliente === 'object' && row.cliente !== null ? row.cliente : {}) as Record<string, unknown>)
				return {
					id: String(row.id || '').trim(),
					idPedido: String(row.id_pedido || '').trim(),
					nota: Number(row.nota || 0),
					motivo: String(row.motivo || '').trim(),
					comentario: String(row.comentario || '').trim(),
					canal: String(row.canal || '').trim(),
					origem: String(row.origem || '').trim(),
					createdAt: String(row.created_at || '').trim(),
					updatedAt: String(row.updated_at || '').trim(),
					cliente,
				}
			})
			: [],
		meta: {
			page: Number(payload.meta?.page || 1),
			pages: Number(payload.meta?.pages || 1),
			perPage: Number(payload.meta?.perpage || 15),
			from: Number(payload.meta?.from || 0),
			to: Number(payload.meta?.to || 0),
			total: Number(payload.meta?.total || 0),
		},
	})
}
