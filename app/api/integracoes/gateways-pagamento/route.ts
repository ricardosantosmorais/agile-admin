import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { serverApiFetch } from '@/src/services/http/server-api';

type GatewayPayload = Record<string, unknown>;

function asString(value: unknown): string {
	return typeof value === 'string' ? value : String(value ?? '');
}

function normalizeBoolean(value: unknown): boolean {
	return value === true || value === 1 || value === '1' || value === 'true' || value === 'S';
}

function onlyDigits(value: unknown) {
	return asString(value).replace(/\D+/g, '');
}

function nullableString(value: unknown): string | null {
	const text = asString(value).trim();
	return text.length > 0 ? text : null;
}

export function normalizeGatewaySavePayload(input: GatewayPayload): GatewayPayload {
	const payload: GatewayPayload = { ...input };

	payload.ativo = normalizeBoolean(input.ativo);
	payload.estorna_parcial = normalizeBoolean(input.estorna_parcial);
	payload.estorna_total = normalizeBoolean(input.estorna_total);
	payload.tokenizacao_cartao = normalizeBoolean(input.tokenizacao_cartao);
	payload['3ds'] = normalizeBoolean(input['3ds']);

	payload.ambiente = nullableString(input.ambiente) ?? 'producao';

	const gatewayBoleto = nullableString(input.gateway_boleto_antecipado);
	const gatewayCartao = nullableString(input.gateway_cartao_credito);
	const gatewayPix = nullableString(input.gateway_pix);

	payload.gateway = gatewayBoleto ?? gatewayCartao ?? gatewayPix ?? nullableString(input.gateway);

	const tipo = nullableString(input.tipo);
	const gateway = nullableString(payload.gateway);

	if (tipo !== 'cartao_credito' || (gateway !== 'cielo' && gateway !== 'rede')) {
		payload.tokenizacao_cartao = false;
	}

	if (tipo !== 'cartao_credito' || gateway !== 'cielo') {
		payload['3ds'] = false;
	}

	if (!payload['3ds']) {
		payload['3ds_nome'] = null;
		payload['3ds_codigo'] = null;
		payload['3ds_mcc'] = null;
		if (tipo === 'cartao_credito' && gateway === 'cielo') {
			payload.client_id = null;
			payload.client_secret = null;
		}
	} else {
		const mcc = onlyDigits(input['3ds_mcc']).slice(0, 4);
		payload['3ds_mcc'] = mcc.length > 0 ? mcc : null;
		payload['3ds_nome'] = nullableString(input['3ds_nome']);
		payload['3ds_codigo'] = nullableString(input['3ds_codigo']);
	}

	if (gateway === 'vindi') {
		payload.status_captura = 'recebido';
	} else {
		payload.status_captura = nullableString(input.status_captura);
	}

	const minutosValidade = onlyDigits(input.minutos_validade);
	if (minutosValidade.length > 0 && minutosValidade !== '0') {
		payload.minutos_validade = minutosValidade;
	} else if (gateway === 'cielo') {
		payload.minutos_validade = 120;
	} else {
		payload.minutos_validade = null;
	}

	payload.dias_vencimento = nullableString(onlyDigits(input.dias_vencimento));
	payload.dias_limite = nullableString(onlyDigits(input.dias_limite));
	payload.dias_cancelamento = nullableString(onlyDigits(input.dias_cancelamento));
	payload.horas_cancelamento = nullableString(onlyDigits(input.horas_cancelamento));
	payload.dias_captura = nullableString(onlyDigits(input.dias_captura));

	payload.chave_pix = nullableString(input.chave_pix);
	payload.id_convenio = nullableString(input.id_convenio);
	payload.numero_convenio = nullableString(input.numero_convenio);
	payload.carteira = nullableString(input.carteira);
	payload.variacao_carteira = nullableString(input.variacao_carteira);
	payload.modalidade = nullableString(input.modalidade);
	payload.cnpj_cpf = nullableString(onlyDigits(input.cnpj));
	payload.cep = nullableString(onlyDigits(input.cep));
	payload.instrucoes = nullableString(input.instrucoes);

	payload.codigo = nullableString(input.codigo);
	payload.conta_erp = nullableString(input.conta_erp);
	payload.nome = nullableString(input.nome);

	payload.client_id = nullableString(payload.client_id);
	payload.client_secret = nullableString(payload.client_secret);
	payload.token = nullableString(payload.token);
	payload.api_key = nullableString(payload.api_key);
	payload.app_key = nullableString(payload.app_key);
	payload.merchant_id = nullableString(payload.merchant_id);
	payload.merchant_key = nullableString(payload.merchant_key);
	payload.processor_id = nullableString(payload.processor_id);
	payload.seller_id = nullableString(payload.seller_id);
	payload.chave_publica = nullableString(payload.chave_publica);
	payload.certificado = nullableString(payload.certificado);
	payload.chave_privada = nullableString(payload.chave_privada);
	payload.csr_pem = nullableString(payload.csr_pem);

	const rawDate = nullableString(input.data_expiracao);
	if (rawDate) {
		if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
			const [day, month, year] = rawDate.split('/');
			payload.data_expiracao = `${year}-${month}-${day} 00:00:00`;
		} else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
			payload.data_expiracao = `${rawDate} 00:00:00`;
		} else {
			payload.data_expiracao = rawDate;
		}
	} else {
		payload.data_expiracao = null;
	}

	return payload;
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
	}

	const query = request.nextUrl.searchParams;
	const id = asString(query.get('id')).trim();

	const params = new URLSearchParams({
		id_empresa: session.currentTenantId,
	});

	if (id) {
		params.set('id', id);
		params.set('perpage', '1');
	} else {
		params.set('page', asString(query.get('page') || '1'));
		params.set('perpage', asString(query.get('perPage') || '15'));
		params.set('order', asString(query.get('order') || 'id'));
		params.set('sort', asString(query.get('sort') || 'desc'));

		const filterKeys = ['id', 'codigo', 'nome::like', 'tipo', 'ambiente', 'ativo'];
		for (const key of filterKeys) {
			const value = asString(query.get(key)).trim();
			if (value) params.set(key, value);
		}
	}

	const result = await serverApiFetch(`gateways_pagamento?${params.toString()}`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	});

	if (!result.ok) {
		return NextResponse.json({ message: 'Erro ao carregar gateways de pagamento.' }, { status: result.status || 400 });
	}

	return NextResponse.json(result.payload);
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: 'Payload invalido.' }, { status: 400 });
	}

	const payload = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
	const action = asString(payload.action).trim() || 'save';

	if (action === 'delete') {
		const ids = Array.isArray(payload.ids) ? payload.ids.map((id) => asString(id).trim()).filter(Boolean) : [];
		if (ids.length === 0) {
			return NextResponse.json({ message: 'Nenhum id informado para exclusao.' }, { status: 400 });
		}

		const delResult = await serverApiFetch('gateways_pagamento', {
			method: 'DELETE',
			token: session.token,
			tenantId: session.currentTenantId,
			body: ids.map((id) => ({ id })),
		});

		if (!delResult.ok) {
			return NextResponse.json({ message: 'Erro ao excluir gateways.' }, { status: delResult.status || 400 });
		}

		return NextResponse.json(delResult.payload);
	}

	if (action === 'gerarCertificadoItau' || action === 'renovarCertificadoItau') {
		return NextResponse.json({ message: 'A automacao de certificado Itaú ainda nao foi disponibilizada na bridge v2. Utilize preenchimento manual neste fluxo.' }, { status: 501 });
	}

	const formInput = (payload.data && typeof payload.data === 'object' ? payload.data : {}) as GatewayPayload;
	const normalized = normalizeGatewaySavePayload({
		...formInput,
		id_empresa: session.currentTenantId,
	});

	const saveResult = await serverApiFetch('gateways_pagamento', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: normalized,
	});

	if (!saveResult.ok) {
		return NextResponse.json({ message: 'Erro ao salvar gateway.' }, { status: saveResult.status || 400 });
	}

	return NextResponse.json(saveResult.payload);
}
