import { NextRequest, NextResponse } from 'next/server';
import { mapDashboardPayloadToSnapshot } from '@/src/features/dashboard/services/dashboard-mappers';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { serverApiFetch } from '@/src/services/http/server-api';

function extractMessage(payload: unknown) {
	if (typeof payload === 'string' && payload) {
		return payload;
	}

	if (typeof payload === 'object' && payload !== null && 'message' in payload) {
		const message = payload.message;
		return typeof message === 'string' && message ? message : '';
	}

	return '';
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession();

	if (!session?.token || !session.currentTenantId) {
		return NextResponse.json({ message: 'Sessão não encontrada.' }, { status: 401 });
	}

	const body = (await request.json()) as {
		startDate?: string;
		endDate?: string;
		rangeLabel?: string;
		tenantId?: string;
		blocks?: string[];
		forceRefresh?: boolean;
		previousStart?: string | null;
		previousEnd?: string | null;
	};

	const tenantId = body.tenantId || session.currentTenantId;
	const forceRefresh = body.forceRefresh === true;
	const result = await serverApiFetch('relatorios/dashboard-v2-comparativo', {
		method: 'POST',
		token: session.token,
		tenantId,
		body: {
			data_inicio: body.startDate ?? '',
			data_fim: body.endDate ?? '',
			sem_cache: forceRefresh ? '1' : '0',
			cache: forceRefresh ? '0' : '1',
			...(body.previousStart ? { previousStart: body.previousStart } : {}),
			...(body.previousEnd ? { previousEnd: body.previousEnd } : {}),
			...(body.blocks?.length ? { blocos: body.blocks.join(',') } : {}),
		},
	});

	if (!result.ok) {
		return NextResponse.json({ message: extractMessage(result.payload) || 'Não foi possível carregar o dashboard.' }, { status: result.status || 400 });
	}

	const snapshot = mapDashboardPayloadToSnapshot(result.payload, body.rangeLabel ?? 'Período selecionado');
	const payloadRecord = typeof result.payload === 'object' && result.payload !== null ? (result.payload as Record<string, unknown>) : null;
	const payloadMeta = payloadRecord && typeof payloadRecord.meta === 'object' && payloadRecord.meta !== null ? (payloadRecord.meta as Record<string, unknown>) : null;
	const cacheIgnored = payloadMeta && 'cache_ignorado' in payloadMeta ? String(payloadMeta.cache_ignorado) : 'unknown';
	const cacheHit = payloadMeta && 'cache_hit' in payloadMeta ? String(payloadMeta.cache_hit) : 'unknown';

	return NextResponse.json(snapshot, {
		headers: {
			'X-Dashboard-Force-Refresh': forceRefresh ? '1' : '0',
			'X-Dashboard-Cache-Ignored': cacheIgnored,
			'X-Dashboard-Cache-Hit': cacheHit,
		},
	});
}
