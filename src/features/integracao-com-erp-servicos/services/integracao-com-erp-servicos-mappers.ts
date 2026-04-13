import { formatDateTime } from '@/src/lib/date-time';
import { asArray, asNumber, asRecord } from '@/src/lib/api-payload';
import type {
	IntegracaoComErpServicoCharacteristic,
	IntegracaoComErpServicoConfigHistoryResponse,
	IntegracaoComErpServicoExecutionDetailResponse,
	IntegracaoComErpServicoExecutionLogContent,
	IntegracaoComErpServicoExecutionFailure,
	IntegracaoComErpServicoExecutionDetailRecord,
	IntegracaoComErpServicoExecutionRecord,
	IntegracaoComErpServicoExecutionResponse,
	IntegracaoComErpServicoHistoryResponse,
	IntegracaoComErpServicoMetadataEntry,
	IntegracaoComErpServicoQuerySupportItem,
	IntegracaoComErpServicoQuerySupportResponse,
	IntegracaoComErpServicoRecord,
	IntegracaoComErpServicosResponse,
} from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-types';

function toStringValue(value: unknown) {
	return String(value ?? '').trim();
}

function toBooleanValue(value: unknown) {
	const normalized = toStringValue(value).toLowerCase();
	return ['1', 'true', 'sim', 'yes', 'ativo'].includes(normalized);
}

function normalizeStatus(status: string) {
	const normalized = status.toLowerCase();

	if (normalized === 'ok') {
		return { label: 'OK', tone: 'success' as const };
	}

	if (normalized === 'warning') {
		return { label: 'Alerta', tone: 'warning' as const };
	}

	if (normalized === 'bad') {
		return { label: 'Falha', tone: 'danger' as const };
	}

	if (normalized === 'working') {
		return { label: 'Em Execução', tone: 'info' as const };
	}

	if (normalized === 'void') {
		return { label: 'Inativo', tone: 'neutral' as const };
	}

	return { label: status || '-', tone: 'neutral' as const };
}

function normalizeMetadataEntries(value: unknown): IntegracaoComErpServicoMetadataEntry[] {
	if (Array.isArray(value)) {
		return value
			.map((entry) => {
				const record = asRecord(entry);
				const label = toStringValue(record.label || record.key || record.titulo || record.title);
				const content = toStringValue(record.value || record.valor || record.content);
				if (!label && !content) {
					return null;
				}

				return {
					label: label || 'Detalhe',
					value: content || '-',
				};
			})
			.filter((entry): entry is IntegracaoComErpServicoMetadataEntry => Boolean(entry));
	}

	if (typeof value === 'object' && value !== null) {
		return Object.entries(value).map(([label, content]) => ({
			label: toStringValue(label) || 'Detalhe',
			value: toStringValue(content) || '-',
		}));
	}

	const raw = toStringValue(value);
	if (!raw) {
		return [];
	}

	try {
		return normalizeMetadataEntries(JSON.parse(raw));
	} catch {
		return [{ label: 'Detalhe', value: raw }];
	}
}

function normalizeCharacteristic(value: unknown, fallbackLabel: string): IntegracaoComErpServicoCharacteristic {
	const record = asRecord(value);
	return {
		key: toStringValue(record.chave || record.key),
		label: toStringValue(record.label) || fallbackLabel,
		inferred: toBooleanValue(record.inferido || record.inferred),
	};
}

function normalizeQueryRecord(value: unknown) {
	if (typeof value === 'string') {
		const raw = toStringValue(value);
		if (!raw) {
			return {};
		}

		try {
			return asRecord(JSON.parse(raw));
		} catch {
			return { query: raw, Query: raw, sql: raw };
		}
	}

	return asRecord(value);
}

