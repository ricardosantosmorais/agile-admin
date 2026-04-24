import type {
	DashboardRootComparativo,
	DashboardRootPeriod,
	DashboardRootSimpleRow,
	DashboardRootSnapshot,
} from '@/src/features/dashboard-root-agileecommerce/types/dashboard-root-agileecommerce';

type DashboardRootResumoSnapshot = NonNullable<DashboardRootSnapshot['resumo']>;

function toNumber(value: unknown) {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : 0;
	}

	if (typeof value === 'string') {
		const normalized = Number(value);
		return Number.isFinite(normalized) ? normalized : 0;
	}

	return 0;
}

function toStringOrNull(value: unknown) {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number') {
		return String(value);
	}

	return null;
}

function hasOwn(record: Record<string, unknown>, key: string) {
	return Object.prototype.hasOwnProperty.call(record, key);
}

function mapSimpleRow(row: unknown): DashboardRootSimpleRow {
	if (!row || typeof row !== 'object' || Array.isArray(row)) {
		return {};
	}

	const record = row as Record<string, unknown>;
	const mapped: DashboardRootSimpleRow = {};

	for (const [key, value] of Object.entries(record)) {
		if (typeof value === 'number') {
			mapped[key] = toNumber(value);
			continue;
		}

		if (typeof value === 'string') {
			const numeric = Number(value);
			mapped[key] = Number.isFinite(numeric) && value.trim() !== '' ? numeric : value;
			continue;
		}

		mapped[key] = value === null ? null : toStringOrNull(value);
	}

	return mapped;
}

function mapSimpleRows(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.map((row) => mapSimpleRow(row));
}

function mapPeriod(value: unknown): DashboardRootPeriod {
	const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

	return {
		data_inicio: toStringOrNull(record.data_inicio),
		data_fim: toStringOrNull(record.data_fim),
		data_inicio_anterior: toStringOrNull(record.data_inicio_anterior),
		data_fim_anterior: toStringOrNull(record.data_fim_anterior),
	};
}

function mapComparativo(value: unknown): DashboardRootComparativo {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	const record = value as Record<string, unknown>;
	const previous =
		record.periodo_anterior && typeof record.periodo_anterior === 'object' && !Array.isArray(record.periodo_anterior) ? (record.periodo_anterior as Record<string, unknown>) : null;

	const previousValues =
		record.valores_anteriores && typeof record.valores_anteriores === 'object' && !Array.isArray(record.valores_anteriores)
			? Object.fromEntries(Object.entries(record.valores_anteriores as Record<string, unknown>).map(([key, currentValue]) => [key, toNumber(currentValue)]))
			: null;

	const variations =
		record.variacoes && typeof record.variacoes === 'object' && !Array.isArray(record.variacoes)
			? Object.fromEntries(Object.entries(record.variacoes as Record<string, unknown>).map(([key, currentValue]) => [key, toNumber(currentValue)]))
			: null;

	return {
		periodo_anterior: previous
			? {
					data_inicio: String(previous.data_inicio ?? ''),
					data_fim: String(previous.data_fim ?? ''),
				}
			: null,
		valores_anteriores: previousValues,
		variacoes: variations,
	};
}

