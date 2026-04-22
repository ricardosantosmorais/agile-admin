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
				? {
						resumo: mapSimpleRow((record.apps as Record<string, unknown>).resumo),
						criacao_serie: mapSimpleRows((record.apps as Record<string, unknown>).criacao_serie),
						criacao_serie_mensal: mapSimpleRows((record.apps as Record<string, unknown>).criacao_serie_mensal),
						logs_status: mapSimpleRows((record.apps as Record<string, unknown>).logs_status),
						notificacoes_publicadas_serie_mensal: mapSimpleRows((record.apps as Record<string, unknown>).notificacoes_publicadas_serie_mensal),
						top_empresas_sem_app: mapSimpleRows((record.apps as Record<string, unknown>).top_empresas_sem_app),
						top_empresas_problemas_publicacao_build: mapSimpleRows((record.apps as Record<string, unknown>).top_empresas_problemas_publicacao_build),
					}
				: undefined,
		push:
			record.push && typeof record.push === 'object' && !Array.isArray(record.push)
				? {
						resumo: Object.fromEntries(
							Object.entries(((record.push as Record<string, unknown>).resumo as Record<string, unknown>) ?? {}).map(([key, value]) => [key, toNumber(value)]),
						),
						comparativo: mapComparativo((record.push as Record<string, unknown>).comparativo),
						tipos: mapSimpleRows((record.push as Record<string, unknown>).tipos),
						serie_envios: mapSimpleRows((record.push as Record<string, unknown>).serie_envios),
						serie_envios_mensal: mapSimpleRows((record.push as Record<string, unknown>).serie_envios_mensal),
						serie_interacoes: mapSimpleRows((record.push as Record<string, unknown>).serie_interacoes),
						serie_interacoes_mensal: mapSimpleRows((record.push as Record<string, unknown>).serie_interacoes_mensal),
						mensagens_externas_status: mapSimpleRows((record.push as Record<string, unknown>).mensagens_externas_status),
					}
				: undefined,
		processos:
			record.processos && typeof record.processos === 'object' && !Array.isArray(record.processos)
				? {
						resumo: Object.fromEntries(
							Object.entries(((record.processos as Record<string, unknown>).resumo as Record<string, unknown>) ?? {}).map(([key, value]) => [key, toNumber(value)]),
						),
						comparativo: mapComparativo((record.processos as Record<string, unknown>).comparativo),
						status: mapSimpleRows((record.processos as Record<string, unknown>).status),
						tipos: mapSimpleRows((record.processos as Record<string, unknown>).tipos),
						serie: mapSimpleRows((record.processos as Record<string, unknown>).serie),
						serie_mensal: mapSimpleRows((record.processos as Record<string, unknown>).serie_mensal),
						logs_tipos: mapSimpleRows((record.processos as Record<string, unknown>).logs_tipos),
						logs_resumo: mapSimpleRow((record.processos as Record<string, unknown>).logs_resumo),
						alertas_falha_recente: mapSimpleRows((record.processos as Record<string, unknown>).alertas_falha_recente),
					}
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
		analytics:
			record.analytics && typeof record.analytics === 'object' && !Array.isArray(record.analytics)
				? {
						resumo: Object.fromEntries(
							Object.entries(((record.analytics as Record<string, unknown>).resumo as Record<string, unknown>) ?? {}).map(([key, value]) => [key, toNumber(value)]),
						),
						comparativo: mapComparativo((record.analytics as Record<string, unknown>).comparativo),
						vendas_series_mensal: mapSimpleRows((record.analytics as Record<string, unknown>).vendas_series_mensal),
						ranking_faturamento: mapSimpleRows((record.analytics as Record<string, unknown>).ranking_faturamento),
						ranking_pedidos: mapSimpleRows((record.analytics as Record<string, unknown>).ranking_pedidos),
						engajamento_empresas: mapSimpleRows((record.analytics as Record<string, unknown>).engajamento_empresas),
						empresas_mais_produtos: mapSimpleRows((record.analytics as Record<string, unknown>).empresas_mais_produtos),
						pedidos_status: mapSimpleRows((record.analytics as Record<string, unknown>).pedidos_status),
						empresas_sinais_queda: mapSimpleRows((record.analytics as Record<string, unknown>).empresas_sinais_queda),
						sincronizacao_resumo: mapSimpleRow((record.analytics as Record<string, unknown>).sincronizacao_resumo),
						sincronizacao_status: mapSimpleRows((record.analytics as Record<string, unknown>).sincronizacao_status),
						sincronizacao_execucoes_recentes: mapSimpleRows((record.analytics as Record<string, unknown>).sincronizacao_execucoes_recentes),
						cobertura_dados: mapSimpleRows((record.analytics as Record<string, unknown>).cobertura_dados),
					}
				: undefined,
	};
}
