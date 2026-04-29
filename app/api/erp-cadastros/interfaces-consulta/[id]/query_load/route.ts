import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import {
	buildAliasValidation,
	buildQueryEditorPayload,
	jsonError,
	loadEmpresa,
	toStringValue,
} from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const searchParams = request.nextUrl.searchParams
	try {
		const idQuery = toStringValue(searchParams.get('id_query'))
		if (!idQuery) throw new Error('Query não informada.')
		let idTemplate = toStringValue(searchParams.get('id_template'))
		const idEmpresaAlvo = toStringValue(searchParams.get('id_empresa_alvo') || searchParams.get('empresa_id'))
		const idEmpresaExecucao = toStringValue(searchParams.get('id_empresa_execucao'))
		if (!idTemplate && idEmpresaAlvo) {
			const empresa = await loadEmpresa(idEmpresaAlvo)
			idTemplate = toStringValue(empresa.id_template)
		}
		const payload = await buildQueryEditorPayload(idTemplate, idEmpresaAlvo, idEmpresaExecucao, idQuery)
		const query = payload.query && typeof payload.query === 'object' ? payload.query as Record<string, unknown> : {}
		return NextResponse.json({
			...payload,
			validation: await buildAliasValidation(id, idQuery, toStringValue(query.query)),
		})
	} catch (error) {
		return jsonError(error, 'Não foi possível carregar a query selecionada.')
	}
}
