import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import {
	buildAliasValidation,
	jsonError,
	toStringValue,
} from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'
import { asRecord } from '@/src/lib/api-payload'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const body = asRecord(await request.json())
	try {
		const idQuery = toStringValue(body.id_query)
		const sql = toStringValue(body.sql)
		if (!idQuery && !sql) throw new Error('Informe uma query para validar os aliases.')
		return NextResponse.json(await buildAliasValidation(id, idQuery, sql))
	} catch (error) {
		return jsonError(error, 'Não foi possível validar os aliases da query.')
	}
}
