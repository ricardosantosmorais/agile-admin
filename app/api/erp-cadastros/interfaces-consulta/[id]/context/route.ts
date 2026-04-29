import { NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { buildOverrideLinks, buildTemplateLinks, jsonError, loadTabela } from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	try {
		const [tabela, templates, overrides] = await Promise.all([loadTabela(id), buildTemplateLinks(id), buildOverrideLinks(id)])
		return NextResponse.json({ tabela, metrics: { templates: templates.length, overrides: overrides.length } })
	} catch (error) {
		return jsonError(error, 'Não foi possível carregar a interface de consulta.')
	}
}
