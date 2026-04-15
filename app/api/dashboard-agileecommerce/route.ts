import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { mapDashboardRootAgileecommercePayload } from '@/src/features/dashboard-root-agileecommerce/services/dashboard-root-agileecommerce-mapper';
import { serverApiFetch } from '@/src/services/http/server-api';

function extractMessage(payload: unknown) {
	if (typeof payload === 'string' && payload) {
		return payload;
	}

	if (typeof payload === 'object' && payload !== null && 'message' in payload) {
		const message = (payload as { message?: unknown }).message;
		return typeof message === 'string' && message ? message : '';
	}

	if (typeof payload === 'object' && payload !== null && 'error' in payload) {
		const error = (payload as { error?: { message?: unknown } }).error;
		return typeof error?.message === 'string' ? error.message : '';
	}

	return '';
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession();

	if (!session?.token || !session.currentTenantId) {
		return NextResponse.json({ message: 'Sessão não encontrada.' }, { status: 401 });
	}

	if (session.currentTenantId !== 'agileecommerce') {
		return NextResponse.json({ message: 'Acesso permitido apenas no tenant root.' }, { status: 403 });
	}

	const body = (await request.json()) as {
		startDate?: string;
		endDate?: string;
		blocks?: string[];
		forceRefresh?: boolean;
		previousStart?: string | null;
		previousEnd?: string | null;
	};

	const result = await serverApiFetch('relatorios/dashboard-agileecommerce', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: {
			data_inicio: body.startDate ?? '',
			data_fim: body.endDate ?? '',
			sem_cache: body.forceRefresh ? '1' : '0',
			cache: body.forceRefresh ? '0' : '1',
			...(body.previousStart ? { previousStart: body.previousStart } : {}),
			...(body.previousEnd ? { previousEnd: body.previousEnd } : {}),
			...(body.blocks?.length ? { blocos: body.blocks.join(',') } : {}),
		},
	});

	if (!result.ok) {
		return NextResponse.json({ message: extractMessage(result.payload) || 'Não foi possível carregar o dashboard da agileecommerce.' }, { status: result.status || 400 });
	}

	return NextResponse.json(mapDashboardRootAgileecommercePayload(result.payload));
}