function mapRow(value: unknown): IntegracaoComErpServicoRecord {
	const row = asRecord(value);
	const service = asRecord(row.servico);
	const caracteristicas = asRecord(row.caracteristicas);
	const status = toStringValue(row.status);
	const query = normalizeQueryRecord(row.query || service.query || row.sql || row.query_sql);
	const normalizedStatus = normalizeStatus(status);

	return {
		id: toStringValue(row.id_servico || row.id),
		idServico: toStringValue(row.id_servico || row.id),
		idServicoEmpresa: toStringValue(row.id_servico_empresa || row.id),
		idTemplate: toStringValue(service.id_template || row.id_template),
		nome: toStringValue(service.nome || row.nome) || '-',
		intervaloExecucao: toStringValue(row.intervalo_execucao) || '-',
		ultimaExecucao: formatDateTime(toStringValue(row.dthr_ultima_execucao)) || '-',
		proximaExecucao: formatDateTime(toStringValue(row.dthr_proxima_execucao)) || '-',
		status,
		statusLabel: normalizedStatus.label,
		statusTone: normalizedStatus.tone,
		ativo: toBooleanValue(row.ativo),
		customizado: toBooleanValue(row.customizado),
		urlFiltro: toStringValue(row.url_filtro),
		gatewayName: toStringValue(row.nome_gateway),
		endpointUrl: toStringValue(row.url),
		hash: toStringValue(query.hash || row.hash),
		querySql: toStringValue(query.Query || query.query || query.sql || row.query_sql || row.sql),
		metadataEntries: normalizeMetadataEntries(row.metadata),
		caracteristicas: {
			natureza: normalizeCharacteristic(caracteristicas.natureza, 'Não identificado'),
			motorExecucao: normalizeCharacteristic(caracteristicas.motor_execucao, 'Não identificado'),
			tipoServico: normalizeCharacteristic(caracteristicas.tipo_servico, 'Não identificado'),
			modoExecucao: normalizeCharacteristic(caracteristicas.modo_execucao, 'Não informado'),
			objeto: normalizeCharacteristic(caracteristicas.objeto, 'Não informado'),
		},
	};
}

function normalizeExecutionStatus(status: string) {
	const normalized = status.toLowerCase();

	if (normalized === 'finalizado') return { label: 'Finalizado', tone: 'success' as const };
	if (normalized === 'finalizado_parcial') return { label: 'Finalizado Parcial', tone: 'warning' as const };
	if (normalized === 'falha_na_execucao') return { label: 'Falha', tone: 'danger' as const };
	if (normalized === 'executando_mysql') return { label: 'Em Execução', tone: 'info' as const };
	if (normalized === 'abortado') return { label: 'Abortado', tone: 'warning' as const };
	if (normalized === 'suspenso') return { label: 'Suspenso', tone: 'warning' as const };
	if (normalized === 'registrado') return { label: 'Registrado', tone: 'info' as const };
	if (normalized === 'encaminhado') return { label: 'Encaminhado', tone: 'info' as const };
	if (normalized === 'enviado') return { label: 'Enviado', tone: 'info' as const };
	if (normalized === 'recebido_no_servico') return { label: 'Recebido no Serviço', tone: 'info' as const };
	if (normalized === 'desconectado') return { label: 'Desconectado', tone: 'warning' as const };
	if (normalized === 'devolvido') return { label: 'Devolvido', tone: 'warning' as const };

	return { label: status || '-', tone: 'neutral' as const };
}

function mapExecutionRow(value: unknown): IntegracaoComErpServicoExecutionRecord {
	const row = asRecord(value);
	const status = toStringValue(row.status);
	const normalizedStatus = normalizeExecutionStatus(status);
	const abortar = toBooleanValue(row.abortar === 'Sim' ? '1' : row.abortar);

	return {
		id: toStringValue(row.id),
		dataHoraInicio: formatDateTime(toStringValue(row.dthr_inicio)) || '-',
		dataHoraFim: formatDateTime(toStringValue(row.dthr_fim)) || '-',
		tempoExecucao: toStringValue(row.tempo_execucao) || '-',
		status,
		statusLabel: normalizedStatus.label,
		statusTone: normalizedStatus.tone,
		abortar,
		abortarLabel: abortar ? 'Sim' : 'Não',
		abortarTone: abortar ? 'warning' : 'success',
		statusLog: toStringValue(row.status_log) || '0/0',
		qtdRegistros: toStringValue(row.qtd_registros_consultados) || '0',
		qtdIncluidos: toStringValue(row.qtd_registros_incluidos) || '0',
		qtdAlterados: toStringValue(row.qtd_registros_alterados) || '0',
		qtdDeletados: toStringValue(row.qtd_registros_deletados) || '0',
	};
}

