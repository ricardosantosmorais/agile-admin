import { NextRequest } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionGet, handleCrudCollectionPost } from '@/src/services/http/crud-route'

const config = { resource: 'funcionalidades' as const, listEmbed: 'funcionalidade_pai' }

export function GET(request: NextRequest) {
	const url = request.nextUrl.clone()
	if ((url.searchParams.get('orderBy') || 'nivel') === 'nivel' && (url.searchParams.get('sort') || 'asc') === 'asc') {
		url.searchParams.set('orderBy', 'nivel,posicao')
		url.searchParams.set('sort', 'asc,desc')
	}
	const parentFilter = url.searchParams.get('id_funcionalidade_pai')
	if (parentFilter === '__root__') {
		url.searchParams.delete('id_funcionalidade_pai')
		url.searchParams.set('funcionalidade_pai:id::null', '1')
	} else if (parentFilter) {
		url.searchParams.delete('id_funcionalidade_pai')
		url.searchParams.set('funcionalidade_pai:id', parentFilter)
	}
	return handleCrudCollectionGet(new NextRequest(url.toString(), { headers: request.headers }), config)
}

export function POST(request: NextRequest) {
	return handleCrudCollectionPost(request, config)
}

export function DELETE(request: NextRequest) {
	return handleCrudCollectionDelete(request, config)
}
