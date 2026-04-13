import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import {
	INTEGRACAO_COM_ERP_DATABASE_PARAMETER_KEYS,
	INTEGRACAO_COM_ERP_INSTALLER_DOWNLOAD_URL,
	INTEGRACAO_COM_ERP_SCHEMA_MODULES,
	isIntegracaoComErpFormModule,
	isIntegracaoComErpInstallationModule,
	isIntegracaoComErpSchemaModule,
} from '@/src/lib/integracao-com-erp-config';
import { buildCompanyParametersPath } from '@/src/lib/company-parameters-query';
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

	return {
		companyResult,
		company: asRecord(asArray(asRecord(companyResult.payload).data)[0]),
	};
}

async function loadSchemaPayload(moduleId: keyof typeof INTEGRACAO_COM_ERP_SCHEMA_MODULES, company: ApiRecord) {
	const schemaConfig = INTEGRACAO_COM_ERP_SCHEMA_MODULES[moduleId];
	const query: Record<string, string | number | boolean> = {
		perpage: 999,
		field: 'ordem',
		id_parametro_grupo: schemaConfig.parameterGroupId,
		editavel: 'true',
		id_empresa: toStringValue(company.codigo || company.id),
	};

	const companyTemplateId = toStringValue(company.id_template);
	if (schemaConfig.exactTemplateForOmie && toStringValue(company.erp).toLowerCase() === 'omie') {
		if (companyTemplateId) {
			query.id_template = companyTemplateId;
		}
	} else if (companyTemplateId) {
		query['id_template:or_null'] = companyTemplateId;
	}

	return externalAdminApiFetch('painelb2b', 'configuracoes_empresa', {
		method: 'GET',
		query,
	});
}

function getModuleMessages(moduleId: string) {
	switch (moduleId) {
		case 'parametros':
			return {
				loadSchema: 'Não foi possível carregar o schema de parâmetros do ERP.',
				loadParameters: 'Não foi possível carregar os parâmetros do ERP.',
				save: 'Não foi possível salvar os parâmetros do ERP.',
			};
		case 'imagens':
			return {
				loadSchema: 'Não foi possível carregar o schema de imagens do ERP.',
				loadParameters: 'Não foi possível carregar os parâmetros de imagens do ERP.',
				save: 'Não foi possível salvar os parâmetros de imagens do ERP.',
			};
		case 'api':
			return {
				loadSchema: 'Não foi possível carregar o schema de API do ERP.',
				loadParameters: 'Não foi possível carregar as configurações de API do ERP.',
				save: 'Não foi possível salvar as configurações de API do ERP.',
			};
		case 'banco-de-dados':
			return {
				loadSchema: '',
				loadParameters: 'Não foi possível carregar a configuração de banco de dados do ERP.',
				save: 'Não foi possível salvar a configuração de banco de dados do ERP.',
			};
		default:
			return {
				loadSchema: 'Não foi possível carregar o schema do ERP.',
				loadParameters: 'Não foi possível carregar os parâmetros do ERP.',
				save: 'Não foi possível salvar os parâmetros do ERP.',
			};
	}
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
	const { module: moduleId } = await params;
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const companyContext = await loadCompanyContext(session.token, session.currentTenantId);
	if ('error' in companyContext) {
		return companyContext.error;
	}

	if (isIntegracaoComErpInstallationModule(moduleId)) {
		return NextResponse.json({
			token: toStringValue(companyContext.company.token_ativacao || companyContext.company.tokenAtivacao),
			downloadUrl: INTEGRACAO_COM_ERP_INSTALLER_DOWNLOAD_URL,
		});
	}

	if (!isIntegracaoComErpFormModule(moduleId)) {
		return NextResponse.json({ message: 'Módulo ERP não encontrado.' }, { status: 404 });
	}

	const messages = getModuleMessages(moduleId);
	let parameterKeys: string[] = [];
	let schemaPayload: unknown = null;

	if (isIntegracaoComErpSchemaModule(moduleId)) {
		const schemaResult = await loadSchemaPayload(moduleId, companyContext.company);
		if (!schemaResult.ok) {
			return NextResponse.json({ message: getErrorMessage(schemaResult.payload, messages.loadSchema) }, { status: schemaResult.status || 400 });
		}

		schemaPayload = schemaResult.payload;
		parameterKeys = asArray(asRecord(schemaResult.payload).data)
			.map((item) => toStringValue(asRecord(item).chave))
			.filter(Boolean);
	} else {
		parameterKeys = [...INTEGRACAO_COM_ERP_DATABASE_PARAMETER_KEYS];
	}

	const parametersResult = await serverApiFetch(buildCompanyParametersPath(session.currentTenantId, parameterKeys), {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	});

	if (!parametersResult.ok) {
		return NextResponse.json({ message: getErrorMessage(parametersResult.payload, messages.loadParameters) }, { status: parametersResult.status || 400 });
	}

	return NextResponse.json({
		schema: schemaPayload,
		parameters: parametersResult.payload,
		company: companyContext.companyResult.payload,
	});
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
	const { module: moduleId } = await params;
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	if (!isIntegracaoComErpFormModule(moduleId)) {
		if (isIntegracaoComErpInstallationModule(moduleId)) {
			return NextResponse.json({ message: 'A instalação do integrador não aceita gravação.' }, { status: 405 });
		}

		return NextResponse.json({ message: 'Módulo ERP não encontrado.' }, { status: 404 });
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
					parametros: String(parameter.parametros ?? '').trim(),
					integracao: Number(parameter.integracao ?? 1),
					criptografado: Number(parameter.criptografado ?? 0),
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
		return NextResponse.json({ message: getErrorMessage(result.payload, getModuleMessages(moduleId).save) }, { status: result.status || 400 });
	}

	return NextResponse.json(result.payload);
}