function mapExecutionDetailRow(value: unknown): IntegracaoComErpServicoExecutionDetailRecord {
	const row = asRecord(value);
	const status = toStringValue(row.status);
	const normalizedStatus = normalizeExecutionStatus(status);
	const tipoDetalhe = toStringValue(row.tipo_detalhe);
	const metadataPreview = toStringValue(row.metadata);
	const dataHoraFimRaw = toStringValue(row.dthr_fim);

	return {
		id: toStringValue(row.id),
		tipoDetalhe,
		tipoDetalheLabel: tipoDetalhe ? tipoDetalhe.replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase()) : '-',
		detalhe: toStringValue(row.detalhe) || '-',
		dataHoraInicio: formatDateTime(toStringValue(row.dthr_inicio)) || '-',
		dataHoraFim: formatDateTime(dataHoraFimRaw) || '-',
		tempoExecucao: dataHoraFimRaw ? toStringValue(row.tempo_execucao) || '-' : '-',
		status,
		statusLabel: normalizedStatus.label,
		statusTone: normalizedStatus.tone,
		tentativas: toStringValue(row.tentativas) || '0',
		metadataPreview: metadataPreview || '-',
		hasDetailContent: ['acao', 'falha_na_execucao'].includes(tipoDetalhe.toLowerCase()) || status.toLowerCase() === 'falha_na_execucao',
		hasMetadataContent: Boolean(metadataPreview) || status.toLowerCase() === 'falha_na_execucao',
	};
}

function buildMeta(metaValue: unknown, fallback: { page: number; perPage: number; total: number }) {
	const meta = asRecord(metaValue);
	const total = Math.max(0, asNumber(meta.total, fallback.total));
	const page = Math.max(1, asNumber(meta.page ?? meta.current_page, fallback.page));
	const perPage = Math.max(1, asNumber(meta.perpage ?? meta.perPage ?? meta.per_page, fallback.perPage));
	const from = total === 0 ? 0 : asNumber(meta.from, (page - 1) * perPage + 1);
	const to = total === 0 ? 0 : asNumber(meta.to, Math.min(total, from + perPage - 1));
	const pages = Math.max(1, asNumber(meta.pages ?? meta.last_page, Math.ceil(total / perPage) || 1));

	return { total, from, to, page, pages, perPage };
}

export function normalizeIntegracaoComErpServicoQuerySupport(payload: unknown): IntegracaoComErpServicoQuerySupportResponse {
	const rows = asArray(asRecord(payload).data);
	const fields: IntegracaoComErpServicoQuerySupportItem[] = [];
	const parameters: IntegracaoComErpServicoQuerySupportItem[] = [];

	for (const entry of rows) {
		const row = asRecord(entry);
		const parentId = toStringValue(row.parentId).toLowerCase();
		const id = toStringValue(row.id || row.nome);
		const label = toStringValue(row.nome || row.label || row.text);
		const dataType = toStringValue(row.tipo);
		const defaultValue = toStringValue(row.valor_padrao || row.default || row.valor);
		const description = [dataType, defaultValue ? `default(${defaultValue})` : ''].filter(Boolean).join(' | ');
		const item = {
			id,
			label: label || '-',
			description: description || toStringValue(row.descricao || row.value),
			kind: parentId === 'parametro' ? ('parameter' as const) : ('field' as const),
			required: toBooleanValue(row.obrigatorio),
			primaryKey: toBooleanValue(row.chave_primaria),
			dataType,
			defaultValue,
		};

		if (parentId === 'parametro') {
			parameters.push(item);
			continue;
		}

		if (parentId === 'alias') {
			fields.push(item);
		}
	}

	return { fields, parameters };
}

