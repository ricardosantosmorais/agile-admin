import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { executeQueryEditor, jsonError, resolveConfiguration, runPreview, toStringValue } from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'
import { asRecord } from '@/src/lib/api-payload'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const body = await request.json() as Record<string, unknown>
	const idEmpresa = toStringValue(body.id_empresa_alvo || body.empresa_id)
	const idTemplate = toStringValue(body.id_template)
	if (!idEmpresa || !idTemplate) return NextResponse.json({ message: 'Selecione uma empresa válida para executar o preview.' }, { status: 400 })
	try {
		const resolved = await resolveConfiguration(id, idEmpresa)
		const resolvedTemplateId = toStringValue((resolved.template as Record<string, unknown>).id)
		if (resolvedTemplateId && resolvedTemplateId !== idTemplate) {
			return NextResponse.json({ message: 'O template resolvido da empresa não corresponde ao template informado no preview.' }, { status: 400 })
		}
		if (toStringValue((resolved.resolucao as Record<string, unknown>).tipo_fonte) === 'query') {
			const query = asRecord((resolved.resolucao as Record<string, unknown>).query)
			const sql = toStringValue(query.query)
			if (!sql) return NextResponse.json({ message: 'A query resolvida não possui SQL para executar o preview.' }, { status: 400 })
			const executed = await executeQueryEditor(
				idEmpresa,
				toStringValue(query.fonte_dados || query.fonteDados || 'erp'),
				sql,
			)
			return NextResponse.json({
				meta: {
					source: 'query',
					query_id: toStringValue(query.id || query.id_query),
					pagination: executed.pagination,
				},
				data: executed.rows,
				rows: executed.rows,
				debug: {
					query,
					raw: executed.raw,
				},
			})
		}
		return NextResponse.json(await runPreview(resolved, toStringValue(body.query_string)))
	} catch (error) {
		return jsonError(error, 'Falha ao executar o preview.')
	}
}
