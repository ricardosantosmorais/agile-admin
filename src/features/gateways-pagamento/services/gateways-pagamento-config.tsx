import { Shield } from 'lucide-react';
import type { CrudFieldConfig, CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types';
import { inputClasses } from '@/src/components/ui/input-styles';

type GatewayTipo = 'boleto_antecipado' | 'cartao_credito' | 'pix' | '';
type SensitiveFieldKey = 'client_secret' | 'token' | 'merchant_key' | 'api_key' | 'app_key' | 'chave_privada';

const GATEWAY_TIPO_OPTIONS = [
	{ value: 'boleto_antecipado', label: 'Boleto Antecipado' },
	{ value: 'cartao_credito', label: 'Cartão de Crédito' },
	{ value: 'pix', label: 'PIX' },
];

const AMBIENTE_OPTIONS = [
	{ value: 'producao', label: 'Produção' },
	{ value: 'teste', label: 'Teste' },
];

const STATUS_CAPTURA_OPTIONS = [
	{ value: 'faturado', label: 'Pedido Faturado (Pré-autorização)' },
	{ value: 'pagamento_aprovado', label: 'Pagamento Aprovado (Pré-autorização)' },
	{ value: 'recebido', label: 'Pedido Recebido (Captura imediata)' },
];

const UF_OPTIONS = [
	'AC',
	'AL',
	'AP',
	'AM',
	'BA',
	'CE',
	'DF',
	'ES',
	'GO',
	'MA',
	'MT',
	'MS',
	'MG',
	'PA',
	'PB',
	'PR',
	'PE',
	'PI',
	'RJ',
	'RN',
	'RS',
	'RO',
	'RR',
	'SC',
	'SP',
	'SE',
	'TO',
];

function asText(value: unknown) {
	return String(value ?? '');
}

function asBoolean(value: unknown) {
	return value === true || value === 1 || value === '1';
}

function resolveGatewayTypeLabel(tipo: unknown) {
	const normalized = asText(tipo);
	return GATEWAY_TIPO_OPTIONS.find((option) => option.value === normalized)?.label ?? '-';
}

function resolveSelectedGateway(form: CrudRecord) {
	const tipo = asText(form.tipo) as GatewayTipo;
	if (tipo === 'boleto_antecipado') return asText(form.gateway_boleto_antecipado);
	if (tipo === 'cartao_credito') return asText(form.gateway_cartao_credito);
	if (tipo === 'pix') return asText(form.gateway_pix);
	return asText(form.gateway);
}

function resolveVisibility(form: CrudRecord) {
	const tipo = asText(form.tipo);
	const gateway = resolveSelectedGateway(form);
	const usa3ds = asBoolean(form['3ds']);
	const isBoleto = tipo === 'boleto_antecipado';
	const isCartao = tipo === 'cartao_credito';
	const isPix = tipo === 'pix';

	return {
		ambiente:
			(isBoleto && ['bb_api', 'maxipago', 'pagarme'].includes(gateway)) ||
			(isCartao && ['rede', 'cielo', 'getnet', 'pagarme', 'safra', 'vindi', 'pagbank'].includes(gateway)) ||
			(isPix && ['bb_api', 'cielo', 'safra', 'pagbank'].includes(gateway)),
		chave_pix: isPix && ['bb_api', 'bradesco', 'itau'].includes(gateway),
		certificado: isPix && ['bb_api', 'bradesco', 'itau'].includes(gateway),
		chave_privada: isPix && ['bb_api', 'bradesco', 'itau'].includes(gateway),
		data_expiracao: isPix && ['bb_api', 'bradesco', 'itau'].includes(gateway),
		app_key: (isBoleto || isPix) && gateway === 'bb_api',
		client_id:
			((isBoleto || isPix) && gateway === 'bb_api') ||
			(isCartao && gateway === 'getnet') ||
			(isPix && ['bradesco', 'itau'].includes(gateway)) ||
			(isCartao && gateway === 'cielo' && usa3ds),
		client_secret:
			((isBoleto || isPix) && gateway === 'bb_api') ||
			(isCartao && gateway === 'getnet') ||
			(isPix && ['bradesco', 'itau'].includes(gateway)) ||
			(isCartao && gateway === 'cielo' && usa3ds),
		token: (isCartao && ['rede', 'safra', 'vindi', 'pagbank'].includes(gateway)) || (isPix && ['safra', 'pagbank'].includes(gateway)),
		merchant_id: (isBoleto && gateway === 'maxipago') || gateway === 'cielo',
		merchant_key: (isBoleto && gateway === 'maxipago') || gateway === 'cielo',
		processor_id: isBoleto && gateway === 'maxipago',
		api_key: (isBoleto || isCartao || isPix) && gateway === 'pagarme',
		seller_id: isCartao && gateway === 'getnet',
		pv: isCartao && gateway === 'rede',
		chave_publica: isCartao && gateway === 'pagbank',
		codigo_banco: isBoleto && gateway === 'bb_api',
		banco_dv: isBoleto && gateway === 'bb_api',
		id_convenio: isBoleto && gateway === 'bb_ecomm',
		numero_convenio: isBoleto && ['bb_api', 'bb_ecomm'].includes(gateway),
		carteira: isBoleto && gateway === 'bb_api',
		variacao_carteira: isBoleto && gateway === 'bb_api',
		modalidade: isBoleto && gateway === 'bb_api',
		agencia: isBoleto && gateway === 'bb_api',
		agencia_dv: isBoleto && gateway === 'bb_api',
		conta: isBoleto && gateway === 'bb_api',
		conta_dv: isBoleto && gateway === 'bb_api',
		cnpj: isBoleto && gateway === 'bb_api',
		razao_social: isBoleto && gateway === 'bb_api',
		nome_fantasia: isBoleto && gateway === 'bb_api',
		cep: isBoleto && gateway === 'bb_api',
		endereco: isBoleto && gateway === 'bb_api',
		numero: isBoleto && gateway === 'bb_api',
		complemento: isBoleto && gateway === 'bb_api',
		bairro: isBoleto && gateway === 'bb_api',
		cidade: isBoleto && gateway === 'bb_api',
		uf: isBoleto && gateway === 'bb_api',
		status_captura: isCartao && gateway !== 'vindi',
		dias_vencimento: isBoleto,
		dias_captura: isCartao && gateway !== 'vindi',
		dias_cancelamento: isBoleto,
		horas_cancelamento: isCartao || isPix,
		dias_limite: isBoleto && gateway === 'bb_api',
		minutos_validade: isPix,
		instrucoes: isBoleto && gateway === 'maxipago',
		tokenizacao_cartao: isCartao && ['cielo', 'rede'].includes(gateway),
		estorna_parcial: isPix,
		estorna_total: isPix,
		usa_3ds: isCartao && gateway === 'cielo',
		detalhes_3ds: isCartao && gateway === 'cielo' && usa3ds,
		csr_pem: isPix && gateway === 'itau',
		pix_itau_auto: isPix && gateway === 'itau',
	};
}

function hiddenWhen(flag: keyof ReturnType<typeof resolveVisibility>) {
	return ({ form }: { form: CrudRecord }) => !resolveVisibility(form)[flag];
}

function maskSecret(value: string, editable: boolean) {
	if (editable) return value;
	const clean = value.trim();
	if (!clean) return '';
	if (clean.length <= 8) return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
	return `${clean.slice(0, 4)}******${clean.slice(-4)}`;
}

function buildSensitiveField(key: SensitiveFieldKey, labelKey: string, label: string): CrudFieldConfig {
	const editableKey = `${key}_editable`;
	const originalKey = `${key}_original`;

	return {
		key,
		labelKey,
		label,
		type: 'custom',
		render: ({ form, readOnly, disabled, patch, t }) => {
			const currentValue = asText(form[key]);
			const originalValue = asText(form[originalKey]);
			const editable = asBoolean(form[editableKey]);
			const hasExistingValue = Boolean(originalValue);

			return (
				<div className="space-y-2">
					<input
						type="text"
						value={maskSecret(currentValue, editable)}
						onChange={(event) => patch(key, event.target.value)}
						disabled={readOnly || disabled || (hasExistingValue && !editable)}
						className={inputClasses()}
					/>
					{!readOnly && hasExistingValue ? (
						<div className="flex flex-wrap gap-2">
							{!editable ? (
								<button
									type="button"
									className="app-button-secondary rounded-full px-3 py-1.5 text-xs font-semibold"
									onClick={() => {
										patch(editableKey, true);
										patch(key, '');
									}}
								>
									{t('common.change', 'Alterar')}
								</button>
							) : (
								<button
									type="button"
									className="app-button-secondary rounded-full px-3 py-1.5 text-xs font-semibold"
									onClick={() => {
										patch(editableKey, false);
										patch(key, originalValue);
									}}
								>
									{t('common.cancelChange', 'Cancelar alteração')}
								</button>
							)}
						</div>
					) : null}
				</div>
			);
		},
	};
}

function resolveTipoChange(currentForm: CrudRecord, nextTipo: GatewayTipo) {
	if (nextTipo === 'boleto_antecipado') {
		return {
			...currentForm,
			tipo: nextTipo,
			gateway_cartao_credito: '',
			gateway_pix: '',
			dias_vencimento: asText(currentForm.dias_vencimento) || '3',
			dias_cancelamento: asText(currentForm.dias_cancelamento) || '7',
		};
	}
	if (nextTipo === 'cartao_credito') {
		return {
			...currentForm,
			tipo: nextTipo,
			gateway_boleto_antecipado: '',
			gateway_pix: '',
			horas_cancelamento: asText(currentForm.horas_cancelamento) || '2',
		};
	}
	if (nextTipo === 'pix') {
		return {
			...currentForm,
			tipo: nextTipo,
			gateway_boleto_antecipado: '',
			gateway_cartao_credito: '',
			minutos_validade: asText(currentForm.minutos_validade) || '1440',
			horas_cancelamento: asText(currentForm.horas_cancelamento) || '2',
		};
	}
	return {
		...currentForm,
		tipo: nextTipo,
		gateway_boleto_antecipado: '',
		gateway_cartao_credito: '',
		gateway_pix: '',
	};
}

function applyFormStateChanges(form: CrudRecord, patch: (key: string, value: unknown) => void, nextState: CrudRecord) {
	for (const [key, value] of Object.entries(nextState)) {
		if (form[key] !== value) {
			patch(key, value);
		}
	}
}

export function normalizeGatewayPagamentoRecord(record: CrudRecord): CrudRecord {
	const normalized: CrudRecord = {
		...record,
		gateway_boleto_antecipado: asText(record.tipo) === 'boleto_antecipado' ? asText(record.gateway || record.gateway_boleto_antecipado) : asText(record.gateway_boleto_antecipado),
		gateway_cartao_credito: asText(record.tipo) === 'cartao_credito' ? asText(record.gateway || record.gateway_cartao_credito) : asText(record.gateway_cartao_credito),
		gateway_pix: asText(record.tipo) === 'pix' ? asText(record.gateway || record.gateway_pix) : asText(record.gateway_pix),
	};

	for (const key of ['client_secret', 'token', 'merchant_key', 'api_key', 'app_key', 'chave_privada'] as SensitiveFieldKey[]) {
		normalized[`${key}_original`] = asText(normalized[key]);
		normalized[`${key}_editable`] = !asText(normalized[key]);
	}

	return normalized;
}

export function prepareGatewayPagamentoPayload(record: CrudRecord): CrudRecord {
	const tipo = asText(record.tipo);
	const gateway = resolveSelectedGateway(record);
	const payload: CrudRecord = {
		...record,
		gateway,
		gateway_boleto_antecipado: tipo === 'boleto_antecipado' ? asText(record.gateway_boleto_antecipado) : '',
		gateway_cartao_credito: tipo === 'cartao_credito' ? asText(record.gateway_cartao_credito) : '',
		gateway_pix: tipo === 'pix' ? asText(record.gateway_pix) : '',
		dias_vencimento: tipo === 'boleto_antecipado' ? asText(record.dias_vencimento) || '3' : asText(record.dias_vencimento),
		dias_cancelamento: tipo === 'boleto_antecipado' ? asText(record.dias_cancelamento) || '7' : asText(record.dias_cancelamento),
		horas_cancelamento: tipo === 'cartao_credito' || tipo === 'pix' ? asText(record.horas_cancelamento) || '2' : asText(record.horas_cancelamento),
		minutos_validade: tipo === 'pix' ? asText(record.minutos_validade) || '1440' : asText(record.minutos_validade),
	};

	for (const key of ['client_secret', 'token', 'merchant_key', 'api_key', 'app_key', 'chave_privada'] as SensitiveFieldKey[]) {
		payload[`${key}_original`] = undefined;
		payload[`${key}_editable`] = undefined;
	}

	return payload;
}

export const GATEWAYS_PAGAMENTO_CONFIG: CrudModuleConfig = {
	key: 'gateways-pagamento',
	resource: 'gateways_pagamento',
	routeBase: '/integracoes/gateways-pagamento',
	featureKey: 'integracoesGatewaysPagamento',
	listTitleKey: 'integrationsPaymentGateways.title',
	listTitle: 'Gateways de Pagamento',
	listDescriptionKey: 'integrationsPaymentGateways.description',
	listDescription: 'Gerencie os gateways de pagamento da empresa ativa.',
	formTitleKey: 'integrationsPaymentGateways.title',
	formTitle: 'Gateways de Pagamento',
	breadcrumbSectionKey: 'menuKeys.integracoes',
	breadcrumbSection: 'Integrações',
	breadcrumbModuleKey: 'integrationsPaymentGateways.title',
	breadcrumbModule: 'Gateways de Pagamento',
	defaultFilters: { page: 1, perPage: 15, orderBy: 'id', sort: 'desc', id: '', codigo: '', 'nome::like': '', tipo: '', ambiente: '', ativo: '' },
	columns: [
		{
			id: 'id',
			labelKey: 'simpleCrud.fields.id',
			label: 'ID',
			sortKey: 'id',
			thClassName: 'w-[120px]',
			filter: { kind: 'text', key: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID' },
		},
		{
			id: 'codigo',
			labelKey: 'simpleCrud.fields.code',
			label: 'Código',
			sortKey: 'codigo',
			thClassName: 'w-[150px]',
			filter: { kind: 'text', key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código' },
		},
		{
			id: 'nome',
			labelKey: 'simpleCrud.fields.name',
			label: 'Nome',
			sortKey: 'nome',
			tdClassName: 'font-semibold text-[color:var(--app-text)]',
			filter: { kind: 'text', key: 'nome::like', labelKey: 'simpleCrud.fields.name', label: 'Nome' },
		},
		{
			id: 'tipo',
			labelKey: 'simpleCrud.fields.type',
			label: 'Tipo',
			sortKey: 'tipo',
			render: (record) => resolveGatewayTypeLabel(record.tipo),
			filter: { kind: 'select', key: 'tipo', labelKey: 'simpleCrud.fields.type', label: 'Tipo', options: GATEWAY_TIPO_OPTIONS },
		},
		{
			id: 'ambiente',
			labelKey: 'integrationsFinancial.fields.environment',
			label: 'Ambiente',
			sortKey: 'ambiente',
			render: (record) => (asText(record.ambiente) === 'teste' ? 'Teste' : 'Produção'),
			filter: { kind: 'select', key: 'ambiente', labelKey: 'integrationsFinancial.fields.environment', label: 'Ambiente', options: AMBIENTE_OPTIONS },
		},
		{
			id: 'ativo',
			labelKey: 'simpleCrud.fields.active',
			label: 'Ativo',
			sortKey: 'ativo',
			thClassName: 'w-[100px]',
			filter: {
				kind: 'select',
				key: 'ativo',
				labelKey: 'simpleCrud.fields.active',
				label: 'Ativo',
				options: [
					{ value: '1', label: 'Sim' },
					{ value: '0', label: 'Não' },
				],
			},
		},
	],
	mobileTitle: (record) => String(record.nome || record.codigo || `#${String(record.id || '-')}`),
	mobileSubtitle: (record) => resolveGatewayTypeLabel(record.tipo),
	mobileMeta: (record) => `${asText(record.ambiente) === 'teste' ? 'Teste' : 'Produção'} • ${asBoolean(record.ativo) ? 'Sim' : 'Não'}`,
	sections: [
		{
			id: 'general',
			titleKey: 'integrationsPaymentGateways.sections.general',
			title: 'Dados principais',
			layout: 'rows',
			fields: [
				{ key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
				{
					key: 'tipo',
					labelKey: 'simpleCrud.fields.type',
					label: 'Tipo',
					type: 'custom',
					defaultValue: '',
					render: ({ form, readOnly, disabled, patch }) => (
						<select
							value={asText(form.tipo)}
							onChange={(event) => applyFormStateChanges(form, patch, resolveTipoChange(form, event.target.value as GatewayTipo))}
							className={inputClasses()}
							disabled={readOnly || disabled}
						>
							<option value="">Selecione</option>
							{GATEWAY_TIPO_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					),
					validate: ({ form }) => (!asText(form.tipo) ? 'Selecione o tipo do gateway.' : null),
				},
				{
					key: 'gateway_boleto_antecipado',
					labelKey: 'integrationsPaymentGateways.gateway',
					label: 'Gateway',
					type: 'select',
					hidden: ({ form }) => asText(form.tipo) !== 'boleto_antecipado',
					options: [
						{ value: 'bb_api', label: 'Banco do Brasil (API)' },
						{ value: 'bb_ecomm', label: 'Banco do Brasil (Comércio Eletrônico)' },
						{ value: 'maxipago', label: 'maxiPago!' },
						{ value: 'pagarme', label: 'Pagar.me' },
					],
					required: true,
				},
				{
					key: 'gateway_cartao_credito',
					labelKey: 'integrationsPaymentGateways.gateway',
					label: 'Gateway',
					type: 'select',
					hidden: ({ form }) => asText(form.tipo) !== 'cartao_credito',
					options: [
						{ value: 'cielo', label: 'Cielo' },
						{ value: 'getnet', label: 'GetNet' },
						{ value: 'pagbank', label: 'PagBank' },
						{ value: 'pagarme', label: 'Pagar.me' },
						{ value: 'rede', label: 'Rede' },
						{ value: 'safra', label: 'Safra' },
						{ value: 'vindi', label: 'Vindi' },
					],
					required: true,
				},
				{
					key: 'gateway_pix',
					labelKey: 'integrationsPaymentGateways.gateway',
					label: 'Gateway',
					type: 'select',
					hidden: ({ form }) => asText(form.tipo) !== 'pix',
					options: [
						{ value: 'bb_api', label: 'Banco do Brasil' },
						{ value: 'bradesco', label: 'Bradesco' },
						{ value: 'cielo', label: 'Cielo' },
						{ value: 'itau', label: 'Itaú' },
						{ value: 'pagbank', label: 'PagBank' },
						{ value: 'pagarme', label: 'Pagar.me' },
						{ value: 'safra', label: 'Safra' },
					],
					required: true,
				},
				{ key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
				{ key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
				{ key: 'conta_erp', labelKey: 'integrationsPaymentGateways.erpAccount', label: 'Conta ERP', type: 'text' },
				{ key: 'ambiente', labelKey: 'integrationsFinancial.fields.environment', label: 'Ambiente', type: 'select', hidden: hiddenWhen('ambiente'), options: AMBIENTE_OPTIONS },
			],
		},
		{
			id: 'operational',
			titleKey: 'integrationsPaymentGateways.operationalRules',
			title: 'Regras operacionais',
			layout: 'rows',
			fields: [
				{
					key: 'estorna_parcial',
					labelKey: 'integrationsPaymentGateways.partialRefund',
					label: 'Estorna Parcial',
					type: 'toggle',
					hidden: hiddenWhen('estorna_parcial'),
					defaultValue: true,
				},
				{
					key: 'estorna_total',
					labelKey: 'integrationsPaymentGateways.totalRefund',
					label: 'Estorna Total',
					type: 'toggle',
					hidden: hiddenWhen('estorna_total'),
					defaultValue: true,
				},
				{
					key: 'tokenizacao_cartao',
					labelKey: 'integrationsPaymentGateways.cardTokenization',
					label: 'Armazenar Cartões',
					type: 'toggle',
					hidden: hiddenWhen('tokenizacao_cartao'),
					defaultValue: false,
				},
				{ key: '3ds', labelKey: 'integrationsPaymentGateways.use3ds', label: 'Usa 3DS', type: 'toggle', hidden: hiddenWhen('usa_3ds'), defaultValue: false },
				{ key: '3ds_nome', labelKey: 'integrationsPaymentGateways.threeDsName', label: 'Nome 3DS', type: 'text', hidden: hiddenWhen('detalhes_3ds') },
				{ key: '3ds_codigo', labelKey: 'integrationsPaymentGateways.threeDsCode', label: 'Código 3DS', type: 'text', hidden: hiddenWhen('detalhes_3ds') },
				{ key: '3ds_mcc', labelKey: 'integrationsPaymentGateways.threeDsMcc', label: 'MCC 3DS', type: 'text', hidden: hiddenWhen('detalhes_3ds') },
				{
					key: 'status_captura',
					labelKey: 'integrationsPaymentGateways.captureStatus',
					label: 'Status para Captura',
					type: 'select',
					hidden: hiddenWhen('status_captura'),
					options: STATUS_CAPTURA_OPTIONS,
				},
				{ key: 'minutos_validade', labelKey: 'integrationsPaymentGateways.validityMinutes', label: 'Minutos Validade', type: 'number', hidden: hiddenWhen('minutos_validade') },
				{ key: 'dias_vencimento', labelKey: 'integrationsPaymentGateways.dueDays', label: 'Dias Vencimento', type: 'number', hidden: hiddenWhen('dias_vencimento') },
				{ key: 'dias_captura', labelKey: 'integrationsPaymentGateways.captureDays', label: 'Dias Captura', type: 'number', hidden: hiddenWhen('dias_captura') },
				{ key: 'dias_cancelamento', labelKey: 'integrationsPaymentGateways.cancelDays', label: 'Dias Cancelamento', type: 'number', hidden: hiddenWhen('dias_cancelamento') },
				{ key: 'horas_cancelamento', labelKey: 'integrationsPaymentGateways.cancelHours', label: 'Horas Cancelamento', type: 'number', hidden: hiddenWhen('horas_cancelamento') },
				{ key: 'dias_limite', labelKey: 'integrationsPaymentGateways.limitDays', label: 'Dias Limite', type: 'number', hidden: hiddenWhen('dias_limite') },
			],
		},
		{
			id: 'credentials',
			titleKey: 'integrationsPaymentGateways.credentials',
			title: 'Credenciais e dados técnicos',
			layout: 'rows',
			fields: [
				{ key: 'client_id', labelKey: 'integrationsPaymentGateways.fields.clientId', label: 'Client ID', type: 'text', hidden: hiddenWhen('client_id') },
				{ ...buildSensitiveField('client_secret', 'integrationsPaymentGateways.fields.clientSecret', 'Client Secret'), hidden: hiddenWhen('client_secret') },
				{ key: 'pv', labelKey: 'integrationsPaymentGateways.fields.pv', label: 'PV', type: 'text', hidden: hiddenWhen('pv') },
				{ ...buildSensitiveField('token', 'integrationsPaymentGateways.fields.token', 'Token'), hidden: hiddenWhen('token') },
				{ key: 'merchant_id', labelKey: 'integrationsPaymentGateways.fields.merchantId', label: 'Merchant ID', type: 'text', hidden: hiddenWhen('merchant_id') },
				{ ...buildSensitiveField('merchant_key', 'integrationsPaymentGateways.fields.merchantKey', 'Merchant Key'), hidden: hiddenWhen('merchant_key') },
				{ key: 'processor_id', labelKey: 'integrationsPaymentGateways.fields.processorId', label: 'Processor ID', type: 'text', hidden: hiddenWhen('processor_id') },
				{ ...buildSensitiveField('api_key', 'integrationsPaymentGateways.fields.apiKey', 'API Key'), hidden: hiddenWhen('api_key') },
				{ ...buildSensitiveField('app_key', 'integrationsPaymentGateways.fields.appKey', 'APP Key'), hidden: hiddenWhen('app_key') },
				{ key: 'seller_id', labelKey: 'integrationsPaymentGateways.fields.sellerId', label: 'Seller ID', type: 'text', hidden: hiddenWhen('seller_id') },
				{ key: 'chave_pix', labelKey: 'integrationsPaymentGateways.fields.pixKey', label: 'Chave PIX', type: 'text', hidden: hiddenWhen('chave_pix') },
				{ key: 'chave_publica', labelKey: 'integrationsPaymentGateways.fields.publicKey', label: 'Chave Pública', type: 'textarea', hidden: hiddenWhen('chave_publica'), rows: 8 },
				{ key: 'certificado', labelKey: 'integrationsPaymentGateways.fields.certificate', label: 'Certificado', type: 'textarea', hidden: hiddenWhen('certificado'), rows: 8 },
				{ ...buildSensitiveField('chave_privada', 'integrationsPaymentGateways.fields.privateKey', 'Chave Privada'), hidden: hiddenWhen('chave_privada') },
				{ key: 'csr_pem', labelKey: 'integrationsPaymentGateways.fields.csr', label: 'CSR', type: 'textarea', hidden: hiddenWhen('csr_pem'), rows: 8 },
				{
					key: 'data_expiracao',
					labelKey: 'integrationsPaymentGateways.fields.expirationDate',
					label: 'Data Expiração Certificado',
					type: 'date',
					hidden: hiddenWhen('data_expiracao'),
				},
				{
					key: 'itau_notice',
					labelKey: 'integrationsPaymentGateways.itauCertificateFlow',
					label: 'Fluxo de certificado Itaú',
					type: 'custom',
					hidden: hiddenWhen('pix_itau_auto'),
					layoutClassName: 'md:col-span-12',
					render: ({ t }) => (
						<div className="rounded-2xl border border-dashed border-line p-4">
							<div className="flex items-center gap-2 text-sm font-semibold text-(--app-text)">
								<Shield className="h-4 w-4" />
								{t('integrationsPaymentGateways.itauCertificateFlow', 'Fluxo de certificado Itaú')}
							</div>
							<p className="mt-2 text-sm text-slate-500">
								{t(
									'integrationsPaymentGateways.itauCertificateFlowHelper',
									'Use preenchimento manual de certificado e chaves neste fluxo. A automação ainda não está disponível na bridge v2.',
								)}
							</p>
							<button type="button" disabled className="app-button-secondary mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
								{t('integrationsPaymentGateways.requestItauCertificate', 'Solicitar Certificado Itaú')}
							</button>
						</div>
					),
				},
				{ key: 'client_secret_editable', labelKey: 'internal.hidden', label: 'Client Secret Editable', type: 'toggle', hidden: () => true, defaultValue: false },
				{ key: 'client_secret_original', labelKey: 'internal.hidden', label: 'Client Secret Original', type: 'text', hidden: () => true, defaultValue: '' },
				{ key: 'token_editable', labelKey: 'internal.hidden', label: 'Token Editable', type: 'toggle', hidden: () => true, defaultValue: false },
				{ key: 'token_original', labelKey: 'internal.hidden', label: 'Token Original', type: 'text', hidden: () => true, defaultValue: '' },
				{ key: 'merchant_key_editable', labelKey: 'internal.hidden', label: 'Merchant Key Editable', type: 'toggle', hidden: () => true, defaultValue: false },
				{ key: 'merchant_key_original', labelKey: 'internal.hidden', label: 'Merchant Key Original', type: 'text', hidden: () => true, defaultValue: '' },
				{ key: 'api_key_editable', labelKey: 'internal.hidden', label: 'Api Key Editable', type: 'toggle', hidden: () => true, defaultValue: false },
				{ key: 'api_key_original', labelKey: 'internal.hidden', label: 'Api Key Original', type: 'text', hidden: () => true, defaultValue: '' },
				{ key: 'app_key_editable', labelKey: 'internal.hidden', label: 'App Key Editable', type: 'toggle', hidden: () => true, defaultValue: false },
				{ key: 'app_key_original', labelKey: 'internal.hidden', label: 'App Key Original', type: 'text', hidden: () => true, defaultValue: '' },
				{ key: 'chave_privada_editable', labelKey: 'internal.hidden', label: 'Chave Privada Editable', type: 'toggle', hidden: () => true, defaultValue: false },
				{ key: 'chave_privada_original', labelKey: 'internal.hidden', label: 'Chave Privada Original', type: 'text', hidden: () => true, defaultValue: '' },
			],
		},
		{
			id: 'bank-data',
			titleKey: 'integrationsPaymentGateways.bankData',
			title: 'Dados bancários e operacionais',
			layout: 'rows',
			fields: [
				{ key: 'codigo_banco', labelKey: 'integrationsPaymentGateways.fields.bankCode', label: 'Código do Banco', type: 'text', hidden: hiddenWhen('codigo_banco') },
				{ key: 'banco_dv', labelKey: 'integrationsPaymentGateways.fields.bankDigit', label: 'DV do Banco', type: 'text', hidden: hiddenWhen('banco_dv') },
				{ key: 'id_convenio', labelKey: 'integrationsPaymentGateways.fields.agreementId', label: 'ID do Convênio', type: 'text', hidden: hiddenWhen('id_convenio') },
				{
					key: 'numero_convenio',
					labelKey: 'integrationsPaymentGateways.fields.agreementNumber',
					label: 'Número do Convênio',
					type: 'text',
					hidden: hiddenWhen('numero_convenio'),
				},
				{ key: 'carteira', labelKey: 'integrationsPaymentGateways.fields.wallet', label: 'Carteira', type: 'text', hidden: hiddenWhen('carteira') },
				{
					key: 'variacao_carteira',
					labelKey: 'integrationsPaymentGateways.fields.walletVariation',
					label: 'Variação da Carteira',
					type: 'text',
					hidden: hiddenWhen('variacao_carteira'),
				},
				{ key: 'modalidade', labelKey: 'integrationsPaymentGateways.fields.modalityCode', label: 'Código da Modalidade', type: 'text', hidden: hiddenWhen('modalidade') },
				{ key: 'agencia', labelKey: 'integrationsPaymentGateways.fields.branch', label: 'Agência', type: 'text', hidden: hiddenWhen('agencia') },
				{ key: 'agencia_dv', labelKey: 'integrationsPaymentGateways.fields.branchDigit', label: 'DV da Agência', type: 'text', hidden: hiddenWhen('agencia_dv') },
				{ key: 'conta', labelKey: 'integrationsPaymentGateways.fields.account', label: 'Conta', type: 'text', hidden: hiddenWhen('conta') },
				{ key: 'conta_dv', labelKey: 'integrationsPaymentGateways.fields.accountDigit', label: 'DV da Conta', type: 'text', hidden: hiddenWhen('conta_dv') },
				{ key: 'cnpj', labelKey: 'integrationsPaymentGateways.fields.cnpj', label: 'CNPJ', type: 'text', hidden: hiddenWhen('cnpj'), mask: 'cnpj' },
				{ key: 'razao_social', labelKey: 'integrationsPaymentGateways.fields.companyName', label: 'Razão Social', type: 'text', hidden: hiddenWhen('razao_social') },
				{ key: 'nome_fantasia', labelKey: 'integrationsPaymentGateways.fields.tradeName', label: 'Nome Fantasia', type: 'text', hidden: hiddenWhen('nome_fantasia') },
				{ key: 'cep', labelKey: 'integrationsPaymentGateways.fields.zipCode', label: 'CEP', type: 'text', hidden: hiddenWhen('cep'), mask: 'cep' },
				{ key: 'endereco', labelKey: 'integrationsPaymentGateways.fields.address', label: 'Endereço', type: 'text', hidden: hiddenWhen('endereco') },
				{ key: 'numero', labelKey: 'integrationsPaymentGateways.fields.number', label: 'Número', type: 'text', hidden: hiddenWhen('numero') },
				{ key: 'complemento', labelKey: 'integrationsPaymentGateways.fields.complement', label: 'Complemento', type: 'text', hidden: hiddenWhen('complemento') },
				{ key: 'bairro', labelKey: 'integrationsPaymentGateways.fields.district', label: 'Bairro', type: 'text', hidden: hiddenWhen('bairro') },
				{ key: 'cidade', labelKey: 'integrationsPaymentGateways.fields.city', label: 'Cidade', type: 'text', hidden: hiddenWhen('cidade') },
				{
					key: 'uf',
					labelKey: 'integrationsPaymentGateways.fields.state',
					label: 'UF',
					type: 'select',
					hidden: hiddenWhen('uf'),
					options: UF_OPTIONS.map((uf) => ({ value: uf, label: uf })),
				},
				{ key: 'instrucoes', labelKey: 'integrationsPaymentGateways.fields.instructions', label: 'Instruções', type: 'text', hidden: hiddenWhen('instrucoes') },
			],
		},
	],
	normalizeRecord: normalizeGatewayPagamentoRecord,
	beforeSave: prepareGatewayPagamentoPayload,
	getSaveRedirectPath: ({ saved, form }) => {
		const savedId = String(saved[0]?.id || form.id || '');
		return savedId ? `/integracoes/gateways-pagamento/${savedId}/editar` : '/integracoes/gateways-pagamento';
	},
};