export function normalizeIntegracaoComErpServicoHistory(payload: unknown, fallback: { page: number; perPage: number }): IntegracaoComErpServicoHistoryResponse {
	const root = asRecord(payload);
	const data = asArray(root.data).map((entry) => {
		const row = asRecord(entry);
		return {
			id: toStringValue(row.id),
			usuario: toStringValue(row.usuario) || '-',
			dataHora: formatDateTime(toStringValue(row.data_hora)) || '-',
			dataHoraCriacao: formatDateTime(toStringValue(row.data_hora_query)) || '-',
			motivo: toStringValue(row.observacao || row.motivo) || '-',
		};
	});

	return { data, meta: buildMeta(root.meta, { page: fallback.page, perPage: fallback.perPage, total: data.length }) };
}

export function normalizeIntegracaoComErpServicoConfigHistory(payload: unknown, fallback: { page: number; perPage: number }): IntegracaoComErpServicoConfigHistoryResponse {
	const root = asRecord(payload);
	const data = asArray(root.data).map((entry) => {
		const row = asRecord(entry);
		return {
			id: toStringValue(row.id),
			usuario: toStringValue(row.usuario) || '-',
			dataHora: formatDateTime(toStringValue(row.data_hora)) || '-',
			motivo: toStringValue(row.motivo) || '-',
			diff: toStringValue(row.diff) || '-',
		};
	});

	return { data, meta: buildMeta(root.meta, { page: fallback.page, perPage: fallback.perPage, total: data.length }) };
}

export function normalizeIntegracaoComErpServicoExecutions(payload: unknown, fallback: { page: number; perPage: number }): IntegracaoComErpServicoExecutionResponse {
	const root = asRecord(payload);
	const data = asArray(root.data).map(mapExecutionRow);
	return { data, meta: buildMeta(root.meta, { page: fallback.page, perPage: fallback.perPage, total: data.length }) };
}

export function normalizeIntegracaoComErpServicoExecutionFailure(payload: unknown): IntegracaoComErpServicoExecutionFailure {
	const data = asRecord(asRecord(payload).data);
	return {
		executionId: toStringValue(data.id_servico_execucao),
		step: toStringValue(data.etapa) || '-',
		message: toStringValue(data.mensagem) || 'Não foi possível localizar detalhes da falha para esta execução.',
	};
}

export function normalizeIntegracaoComErpServicoExecutionDetails(payload: unknown, fallback: { page: number; perPage: number }): IntegracaoComErpServicoExecutionDetailResponse {
	const root = asRecord(payload);
	const data = asArray(root.data).map(mapExecutionDetailRow);
	return { data, meta: buildMeta(root.meta, { page: fallback.page, perPage: fallback.perPage, total: data.length }) };
}

export function normalizeIntegracaoComErpServicoExecutionLogContent(payload: unknown): IntegracaoComErpServicoExecutionLogContent {
	const data = asRecord(asRecord(payload).data);
	const kind = toStringValue(data.kind) === 'metadata' ? 'metadata' : 'detail';
	const rawContent = typeof data.content === 'string' ? data.content : JSON.stringify(data.content ?? '-', null, 2);

	return {
		title: toStringValue(data.title) || 'Conteúdo da execução',
		fileName: toStringValue(data.file_name),
		content: rawContent || '-',
		kind,
	};
}

export function normalizeIntegracaoComErpServicosResponse(payload: unknown, fallback: { page: number; perPage: number }): IntegracaoComErpServicosResponse {
	const root = asRecord(payload);
	const data = asArray(root.data).map(mapRow);
	const meta = asRecord(root.meta);
	const total = Math.max(0, asNumber(meta.total, data.length));
	const page = Math.max(1, asNumber(meta.page ?? meta.current_page, fallback.page));
	const perPage = Math.max(1, asNumber(meta.perpage ?? meta.perPage ?? meta.per_page, fallback.perPage));
	const from = total === 0 ? 0 : asNumber(meta.from, (page - 1) * perPage + 1);
	const to = total === 0 || data.length === 0 ? 0 : asNumber(meta.to, from + data.length - 1);
	const pages = Math.max(1, asNumber(meta.pages ?? meta.last_page, Math.ceil(total / perPage) || 1));

	return {
		data,
		meta: {
			total,
			from,
			to,
			page,
			pages,
			perPage,
		},
	};
}
