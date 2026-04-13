import { httpClient } from '@/src/services/http/http-client';

export type GatewayTipo = 'boleto_antecipado' | 'cartao_credito' | 'pix' | '';

export type GatewayPagamentoRecord = {
	id?: string;
	ativo: boolean;
	tipo: GatewayTipo;
	gateway_boleto_antecipado: string;
	gateway_cartao_credito: string;
	gateway_pix: string;
	gateway: string;
	codigo: string;
	conta_erp: string;
	nome: string;
	ambiente: 'producao' | 'teste';
	estorna_parcial: boolean;
	estorna_total: boolean;
	tokenizacao_cartao: boolean;
	'3ds': boolean;
	'3ds_nome': string;
	'3ds_codigo': string;
	'3ds_mcc': string;
	client_id: string;
	client_secret: string;
	pv: string;
	token: string;
	merchant_id: string;
	merchant_key: string;
	processor_id: string;
	api_key: string;
	app_key: string;
	seller_id: string;
	chave_pix: string;
	certificado: string;
	chave_privada: string;
	chave_publica: string;
	csr_pem: string;
	data_expiracao: string;
	codigo_banco: string;
	banco_dv: string;
	id_convenio: string;
	numero_convenio: string;
	carteira: string;
	variacao_carteira: string;
	modalidade: string;
	agencia: string;
	agencia_dv: string;
	conta: string;
	conta_dv: string;
	cnpj: string;
	razao_social: string;
	nome_fantasia: string;
	cep: string;
	endereco: string;
	numero: string;
	complemento: string;
	bairro: string;
	cidade: string;
	uf: string;
	status_captura: string;
	dias_vencimento: string;
	dias_captura: string;
	dias_cancelamento: string;
	minutos_validade: string;
	horas_cancelamento: string;
	dias_limite: string;
	instrucoes: string;
};

export type GatewaysListResponse = {
	data: GatewayPagamentoRecord[];
	meta: {
		total: number;
		current_page: number;
		per_page: number;
		last_page: number;
		from: number;
		to: number;
	};
};

export const emptyGatewayRecord: GatewayPagamentoRecord = {
	ativo: true,
	tipo: '',
	gateway_boleto_antecipado: '',
	gateway_cartao_credito: '',
	gateway_pix: '',
	gateway: '',
	codigo: '',
	conta_erp: '',
	nome: '',
	ambiente: 'producao',
	estorna_parcial: true,
	estorna_total: true,
	tokenizacao_cartao: false,
	'3ds': false,
	'3ds_nome': '',
	'3ds_codigo': '',
	'3ds_mcc': '',
	client_id: '',
	client_secret: '',
	pv: '',
	token: '',
	merchant_id: '',
	merchant_key: '',
	processor_id: '',
	api_key: '',
	app_key: '',
	seller_id: '',
	chave_pix: '',
	certificado: '',
	chave_privada: '',
	chave_publica: '',
	csr_pem: '',
	data_expiracao: '',
	codigo_banco: '',
	banco_dv: '',
	id_convenio: '',
	numero_convenio: '',
	carteira: '',
	variacao_carteira: '',
	modalidade: '',
	agencia: '',
	agencia_dv: '',
	conta: '',
	conta_dv: '',
	cnpj: '',
	razao_social: '',
	nome_fantasia: '',
	cep: '',
	endereco: '',
	numero: '',
	complemento: '',
	bairro: '',
	cidade: '',
	uf: '',
	status_captura: '',
	dias_vencimento: '',
	dias_captura: '',
	dias_cancelamento: '',
	minutos_validade: '',
	horas_cancelamento: '',
	dias_limite: '',
	instrucoes: '',
};

function normalizeDateValue(value: unknown) {
	const normalized = value == null ? '' : String(value).trim();

	if (!normalized) {
		return '';
	}

	const matched = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
	return matched ? matched[1] : normalized;
}

function toRecord(payload: unknown): GatewayPagamentoRecord {
	const source = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
	return {
		...emptyGatewayRecord,
		...(Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value == null ? '' : value])) as Partial<GatewayPagamentoRecord>),
		id: source.id ? String(source.id) : undefined,
		ativo: source.ativo === true || source.ativo === 1 || source.ativo === '1',
		estorna_parcial: source.estorna_parcial === true || source.estorna_parcial === 1 || source.estorna_parcial === '1',
		estorna_total: source.estorna_total === true || source.estorna_total === 1 || source.estorna_total === '1',
		tokenizacao_cartao: source.tokenizacao_cartao === true || source.tokenizacao_cartao === 1 || source.tokenizacao_cartao === '1',
		'3ds': source['3ds'] === true || source['3ds'] === 1 || source['3ds'] === '1',
		tipo: (source.tipo ? String(source.tipo) : '') as GatewayTipo,
		ambiente: source.ambiente === 'teste' ? 'teste' : 'producao',
		gateway: source.gateway ? String(source.gateway) : '',
		data_expiracao: normalizeDateValue(source.data_expiracao),
	};
}

export const gatewaysPagamentoClient = {
	async list(filters: Record<string, string> = {}) {
		const query = new URLSearchParams(filters).toString();
		const payload = await httpClient<GatewaysListResponse>(`/api/integracoes/gateways-pagamento${query ? `?${query}` : ''}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return {
			rows: Array.isArray(payload?.data) ? payload.data.map((item) => toRecord(item)) : [],
			meta: payload?.meta,
		};
	},

	async getById(id: string) {
		const payload = await httpClient<{ data?: unknown[] }>(`/api/integracoes/gateways-pagamento?id=${encodeURIComponent(id)}`, {
			method: 'GET',
			cache: 'no-store',
		});

		const first = Array.isArray(payload?.data) ? payload.data[0] : null;
		return first ? toRecord(first) : null;
	},

	async save(data: GatewayPagamentoRecord) {
		return httpClient('/api/integracoes/gateways-pagamento', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'save', data }),
		});
	},

	async delete(ids: string[]) {
		return httpClient('/api/integracoes/gateways-pagamento', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'delete', ids }),
		});
	},
};
