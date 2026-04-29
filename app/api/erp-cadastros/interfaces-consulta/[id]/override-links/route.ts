import { NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { buildOverrideLinks, jsonError } from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	try {
		return NextResponse.json({ data: await buildOverrideLinks(id) })
	} catch (error) {
		return jsonError(error, 'Não foi possível carregar os overrides por empresa.')
	}
}
