'use client';

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCcw } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { AppDataTable } from '@/src/components/data-table/app-data-table';
import type { AppDataTableColumn } from '@/src/components/data-table/types';
import { AsyncState } from '@/src/components/ui/async-state';
import { DateRangeComparativePicker, type DateRangePreset, type DateRangeValue } from '@/src/components/ui/date-range-comparative-picker';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatCard } from '@/src/components/ui/stat-card';
import { useDashboardRootSequencedSnapshot, type DashboardRootPhaseId } from '@/src/features/dashboard-root-agileecommerce/hooks/use-dashboard-root-sequenced-snapshot';
import {
	formatDashboardRootAgentEventType,
	formatDashboardRootAgentRole,
	formatDashboardRootAttentionLabel,
	formatDashboardRootBuildStatus,
	formatDashboardRootCompanyStatus,
	formatDashboardRootOrderStatus,
	formatDashboardRootPlatform,
	formatDashboardRootProcessStatus,
	formatDashboardRootProcessType,
	formatDashboardRootToolName,
	formatDashboardRootTransportStatus,
} from '@/src/features/dashboard-root-agileecommerce/services/dashboard-root-agileecommerce-formatters';
import type { DashboardRootSimpleRow, DashboardRootSnapshot } from '@/src/features/dashboard-root-agileecommerce/types/dashboard-root-agileecommerce';
import { useIntersectionOnce } from '@/src/hooks/use-intersection-once';
import { useI18n } from '@/src/i18n/use-i18n';
import { formatCurrency, formatDate, formatNumber } from '@/src/lib/formatters';
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button';

const chartPalette = ['#195f4d', '#0f766e', '#0284c7', '#f59e0b', '#e11d48', '#334155'];
const MAX_DAYS = 365;
const STORAGE_KEY = 'dashboard_agileecommerce';

type StoredDashboardRange = {
	label?: string;
	start: string;
	end: string;
	previousStart?: string | null;
	previousEnd?: string | null;
};

function formatDateInput(date: Date) {
	return date.toISOString().slice(0, 10);
}

function createPreviousRange(range: DateRangeValue) {
	const startDate = new Date(`${range.start}T00:00:00`);
	const endDate = new Date(`${range.end}T00:00:00`);
	const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
	const previousEnd = new Date(startDate);
	previousEnd.setDate(previousEnd.getDate() - 1);
	const previousStart = new Date(previousEnd);
	previousStart.setDate(previousStart.getDate() - days + 1);

	return {
		start: formatDateInput(previousStart),
		end: formatDateInput(previousEnd),
	};
}

function getPresets(t: ReturnType<typeof useI18n>['t']): DateRangePreset[] {
	const today = new Date();
	const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
	const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
	const last30Start = new Date(today);
	last30Start.setDate(last30Start.getDate() - 29);
	const last90Start = new Date(today);
	last90Start.setDate(last90Start.getDate() - 89);

	return [
		{ id: 'mes_atual', label: t('dashboardRoot.presets.currentMonth', 'Mês atual'), range: { start: formatDateInput(currentMonthStart), end: formatDateInput(currentMonthEnd) } },
		{ id: 'ultimos_30_dias', label: t('dashboardRoot.presets.last30Days', 'Últimos 30 dias'), range: { start: formatDateInput(last30Start), end: formatDateInput(today) } },
		{ id: 'ultimos_90_dias', label: t('dashboardRoot.presets.last90Days', 'Últimos 90 dias'), range: { start: formatDateInput(last90Start), end: formatDateInput(today) } },
	];
}

function readStoredDashboardRange() {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return null;
		}

		const parsed = JSON.parse(raw) as Partial<StoredDashboardRange>;
		if (!parsed.start || !parsed.end) {
			return null;
		}

		return {
			label: parsed.label,
			start: parsed.start,
			end: parsed.end,
			previousStart: parsed.previousStart ?? null,
			previousEnd: parsed.previousEnd ?? null,
		} satisfies StoredDashboardRange;
	} catch {
		return null;
	}
}

function parseNumber(value: unknown) {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : 0;
	}

	if (typeof value === 'string') {
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : 0;
	}

	return 0;
}

function formatChartValue(value: unknown, formatter?: (value: number) => string) {
	const numericValue = parseNumber(value);
	return formatter ? formatter(numericValue) : formatNumber(numericValue);
}

function parseText(value: unknown, fallback = '-') {
	if (typeof value === 'string' && value.trim()) {
		return value;
	}

	if (typeof value === 'number') {
		return String(value);
	}

	return fallback;
}

function SectionSkeleton({ lines = 3, chart = false }: { lines?: number; chart?: boolean }) {
	return (
		<div className="space-y-3">
			{chart ? <div className="app-pane-muted h-56 animate-pulse rounded-2xl" /> : null}
			{Array.from({ length: lines }).map((_, index) => (
				<div key={index} className="app-pane-muted h-10 animate-pulse rounded-2xl" />
			))}
		</div>
	);
}

function LazyDashboardSection({
	phaseIds,
	isReady,
	fallback,
	requestPhases,
	children,
}: {
	phaseIds: DashboardRootPhaseId[];
	isReady: boolean;
	fallback: ReactNode;
	requestPhases: (phaseIds: DashboardRootPhaseId | DashboardRootPhaseId[]) => void;
	children: ReactNode;
}) {
	const { ref, hasIntersected } = useIntersectionOnce<HTMLDivElement>();

	useEffect(() => {
		if (!hasIntersected) {
			return;
		}

		requestPhases(phaseIds);
	}, [hasIntersected, phaseIds, requestPhases]);

	return <div ref={ref}>{isReady ? children : fallback}</div>;
}

function InfoTooltipButton({ label }: { label: string }) {
	return (
		<TooltipIconButton label={label}>
			<button
				type="button"
				className="app-button-secondary inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-[color:var(--app-muted)] shadow-sm"
				aria-label={label}
			>
				i
			</button>
		</TooltipIconButton>
	);
}

function MetricTile({
	label,
	value,
	helper,
	tooltip,
	tone = 'slate',
}: {
	label: string;
	value: string;
	helper: string;
	tooltip?: string;
	tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'rose';
}) {
	const toneMap = {
		slate: 'app-pane-muted border-line/70',
		emerald: 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-400/35 dark:bg-emerald-500/12',
		sky: 'border-sky-200/80 bg-sky-50/70 dark:border-sky-400/35 dark:bg-sky-500/12',
		amber: 'border-amber-200/80 bg-amber-50/70 dark:border-amber-400/35 dark:bg-amber-500/12',
		rose: 'border-rose-200/80 bg-rose-50/70 dark:border-rose-400/35 dark:bg-rose-500/12',
	};

	return (
		<div className={`rounded-3xl border px-4 py-4 ${toneMap[tone]}`}>
			<div className="flex items-start justify-between gap-2">
				<div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--app-muted)]">{label}</div>
				{tooltip ? <InfoTooltipButton label={tooltip} /> : null}
			</div>
			<div className="mt-2 text-2xl font-black tracking-tight text-[color:var(--app-text)]">{value}</div>
			<div className="mt-2 text-[11px] leading-4 text-[color:var(--app-muted)]">{helper}</div>
		</div>
	);
}

