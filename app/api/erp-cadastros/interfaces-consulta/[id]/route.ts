import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { normalizeInterfaceConsultaRecord } from '@/src/features/integracao-com-erp-interfaces-consulta/services/integracao-com-erp-interfaces-consulta'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const result = await agileV2Fetch('tabelas', { method: 'GET', query: { perpage: 1, id } })
	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar a interface de consulta.') }, { status: result.status || 400 })
	}
	const item = asArray<Record<string, unknown>>(asRecord(result.payload).data).at(0)
	if (!item) return NextResponse.json({ message: 'Interface de consulta não encontrada.' }, { status: 404 })
	return NextResponse.json(normalizeInterfaceConsultaRecord(item))
}
