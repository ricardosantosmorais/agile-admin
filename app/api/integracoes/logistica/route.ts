import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { integracaoLogisticaParameterKeys } from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';
import { buildCompanyParametersPath } from '@/src/lib/company-parameters-query';
import { serverApiFetch } from '@/src/services/http/server-api';

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

	const [parametersResult, branchesResult] = await Promise.all([
		serverApiFetch(buildCompanyParametersPath(session.currentTenantId, [...integracaoLogisticaParameterKeys]), {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		}),
		serverApiFetch(`filiais?id_empresa=${encodeURIComponent(session.currentTenantId)}&perpage=1000&order=nome_fantasia`, {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		}),
	]);

	if (!parametersResult.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(parametersResult.payload, 'Não foi possível carregar os parâmetros de logística.') },
			{ status: parametersResult.status || 400 },
		);
	}

	if (!branchesResult.ok) {
		return NextResponse.json({ message: getErrorMessage(branchesResult.payload, 'Não foi possível carregar as filiais.') }, { status: branchesResult.status || 400 });
	}

	return NextResponse.json({ parameters: parametersResult.payload, branches: branchesResult.payload });
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const body = (await request.json()) as {
		parameters?: Array<{
			id_filial?: string | null;
			chave?: string;
			parametros?: string;
			integracao?: number;
			criptografado?: number;
		}>;
	};

	const parameters = Array.isArray(body.parameters)
		? body.parameters
				.filter((parameter) => typeof parameter?.chave === 'string' && parameter.chave.trim().length > 0)
				.map((parameter) => ({
					id_filial: parameter.id_filial ?? null,
					chave: String(parameter.chave).trim(),
					parametros: String(parameter.parametros ?? ''),
					integracao: Number(parameter.integracao ?? 0),
					criptografado: Number(parameter.criptografado ?? 0),
				}))
		: [];

	const changedFindCep = parameters.some(
		(parameter) => (parameter.chave === 'findcep_endpoint' || parameter.chave === 'findcep_referer') && parameter.parametros.trim().length > 0,
	);

	if (changedFindCep) {
		const branchesWithoutCoordinates = await serverApiFetch('filiais?longitude::nu&latitude::nu', {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		});

		if (branchesWithoutCoordinates.ok) {
			const payload = branchesWithoutCoordinates.payload;
			const data = typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data) ? payload.data : [];
			if (data.length > 0) {
				return NextResponse.json(
					{
						message:
							'Não é possível alterar os parâmetros do FindCEP enquanto houver filiais com coordenadas de latitude e longitude vazias. Atualize as coordenadas das filiais antes de alterar estes parâmetros.',
					},
					{ status: 422 },
				);
			}
		}
	}

	const result = await serverApiFetch('empresas/parametros', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: parameters,
	});

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar as configurações de logística.') }, { status: result.status || 400 });
	}

	return NextResponse.json(result.payload);
}