function ChartTooltip({
	active,
	payload,
	label,
	formatter,
	labelFormatter,
}: {
	active?: boolean;
	payload?: Array<{ name?: string; value?: unknown; color?: string }>;
	label?: string | number;
	formatter?: (value: unknown) => string;
	labelFormatter?: (label: string | number) => string;
}) {
	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div className="app-card-modern rounded-[1rem] px-3 py-2.5 text-[12px] shadow-xl">
			{typeof label !== 'undefined' ? <div className="mb-1 font-semibold text-[color:var(--app-text)]">{labelFormatter ? labelFormatter(label) : label}</div> : null}
			<div className="space-y-1">
				{payload.map((entry, index) => (
					<div key={`${entry.name ?? 'value'}-${index}`} className="flex items-center gap-2 text-[color:var(--app-muted)]">
						<span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? chartPalette[index % chartPalette.length] }} aria-hidden="true" />
						<span className="font-medium text-[color:var(--app-text)]">{entry.name ?? 'value'}:</span>
						<span>{formatter ? formatter(entry.value) : formatChartValue(entry.value)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function buildAttentionCardCopy(key: string, t: ReturnType<typeof useI18n>['t']) {
	switch (key) {
		case 'empresas_bloqueadas':
			return {
				helper: t('dashboardRoot.attention.empresasBloqueadasHelper', 'Empresas bloqueadas e potencialmente impedidas de operar normalmente no ambiente root.'),
				tooltip: t('dashboardRoot.attention.empresasBloqueadasTooltip', 'Ajuda a dimensionar impacto operacional imediato na carteira administrada.'),
			};
		case 'empresas_manutencao':
			return {
				helper: t('dashboardRoot.attention.empresasManutencaoHelper', 'Empresas em manutenção que exigem leitura de estabilidade e acompanhamento técnico.'),
				tooltip: t('dashboardRoot.attention.empresasManutencaoTooltip', 'Indica contas que podem estar com experiência degradada ou operação temporariamente limitada.'),
			};
		case 'empresas_sem_app':
			return {
				helper: t('dashboardRoot.attention.empresasSemAppHelper', 'Empresas da carteira sem aplicativo publicado ou vinculado no momento.'),
				tooltip: t('dashboardRoot.attention.empresasSemAppTooltip', 'Serve para priorizar oportunidades de implantação, publicação ou retomada do canal mobile.'),
			};
		case 'empresas_com_build_falho_recente':
			return {
				helper: t('dashboardRoot.attention.empresasComBuildFalhoHelper', 'Empresas com falha recente de build ou publicação em seus aplicativos.'),
				tooltip: t('dashboardRoot.attention.empresasComBuildFalhoTooltip', 'Leitura rápida para triagem de incidentes de entrega e publicação do app.'),
			};
		default:
			return {
				helper: t('dashboardRoot.attention.defaultHelper', 'Indicador de atenção operacional da carteira root.'),
				tooltip: t('dashboardRoot.attention.defaultTooltip', 'Sinal complementar para leitura da saúde operacional da plataforma.'),
			};
	}
}

function aggregateLegendData(data: Array<{ name: string; value: number }>, limit = 5) {
	const sorted = [...data].sort((left, right) => right.value - left.value);
	if (sorted.length <= limit) {
		return sorted;
	}

	const visible = sorted.slice(0, limit);
	const othersValue = sorted.slice(limit).reduce((total, item) => total + item.value, 0);
	if (othersValue > 0) {
		visible.push({ name: 'Outros', value: othersValue });
	}

	return visible;
}

function StatusDonutCard({
	data,
	totalLabel,
	tooltip,
}: {
	data: Array<{ name: string; value: number }>;
	totalLabel: string;
	tooltip?: string;
}) {
	const { t } = useI18n();
	if (!data.length) {
		return <div className="text-sm text-slate-500">{t('dashboardRoot.empty', 'Sem dados para este período.')}</div>;
	}

	const visibleData = aggregateLegendData(data, 5);
	const total = visibleData.reduce((sum, item) => sum + item.value, 0);

	return (
		<div className="space-y-4">
			<div className="relative mx-auto h-64 w-full max-w-[320px]">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie data={visibleData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={3} stroke="var(--app-panel-solid)" strokeWidth={2}>
							{visibleData.map((entry, index) => (
								<Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
							))}
						</Pie>
						<Tooltip content={<ChartTooltip formatter={(value) => formatNumber(parseNumber(value))} />} />
					</PieChart>
				</ResponsiveContainer>
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="app-card-modern rounded-full px-4 py-3 text-center shadow-sm">
						<div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--app-muted)]">{totalLabel}</div>
						<div className="mt-1 text-xl font-black tracking-tight text-[color:var(--app-text)]">{formatNumber(total)}</div>
					</div>
				</div>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between gap-2">
					<div className="text-[11px] leading-5 text-[color:var(--app-muted)]">{t('dashboardRoot.ordersStatusLegend', 'Leitura dos principais status que compoem o volume de pedidos no periodo.')}</div>
					{tooltip ? <InfoTooltipButton label={tooltip} /> : null}
				</div>
				<div className="grid gap-2 sm:grid-cols-2">
					{visibleData.map((item, index) => {
						const percentage = total > 0 ? (item.value / total) * 100 : 0;

						return (
							<div key={item.name} className="app-pane-muted flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5">
								<div className="flex min-w-0 items-center gap-2.5">
									<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} aria-hidden="true" />
									<div className="min-w-0">
										<div className="truncate text-sm font-semibold text-[color:var(--app-text)]">{item.name}</div>
										<div className="text-[11px] text-[color:var(--app-muted)]">{formatNumber(percentage)}%</div>
									</div>
								</div>
								<div className="text-sm font-semibold text-[color:var(--app-text)]">{formatNumber(item.value)}</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function LineChartCard({
	data,
	dataKey,
	titleKey,
	color = chartPalette[0],
	formatValue,
	comparisonDataKey,
	comparisonColor = chartPalette[2],
	comparisonName,
	primaryName,
	labelFormatter,
}: {
	data: DashboardRootSimpleRow[];
	dataKey: string;
	titleKey: string;
	color?: string;
	formatValue?: (value: number) => string;
	comparisonDataKey?: string;
	comparisonColor?: string;
	comparisonName?: string;
	primaryName?: string;
	labelFormatter?: (label: string | number) => string;
}) {
	const { t } = useI18n();
	if (!data.length) {
		return <div className="text-sm text-slate-500">{t('dashboardRoot.empty', 'Sem dados para este período.')}</div>;
	}

	return (
		<div className="h-64 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
					<XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--app-muted)' }} stroke="var(--app-border)" />
					<YAxis tick={{ fontSize: 12, fill: 'var(--app-muted)' }} stroke="var(--app-border)" tickFormatter={(value) => formatChartValue(value, formatValue)} />
					<Tooltip content={<ChartTooltip formatter={(value) => formatChartValue(value, formatValue)} labelFormatter={(label) => (labelFormatter ? labelFormatter(label) : `${t(titleKey, titleKey)}: ${label}`)} />} />
					<Line type="monotone" dataKey={dataKey} name={primaryName ?? t('dashboardRoot.chart.currentPeriod', 'Período atual')} stroke={color} strokeWidth={2.5} dot={false} />
					{comparisonDataKey ? (
						<Line
							type="monotone"
							dataKey={comparisonDataKey}
							name={comparisonName ?? t('dashboardRoot.chart.previousPeriod', 'Período anterior')}
							stroke={comparisonColor}
							strokeWidth={2}
							strokeDasharray="6 4"
							dot={false}
						/>
					) : null}
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

function BarChartCard({
	data,
	dataKey,
	categoryKey = 'label',
	formatValue,
}: {
	data: DashboardRootSimpleRow[];
	dataKey: string;
	categoryKey?: string;
	formatValue?: (value: number) => string;
}) {
	const { t } = useI18n();
	if (!data.length) {
		return <div className="text-sm text-slate-500">{t('dashboardRoot.empty', 'Sem dados para este período.')}</div>;
	}

	return (
		<div className="h-64 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
					<XAxis dataKey={categoryKey} tick={{ fontSize: 12, fill: 'var(--app-muted)' }} stroke="var(--app-border)" />
					<YAxis tick={{ fontSize: 12, fill: 'var(--app-muted)' }} stroke="var(--app-border)" tickFormatter={(value) => formatChartValue(value, formatValue)} />
					<Tooltip content={<ChartTooltip formatter={(value) => formatChartValue(value, formatValue)} />} />
					<Bar dataKey={dataKey} radius={[8, 8, 0, 0]} fill={chartPalette[0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

function PieChartCard({ data }: { data: Array<{ name: string; value: number }> }) {
	const { t } = useI18n();
	if (!data.length) {
		return <div className="text-sm text-slate-500">{t('dashboardRoot.empty', 'Sem dados para este período.')}</div>;
	}

	return (
		<div className="h-64 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="var(--app-panel-solid)" strokeWidth={2}>
						{data.map((entry, index) => (
							<Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
						))}
					</Pie>
					<Tooltip content={<ChartTooltip formatter={(value) => formatChartValue(value)} />} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}

function SimpleTable({
	columns,
	rows,
	maxHeightClass,
}: {
	columns: Array<{ key: string; label: string; formatter?: (value: unknown, row: DashboardRootSimpleRow) => string }>;
	rows: DashboardRootSimpleRow[];
	maxHeightClass?: string;
}) {
	const { t } = useI18n();
	if (!rows.length) {
		return <div className="text-sm text-slate-500">{t('dashboardRoot.empty', 'Sem dados para este período.')}</div>;
	}

	const tableColumns = columns.map((column) => ({
		id: column.key,
		label: column.label,
		cell: (row: DashboardRootSimpleRow) => column.formatter ? column.formatter(row[column.key], row) : parseText(row[column.key]),
		tdClassName: 'text-[color:var(--app-text)]',
	})) satisfies AppDataTableColumn<DashboardRootSimpleRow>[];
	const boundedTableClassName = maxHeightClass
		? `relative z-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[1.25rem] [scrollbar-gutter:stable] ${maxHeightClass}`
		: 'relative z-0 min-w-0';

	return (
		<div className={boundedTableClassName}>
			<AppDataTable
				rows={rows}
				getRowId={(row) => `${parseText(row.id, '')}-${rows.indexOf(row)}`}
				columns={tableColumns}
				emptyMessage={t('dashboardRoot.empty', 'Sem dados para este período.')}
				mobileCard={{
					title: (row) => tableColumns[0]?.cell(row) ?? '-',
					subtitle: (row) => tableColumns[1]?.cell(row) ?? '',
				}}
			/>
		</div>
	);
}

function toSeries(rows: DashboardRootSimpleRow[], labelKey: string, valueKey: string, labelFormatter?: (value: unknown) => string) {
	return rows.map((row) => ({
		label: labelFormatter ? labelFormatter(row[labelKey]) : parseText(row[labelKey]),
		value: parseNumber(row[valueKey]),
	}));
}

function toNameValueSeries(rows: DashboardRootSimpleRow[], labelKey: string, valueKey: string, labelFormatter?: (value: unknown) => string) {
	return rows.map((row) => ({
		name: labelFormatter ? labelFormatter(row[labelKey]) : parseText(row[labelKey]),
		value: parseNumber(row[valueKey]),
	}));
}

function buildDailyComparisonSeries(currentRows: DashboardRootSimpleRow[], previousRows: DashboardRootSimpleRow[]) {
	const maxLength = Math.max(currentRows.length, previousRows.length);

	return Array.from({ length: maxLength }, (_, index) => {
		const current = currentRows[index] ?? {};
		const previous = previousRows[index] ?? {};
		const currentLabel = parseText(current.label, `#${index + 1}`);
		const previousLabel = parseText(previous.label, '-');

		return {
			label: currentLabel,
			currentValue: parseNumber(current.value),
			previousValue: parseNumber(previous.value),
			currentLabel,
			previousLabel,
		};
	});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildExecutiveCards(snapshot: DashboardRootSnapshot, t: ReturnType<typeof useI18n>['t']) {
	const resumo = snapshot.resumo;
	if (!resumo) {
		return [];
	}

	const comparativo = resumo.comparativo?.variacoes ?? {};

	return [
		{
			label: t('dashboardRoot.cards.activeCompanies', 'Empresas ativas'),
			value: resumo.carteira.empresas_ativas,
			variation: 0,
			type: 'number' as const,
			tone: 'emerald' as const,
			showComparison: false,
		},
		{
			label: t('dashboardRoot.cards.productionCompanies', 'Empresas em produção'),
			value: resumo.carteira.empresas_producao,
			variation: 0,
			type: 'number' as const,
			tone: 'sky' as const,
			showComparison: false,
		},
		{
			label: t('dashboardRoot.cards.homologationCompanies', 'Empresas em homologação'),
			value: resumo.carteira.empresas_homologacao,
			variation: 0,
			type: 'number' as const,
			tone: 'amber' as const,
			showComparison: false,
		},
		{
			label: t('dashboardRoot.cards.activeApps', 'Apps ativos'),
			value: resumo.carteira.apps_ativos,
			variation: 0,
			type: 'number' as const,
			tone: 'sky' as const,
			showComparison: false,
		},
		{
			label: t('dashboardRoot.cards.pushesInPeriod', 'Pushes no período'),
			value: resumo.periodo_atual.pushes_enviados,
			variation: comparativo.pushes_enviados ?? 0,
			type: 'number' as const,
			tone: 'emerald' as const,
			showComparison: resumo.comparativo !== null,
		},
		{
			label: t('dashboardRoot.cards.processErrors', 'Processos com erro no período'),
			value: resumo.periodo_atual.processos_erro,
			variation: comparativo.processos_erro ?? 0,
			type: 'number' as const,
			tone: 'rose' as const,
			showComparison: resumo.comparativo !== null,
		},
		{
			label: t('dashboardRoot.cards.agentExecutions', 'Execuções do agente no período'),
			value: resumo.periodo_atual.execucoes_agente,
			variation: comparativo.execucoes_agente ?? 0,
			type: 'number' as const,
			tone: 'amber' as const,
			showComparison: resumo.comparativo !== null,
		},
		{
			label: t('dashboardRoot.cards.mcpErrorRate', 'Taxa de erro MCP no período'),
			value: resumo.periodo_atual.taxa_erro_mcp,
			variation: comparativo.taxa_erro_mcp ?? 0,
			type: 'percent' as const,
			tone: 'rose' as const,
			showComparison: resumo.comparativo !== null,
		},
	];
}

function buildCommercialExecutiveCards(snapshot: DashboardRootSnapshot, t: ReturnType<typeof useI18n>['t'], hasComparison: boolean) {
	const analytics = snapshot.analytics;
	if (!analytics) {
		return [];
	}

	const comparativo = analytics.comparativo?.variacoes ?? {};

	const primaryCards = [
		{
			label: t('dashboardRoot.rootV2.cards.realizedGmv', 'Receita realizada'),
			value: parseNumber(analytics.resumo?.valor_total_vendas),
			variation: comparativo.valor_total_vendas ?? 0,
			type: 'currency' as const,
			tone: 'emerald' as const,
			showComparison: hasComparison,
			description: t('dashboardRoot.rootV2.executive.revenueDescription', 'Soma dos pedidos cuja data do pedido está no período e cujo status atual entra na regra comercial usada também no dashboard da empresa.'),
			tooltip: t('dashboardRoot.rootV2.executive.revenueTooltip', 'Usa a mesma regra comercial do dashboard da empresa: inclui pedidos em análise, aprovação, faturamento, separação, transporte e entrega; exclui carrinho, consulta, rejeitado, cancelado, estornado, devolvido e rascunho.'),
		},
		{
			label: t('dashboardRoot.rootV2.cards.realizedOrders', 'Pedidos realizados'),
			value: parseNumber(analytics.resumo?.total_pedidos),
			variation: comparativo.total_pedidos ?? 0,
			type: 'number' as const,
			tone: 'sky' as const,
			showComparison: hasComparison,
			description: t('dashboardRoot.rootV2.executive.ordersDescription', 'Quantidade de pedidos cuja data do pedido está no período e cujo status atual entra na regra comercial usada também no dashboard da empresa.'),
			tooltip: t('dashboardRoot.rootV2.executive.ordersTooltip', 'Usa exatamente a mesma regra da receita realizada para manter volume e receita consistentes.'),
		},
		{
			label: t('dashboardRoot.cards.averageTicketConsolidated', 'Ticket médio consolidado'),
			value: parseNumber(analytics.resumo?.ticket_medio_consolidado),
			variation: comparativo.ticket_medio_consolidado ?? 0,
			type: 'currency' as const,
			tone: 'amber' as const,
			showComparison: hasComparison,
			description: t('dashboardRoot.rootV2.executive.ticketDescription', 'Receita realizada dividida pelos pedidos realizados no período.'),
			tooltip: t('dashboardRoot.rootV2.executive.ticketTooltip', 'Calculado apenas com pedidos pela data do pedido e status atual dentro da regra comercial usada também no dashboard da empresa.'),
		},
		{
			label: t('dashboardRoot.cards.companiesWithSales', 'Empresas com venda no período'),
			value: parseNumber(analytics.resumo?.empresas_com_dados),
			variation: 0,
			type: 'number' as const,
			tone: 'sky' as const,
			showComparison: false,
			description: t('dashboardRoot.rootV2.executive.companiesWithSalesDescription', 'Empresas com pelo menos um pedido cuja data está no período e cujo status atual entra na regra comercial usada também no dashboard da empresa.'),
			tooltip: t('dashboardRoot.rootV2.executive.companiesWithSalesTooltip', 'Conta apenas empresas que contribuíram para a receita ou pedidos realizados exibidos no dashboard.'),
		},
	];

	if (!hasComparison) {
		return [
			...primaryCards,
			{
				label: t('dashboardRoot.rootV2.cards.cancelledPercentage', 'Percentual cancelado'),
				value: parseNumber(analytics.resumo?.percentual_cancelado),
				variation: 0,
				type: 'percent' as const,
				tone: parseNumber(analytics.resumo?.percentual_cancelado) > 10 ? ('rose' as const) : ('amber' as const),
				showComparison: false,
				description: t('dashboardRoot.rootV2.executive.cancelledPercentageDescription', 'Pedidos cancelados divididos por pedidos realizados mais pedidos cancelados no período.'),
				tooltip: t('dashboardRoot.rootV2.executive.cancelledPercentageTooltip', 'Usa pedidos pela data do pedido. Cancelados entram neste indicador e na distribuição geral por status, mas não entram na receita realizada.'),
			},
		];
	}

	return [
		...primaryCards,
		{
			label: t('dashboardRoot.rootV2.cards.revenueGrowth', 'Crescimento de receita realizada'),
			value: comparativo.valor_total_vendas ?? 0,
			variation: 0,
			type: 'percent' as const,
			tone: (comparativo.valor_total_vendas ?? 0) >= 0 ? ('emerald' as const) : ('rose' as const),
			showComparison: false,
			description: t('dashboardRoot.rootV2.executive.salesGrowthDescription', 'Variação percentual da receita realizada contra o período anterior equivalente.'),
			tooltip: t('dashboardRoot.rootV2.executive.salesGrowthTooltip', 'Compara apenas pedidos pela data do pedido e status atual dentro da regra comercial usada também no dashboard da empresa.'),
		},
		{
			label: t('dashboardRoot.cards.ordersGrowth', 'Crescimento de pedidos'),
			value: comparativo.total_pedidos ?? 0,
			variation: 0,
			type: 'percent' as const,
			tone: (comparativo.total_pedidos ?? 0) >= 0 ? ('sky' as const) : ('rose' as const),
			showComparison: false,
			description: t('dashboardRoot.rootV2.executive.ordersGrowthDescription', 'Variação percentual dos pedidos realizados contra o período anterior equivalente.'),
			tooltip: t('dashboardRoot.rootV2.executive.ordersGrowthTooltip', 'Usa a mesma regra comercial da receita realizada para separar volume de pedidos e ticket médio.'),
		},
		{
			label: t('dashboardRoot.cards.companiesInDecline', 'Empresas em queda'),
			value: parseNumber(analytics.resumo?.empresas_em_queda),
			variation: 0,
			type: 'number' as const,
			tone: 'rose' as const,
			showComparison: false,
			description: t('dashboardRoot.rootV2.executive.companiesInDeclineDescription', 'Empresas cuja receita realizada caiu em relação ao período anterior equivalente.'),
			tooltip: t('dashboardRoot.rootV2.executive.companiesInDeclineTooltip', 'Compara somente receita realizada, usando data do pedido e status atual dentro da regra comercial usada também no dashboard da empresa.'),
		},
		{
			label: t('dashboardRoot.rootV2.cards.cancelledPercentage', 'Percentual cancelado'),
			value: parseNumber(analytics.resumo?.percentual_cancelado),
			variation: 0,
			type: 'percent' as const,
			tone: parseNumber(analytics.resumo?.percentual_cancelado) > 10 ? ('rose' as const) : ('amber' as const),
			showComparison: false,
			description: t('dashboardRoot.rootV2.executive.cancelledPercentageDescription', 'Pedidos cancelados divididos por pedidos realizados mais pedidos cancelados no período.'),
			tooltip: t('dashboardRoot.rootV2.executive.cancelledPercentageTooltip', 'Usa pedidos pela data do pedido. Cancelados entram neste indicador e na distribuição geral por status, mas não entram na receita realizada.'),
		},
	];
}
function buildAnalyticsTrustCardsV2(snapshot: DashboardRootSnapshot, t: ReturnType<typeof useI18n>['t']) {
	const confianca = snapshot.analytics?.confianca;
	if (!confianca) {
		return [];
	}

	return [
		{
			label: t('dashboardRoot.trust.latestSalesUpdate', 'Última atualização comercial disponível'),
			value: parseText(confianca.ultima_data_vendas) !== '-' ? formatDate(parseText(confianca.ultima_data_vendas)) : '-',
			tooltip: t('dashboardRoot.trust.latestSalesUpdateTooltip', 'Mostra até que data a leitura comercial da carteira possui movimentação disponível para o dashboard.'),
			tone: 'slate' as const,
			helper: t('dashboardRoot.trust.latestSalesUpdateHelper', 'Data mais recente com movimentação comercial considerada no dashboard.'),
		},
		{
			label: t('dashboardRoot.trust.salesCoverage', 'Empresas com atualização comercial recente'),
			value: `${formatNumber(parseNumber(confianca.empresas_com_vendas_frescas))}/${formatNumber(parseNumber(confianca.empresas_total_root))}`,
			tooltip: t('dashboardRoot.trust.salesCoverageTooltip', 'Mostra quantas empresas têm leitura comercial recente o suficiente para sustentar com segurança os indicadores executivos.'),
			tone: 'emerald' as const,
			helper: `${formatNumber(parseNumber(confianca.cobertura_vendas_frescas_percentual))}% ${t('dashboardRoot.trust.salesCoverageHelper', 'da carteira com leitura comercial dentro da janela considerada confiável.')}`,
		},
		{
			label: t('dashboardRoot.trust.ordersCoverage', 'Empresas com atualização recente de pedidos'),
			value: `${formatNumber(parseNumber(confianca.empresas_com_pedidos_frescos))}/${formatNumber(parseNumber(confianca.empresas_total_root))}`,
			tooltip: t('dashboardRoot.trust.ordersCoverageTooltip', 'Mostra quantas empresas têm atualização recente da leitura de status atual dos pedidos.'),
			tone: 'sky' as const,
			helper: `${formatNumber(parseNumber(confianca.cobertura_pedidos_frescos_percentual))}% ${t('dashboardRoot.trust.ordersCoverageHelper', 'da carteira com leitura recente de status atual dos pedidos.')}`,
		},
		{
			label: t('dashboardRoot.trust.syncFailures', 'Falhas recentes de sincronização'),
			value: formatNumber(parseNumber(confianca.falhas_sincronizacao_periodo)),
			tooltip: t('dashboardRoot.trust.syncFailuresTooltip', 'Considera as sincronizações técnicas encerradas com falha nos últimos 7 dias, independentemente do período comercial filtrado.'),
			tone: parseNumber(confianca.falhas_sincronizacao_periodo) > 0 ? ('rose' as const) : ('amber' as const),
			helper: t('dashboardRoot.trust.syncFailuresHelper', 'Falhas técnicas registradas na janela operacional recente de 7 dias.'),
		},
	];
}

export function DashboardRootAgileecommercePage() {
	const { t } = useI18n();
	const presets = useMemo(() => getPresets(t), [t]);
	const [selectedRange, setSelectedRange] = useState<DateRangeValue>(() => {
		const stored = readStoredDashboardRange();
		return stored ? { start: stored.start, end: stored.end } : presets[1].range;
	});
	const [selectedPreviousRange, setSelectedPreviousRange] = useState<DateRangeValue | null>(() => {
		const stored = readStoredDashboardRange();
		if (stored?.previousStart && stored?.previousEnd) {
			return {
				start: stored.previousStart,
				end: stored.previousEnd,
			};
		}

		const baseRange = stored ? { start: stored.start, end: stored.end } : presets[1].range;
		return createPreviousRange(baseRange);
	});

	const selectedRangeLabel = useMemo(() => {
		const preset = presets.find((item) => item.range.start === selectedRange.start && item.range.end === selectedRange.end);
		if (preset) {
			return preset.label;
		}

		return `${selectedRange.start} a ${selectedRange.end}`;
	}, [presets, selectedRange.end, selectedRange.start]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const stored: StoredDashboardRange = {
			label: selectedRangeLabel,
			start: selectedRange.start,
			end: selectedRange.end,
			previousStart: selectedPreviousRange?.start ?? null,
			previousEnd: selectedPreviousRange?.end ?? null,
		};

		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
	}, [selectedPreviousRange, selectedRange.end, selectedRange.start, selectedRangeLabel]);

	const { snapshot, completedPhases, error, requestPhases, refreshSnapshot } = useDashboardRootSequencedSnapshot({
		startDate: selectedRange.start,
		endDate: selectedRange.end,
		previousStart: selectedPreviousRange?.start ?? null,
		previousEnd: selectedPreviousRange?.end ?? null,
	});
	const hasPhase = (phase: DashboardRootPhaseId) => completedPhases.includes(phase);
	const initialLoaded = hasPhase('summary');
	const productSummaryLoaded = hasPhase('productSummary');
	const productDetailLoaded = hasPhase('productDetail');
	const engagementSummaryLoaded = hasPhase('engagementSummary');
	const engagementDetailLoaded = hasPhase('engagementDetail');
	const operationsSummaryLoaded = hasPhase('operationsSummary');
	const operationsDetailLoaded = hasPhase('operationsDetail');
	const hasComparison = selectedPreviousRange !== null && snapshot?.analytics?.comparativo !== null;

	const cards = useMemo(() => (snapshot ? buildCommercialExecutiveCards(snapshot, t, hasComparison) : []), [hasComparison, snapshot, t]);
	const trustCards = useMemo(() => (snapshot ? buildAnalyticsTrustCardsV2(snapshot, t) : []), [snapshot, t]);
	const primaryCards = useMemo(() => cards.slice(0, 4), [cards]);
	const secondaryCards = useMemo(() => (hasComparison ? cards.slice(4) : cards.slice(-1)), [cards, hasComparison]);
	const companyStatusPie = useMemo(
		() => toNameValueSeries(snapshot?.empresas?.status ?? [], 'status', 'total', (value) => formatDashboardRootCompanyStatus(value, t)),
		[snapshot, t],
	);
	const clusterBars = useMemo(() => toSeries(snapshot?.empresas?.clusters ?? [], 'nome', 'total'), [snapshot]);
	const erpBars = useMemo(() => toSeries(snapshot?.empresas?.erps ?? [], 'erp', 'total'), [snapshot]);
	const appMonthlySeries = useMemo(() => toSeries(snapshot?.apps?.criacao_serie_mensal ?? [], 'mes', 'total'), [snapshot]);
	const notificationsMonthlySeries = useMemo(() => toSeries(snapshot?.apps?.notificacoes_publicadas_serie_mensal ?? [], 'mes', 'total'), [snapshot]);
	const pushMonthlySeries = useMemo(() => toSeries(snapshot?.push?.serie_envios_mensal ?? [], 'mes', 'total'), [snapshot]);
	const pushInteractionMonthlySeries = useMemo(() => toSeries(snapshot?.push?.serie_interacoes_mensal ?? [], 'mes', 'total'), [snapshot]);
	const processMonthlySeries = useMemo(() => toSeries(snapshot?.processos?.serie_mensal ?? [], 'mes', 'total'), [snapshot]);
	const processStatusPie = useMemo(
		() => toNameValueSeries(snapshot?.processos?.status ?? [], 'status', 'total', (value) => formatDashboardRootProcessStatus(value, t)),
		[snapshot, t],
	);
	const processTypesBars = useMemo(() => toSeries(snapshot?.processos?.tipos ?? [], 'tipo', 'total', (value) => formatDashboardRootProcessType(value, t)), [snapshot, t]);
	const agentDailySeries = useMemo(
		() => toSeries(snapshot?.agent?.execucoes_serie_diaria ?? [], 'data', 'total').map((item) => ({ ...item, label: item.label ? formatDate(item.label) : item.label })),
		[snapshot],
	);
	const auditStatusPie = useMemo(() => toNameValueSeries(snapshot?.audit?.status ?? [], 'status', 'total', (value) => formatDashboardRootBuildStatus(value, t)), [snapshot, t]);
	const analyticsRevenueDailySeries = useMemo(
		() => toSeries(snapshot?.analytics?.vendas_series_diaria ?? [], 'data', 'valor_total_vendas').map((item) => ({ ...item, label: item.label ? formatDate(item.label) : item.label })),
		[snapshot],
	);
	const analyticsRevenueDailyPreviousSeries = useMemo(
		() =>
			toSeries(snapshot?.analytics?.vendas_series_diaria_anterior ?? [], 'data', 'valor_total_vendas').map((item) => ({
				...item,
				label: item.label ? formatDate(item.label) : item.label,
			})),
		[snapshot],
	);
	const analyticsRevenueDailyComparisonSeries = useMemo(
		() => buildDailyComparisonSeries(analyticsRevenueDailySeries, analyticsRevenueDailyPreviousSeries),
		[analyticsRevenueDailyPreviousSeries, analyticsRevenueDailySeries],
	);
	const analyticsRevenueSeries = useMemo(() => toSeries(snapshot?.analytics?.vendas_series_mensal ?? [], 'mes', 'valor_total_vendas'), [snapshot]);
	const analyticsOrderStatusPie = useMemo(
		() => toNameValueSeries(snapshot?.analytics?.pedidos_status ?? [], 'status_pedido', 'total_pedidos', (value) => formatDashboardRootOrderStatus(value, t)),
		[snapshot, t],
	);
	const analyticsOrdersSeries = useMemo(() => toSeries(snapshot?.analytics?.vendas_series_mensal ?? [], 'mes', 'total_pedidos'), [snapshot]);
	const topTools = snapshot?.audit?.top_tools ?? [];

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[{ label: t('routes.dashboard', 'Início'), href: '/dashboard' }, { label: t('dashboardRoot.title', 'Dashboard Agileecommerce') }]}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<DateRangeComparativePicker
							value={selectedRange}
							onChange={setSelectedRange}
							previousValue={selectedPreviousRange}
							onPreviousChange={setSelectedPreviousRange}
							presets={presets}
							maxDays={MAX_DAYS}
						/>
						<button type="button" onClick={refreshSnapshot} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
							<RefreshCcw className="h-4 w-4" />
							{t('common.refresh', 'Atualizar')}
						</button>
					</div>
				}
			/>

			<AsyncState isLoading={!initialLoaded && !error} error={!initialLoaded ? error : ''}>
				{snapshot ? (
					<>
						{error && initialLoaded ? <div className="app-warning-panel rounded-2xl px-4 py-3 text-sm">{error}</div> : null}

						<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
							{primaryCards.map((card) => (
								<StatCard
									key={card.label}
									label={card.label}
									value={card.value}
									variation={card.variation}
									type={card.type}
									tone={card.tone}
									showComparison={card.showComparison}
									description={card.description}
									tooltip={card.tooltip}
								/>
							))}
						</div>

						<LazyDashboardSection
							phaseIds={['commercial']}
							isReady={hasPhase('commercial')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboardRoot.executiveStoryTitle', 'Pulso comercial da carteira')}
									description={t('dashboardRoot.executiveStoryDescription', 'Uma leitura rápida da receita realizada e dos sinais que merecem atenção no período selecionado.')}
								>
									<SectionSkeleton lines={4} chart />
								</SectionCard>
							}
						>
							<SectionCard
								title={t('dashboardRoot.executiveStoryTitle', 'Pulso comercial da carteira')}
								description={t('dashboardRoot.executiveStoryDescription', 'Uma leitura rápida da receita realizada e dos sinais que merecem atenção no período selecionado.')}
								action={<InfoTooltipButton label={t('dashboardRoot.executiveStoryTooltip', 'O gráfico usa pedidos pela data do pedido e status atual dentro da regra comercial usada também no dashboard da empresa; os cards laterais destacam crescimento, risco e cobertura do dado.')} />}
							>
								<div className="space-y-4">
									<div className="app-pane-muted rounded-[1.6rem] p-4">
										<div className="mb-3 flex flex-wrap items-start justify-between gap-3">
											<div>
												<div className="text-sm font-semibold text-slate-800">{t('dashboardRoot.rootV2.charts.realizedRevenueDaily', 'Receita realizada por dia')}</div>
												<div className="text-[11px] leading-5 text-slate-500">{t('dashboardRoot.executiveStoryChartLegendDaily', 'Evolução diária da receita realizada, com comparação contra o período anterior quando disponível.')}</div>
											</div>
											<div className="app-button-secondary rounded-full px-3 py-1 text-[11px] font-semibold text-[color:var(--app-muted)]">{selectedRangeLabel}</div>
										</div>
										<LineChartCard
										data={hasComparison ? analyticsRevenueDailyComparisonSeries : analyticsRevenueDailySeries}
										dataKey={hasComparison ? 'currentValue' : 'value'}
										comparisonDataKey={hasComparison ? 'previousValue' : undefined}
										titleKey="dashboardRoot.rootV2.charts.realizedRevenueDaily"
										formatValue={formatCurrency}
										labelFormatter={(label) => {
											if (!hasComparison) {
												return `${t('dashboardRoot.rootV2.charts.realizedRevenueDaily', 'Receita realizada por dia')}: ${label}`;
											}

											const row = analyticsRevenueDailyComparisonSeries.find((item) => item.label === label);
											if (!row) {
												return `${t('dashboardRoot.rootV2.charts.realizedRevenueDaily', 'Receita realizada por dia')}: ${label}`;
											}

											return `${t('dashboardRoot.chart.currentPeriod', 'Período atual')}: ${row.currentLabel} | ${t('dashboardRoot.chart.previousPeriod', 'Período anterior')}: ${row.previousLabel}`;
										}}
									/>
									</div>

									<div className="grid gap-3 md:grid-cols-2">
										{secondaryCards.map((card) => (
											<MetricTile
												key={card.label}
												label={card.label}
												value={card.type === 'currency' ? formatCurrency(card.value) : card.type === 'percent' ? `${formatNumber(card.value)}%` : formatNumber(card.value)}
												helper={card.description ?? t('dashboardRoot.executiveStoryFallback', 'Indicador complementar da leitura comercial.')}
												tooltip={card.tooltip}
												tone={card.tone === 'sky' ? 'sky' : card.tone === 'amber' ? 'amber' : card.tone === 'rose' ? 'rose' : 'emerald'}
											/>
										))}
									</div>
								</div>
							</SectionCard>
						</LazyDashboardSection>

						{trustCards.length ? (
							<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
								{trustCards.map((card) => (
									<MetricTile key={card.label} label={card.label} value={card.value} helper={card.helper} tooltip={card.tooltip} tone={card.tone} />
								))}
							</div>
						) : null}

												<LazyDashboardSection
							phaseIds={['analyticsCommercial']}
							isReady={hasPhase('analyticsCommercial')}
							requestPhases={requestPhases}
							fallback={
								<div className="space-y-4">
									<SectionCard
										title={t('dashboardRoot.analyticsExecutiveTitle', 'Visão executiva comercial')}
									description={t('dashboardRoot.rootV2.analyticsExecutiveDescription', 'Receita realizada, pedidos realizados e confiabilidade da leitura comercial root.')}
									>
										<SectionSkeleton lines={4} chart />
									</SectionCard>
									<div className="grid gap-4">
										<SectionCard title={t('dashboardRoot.rootV2.tables.revenueRanking', 'Ranking de receita realizada')}>
											<SectionSkeleton lines={6} />
										</SectionCard>
									</div>
								</div>
							}
						>
							<div className="space-y-4">
								<SectionCard
									title={t('dashboardRoot.analyticsExecutiveTitle', 'Visão executiva comercial')}
									description={t('dashboardRoot.rootV2.analyticsExecutiveDescription', 'Receita realizada, pedidos realizados e confiabilidade da leitura comercial root.')}
								>
									<div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
										<div className="space-y-4">
											<div className="app-pane-muted rounded-[1.4rem] p-4">
												<h3 className="mb-2 text-sm font-semibold text-slate-700">{t('dashboardRoot.rootV2.charts.realizedRevenueMonthly', 'Receita realizada por mês')}</h3>
												<p className="mb-3 text-[11px] leading-5 text-slate-500">{t('dashboardRoot.rootV2.chartLegend.revenueSeries', 'Evolução mensal da receita realizada, considerando pedidos pela data do pedido e status atual dentro da regra comercial usada também no dashboard da empresa.')}</p>
												<LineChartCard data={analyticsRevenueSeries} dataKey="value" titleKey="dashboardRoot.rootV2.charts.realizedRevenueMonthly" formatValue={formatCurrency} />
											</div>

											<div className="app-pane-muted rounded-[1.4rem] p-4">
												<h3 className="mb-2 text-sm font-semibold text-slate-700">{t('dashboardRoot.rootV2.charts.realizedOrdersMonthly', 'Pedidos realizados por mês')}</h3>
												<p className="mb-3 text-[11px] leading-5 text-slate-500">{t('dashboardRoot.rootV2.chartLegend.ordersSeries', 'Evolução mensal dos pedidos realizados, usando a mesma regra da receita realizada.')}</p>
												<LineChartCard data={analyticsOrdersSeries} dataKey="value" titleKey="dashboardRoot.rootV2.charts.realizedOrdersMonthly" />
											</div>
										</div>

										<div className="app-pane rounded-[1.4rem] p-4">
											<h3 className="mb-2 text-sm font-semibold text-slate-700">{t('dashboardRoot.rootV2.charts.ordersByCurrentStatus', 'Pedidos por status atual')}</h3>
											<p className="mb-3 text-[11px] leading-5 text-slate-500">{t('dashboardRoot.rootV2.chartLegend.ordersStatus', 'Distribuição atual dos pedidos cuja data está no período selecionado, agrupados pelo status atual.')}</p>
											<StatusDonutCard
												data={analyticsOrderStatusPie}
												totalLabel={t('dashboardRoot.rootV2.cards.ordersInPeriod', 'Pedidos do período')}
												tooltip={t('dashboardRoot.rootV2.chartTooltip.ordersStatusLegend', 'Mostra o peso percentual de cada status atual entre os pedidos com data no período. Não representa sequência histórica de status.')}
											/>
										</div>
									</div>
								</SectionCard>

								<div className="grid gap-4">
									<div className="grid gap-3 md:grid-cols-3">
										<MetricTile
											label={t('dashboardRoot.rootV2.cards.companiesWithoutSales', 'Empresas sem venda')}
											value={formatNumber(parseNumber(snapshot.analytics?.resumo?.empresas_sem_venda))}
											helper={t('dashboardRoot.rootV2.portfolio.companiesWithoutSalesHelper', 'Carteira sem pedido realizado no período selecionado.')}
											tooltip={t('dashboardRoot.rootV2.portfolio.companiesWithoutSalesTooltip', 'Total root menos empresas com pelo menos um pedido cuja data está no período e cujo status atual entra na regra comercial usada também no dashboard da empresa.')}
											tone="amber"
										/>
										<MetricTile
											label={t('dashboardRoot.rootV2.cards.revenueConcentrationTop10', 'Concentração top 10')}
											value={`${formatNumber(parseNumber(snapshot.analytics?.concentracao_faturamento?.top_10_percentual))}%`}
											helper={t('dashboardRoot.rootV2.portfolio.revenueConcentrationTop10Helper', 'Participação das dez maiores empresas na receita realizada.')}
											tooltip={t('dashboardRoot.rootV2.portfolio.revenueConcentrationTop10Tooltip', 'Participação das 10 maiores contas dentro da receita realizada, usando data do pedido e status atual na regra comercial usada também no dashboard da empresa.')}
											tone="sky"
										/>
										<MetricTile
											label={t('dashboardRoot.cards.companiesInDecline', 'Empresas em queda')}
											value={formatNumber(parseNumber(snapshot.analytics?.resumo?.empresas_em_queda))}
											helper={t('dashboardRoot.rootV2.portfolio.companiesInDeclineHelper', 'Empresas que encolheram em receita realizada contra o período anterior equivalente.')}
											tooltip={t('dashboardRoot.rootV2.portfolio.companiesInDeclineTooltip', 'A queda compara apenas receita realizada dos dois períodos, usando data do pedido e status atual na regra comercial usada também no dashboard da empresa.')}
											tone="rose"
										/>
									</div>

									<SectionCard
										title={t('dashboardRoot.rootV2.tables.revenueRanking', 'Ranking de receita realizada')}
										description={t('dashboardRoot.rootV2.tables.revenueRankingDescription', 'Mostra as empresas que mais contribuem para a receita realizada no período escolhido.')}
										action={<InfoTooltipButton label={t('dashboardRoot.rootV2.tables.revenueRankingTooltip', 'Ranking calculado apenas com pedidos cuja data está no período e cujo status atual entra na regra comercial usada também no dashboard da empresa.')} />}
									>
										<SimpleTable
											rows={snapshot.analytics?.ranking_faturamento ?? []}
											maxHeightClass="max-h-[320px]"
											columns={[
												{ key: 'empresa_nome', label: t('dashboardRoot.table.company', 'Empresa') },
												{ key: 'valor_total_vendas', label: t('dashboardRoot.rootV2.table.realizedRevenue', 'Receita realizada'), formatter: (value) => formatCurrency(parseNumber(value)) },
												{ key: 'total_pedidos', label: t('dashboardRoot.table.orderCount', 'Pedidos'), formatter: (value) => formatNumber(parseNumber(value)) },
											]}
										/>
									</SectionCard>
								</div>

								{hasComparison ? (
									<div className="grid gap-4">
										<SectionCard
											title={t('dashboardRoot.rootV2.tables.declineSignals', 'Sinais de queda de receita realizada')}
											description={t('dashboardRoot.rootV2.tables.declineSignalsDescription', 'Empresas cuja receita realizada caiu no comparativo com o período anterior equivalente.')}
											action={<InfoTooltipButton label={t('dashboardRoot.rootV2.tables.declineSignalsTooltip', 'Compara somente receita realizada, usando data do pedido e status atual dentro da regra comercial usada também no dashboard da empresa.')} />}
										>
											<SimpleTable
												rows={snapshot.analytics?.empresas_sinais_queda ?? []}
												maxHeightClass="max-h-[320px]"
												columns={[
													{ key: 'empresa_nome', label: t('dashboardRoot.table.company', 'Empresa') },
													{ key: 'valor_anterior', label: t('dashboardRoot.rootV2.table.previousRealizedRevenue', 'Receita anterior'), formatter: (value) => formatCurrency(parseNumber(value)) },
													{ key: 'valor_atual', label: t('dashboardRoot.rootV2.table.currentRealizedRevenue', 'Receita atual'), formatter: (value) => formatCurrency(parseNumber(value)) },
													{ key: 'variacao_percentual', label: t('dashboardRoot.table.variation', 'Variação'), formatter: (value) => `${formatNumber(parseNumber(value))}%` },
												]}
											/>
										</SectionCard>
									</div>
								) : null}
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['analyticsOps']}
							isReady={hasPhase('analyticsOps')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboardRoot.analyticsOpsTitle', 'Operação analítica')}
									description={t('dashboardRoot.analyticsOpsDescription', 'Indicadores operacionais que ajudam a avaliar a consistência e o ritmo de atualização da base analítica.')}
								>
									<SectionSkeleton lines={4} />
								</SectionCard>
							}
						>
							<SectionCard
								title={t('dashboardRoot.analyticsOpsTitle', 'Operação analítica')}
								description={t('dashboardRoot.analyticsOpsDescription', 'Indicadores operacionais que ajudam a avaliar a consistência e o ritmo de atualização da base analítica.')}
								action={<InfoTooltipButton label={t('dashboardRoot.analyticsOpsTooltip', 'Mostra sinais de uso da base analítica e da saúde das sincronizações que alimentam o dashboard root.')} />}
							>
								<div className="grid gap-3 md:grid-cols-2">
									<MetricTile
										label={t('dashboardRoot.cards.syncExecutions', 'Execuções de sincronização')}
										value={formatNumber(parseNumber(snapshot.analytics?.sincronizacao_resumo?.total_execucoes))}
										helper={t('dashboardRoot.analyticsOps.syncExecutionsHelper', 'Volume de sincronizações técnicas registradas nos últimos 7 dias.')}
										tooltip={t('dashboardRoot.analyticsOps.syncExecutionsTooltip', 'Conta as rotinas que atualizaram ou tentaram atualizar a base analítica root.')}
										tone="amber"
									/>
									<MetricTile
										label={t('dashboardRoot.cards.syncErrors', 'Erros de sincronização')}
										value={formatNumber(parseNumber(snapshot.analytics?.sincronizacao_resumo?.erro))}
										helper={t('dashboardRoot.analyticsOps.syncErrorsHelper', 'Falhas acumuladas nas execuções da camada analítica dentro do intervalo.')}
										tooltip={t('dashboardRoot.analyticsOps.syncErrorsTooltip', 'Se este número cresce, a confiabilidade da leitura comercial tende a cair.')}
										tone={parseNumber(snapshot.analytics?.sincronizacao_resumo?.erro) > 0 ? 'rose' : 'slate'}
									/>
								</div>
							</SectionCard>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['platform']}
							isReady={hasPhase('platform')}
							requestPhases={requestPhases}
							fallback={
								<div className="space-y-4">
									<SectionCard
										title={t('dashboardRoot.platformHealthTitle', 'Saúde da plataforma')}
										description={t('dashboardRoot.platformHealthDescription', 'Distribuição da carteira e sinais de atenção do ambiente root.')}
									>
										<SectionSkeleton lines={4} chart />
									</SectionCard>
									<div className="grid gap-4 xl:grid-cols-2">
										<SectionCard
											title={t('dashboardRoot.charts.clusterDistribution', 'Empresas por cluster')}
											description={t('dashboardRoot.clusterDescription', 'Capacidade distribuída entre clusters e ERPs da carteira.')}
										>
											<SectionSkeleton lines={2} chart />
										</SectionCard>
										<SectionCard
											title={t('dashboardRoot.charts.erpDistribution', 'Empresas por ERP')}
											description={t('dashboardRoot.erpDescription', 'Concentração da base por ERP para leitura operacional.')}
										>
											<SectionSkeleton lines={2} chart />
										</SectionCard>
									</div>
								</div>
							}
						>
							<div className="space-y-4">
								<SectionCard
									title={t('dashboardRoot.platformHealthTitle', 'Saúde da plataforma')}
									description={t('dashboardRoot.platformHealthDescription', 'Distribuição da carteira e sinais de atenção do ambiente root.')}
									action={<InfoTooltipButton label={t('dashboardRoot.platformHealthTooltip', 'Consolida a distribuição da carteira e os principais alertas operacionais do ambiente root.')} />}
								>
									<div className="grid gap-4 lg:grid-cols-2">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.companyStatus', 'Empresas por status')}</h3>
											<PieChartCard data={companyStatusPie} />
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											{Object.entries(snapshot.empresas?.cards_atencao ?? {}).map(([key, value]) => {
												const copy = buildAttentionCardCopy(key, t);
												return (
													<MetricTile
														key={key}
														label={formatDashboardRootAttentionLabel(key, t)}
														value={formatNumber(Number(value))}
														helper={copy.helper}
														tooltip={copy.tooltip}
														tone={key === 'empresas_com_build_falho_recente' || key === 'empresas_bloqueadas' ? 'rose' : 'amber'}
													/>
												);
											})}
										</div>
									</div>
								</SectionCard>

								<div className="grid gap-4 xl:grid-cols-2">
									<SectionCard
										title={t('dashboardRoot.charts.clusterDistribution', 'Empresas por cluster')}
										description={t('dashboardRoot.clusterDescription', 'Capacidade distribuída entre clusters e ERPs da carteira.')}
										action={<InfoTooltipButton label={t('dashboardRoot.clusterTooltip', 'Mostra como a carteira está distribuída entre os clusters de infraestrutura e operação.')} />}
									>
										<BarChartCard data={clusterBars} dataKey="value" />
									</SectionCard>

									<SectionCard
										title={t('dashboardRoot.charts.erpDistribution', 'Empresas por ERP')}
										description={t('dashboardRoot.erpDescription', 'Concentração da base por ERP para leitura operacional.')}
										action={<InfoTooltipButton label={t('dashboardRoot.erpTooltip', 'Ajuda a entender a concentração da carteira por ERP e possíveis dependências operacionais.')} />}
									>
										<BarChartCard data={erpBars} dataKey="value" />
									</SectionCard>
								</div>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['productSummary', 'productDetail']}
							isReady={productSummaryLoaded}
							requestPhases={requestPhases}
							fallback={
								<div className="grid gap-4 xl:grid-cols-2">
									<SectionCard
										title={t('dashboardRoot.productOperationTitle', 'Operação de produto')}
										description={t('dashboardRoot.productOperationDescription', 'Crescimento de apps, builds e notificações publicadas.')}
									>
										<SectionSkeleton lines={4} chart />
									</SectionCard>
									<SectionCard
										title={t('dashboardRoot.tables.productAttention', 'Empresas sem app ou com problema de publicação/build')}
										description={t('dashboardRoot.productAttentionDescription', 'Lista operacional para priorização do time da plataforma.')}
									>
										<SectionSkeleton lines={6} />
									</SectionCard>
								</div>
							}
						>
							<div className="grid items-start gap-4 xl:grid-cols-2">
								<SectionCard
									title={t('dashboardRoot.productOperationTitle', 'Operação de produto')}
									description={t('dashboardRoot.productOperationDescription', 'Crescimento de apps, builds e notificações publicadas.')}
									action={<InfoTooltipButton label={t('dashboardRoot.productOperationTooltip', 'Leitura consolidada da evolução de apps, publicações e estabilidade operacional da frente de produto.')} />}
								>
									<div className="grid gap-4 lg:grid-cols-2">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.appsMonthly', 'Apps criados por mês')}</h3>
												<LineChartCard data={appMonthlySeries} dataKey="value" titleKey="dashboardRoot.charts.appsMonthly" />
										</div>
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.publishedNotificationsMonthly', 'Notificações publicadas por mês')}</h3>
												<LineChartCard data={notificationsMonthlySeries} dataKey="value" titleKey="dashboardRoot.charts.publishedNotificationsMonthly" />
										</div>
									</div>
									<div className="mt-4">
										<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.tables.buildStatus', 'Builds por plataforma e status')}</h3>
										<SimpleTable
											rows={snapshot.apps?.logs_status ?? []}
											maxHeightClass="max-h-[320px]"
											columns={[
												{ key: 'plataforma', label: t('dashboardRoot.table.platform', 'Plataforma'), formatter: (value) => formatDashboardRootPlatform(value, t) },
												{ key: 'status', label: t('dashboardRoot.table.status', 'Status'), formatter: (value) => formatDashboardRootBuildStatus(value, t) },
												{ key: 'total', label: t('dashboardRoot.table.total', 'Total'), formatter: (value) => formatNumber(parseNumber(value)) },
											]}
										/>
									</div>
								</SectionCard>

								<SectionCard
									title={t('dashboardRoot.tables.productAttention', 'Empresas sem app ou com problema de publicação/build')}
									description={t('dashboardRoot.productAttentionDescription', 'Lista operacional para priorização do time da plataforma.')}
									action={<InfoTooltipButton label={t('dashboardRoot.productAttentionTooltip', 'Agrupa contas sem app e contas com falhas recentes de build ou publicação para priorização operacional.')} />}
								>
									{productDetailLoaded ? (
										<div className="space-y-4">
											<div>
												<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.tables.companiesWithoutApp', 'Empresas sem app')}</h3>
												<SimpleTable
													rows={snapshot.apps?.top_empresas_sem_app ?? []}
													maxHeightClass="max-h-[260px]"
													columns={[
														{ key: 'nome_fantasia', label: t('dashboardRoot.table.company', 'Empresa') },
														{ key: 'status', label: t('dashboardRoot.table.status', 'Status'), formatter: (value) => formatDashboardRootCompanyStatus(value, t) },
													]}
												/>
											</div>
											<div>
												<h3 className="mb-3 text-sm font-semibold text-slate-700">
													{t('dashboardRoot.tables.companiesWithBuildIssues', 'Empresas com problema de build/publicação')}
												</h3>
												<SimpleTable
													rows={snapshot.apps?.top_empresas_problemas_publicacao_build ?? []}
													maxHeightClass="max-h-[320px]"
													columns={[
														{ key: 'nome_fantasia', label: t('dashboardRoot.table.company', 'Empresa') },
														{ key: 'plataforma', label: t('dashboardRoot.table.platform', 'Plataforma'), formatter: (value) => formatDashboardRootPlatform(value, t) },
														{ key: 'status', label: t('dashboardRoot.table.status', 'Status'), formatter: (value) => formatDashboardRootBuildStatus(value, t) },
														{ key: 'total_logs', label: t('dashboardRoot.table.total', 'Total'), formatter: (value) => formatNumber(parseNumber(value)) },
														{
															key: 'ultima_ocorrencia',
															label: t('dashboardRoot.table.lastOccurrence', 'Última ocorrência'),
															formatter: (value) => (parseText(value) !== '-' ? formatDate(String(value)) : '-'),
														},
													]}
												/>
											</div>
										</div>
									) : (
										<SectionSkeleton lines={7} />
									)}
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['engagementSummary', 'engagementDetail']}
							isReady={engagementSummaryLoaded}
							requestPhases={requestPhases}
							fallback={
								<div className="grid gap-4 xl:grid-cols-2">
									<SectionCard
										title={t('dashboardRoot.engagementTitle', 'Engajamento e comunicação')}
										description={t('dashboardRoot.engagementDescription', 'Volume e resposta das comunicações enviadas pela plataforma.')}
									>
										<SectionSkeleton lines={3} chart />
									</SectionCard>
									<SectionCard
										title={t('dashboardRoot.communicationDeliveryTitle', 'Entrega e resposta das mensagens')}
										description={t('dashboardRoot.communicationDeliveryDescription', 'Leitura operacional dos canais e do transporte das mensagens.')}
									>
										<SectionSkeleton lines={4} chart />
									</SectionCard>
								</div>
							}
						>
							<div className="grid gap-4 xl:grid-cols-2">
								<SectionCard
									title={t('dashboardRoot.engagementTitle', 'Engajamento e comunicação')}
									description={t('dashboardRoot.engagementDescription', 'Volume e resposta das comunicações enviadas pela plataforma.')}
									action={<InfoTooltipButton label={t('dashboardRoot.engagementTooltip', 'Acompanha o ritmo de envios e o retorno das interações geradas pelas comunicações da plataforma.')} />}
								>
									<div className="grid gap-4 lg:grid-cols-2">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.pushMonthly', 'Pushes enviados por mês')}</h3>
												<LineChartCard data={pushMonthlySeries} dataKey="value" titleKey="dashboardRoot.charts.pushMonthly" />
										</div>
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.pushInteractionsMonthly', 'Interações de push por mês')}</h3>
												<LineChartCard data={pushInteractionMonthlySeries} dataKey="value" titleKey="dashboardRoot.charts.pushInteractionsMonthly" />
										</div>
									</div>
								</SectionCard>

								<SectionCard
									title={t('dashboardRoot.communicationDeliveryTitle', 'Entrega e resposta das mensagens')}
									description={t('dashboardRoot.communicationDeliveryDescription', 'Leitura operacional dos canais e do transporte das mensagens.')}
									action={<InfoTooltipButton label={t('dashboardRoot.communicationDeliveryTooltip', 'Mostra como os envios se distribuem por tipo e quais status de transporte predominam na operação.')} />}
								>
									{engagementDetailLoaded ? (
										<div className="grid gap-4 lg:grid-cols-2">
											<div>
												<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.pushTypes', 'Tipos de push')}</h3>
												<PieChartCard data={toNameValueSeries(snapshot.push?.tipos ?? [], 'tipo', 'total')} />
											</div>
											<div>
												<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.tables.transportStatus', 'Status de transporte das mensagens')}</h3>
												<SimpleTable
													rows={snapshot.push?.mensagens_externas_status ?? []}
													maxHeightClass="max-h-[320px]"
													columns={[
														{ key: 'transport_status', label: t('dashboardRoot.table.status', 'Status'), formatter: (value) => formatDashboardRootTransportStatus(value, t) },
														{ key: 'total', label: t('dashboardRoot.table.total', 'Total'), formatter: (value) => formatNumber(parseNumber(value)) },
													]}
												/>
											</div>
										</div>
									) : (
										<SectionSkeleton lines={5} chart />
									)}
								</SectionCard>
							</div>
						</LazyDashboardSection>

<LazyDashboardSection
							phaseIds={['operationsSummary', 'operationsDetail']}
							isReady={operationsSummaryLoaded}
							requestPhases={requestPhases}
							fallback={
								<div className="space-y-4">
									<SectionCard
										title={t('dashboardRoot.internalOperationTitle', 'Operação interna')}
										description={t('dashboardRoot.internalOperationDescription', 'Throughput, falhas e tipos de processos internos do admin.')}
									>
										<SectionSkeleton lines={5} chart />
									</SectionCard>
									<SectionCard
										title={t('dashboardRoot.tables.processAlerts', 'Alertas de processos falhos recentes')}
										description={t('dashboardRoot.processAlertsDescription', 'Concentre aqui as últimas falhas operacionais para triagem rápida.')}
									>
										<SectionSkeleton lines={7} />
									</SectionCard>
								</div>
							}
						>
							<div className="space-y-4">
								<SectionCard
									title={t('dashboardRoot.internalOperationTitle', 'Operação interna')}
									description={t('dashboardRoot.internalOperationDescription', 'Throughput, falhas e tipos de processos internos do admin.')}
									action={<InfoTooltipButton label={t('dashboardRoot.internalOperationTooltip', 'Resume volume, status e tipos de processos internos para acompanhamento operacional do admin root.')} />}
								>
									<div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.processesMonthly', 'Processos por mês')}</h3>
												<LineChartCard data={processMonthlySeries} dataKey="value" titleKey="dashboardRoot.charts.processesMonthly" />
										</div>
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.processStatus', 'Status dos processos')}</h3>
											<PieChartCard data={processStatusPie} />
										</div>
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.processTypes', 'Tipos de processo')}</h3>
											<BarChartCard data={processTypesBars} dataKey="value" />
										</div>
										<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
											<MetricTile
												label={t('dashboardRoot.cards.processLogsErrors', 'Logs de erro')}
												value={formatNumber(parseNumber(snapshot.processos?.logs_resumo?.erros))}
												helper={t('dashboardRoot.processLogsErrorsHelper', 'Quantidade de logs operacionais classificados como erro dentro do período selecionado.')}
												tooltip={t('dashboardRoot.processLogsErrorsTooltip', 'Ajuda a medir pressão operacional e concentração de falhas internas do admin.')}
												tone="rose"
											/>
											<MetricTile
												label={t('dashboardRoot.cards.processLogsInfo', 'Logs de informação')}
												value={formatNumber(parseNumber(snapshot.processos?.logs_resumo?.informacoes))}
												helper={t('dashboardRoot.processLogsInfoHelper', 'Quantidade de logs informativos gerados pelos processos internos no período.')}
												tooltip={t('dashboardRoot.processLogsInfoTooltip', 'Ajuda a dimensionar o volume de processamento e telemetria operacional registrada.')}
												tone="slate"
											/>
										</div>
									</div>
								</SectionCard>

								<SectionCard
									title={t('dashboardRoot.tables.processAlerts', 'Alertas de processos falhos recentes')}
									description={t('dashboardRoot.processAlertsDescription', 'Concentre aqui as últimas falhas operacionais para triagem rápida.')}
									action={<InfoTooltipButton label={t('dashboardRoot.processAlertsTooltip', 'Lista os processos com falha recente para apoiar diagnóstico e atuação rápida do time interno.')} />}
								>
									{operationsDetailLoaded ? (
										<SimpleTable
											rows={snapshot.processos?.alertas_falha_recente ?? []}
											maxHeightClass="max-h-[560px]"
											columns={[
												{ key: 'empresa_nome', label: t('dashboardRoot.table.company', 'Empresa') },
												{ key: 'tipo', label: t('dashboardRoot.table.type', 'Tipo'), formatter: (value) => formatDashboardRootProcessType(value, t) },
												{
													key: 'relatorio_nome',
													label: t('dashboardRoot.table.report', 'Relatório'),
													formatter: (value) => parseText(value),
												},
												{ key: 'status', label: t('dashboardRoot.table.status', 'Status'), formatter: (value) => formatDashboardRootProcessStatus(value, t) },
												{
													key: 'ultima_ocorrencia',
													label: t('dashboardRoot.table.lastOccurrence', 'Última ocorrência'),
													formatter: (value) => (parseText(value) !== '-' ? formatDate(String(value)) : '-'),
												},
											]}
										/>
									) : (
										<SectionSkeleton lines={7} />
									)}
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['ai']}
							isReady={hasPhase('ai')}
							requestPhases={requestPhases}
							fallback={
								<div className="space-y-4">
									<div className="grid gap-4 xl:grid-cols-2">
										<SectionCard
											title={t('dashboardRoot.aiGovernanceTitle', 'IA e governança')}
											description={t('dashboardRoot.aiGovernanceDescription', 'Adoção do agente, eventos e saúde das tools do ambiente root.')}
										>
											<SectionSkeleton lines={3} chart />
										</SectionCard>
										<SectionCard
											title={t('dashboardRoot.aiOperationsTitle', 'Uso do agente')}
											description={t('dashboardRoot.aiOperationsDescription', 'Papéis de mensagem e tipos de evento com leitura amigável.')}
										>
											<SectionSkeleton lines={4} />
										</SectionCard>
									</div>
									<SectionCard
										title={t('dashboardRoot.toolsObservabilityTitle', 'Tools e observabilidade')}
										description={t('dashboardRoot.toolsObservabilityDescription', 'Uso das tools com latência média e alertas de erro ou lentidão.')}
									>
										<SectionSkeleton lines={5} />
									</SectionCard>
								</div>
							}
						>
							<div className="space-y-4">
								<div className="grid gap-4 xl:grid-cols-2">
									<SectionCard
										title={t('dashboardRoot.aiGovernanceTitle', 'IA e governança')}
										description={t('dashboardRoot.aiGovernanceDescription', 'Adoção do agente, eventos e saúde das tools do ambiente root.')}
										action={<InfoTooltipButton label={t('dashboardRoot.aiGovernanceTooltip', 'Consolida uso do agente, auditoria MCP e sinais gerais de governança do ecossistema de IA.')} />}
									>
										<div className="grid gap-4 lg:grid-cols-2">
											<div>
												<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.agentExecutionsDaily', 'Execuções do agente por dia')}</h3>
												<LineChartCard data={agentDailySeries} dataKey="value" titleKey="dashboardRoot.charts.agentExecutionsDaily" />
											</div>
											<div>
												<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.auditStatus', 'Auditoria MCP por status')}</h3>
												<PieChartCard data={auditStatusPie} />
											</div>
										</div>
									</SectionCard>

									<SectionCard
										title={t('dashboardRoot.aiOperationsTitle', 'Uso do agente')}
										description={t('dashboardRoot.aiOperationsDescription', 'Papéis de mensagem e tipos de evento com leitura amigável.')}
										action={<InfoTooltipButton label={t('dashboardRoot.aiOperationsTooltip', 'Mostra como o agente está sendo utilizado e quais tipos de eventos aparecem com mais frequência.')} />}
									>
										<div className="grid gap-4 lg:grid-cols-2">
											<div>
												<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.tables.messagesByRole', 'Mensagens user vs assistant')}</h3>
												<SimpleTable
													rows={snapshot.agent?.mensagens_por_papel ?? []}
													maxHeightClass="max-h-[320px]"
													columns={[
														{ key: 'papel', label: t('dashboardRoot.table.role', 'Papel'), formatter: (value) => formatDashboardRootAgentRole(value, t) },
														{ key: 'total', label: t('dashboardRoot.table.total', 'Total'), formatter: (value) => formatNumber(parseNumber(value)) },
													]}
												/>
											</div>
											<div>
												<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.tables.agentEvents', 'Eventos do agente por tipo')}</h3>
												<SimpleTable
													rows={snapshot.agent?.eventos_tipos ?? []}
													maxHeightClass="max-h-[320px]"
													columns={[
														{ key: 'tipo', label: t('dashboardRoot.table.type', 'Tipo'), formatter: (value) => formatDashboardRootAgentEventType(value, t) },
														{ key: 'total', label: t('dashboardRoot.table.total', 'Total'), formatter: (value) => formatNumber(parseNumber(value)) },
													]}
												/>
											</div>
										</div>
									</SectionCard>
								</div>

									<SectionCard
										title={t('dashboardRoot.toolsObservabilityTitle', 'Tools e observabilidade')}
										description={t('dashboardRoot.toolsObservabilityDescription', 'Uso das tools com latência média e alertas de erro ou lentidão.')}
										action={<InfoTooltipButton label={t('dashboardRoot.toolsObservabilityTooltip', 'Ajuda a identificar tools mais usadas, gargalos de latência e pontos de instabilidade operacional.')} />}
									>
									<div className="grid gap-4 xl:grid-cols-2">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.tables.topTools', 'Top tools usadas e latência média')}</h3>
											<SimpleTable
												rows={topTools}
												maxHeightClass="max-h-[360px]"
												columns={[
													{ key: 'tool_name', label: t('dashboardRoot.table.tool', 'Tool'), formatter: (value) => formatDashboardRootToolName(value, t) },
													{ key: 'total', label: t('dashboardRoot.table.total', 'Total'), formatter: (value) => formatNumber(parseNumber(value)) },
													{ key: 'duracao_media_ms', label: t('dashboardRoot.table.avgLatency', 'Latência média'), formatter: (value) => `${formatNumber(parseNumber(value))}ms` },
												]}
											/>
										</div>
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.tables.auditAlerts', 'Alertas de erro ou lentidão por tool')}</h3>
											<SimpleTable
												rows={snapshot.audit?.alertas_tools ?? []}
												maxHeightClass="max-h-[360px]"
												columns={[
													{ key: 'tool_name', label: t('dashboardRoot.table.tool', 'Tool'), formatter: (value) => formatDashboardRootToolName(value, t) },
													{ key: 'erros', label: t('dashboardRoot.table.errors', 'Erros'), formatter: (value) => formatNumber(parseNumber(value)) },
													{ key: 'duracao_media_ms', label: t('dashboardRoot.table.avgLatency', 'Latência média'), formatter: (value) => `${formatNumber(parseNumber(value))}ms` },
												]}
											/>
										</div>
									</div>
								</SectionCard>
							</div>
						</LazyDashboardSection>
					</>
				) : null}
			</AsyncState>
		</div>
	);
}
