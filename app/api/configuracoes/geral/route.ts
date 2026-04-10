import { NextRequest, NextResponse } from 'next/server';
import { buildCompanyParametersPath } from '@/src/lib/company-parameters-query';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api';
import { serverApiFetch } from '@/src/services/http/server-api';

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
	return typeof value === 'object' && value !== null ? (value as ApiRecord) : {};
}

function asArray(value: unknown) {
	return Array.isArray(value) ? value : [];
}

function toStringValue(value: unknown) {
	return String(value ?? '').trim();
}

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

async function loadCompanyContext(token: string, tenantId: string) {
	const companyResult = await serverApiFetch(`empresas?id=${encodeURIComponent(tenantId)}&perpage=1`, {
		method: 'GET',
		token,
		tenantId,
	});

	if (!companyResult.ok) {
		return {
			error: NextResponse.json({ message: getErrorMessage(companyResult.payload, 'Não foi possível carregar os dados da empresa.') }, { status: companyResult.status || 400 }),
		};
	}

	const company = asRecord(asArray(asRecord(companyResult.payload).data)[0]);

	return {
		companyResult,
		company,
	};
}

export async function GET() {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const companyContext = await loadCompanyContext(session.token, session.currentTenantId);
	if ('error' in companyContext) {
		return companyContext.error;
	}

	const company = companyContext.company;
	const companyCode = toStringValue(company.codigo || company.id || session.currentTenantId);
	const companyTemplateId = toStringValue(company.id_template);

	const schemaResult = await externalAdminApiFetch('painelb2b', 'configuracoes_empresa', {
		method: 'GET',
		query: {
			perpage: 999,
			id_parametro_grupo: 3,
			field: 'ordem',
			editavel: 'true',
			'id_template:or_null': companyTemplateId,
			id_empresa: companyCode,
		},
	});

	if (!schemaResult.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(schemaResult.payload, 'Não foi possível carregar o schema de configurações gerais.') },
			{ status: schemaResult.status || 400 },
		);
	}

	const parameterKeys = asArray(asRecord(schemaResult.payload).data)
		.map((item) => toStringValue(asRecord(item).chave))
		.filter(Boolean);

	const parametersResult = await serverApiFetch(buildCompanyParametersPath(session.currentTenantId, parameterKeys), {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	});

	if (!parametersResult.ok) {
		return NextResponse.json({ message: getErrorMessage(parametersResult.payload, 'Não foi possível carregar os parâmetros gerais.') }, { status: parametersResult.status || 400 });
	}

	return NextResponse.json({
		parameters: parametersResult.payload,
		schema: schemaResult.payload,
		company: companyContext.companyResult.payload,
	});
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const body = (await request.json()) as {
		parameters?: Array<{ id_filial?: string | null; chave?: string; parametros?: string }>;
		company?: { id?: string; tipo?: string; url?: string; s3_bucket?: string } | null;
	};

	const companyPayload = asRecord(body.company);
	const companyId = toStringValue(companyPayload.id);

	if (companyId) {
		const empresaBody: Record<string, string> = { id: companyId };
		const tipo = toStringValue(companyPayload.tipo);
		const url = toStringValue(companyPayload.url);
		const s3Bucket = toStringValue(companyPayload.s3_bucket);

		if (tipo || 'tipo' in companyPayload) {
			empresaBody.tipo = tipo;
		}
		if (url || 'url' in companyPayload) {
			empresaBody.url = url;
		}
		if (s3Bucket || 's3_bucket' in companyPayload) {
			empresaBody.s3_bucket = s3Bucket;
		}

		const companyResult = await serverApiFetch('empresas', {
			method: 'POST',
			token: session.token,
			tenantId: session.currentTenantId,
			body: empresaBody,
		});

		if (!companyResult.ok) {
			return NextResponse.json({ message: getErrorMessage(companyResult.payload, 'Não foi possível salvar os dados da empresa.') }, { status: companyResult.status || 400 });
		}
	}

	const parameters = Array.isArray(body.parameters)
		? body.parameters
				.filter((parameter) => typeof parameter?.chave === 'string' && parameter.chave.trim().length > 0)
				.map((parameter) => ({
					id_filial: parameter.id_filial ?? null,
					chave: String(parameter.chave).trim(),
					parametros: String(parameter.parametros ?? '').trim(),
				}))
		: [];

	if (!parameters.length) {
		return NextResponse.json({ success: true, skipped: true });
	}

	const result = await serverApiFetch('empresas/parametros', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: parameters,
	});

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar os parâmetros gerais.') }, { status: result.status || 400 });
	}

	return NextResponse.json(result.payload);
}
