import { asArray, asRecord, asString } from '@/src/lib/api-payload';

export type IntegracaoComErpFieldOption = {
	value: string;
	label: string;
};

export type IntegracaoComErpFieldType = 'text' | 'enum' | 'secret';

export type IntegracaoComErpConfigFieldDefinition = {
	key: string;
	label: string;
	description: string;
	type: IntegracaoComErpFieldType;
	options: IntegracaoComErpFieldOption[];
	order: number;
	layoutClassName?: string;
	includeEmptyOption?: boolean;
	inputMode?: 'text' | 'numeric' | 'decimal';
	placeholder?: string;
};

export type IntegracaoComErpFieldMeta = {
	updatedAt: string;
	updatedBy: string;
};

export type IntegracaoComErpConfigRecord = {
	fields: IntegracaoComErpConfigFieldDefinition[];
	values: Record<string, string>;
	metadata: Record<string, IntegracaoComErpFieldMeta>;
	company: {
		id: string;
		codigo: string;
		idTemplate: string;
		erp: string;
		tokenAtivacao: string;
	};
};

export type IntegracaoComErpParameterPayload = {
	id_filial: string | null;
	chave: string;
	parametros: string;
	integracao: number;
	criptografado: number;
};

function toStringValue(value: unknown) {
	return asString(value).trim();
}

function toNumberValue(value: unknown) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function parseFixedListOptions(value: unknown) {
	const raw = toStringValue(value);
	if (!raw) {
		return [];
	}

	try {
		return asArray(JSON.parse(raw))
			.map((item) => {
				const option = asRecord(item);
				return {
					value: toStringValue(option.value),
					label: toStringValue(option.text || option.label || option.nome || option.value),
				};
			})
			.filter((option) => option.value || option.label);
	} catch {
		return [];
	}
}

function normalizeSchemaFields(payload: unknown) {
	const normalized: IntegracaoComErpConfigFieldDefinition[] = [];

	for (const item of asArray(asRecord(payload).data)) {
		const field = asRecord(item);
		const key = toStringValue(field.chave);

		if (!key) {
			continue;
		}

		const isFixedCombo = toStringValue(field.tipo_entrada) === 'combo' && toStringValue(field.fonte_dados) === 'lista_fixa';
		const isSecret = toStringValue(field.tipo_entrada) === 'livre' && toStringValue(field.tipo_valor) === 'senha';

		normalized.push({
			key,
			label: toStringValue(field.nome || key),
			description: toStringValue(field.descricao),
			type: isSecret ? 'secret' : isFixedCombo ? 'enum' : 'text',
			options: isFixedCombo ? parseFixedListOptions(field.dados) : [],
			order: toNumberValue(field.ordem),
		});
	}

	return normalized.sort((left, right) => left.order - right.order);
}

function normalizeMetadata(parameters: Array<Record<string, unknown>>) {
	const metadata: Record<string, IntegracaoComErpFieldMeta> = {};

	for (const parameter of parameters) {
		const key = toStringValue(parameter.chave);
		const user = asRecord(parameter.usuario);
		const updatedAt = toStringValue(parameter.created_at);
		const updatedBy = toStringValue(user.nome);

		if (!key || !updatedAt || !updatedBy) {
			continue;
		}

		metadata[key] = { updatedAt, updatedBy };
	}

	return metadata;
}

function normalizeCompany(payload: unknown) {
	const company = asRecord(asArray(asRecord(payload).data)[0]);

	return {
		id: toStringValue(company.id),
		codigo: toStringValue(company.codigo || company.id),
		idTemplate: toStringValue(company.id_template),
		erp: toStringValue(company.erp),
		tokenAtivacao: toStringValue(company.token_ativacao || company.tokenAtivacao),
	};
}

export function normalizeIntegracaoComErpConfigRecord(payload: unknown, fixedFields?: IntegracaoComErpConfigFieldDefinition[]): IntegracaoComErpConfigRecord {
	const root = asRecord(payload);
	const fields = fixedFields ? [...fixedFields] : normalizeSchemaFields(root.schema);
	const parameterRows = asArray(asRecord(root.parameters).data).map((item) => asRecord(item));
	const parameterMap = new Map(parameterRows.map((item) => [toStringValue(item.chave), item] as const));
	const values: Record<string, string> = {};

	for (const field of fields) {
		values[field.key] = toStringValue(parameterMap.get(field.key)?.parametros);
	}

	return {
		fields,
		values,
		metadata: normalizeMetadata(parameterRows),
		company: normalizeCompany(root.company),
	};
}

export function mapIntegracaoComErpFieldsToBaseDefinitions(fields: IntegracaoComErpConfigFieldDefinition[], section = 'general') {
	return fields.map((field) => ({
		key: field.key,
		section,
		type: field.type,
		label: field.label,
		helper: field.description,
		options: field.options,
		layoutClassName: field.layoutClassName,
		includeEmptyOption: field.includeEmptyOption,
		inputMode: field.inputMode,
		placeholder: field.placeholder,
	}));
}

export function buildDirtyIntegracaoComErpParametersPayload(
	fields: IntegracaoComErpConfigFieldDefinition[],
	initialValues: Record<string, string>,
	currentValues: Record<string, string>,
	version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
	const parameters: IntegracaoComErpParameterPayload[] = [];

	for (const field of fields) {
		const initialValue = String(initialValues[field.key] ?? '').trim();
		const currentValue = String(currentValues[field.key] ?? '').trim();

		if (initialValue === currentValue) {
			continue;
		}

		if (field.type === 'secret' && !currentValue) {
			continue;
		}

		parameters.push({
			id_filial: null,
			chave: field.key,
			parametros: currentValue,
			integracao: 1,
			criptografado: field.type === 'secret' && currentValue ? 1 : 0,
		});
	}

	if (!parameters.length) {
		return [];
	}

	return [{ id_filial: null, chave: 'versao', parametros: version, integracao: 1, criptografado: 0 }, ...parameters];
}
