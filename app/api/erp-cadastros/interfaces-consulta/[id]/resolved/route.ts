import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { jsonError, resolveConfiguration, toStringValue } from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const idEmpresa = toStringValue(request.nextUrl.searchParams.get('id_empresa_alvo') || request.nextUrl.searchParams.get('empresa_id'))
	if (!idEmpresa) return NextResponse.json({ message: 'Interface e empresa são obrigatórias para o preview.' }, { status: 400 })
	try {
		return NextResponse.json(await resolveConfiguration(id, idEmpresa))
	} catch (error) {
		return jsonError(error, 'Falha ao carregar a configuração resolvida.')
	}
}
