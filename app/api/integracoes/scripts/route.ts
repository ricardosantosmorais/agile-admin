import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { buildCompanyParametersPath } from '@/src/lib/company-parameters-query';
import { serverApiFetch } from '@/src/services/http/server-api';

const INTEGRACAO_SCRIPTS_PARAMETER_KEYS = ['head_js', 'footer_js'] as const;

function getErrorMessage(payload: unknown, fallback: string) {
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

export async function GET() {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const result = await serverApiFetch(buildCompanyParametersPath(session.currentTenantId, [...INTEGRACAO_SCRIPTS_PARAMETER_KEYS]), {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	});

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os parâmetros de scripts.') }, { status: result.status || 400 });
	}

	return NextResponse.json({ parameters: result.payload });
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const body = await request.json();
	const parameters = body?.parameters;

	if (!Array.isArray(parameters)) {
		return NextResponse.json({ message: 'Payload inválido.' }, { status: 400 });
	}

	const result = await serverApiFetch('empresas/parametros', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: parameters,
	});

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar os parâmetros de scripts.') }, { status: result.status || 400 });
	}

	return NextResponse.json({ success: true });
}
