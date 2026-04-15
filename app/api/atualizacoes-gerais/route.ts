import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { asArray, asBoolean, asRecord, asString } from '@/src/lib/api-payload';
import { sanitizeRichHtml } from '@/src/lib/html-sanitizer';
import { serverApiFetch } from '@/src/services/http/server-api';

function getPayloadMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null) {
		if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
			return payload.error.message;
		}

		if ('message' in payload && typeof payload.message === 'string') {
			return payload.message;
		}
	}

	return fallback;
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const params = new URLSearchParams({
		page: '1',
		perpage: request.nextUrl.searchParams.get('limit') || '200',
		ativo: '1',
		order: 'data,created_at',
		sort: 'desc,desc',
	});

	const plataforma = request.nextUrl.searchParams.get('plataforma')?.trim() ?? '';
	const tipo = request.nextUrl.searchParams.get('tipo')?.trim() ?? '';
	const busca = request.nextUrl.searchParams.get('busca')?.trim() ?? '';
	const mesInicio = request.nextUrl.searchParams.get('mesInicio')?.trim() ?? '';
	const mesFim = request.nextUrl.searchParams.get('mesFim')?.trim() ?? '';

	if (plataforma) {
		params.set('plataforma', plataforma);
	}
	if (tipo) {
		params.set('tipo', tipo);
	}
	if (busca) {
		params.set('titulo::lk', busca);
	}
	if (/^\d{4}-(0[1-9]|1[0-2])$/.test(mesInicio)) {
		params.set('data::ge', `${mesInicio}-01 00:00:00`);
	}
	if (/^\d{4}-(0[1-9]|1[0-2])$/.test(mesFim)) {
		const [year, month] = mesFim.split('-').map(Number);
		const lastDay = new Date(year, month, 0).getDate();
		params.set('data::le', `${mesFim}-${String(lastDay).padStart(2, '0')} 23:59:59`);
	}

	const result = await serverApiFetch(`changelog?${params.toString()}`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	});

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar as atualizações gerais.') }, { status: result.status || 400 });
	}

	const rows = asArray<Record<string, unknown>>(asRecord(result.payload).data).map((row) => ({
		id: asString(row.id),
		titulo: asString(row.titulo),
		data: asString(row.data),
		plataforma: asString(row.plataforma),
		tipo: asString(row.tipo),
		apenasMaster: asBoolean(row.apenas_master),
		conteudo: sanitizeRichHtml(row.conteudo),
	}));

	return NextResponse.json({
		data: rows,
		meta: {
			total: rows.length,
		},
	});
}
