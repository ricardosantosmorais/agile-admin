import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import {
	fetchRows,
	jsonError,
	toStringValue,
} from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

export async function GET(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const q = toStringValue(request.nextUrl.searchParams.get('q'))
	const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1))
	const perpage = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get('perPage') || 20)))
	try {
		const rows = await fetchRows('templates', {
			page,
			perpage,
			order: 'nome',
			sort: 'asc',
			...(q ? { 'nome::lk': q } : {}),
		})
		return NextResponse.json({
			data: rows.map((row) => ({
				id: toStringValue(row.id),
				label: toStringValue(row.nome || row.descricao || row.id),
			})).filter((row) => row.id),
		})
	} catch (error) {
		return jsonError(error, 'Não foi possível carregar os templates.')
	}
}
