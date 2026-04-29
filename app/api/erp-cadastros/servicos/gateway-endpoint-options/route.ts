import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { loadServicoGatewayEndpointOptions } from '@/app/api/erp-cadastros/servicos/_servicos-shared'

export async function GET(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const params = request.nextUrl.searchParams
	const options = await loadServicoGatewayEndpointOptions(
		(params.get('id_template') || '').trim(),
		(params.get('q') || '').trim(),
		params.get('page') || '1',
		params.get('perPage') || '20',
	)
	return NextResponse.json(options)
}

