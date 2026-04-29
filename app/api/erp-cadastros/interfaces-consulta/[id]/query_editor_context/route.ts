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
		let idTemplate = toStringValue(searchParams.get('id_template'))
		const idEmpresaAlvo = toStringValue(searchParams.get('id_empresa_alvo') || searchParams.get('empresa_id'))
		const idEmpresaExecucao = toStringValue(searchParams.get('id_empresa_execucao'))
		const idQuery = toStringValue(searchParams.get('id_query'))
		if (!idTemplate && idEmpresaAlvo) {
			const empresa = await loadEmpresa(idEmpresaAlvo)
			idTemplate = toStringValue(empresa.id_template)
		}
		if (!idTemplate) throw new Error('Template não informado para o editor da query.')
		const payload = await buildQueryEditorPayload(idTemplate, idEmpresaAlvo, idEmpresaExecucao, idQuery)
		return NextResponse.json({
			...payload,
			validation: idQuery || toStringValue(payload.query && typeof payload.query === 'object' ? (payload.query as Record<string, unknown>).query : '')
				? await buildAliasValidation(id, idQuery, toStringValue(payload.query && typeof payload.query === 'object' ? (payload.query as Record<string, unknown>).query : ''))
				: null,
		})
	} catch (error) {
		return jsonError(error, 'Não foi possível carregar o contexto do editor da query.')
	}
}
