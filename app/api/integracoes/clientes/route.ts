import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { buildCompanyParametersPath, buildLookupPath } from '@/src/lib/company-parameters-query';
import { serverApiFetch } from '@/src/services/http/server-api';

const INTEGRACAO_CLIENTES_PARAMETER_KEYS = ['cnpja_token', 'portal_token', 'portal_pedidos', 'portal_orcamentos', 'portal_titulos', 'portal_notas_fiscais'] as const;

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
		serverApiFetch(buildCompanyParametersPath(session.currentTenantId, [...INTEGRACAO_CLIENTES_PARAMETER_KEYS]), {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		}),
		serverApiFetch(
			buildLookupPath('filiais', session.currentTenantId, {
				order: 'nome_fantasia',
				includeActiveOnly: false,
				fields: ['id', 'nome_fantasia'],
				perPage: 1000,
			}),
			{
				method: 'GET',
				token: session.token,
				tenantId: session.currentTenantId,
			},
		),
	]);

	if (!parametersResult.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(parametersResult.payload, 'Não foi possível carregar os parâmetros de integrações de clientes.') },
			{ status: parametersResult.status || 400 },
		);
	}

	if (!branchesResult.ok) {
		return NextResponse.json({ message: getErrorMessage(branchesResult.payload, 'Não foi possível carregar as filiais.') }, { status: branchesResult.status || 400 });
	}

	return NextResponse.json({
		parameters: parametersResult.payload,
		branches: branchesResult.payload,
	});
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

	const result = await serverApiFetch('empresas/parametros', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: parameters,
	});

	if (!result.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(result.payload, 'Não foi possível salvar as configurações de integrações de clientes.') },
			{ status: result.status || 400 },
		);
	}

	return NextResponse.json(result.payload);
}
