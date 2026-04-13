import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { IntegracaoFinanceiroParameterPayload } from '@/src/features/integracoes-financeiro/types/integracao-financeiro.types';
import { buildCompanyParametersPath, buildLookupPath } from '@/src/lib/company-parameters-query';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { serverApiFetch } from '@/src/services/http/server-api';

/**
 * GET /api/integracoes/financeiro
 *
 * Carrega:
 * 1. Todos os parâmetros de integração financeira
 * 2. Lista de filiais
 * 3. Lista de gateways de pagamento
 */
export async function GET() {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	// Listar todos os parâmetros relevantes para o módulo
	const parameterKeys = [
		'versao',
		'id_gateway_pagamento_boleto_antecipado',
		'id_gateway_pagamento_cartao_credito',
		'id_gateway_pagamento_pix',
		'clearsale_ambiente',
		'clearsale_login',
		'clearsale_senha',
		'clearsale_fingerprint',
		'clearsale_b2b_b2c',
		'clearsale_custom_sla',
		'clearsale_envia_pix',
		'konduto_ambiente',
		'konduto_chave_publica',
		'konduto_chave_privada',
	];

	// Carrega em paralelo
	const [parametersResult, branchesResult, gatewaysResult] = await Promise.all([
		serverApiFetch(buildCompanyParametersPath(session.currentTenantId, parameterKeys), {
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
		serverApiFetch(
			buildLookupPath('gateways_pagamento', session.currentTenantId, {
				order: 'nome',
				perPage: 1000,
				fields: ['id', 'nome', 'tipo', 'created_at'],
			}),
			{
				method: 'GET',
				token: session.token,
				tenantId: session.currentTenantId,
			},
		),
	]);

	if (!parametersResult.ok || !branchesResult.ok || !gatewaysResult.ok) {
		return NextResponse.json(
			{
				message: 'Erro ao carregar configurações de integração financeira.',
			},
			{ status: 400 },
		);
	}

	return NextResponse.json({
		parameters: parametersResult.payload,
		branches: branchesResult.payload,
		gateways: gatewaysResult.payload,
	});
}

/**
 * POST /api/integracoes/financeiro
 *
 * Salva os parâmetros de integração financeira
 */
export async function POST(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: 'Payload inválido.' }, { status: 400 });
	}

	// Valida e normaliza o array de parâmetros
	const bodyRecord = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
	const parameters = Array.isArray(bodyRecord.parameters)
		? (bodyRecord.parameters as unknown[])
				.filter((param) => param && typeof param === 'object' && typeof (param as Record<string, unknown>).chave === 'string')
				.map((param) => {
					const p = param as Record<string, unknown>;
					return {
						id_filial: p.id_filial ?? null,
						chave: String(p.chave ?? '').trim(),
						parametros: String(p.parametros ?? ''),
						integracao: Number(p.integracao ?? 0),
						criptografado: Number(p.criptografado ?? 0),
					} as IntegracaoFinanceiroParameterPayload;
				})
		: [];

	if (parameters.length === 0) {
		return NextResponse.json({ message: 'Nenhum parâmetro para salvar.' }, { status: 400 });
	}

	const result = await serverApiFetch('empresas/parametros', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: parameters,
	});

	if (!result.ok) {
		return NextResponse.json(
			{
				message: result.payload?.message || 'Erro ao salvar configurações de integração financeira.',
			},
			{ status: result.status || 400 },
		);
	}

	return NextResponse.json(result.payload);
}
