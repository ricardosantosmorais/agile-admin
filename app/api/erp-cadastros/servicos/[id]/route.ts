import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { resolveServicoLabels } from '@/app/api/erp-cadastros/servicos/_servicos-shared'
import { normalizeServicoCadastroRecord } from '@/src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos'
import { asArray, asRecord } from '@/src/lib/api-payload'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params

	const result = await agileV2Fetch('servicos', {
		method: 'GET',
		query: { perpage: 1, id, join: 'templates:nome,id' },
	})
	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar o serviço.') }, { status: result.status || 400 })
	}

	const row = asArray<Record<string, unknown>>(asRecord(result.payload).data)[0]
	if (!row) {
		return NextResponse.json({ message: 'Serviço não encontrado.' }, { status: 404 })
	}

	return NextResponse.json(normalizeServicoCadastroRecord(await resolveServicoLabels(row)))
}