export function mapDashboardRootAgileecommercePayload(payload: unknown): DashboardRootSnapshot {
	const record = payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
	const meta = record.meta && typeof record.meta === 'object' && !Array.isArray(record.meta) ? (record.meta as Record<string, unknown>) : {};
	const metaPeriod = meta.periodo && typeof meta.periodo === 'object' && !Array.isArray(meta.periodo) ? meta.periodo : {};
	const resumo = record.resumo && typeof record.resumo === 'object' && !Array.isArray(record.resumo) ? (record.resumo as Record<string, unknown>) : null;

	const analyticsRecord = record.analytics && typeof record.analytics === 'object' && !Array.isArray(record.analytics) ? (record.analytics as Record<string, unknown>) : null;
	const analytics = analyticsRecord
		? {
				...(hasOwn(analyticsRecord, 'resumo')
					? {
							resumo: Object.fromEntries(
								Object.entries((analyticsRecord.resumo as Record<string, unknown> | undefined) ?? {}).map(([key, value]) => [key, toNumber(value)]),
							),
						}
					: {}),
				...(hasOwn(analyticsRecord, 'comparativo') ? { comparativo: mapComparativo(analyticsRecord.comparativo) } : {}),
				...(hasOwn(analyticsRecord, 'confianca') ? { confianca: mapSimpleRow(analyticsRecord.confianca) } : {}),
				...(hasOwn(analyticsRecord, 'vendas_series_diaria') ? { vendas_series_diaria: mapSimpleRows(analyticsRecord.vendas_series_diaria) } : {}),
				...(hasOwn(analyticsRecord, 'vendas_series_diaria_anterior') ? { vendas_series_diaria_anterior: mapSimpleRows(analyticsRecord.vendas_series_diaria_anterior) } : {}),
				...(hasOwn(analyticsRecord, 'vendas_series_mensal') ? { vendas_series_mensal: mapSimpleRows(analyticsRecord.vendas_series_mensal) } : {}),
				...(hasOwn(analyticsRecord, 'ranking_faturamento') ? { ranking_faturamento: mapSimpleRows(analyticsRecord.ranking_faturamento) } : {}),
				...(hasOwn(analyticsRecord, 'ranking_pedidos') ? { ranking_pedidos: mapSimpleRows(analyticsRecord.ranking_pedidos) } : {}),
				...(hasOwn(analyticsRecord, 'ranking_usuarios_ativos') ? { ranking_usuarios_ativos: mapSimpleRows(analyticsRecord.ranking_usuarios_ativos) } : {}),
				...(hasOwn(analyticsRecord, 'engajamento_empresas') ? { engajamento_empresas: mapSimpleRows(analyticsRecord.engajamento_empresas) } : {}),
				...(hasOwn(analyticsRecord, 'empresas_base_saudavel') ? { empresas_base_saudavel: mapSimpleRows(analyticsRecord.empresas_base_saudavel) } : {}),
				...(hasOwn(analyticsRecord, 'empresas_mais_produtos') ? { empresas_mais_produtos: mapSimpleRows(analyticsRecord.empresas_mais_produtos) } : {}),
				...(hasOwn(analyticsRecord, 'pedidos_status') ? { pedidos_status: mapSimpleRows(analyticsRecord.pedidos_status) } : {}),
				...(hasOwn(analyticsRecord, 'empresas_sinais_queda') ? { empresas_sinais_queda: mapSimpleRows(analyticsRecord.empresas_sinais_queda) } : {}),
				...(hasOwn(analyticsRecord, 'frescor_analytics_por_empresa') ? { frescor_analytics_por_empresa: mapSimpleRows(analyticsRecord.frescor_analytics_por_empresa) } : {}),
				...(hasOwn(analyticsRecord, 'sincronizacao_resumo') ? { sincronizacao_resumo: mapSimpleRow(analyticsRecord.sincronizacao_resumo) } : {}),
				...(hasOwn(analyticsRecord, 'sincronizacao_status') ? { sincronizacao_status: mapSimpleRows(analyticsRecord.sincronizacao_status) } : {}),
				...(hasOwn(analyticsRecord, 'sincronizacao_execucoes_recentes') ? { sincronizacao_execucoes_recentes: mapSimpleRows(analyticsRecord.sincronizacao_execucoes_recentes) } : {}),
				...(hasOwn(analyticsRecord, 'cobertura_dados') ? { cobertura_dados: mapSimpleRows(analyticsRecord.cobertura_dados) } : {}),
			}
		: undefined;

	return {
		meta: {
			versao: String(meta.versao ?? ''),
			schema: toNumber(meta.schema),
			cache_ttl_minutos: toNumber(meta.cache_ttl_minutos),
			cache_ignorado: Boolean(meta.cache_ignorado),
			cache_hit: Boolean(meta.cache_hit),
			tenant_id: String(meta.tenant_id ?? ''),
			blocos: Array.isArray(meta.blocos) ? meta.blocos.map((item) => String(item)) : [],
			periodo: mapPeriod(metaPeriod),
		},
		resumo: resumo
			? {
					carteira: {
						empresas_total: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.empresas_total),
						empresas_ativas: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.empresas_ativas),
						empresas_producao: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.empresas_producao),
						empresas_homologacao: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.empresas_homologacao),
						empresas_bloqueadas: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.empresas_bloqueadas),
						empresas_manutencao: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.empresas_manutencao),
						empresas_com_app: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.empresas_com_app),
						apps_ativos: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.apps_ativos),
						cobertura_apps_percentual: toNumber((resumo.carteira as Record<string, unknown> | undefined)?.cobertura_apps_percentual),
					},
					periodo_atual: Object.fromEntries(
						Object.entries((resumo.periodo_atual as Record<string, unknown> | undefined) ?? {}).map(([key, value]) => [key, toNumber(value)]),
					) as DashboardRootResumoSnapshot['periodo_atual'],
					comparativo: mapComparativo(resumo.comparativo),
				}
			: undefined,
		empresas:
			record.empresas && typeof record.empresas === 'object' && !Array.isArray(record.empresas)
				? {
						status: mapSimpleRows((record.empresas as Record<string, unknown>).status),
						clusters: mapSimpleRows((record.empresas as Record<string, unknown>).clusters),
						erps: mapSimpleRows((record.empresas as Record<string, unknown>).erps),
						flags: mapSimpleRow((record.empresas as Record<string, unknown>).flags),
						implantacao: mapSimpleRow((record.empresas as Record<string, unknown>).implantacao),
						cards_atencao: Object.fromEntries(
							Object.entries(((record.empresas as Record<string, unknown>).cards_atencao as Record<string, unknown>) ?? {}).map(([key, value]) => [key, toNumber(value)]),
						),
						top_empresas_sem_app: mapSimpleRows((record.empresas as Record<string, unknown>).top_empresas_sem_app),
						top_empresas_problemas_app: mapSimpleRows((record.empresas as Record<string, unknown>).top_empresas_problemas_app),
					}
				: undefined,
		apps:
			record.apps && typeof record.apps === 'object' && !Array.isArray(record.apps)
				? (() => {
						const appsRecord = record.apps as Record<string, unknown>;
						return {
							...(hasOwn(appsRecord, 'resumo') ? { resumo: mapSimpleRow(appsRecord.resumo) } : {}),
							...(hasOwn(appsRecord, 'criacao_serie') ? { criacao_serie: mapSimpleRows(appsRecord.criacao_serie) } : {}),
							...(hasOwn(appsRecord, 'criacao_serie_mensal') ? { criacao_serie_mensal: mapSimpleRows(appsRecord.criacao_serie_mensal) } : {}),
							...(hasOwn(appsRecord, 'logs_status') ? { logs_status: mapSimpleRows(appsRecord.logs_status) } : {}),
							...(hasOwn(appsRecord, 'notificacoes_publicadas_serie_mensal')
								? { notificacoes_publicadas_serie_mensal: mapSimpleRows(appsRecord.notificacoes_publicadas_serie_mensal) }
								: {}),
							...(hasOwn(appsRecord, 'top_empresas_sem_app') ? { top_empresas_sem_app: mapSimpleRows(appsRecord.top_empresas_sem_app) } : {}),
							...(hasOwn(appsRecord, 'top_empresas_problemas_publicacao_build')
								? { top_empresas_problemas_publicacao_build: mapSimpleRows(appsRecord.top_empresas_problemas_publicacao_build) }
								: {}),
						};
					})()
				: undefined,
		push:
			record.push && typeof record.push === 'object' && !Array.isArray(record.push)
				? (() => {
						const pushRecord = record.push as Record<string, unknown>;
						return {
							...(hasOwn(pushRecord, 'resumo')
								? {
										resumo: Object.fromEntries(
											Object.entries((pushRecord.resumo as Record<string, unknown> | undefined) ?? {}).map(([key, value]) => [key, toNumber(value)]),
										),
									}
								: {}),
							...(hasOwn(pushRecord, 'comparativo') ? { comparativo: mapComparativo(pushRecord.comparativo) } : {}),
							...(hasOwn(pushRecord, 'tipos') ? { tipos: mapSimpleRows(pushRecord.tipos) } : {}),
							...(hasOwn(pushRecord, 'serie_envios') ? { serie_envios: mapSimpleRows(pushRecord.serie_envios) } : {}),
							...(hasOwn(pushRecord, 'serie_envios_mensal') ? { serie_envios_mensal: mapSimpleRows(pushRecord.serie_envios_mensal) } : {}),
							...(hasOwn(pushRecord, 'serie_interacoes') ? { serie_interacoes: mapSimpleRows(pushRecord.serie_interacoes) } : {}),
							...(hasOwn(pushRecord, 'serie_interacoes_mensal')
								? { serie_interacoes_mensal: mapSimpleRows(pushRecord.serie_interacoes_mensal) }
								: {}),
							...(hasOwn(pushRecord, 'mensagens_externas_status')
								? { mensagens_externas_status: mapSimpleRows(pushRecord.mensagens_externas_status) }
								: {}),
						};
					})()
				: undefined,
		processos:
			record.processos && typeof record.processos === 'object' && !Array.isArray(record.processos)
				? (() => {
						const processosRecord = record.processos as Record<string, unknown>;
						return {
							...(hasOwn(processosRecord, 'resumo')
								? {
										resumo: Object.fromEntries(
											Object.entries((processosRecord.resumo as Record<string, unknown> | undefined) ?? {}).map(([key, value]) => [key, toNumber(value)]),
										),
									}
								: {}),
							...(hasOwn(processosRecord, 'comparativo') ? { comparativo: mapComparativo(processosRecord.comparativo) } : {}),
							...(hasOwn(processosRecord, 'status') ? { status: mapSimpleRows(processosRecord.status) } : {}),
							...(hasOwn(processosRecord, 'tipos') ? { tipos: mapSimpleRows(processosRecord.tipos) } : {}),
							...(hasOwn(processosRecord, 'serie') ? { serie: mapSimpleRows(processosRecord.serie) } : {}),
							...(hasOwn(processosRecord, 'serie_mensal') ? { serie_mensal: mapSimpleRows(processosRecord.serie_mensal) } : {}),
							...(hasOwn(processosRecord, 'logs_tipos') ? { logs_tipos: mapSimpleRows(processosRecord.logs_tipos) } : {}),
							...(hasOwn(processosRecord, 'logs_resumo') ? { logs_resumo: mapSimpleRow(processosRecord.logs_resumo) } : {}),
							...(hasOwn(processosRecord, 'alertas_falha_recente')
								? { alertas_falha_recente: mapSimpleRows(processosRecord.alertas_falha_recente) }
								: {}),
						};
					})()
				: undefined,
		agent:
			record.agent && typeof record.agent === 'object' && !Array.isArray(record.agent)
				? {
						resumo: Object.fromEntries(
							Object.entries(((record.agent as Record<string, unknown>).resumo as Record<string, unknown>) ?? {}).map(([key, value]) => [key, toNumber(value)]),
						),
						comparativo: mapComparativo((record.agent as Record<string, unknown>).comparativo),
						execucoes_status: mapSimpleRows((record.agent as Record<string, unknown>).execucoes_status),
						execucoes_serie_diaria: mapSimpleRows((record.agent as Record<string, unknown>).execucoes_serie_diaria),
						mensagens_por_papel: mapSimpleRows((record.agent as Record<string, unknown>).mensagens_por_papel),
						eventos_tipos: mapSimpleRows((record.agent as Record<string, unknown>).eventos_tipos),
						canais_direcao: mapSimpleRows((record.agent as Record<string, unknown>).canais_direcao),
						canais_status: mapSimpleRows((record.agent as Record<string, unknown>).canais_status),
						webhook_event_types: mapSimpleRows((record.agent as Record<string, unknown>).webhook_event_types),
					}
				: undefined,
		audit:
			record.audit && typeof record.audit === 'object' && !Array.isArray(record.audit)
				? {
						resumo: Object.fromEntries(
							Object.entries(((record.audit as Record<string, unknown>).resumo as Record<string, unknown>) ?? {}).map(([key, value]) => [key, toNumber(value)]),
						),
						comparativo: mapComparativo((record.audit as Record<string, unknown>).comparativo),
						status: mapSimpleRows((record.audit as Record<string, unknown>).status),
						top_tools: mapSimpleRows((record.audit as Record<string, unknown>).top_tools),
						serie: mapSimpleRows((record.audit as Record<string, unknown>).serie),
						alertas_tools: mapSimpleRows((record.audit as Record<string, unknown>).alertas_tools),
					}
				: undefined,
		leads:
			record.leads && typeof record.leads === 'object' && !Array.isArray(record.leads)
				? {
						status: mapSimpleRows((record.leads as Record<string, unknown>).status),
						fontes: mapSimpleRows((record.leads as Record<string, unknown>).fontes),
						serie_mensal: mapSimpleRows((record.leads as Record<string, unknown>).serie_mensal),
					}
				: undefined,
		analytics,
	};
}
