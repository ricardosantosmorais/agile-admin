/**
 * Mappers para transformação de dados Integrações > Financeiro
 *
 * Duas direções:
 * 1. normalizeIntegracaoFinanceiroRecord: API → Tipos internos (GET)
 * 2. buildIntegracaoFinanceiroSavePayload: Tipos internos → API (POST)
 */

import {
	type ClearSaleConfig,
	type ClearSaleFieldMeta,
	type FinanceiroFieldMeta,
	type FinanceiroGatewayBranchRow,
	type GatewayPagamento,
	type IntegracaoFinanceiroParameterPayload,
	type IntegracaoFinanceiroRecord,
	type KondutoConfig,
	type KondutoFieldMeta,
	FINANCEIRO_PARAMETER_KEYS,
} from '../types/integracao-financeiro.types';
import { asArray, asRecord, asString } from '@/src/lib/api-payload';

function asGatewayTipo(value: unknown): GatewayPagamento['tipo'] {
	const normalized = asString(value).trim();
	return normalized === 'boleto_antecipado' || normalized === 'cartao_credito' || normalized === 'pix' ? normalized : 'pix';
}

function asClearSaleAmbiente(value: unknown): ClearSaleConfig['ambiente'] {
	const normalized = asString(value).trim();
	return normalized === 'producao' || normalized === 'teste' ? normalized : '';
}

function asClearSaleModo(value: unknown): ClearSaleConfig['modoBb2B2c'] {
	const normalized = asString(value).trim();
	return normalized === 'B2B' || normalized === 'B2C' ? normalized : '';
}

function asClearSaleEnviaPix(value: unknown): ClearSaleConfig['enviaPix'] {
	const normalized = asString(value).trim();
	return normalized === 'S' || normalized === 'N' ? normalized : '';
}

function asKondutoAmbiente(value: unknown): KondutoConfig['ambiente'] {
	const normalized = asString(value).trim();
	return normalized === 'producao' || normalized === 'teste' ? normalized : '';
}

/**
 * Helpers para manipulação segura de tipos
 */

function resolveTimestamp(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string, branchId?: string): Record<string, unknown> | null {
	return (
		parameters.find((item) => {
			const itemKey = asString(item.chave).trim();
			const itemBranch = asString(item.id_filial ?? '').trim();
			if (itemKey !== key) return false;
			if (!branchId) return itemBranch.length === 0;
			return itemBranch === branchId;
		}) ?? null
	);
}

function extractFieldMeta(record: Record<string, unknown> | null): FinanceiroFieldMeta {
	if (!record) return { updatedAt: '', updatedBy: '' };
	const user = asRecord(record.usuario);
	return {
		updatedAt: asString(record.created_at ?? '').trim(),
		updatedBy: asString(user.nome ?? '').trim(),
	};
}

/**
 * Normaliza o payload do GET em tipos internos do módulo
 */
export function normalizeIntegracaoFinanceiroRecord(payload: unknown): IntegracaoFinanceiroRecord {
	const root = asRecord(payload);
	const parametersPayload = asRecord(root.parameters ?? {});
	const branchesPayload = asRecord(root.branches ?? {});
	const gatewaysPayload = asRecord(root.gateways ?? {});

	const parameters = asArray(parametersPayload.data ?? []).map((item) => asRecord(item));
	const branches = asArray(branchesPayload.data ?? []).map((item) => asRecord(item));
	const gateways = asArray(gatewaysPayload.data ?? []).map((item) => asRecord(item));

	// Mapear gateways
	const gatewaysList: GatewayPagamento[] = gateways.map((gw) => ({
		id: asString(gw.id).trim(),
		nome: asString(gw.nome).trim(),
		tipo: asGatewayTipo(gw.tipo),
		createdAt: asString(gw.created_at).trim(),
	}));

	// Mapear ClearSale global
	const clearSaleAmbiente = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.CLEARSALE_AMBIENTE);
	const clearSaleLogin = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.CLEARSALE_LOGIN);
	const clearSaleSenha = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.CLEARSALE_SENHA);
	const clearSaleFingerprint = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.CLEARSALE_FINGERPRINT);
	const clearSaleB2bB2c = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.CLEARSALE_B2B_B2C);
	const clearSaleCustomSla = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.CLEARSALE_CUSTOM_SLA);
	const clearSaleEnviaPix = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.CLEARSALE_ENVIA_PIX);

	const clearSale: ClearSaleConfig = {
		ambiente: asClearSaleAmbiente(clearSaleAmbiente?.parametros),
		login: asString(clearSaleLogin?.parametros ?? '').trim(),
		senha: asString(clearSaleSenha?.parametros ?? '').trim(),
		fingerprint: asString(clearSaleFingerprint?.parametros ?? '').trim(),
		modoBb2B2c: asClearSaleModo(clearSaleB2bB2c?.parametros),
		customSla: asString(clearSaleCustomSla?.parametros ?? '').trim(),
		enviaPix: asClearSaleEnviaPix(clearSaleEnviaPix?.parametros),
	};

	const clearSaleMetadata: ClearSaleFieldMeta = {
		ambiente: extractFieldMeta(clearSaleAmbiente),
		login: extractFieldMeta(clearSaleLogin),
		senha: extractFieldMeta(clearSaleSenha),
		fingerprint: extractFieldMeta(clearSaleFingerprint),
		modoBb2B2c: extractFieldMeta(clearSaleB2bB2c),
		customSla: extractFieldMeta(clearSaleCustomSla),
		enviaPix: extractFieldMeta(clearSaleEnviaPix),
	};

	// Mapear Konduto global
	const kondutoAmbiente = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.KONDUTO_AMBIENTE);
	const kondutoChavePublica = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.KONDUTO_CHAVE_PUBLICA);
	const kondutoChavePrivada = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.KONDUTO_CHAVE_PRIVADA);

	const konduto: KondutoConfig = {
		ambiente: asKondutoAmbiente(kondutoAmbiente?.parametros),
		chavePublica: asString(kondutoChavePublica?.parametros ?? '').trim(),
		chavePrivada: asString(kondutoChavePrivada?.parametros ?? '').trim(),
	};

	const kondutoMetadata: KondutoFieldMeta = {
		ambiente: extractFieldMeta(kondutoAmbiente),
		chavePublica: extractFieldMeta(kondutoChavePublica),
		chavePrivada: extractFieldMeta(kondutoChavePrivada),
	};

	// Mapear por filial
	const branchList: FinanceiroGatewayBranchRow[] = branches.map((branch) => {
		const branchId = asString(branch.id ?? '').trim();
		const branchName = asString(branch.nome_fantasia ?? '-').trim() || '-';

		const gateGatewayBoleto = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.GATEWAY_BOLETO, branchId);
		const gateGatewayCartao = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.GATEWAY_CARTAO, branchId);
		const gateGatewayPix = getParameterByKey(parameters, FINANCEIRO_PARAMETER_KEYS.GATEWAY_PIX, branchId);

		return {
			id: branchId,
			nome: branchName,
			gatewayBoleto: asString(gateGatewayBoleto?.parametros ?? '').trim(),
			gatewayCartao: asString(gateGatewayCartao?.parametros ?? '').trim(),
			gatewayPix: asString(gateGatewayPix?.parametros ?? '').trim(),
			updatedAtBoleto: extractFieldMeta(gateGatewayBoleto),
			updatedAtCartao: extractFieldMeta(gateGatewayCartao),
			updatedAtPix: extractFieldMeta(gateGatewayPix),
		};
	});

	return {
		gateways: gatewaysList,
		branches: branchList,
		clearSale,
		clearSaleMetadata,
		konduto,
		kondutoMetadata,
	};
}

