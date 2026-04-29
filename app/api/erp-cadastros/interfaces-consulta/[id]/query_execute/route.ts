import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import {
	executeQueryEditor,
	jsonError,
	toStringValue,
} from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'
import { asRecord } from '@/src/lib/api-payload'

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const body = asRecord(await request.json())
	try {
		return NextResponse.json(await executeQueryEditor(
			toStringValue(body.id_empresa_execucao),
			toStringValue(body.fonte_dados || 'erp'),
			toStringValue(body.sql),
		))
	} catch (error) {
		return jsonError(error, 'Não foi possível executar a query.')
	}
}