/**
 * Constrói payload de salvamento a partir do estado interno do formulário
 */
export function buildIntegracaoFinanceiroSavePayload(
	branches: FinanceiroGatewayBranchRow[],
	clearSale: ClearSaleConfig,
	konduto: KondutoConfig,
	options?: { includeClearSaleSenha?: boolean; includeKondutoChavePrivada?: boolean },
): IntegracaoFinanceiroParameterPayload[] {
	const includeClearSaleSenha = options?.includeClearSaleSenha ?? false;
	const includeKondutoChavePrivada = options?.includeKondutoChavePrivada ?? false;
	const version = resolveTimestamp();

	const payload: IntegracaoFinanceiroParameterPayload[] = [
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.VERSION,
			parametros: version,
			integracao: 0,
			criptografado: 0,
		},
	];

	// ClearSale global
	payload.push(
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.CLEARSALE_AMBIENTE,
			parametros: clearSale.ambiente.trim(),
			integracao: 0,
			criptografado: 0,
		},
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.CLEARSALE_LOGIN,
			parametros: clearSale.login.trim(),
			integracao: 0,
			criptografado: 0,
		},
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.CLEARSALE_FINGERPRINT,
			parametros: clearSale.fingerprint.trim(),
			integracao: 0,
			criptografado: 0,
		},
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.CLEARSALE_B2B_B2C,
			parametros: clearSale.modoBb2B2c.trim(),
			integracao: 0,
			criptografado: 0,
		},
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.CLEARSALE_CUSTOM_SLA,
			parametros: clearSale.customSla.trim(),
			integracao: 0,
			criptografado: 0,
		},
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.CLEARSALE_ENVIA_PIX,
			parametros: clearSale.enviaPix.trim(),
			integracao: 0,
			criptografado: 0,
		},
	);

	// ClearSale senha (encriptado)
	if (includeClearSaleSenha && clearSale.senha.trim().length > 0) {
		payload.push({
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.CLEARSALE_SENHA,
			parametros: clearSale.senha.trim(),
			integracao: 0,
			criptografado: 1, // encrypted
		});
	}

	// Konduto global
	payload.push(
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.KONDUTO_AMBIENTE,
			parametros: konduto.ambiente.trim(),
			integracao: 0,
			criptografado: 0,
		},
		{
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.KONDUTO_CHAVE_PUBLICA,
			parametros: konduto.chavePublica.trim(),
			integracao: 0,
			criptografado: 0,
		},
	);

	// Konduto chave privada (encriptado)
	if (includeKondutoChavePrivada && konduto.chavePrivada.trim().length > 0) {
		payload.push({
			id_filial: null,
			chave: FINANCEIRO_PARAMETER_KEYS.KONDUTO_CHAVE_PRIVADA,
			parametros: konduto.chavePrivada.trim(),
			integracao: 0,
			criptografado: 1, // encrypted
		});
	}

	// Gateways por filial
	for (const branch of branches) {
		payload.push(
			{
				id_filial: branch.id || null,
				chave: FINANCEIRO_PARAMETER_KEYS.GATEWAY_BOLETO,
				parametros: branch.gatewayBoleto.trim(),
				integracao: 0,
				criptografado: 0,
			},
			{
				id_filial: branch.id || null,
				chave: FINANCEIRO_PARAMETER_KEYS.GATEWAY_CARTAO,
				parametros: branch.gatewayCartao.trim(),
				integracao: 0,
				criptografado: 0,
			},
			{
				id_filial: branch.id || null,
				chave: FINANCEIRO_PARAMETER_KEYS.GATEWAY_PIX,
				parametros: branch.gatewayPix.trim(),
				integracao: 0,
				criptografado: 0,
			},
		);
	}

	return payload;
}
