'use client';

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCcw } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
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
			{chart ? <div className="h-56 animate-pulse rounded-2xl border border-line/70 bg-slate-100" /> : null}
			{Array.from({ length: lines }).map((_, index) => (
				<div key={index} className="h-10 animate-pulse rounded-2xl border border-line/70 bg-slate-100" />
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

function LineChartCard({
	data,
	dataKey,
	titleKey,
	color = chartPalette[0],
	formatValue,
}: {
	data: DashboardRootSimpleRow[];
	dataKey: string;
	titleKey: string;
	color?: string;
	formatValue?: (value: number) => string;
}) {
	const { t } = useI18n();
	if (!data.length) {
		return <div className="text-sm text-slate-500">{t('dashboardRoot.empty', 'Sem dados para este período.')}</div>;
	}

	return (
		<div className="h-64 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
					<XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
					<YAxis tick={{ fontSize: 12 }} stroke="#64748b" tickFormatter={(value) => formatChartValue(value, formatValue)} />
					<Tooltip formatter={(value) => formatChartValue(value, formatValue)} labelFormatter={(label) => `${t(titleKey, titleKey)}: ${label}`} />
					<Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} />
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
					<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
					<XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} stroke="#64748b" />
					<YAxis tick={{ fontSize: 12 }} stroke="#64748b" tickFormatter={(value) => formatChartValue(value, formatValue)} />
					<Tooltip formatter={(value) => formatChartValue(value, formatValue)} />
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
					<Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} strokeWidth={0}>
						{data.map((entry, index) => (
							<Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
						))}
					</Pie>
					<Tooltip formatter={(value) => formatChartValue(value)} />
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

	return (
		<div className={['overflow-auto rounded-2xl border border-line/70', maxHeightClass ?? ''].filter(Boolean).join(' ')}>
			<table className="min-w-full text-left text-sm">
				<thead className="sticky top-0 bg-slate-50 text-slate-500">
					<tr>
						{columns.map((column) => (
							<th key={column.key} className="px-3 py-2.5 font-semibold">
								{column.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr key={`${index}-${parseText(row.id, String(index))}`} className="border-t border-line/60 text-slate-700">
							{columns.map((column) => (
								<td key={column.key} className="px-3 py-2.5 align-top">
									{column.formatter ? column.formatter(row[column.key], row) : parseText(row[column.key])}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
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

	const cards = useMemo(() => (snapshot ? buildExecutiveCards(snapshot, t) : []), [snapshot, t]);
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
	const analyticsRevenueSeries = useMemo(() => toSeries(snapshot?.analytics?.vendas_series_mensal ?? [], 'mes', 'valor_total_vendas'), [snapshot]);
	const analyticsOrderStatusPie = useMemo(() => toNameValueSeries(snapshot?.analytics?.pedidos_status ?? [], 'status_pedido', 'total_pedidos'), [snapshot]);
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
						{error && initialLoaded ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div> : null}

						<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
							{cards.map((card) => (
								<StatCard
									key={card.label}
									label={card.label}
									value={card.value}
									variation={card.variation}
									type={card.type}
									tone={card.tone}
									showComparison={card.showComparison}
								/>
							))}
						</div>

						<LazyDashboardSection
							phaseIds={['platform']}
							isReady={hasPhase('platform')}
							requestPhases={requestPhases}
							fallback={
								<div className="grid gap-4 xl:grid-cols-12">
									<SectionCard
										title={t('dashboardRoot.platformHealthTitle', 'Saúde da plataforma')}
										description={t('dashboardRoot.platformHealthDescription', 'Distribuição da carteira e sinais de atenção do ambiente root.')}
										className="xl:col-span-6"
									>
										<SectionSkeleton lines={4} chart />
									</SectionCard>
									<SectionCard
										title={t('dashboardRoot.charts.clusterDistribution', 'Empresas por cluster')}
										description={t('dashboardRoot.clusterDescription', 'Capacidade distribuída entre clusters e ERPs da carteira.')}
										className="xl:col-span-3"
									>
										<SectionSkeleton lines={2} chart />
									</SectionCard>
									<SectionCard
										title={t('dashboardRoot.charts.erpDistribution', 'Empresas por ERP')}
										description={t('dashboardRoot.erpDescription', 'Concentração da base por ERP para leitura operacional.')}
										className="xl:col-span-3"
									>
										<SectionSkeleton lines={2} chart />
									</SectionCard>
								</div>
							}
						>
							<div className="grid gap-4 xl:grid-cols-12">
								<SectionCard
									title={t('dashboardRoot.platformHealthTitle', 'Saúde da plataforma')}
									description={t('dashboardRoot.platformHealthDescription', 'Distribuição da carteira e sinais de atenção do ambiente root.')}
									className="xl:col-span-6"
								>
									<div className="grid gap-4 lg:grid-cols-2">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.companyStatus', 'Empresas por status')}</h3>
											<PieChartCard data={companyStatusPie} />
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											{Object.entries(snapshot.empresas?.cards_atencao ?? {}).map(([key, value]) => (
												<div key={key} className="rounded-2xl border border-line/70 bg-slate-50 px-4 py-3">
													<div className="text-sm font-semibold leading-5 text-slate-600">{formatDashboardRootAttentionLabel(key, t)}</div>
													<div className="mt-3 text-3xl font-black tracking-tight text-slate-950">{formatNumber(Number(value))}</div>
												</div>
											))}
										</div>
									</div>
								</SectionCard>

								<SectionCard
									title={t('dashboardRoot.charts.clusterDistribution', 'Empresas por cluster')}
									description={t('dashboardRoot.clusterDescription', 'Capacidade distribuída entre clusters e ERPs da carteira.')}
									className="xl:col-span-3"
								>
									<BarChartCard data={clusterBars} dataKey="value" />
								</SectionCard>

								<SectionCard
									title={t('dashboardRoot.charts.erpDistribution', 'Empresas por ERP')}
									description={t('dashboardRoot.erpDescription', 'Concentração da base por ERP para leitura operacional.')}
									className="xl:col-span-3"
								>
									<BarChartCard data={erpBars} dataKey="value" />
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['product']}
							isReady={hasPhase('product')}
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
							<div className="grid gap-4 xl:grid-cols-2">
								<SectionCard
									title={t('dashboardRoot.productOperationTitle', 'Operação de produto')}
									description={t('dashboardRoot.productOperationDescription', 'Crescimento de apps, builds e notificações publicadas.')}
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
								>
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
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['engagement']}
							isReady={hasPhase('engagement')}
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
								>
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
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['analytics']}
							isReady={hasPhase('analytics')}
							requestPhases={requestPhases}
							fallback={
								<div className="space-y-4">
									<SectionCard
										title={t('dashboardRoot.analyticsTitle', 'Analytics comercial e operação')}
										description={t('dashboardRoot.analyticsDescription', 'Consolidação de faturamento, pedidos, engajamento e sincronização analítica por empresa.')}
									>
										<SectionSkeleton lines={4} chart />
									</SectionCard>
									<div className="grid gap-4 xl:grid-cols-2">
										<SectionCard title={t('dashboardRoot.tables.revenueRanking', 'Ranking de faturamento')}>
											<SectionSkeleton lines={6} />
										</SectionCard>
										<SectionCard title={t('dashboardRoot.tables.declineSignals', 'Sinais de queda de faturamento')}>
											<SectionSkeleton lines={6} />
										</SectionCard>
									</div>
								</div>
							}
						>
							<div className="space-y-4">
								<SectionCard
									title={t('dashboardRoot.analyticsTitle', 'Analytics comercial e operação')}
									description={t('dashboardRoot.analyticsDescription', 'Consolidação de faturamento, pedidos, engajamento e sincronização analítica por empresa.')}
								>
									<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
										<div className="rounded-2xl border border-line/70 bg-slate-50 px-4 py-3">
											<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t('dashboardRoot.cards.revenueTotal', 'Faturamento total')}</div>
											<div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{formatCurrency(parseNumber(snapshot.analytics?.resumo?.valor_total_vendas))}</div>
										</div>
										<div className="rounded-2xl border border-line/70 bg-slate-50 px-4 py-3">
											<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t('dashboardRoot.cards.ordersTotal', 'Pedidos transacionados')}</div>
											<div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{formatNumber(parseNumber(snapshot.analytics?.resumo?.total_pedidos))}</div>
										</div>
										<div className="rounded-2xl border border-line/70 bg-slate-50 px-4 py-3">
											<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
												{t('dashboardRoot.cards.averageTicketConsolidated', 'Ticket médio consolidado')}
											</div>
											<div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
												{formatCurrency(parseNumber(snapshot.analytics?.resumo?.ticket_medio_consolidado))}
											</div>
										</div>
										<div className="rounded-2xl border border-line/70 bg-slate-50 px-4 py-3">
											<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t('dashboardRoot.cards.activeCustomers', 'Clientes ativos')}</div>
											<div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{formatNumber(parseNumber(snapshot.analytics?.resumo?.clientes_ativos))}</div>
										</div>
									</div>

									<div className="mt-4 grid gap-4 xl:grid-cols-2">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.transactedVolumeMonthly', 'Volume transacionado por mês')}</h3>
											<LineChartCard data={analyticsRevenueSeries} dataKey="value" titleKey="dashboardRoot.charts.transactedVolumeMonthly" formatValue={formatCurrency} />
										</div>
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.ordersByStatus', 'Pedidos por status')}</h3>
											<PieChartCard data={analyticsOrderStatusPie} />
										</div>
									</div>
								</SectionCard>

								<div className="grid gap-4 xl:grid-cols-2">
									<SectionCard title={t('dashboardRoot.tables.revenueRanking', 'Ranking de faturamento')}>
										<SimpleTable
											rows={snapshot.analytics?.ranking_faturamento ?? []}
											maxHeightClass="max-h-[360px]"
											columns={[
												{ key: 'empresa_nome', label: t('dashboardRoot.table.company', 'Empresa') },
												{ key: 'valor_total_vendas', label: t('dashboardRoot.table.revenue', 'Faturamento'), formatter: (value) => formatCurrency(parseNumber(value)) },
												{ key: 'total_pedidos', label: t('dashboardRoot.table.orderCount', 'Pedidos'), formatter: (value) => formatNumber(parseNumber(value)) },
											]}
										/>
									</SectionCard>

									<SectionCard title={t('dashboardRoot.tables.declineSignals', 'Sinais de queda de faturamento')}>
										<SimpleTable
											rows={snapshot.analytics?.empresas_sinais_queda ?? []}
											maxHeightClass="max-h-[360px]"
											columns={[
												{ key: 'empresa_nome', label: t('dashboardRoot.table.company', 'Empresa') },
												{
													key: 'valor_anterior',
													label: t('dashboardRoot.table.previousRevenue', 'Faturamento anterior'),
													formatter: (value) => formatCurrency(parseNumber(value)),
												},
												{ key: 'valor_atual', label: t('dashboardRoot.table.currentRevenue', 'Faturamento atual'), formatter: (value) => formatCurrency(parseNumber(value)) },
												{
													key: 'variacao_percentual',
													label: t('dashboardRoot.table.variation', 'Variação'),
													formatter: (value) => `${formatNumber(parseNumber(value))}%`,
												},
											]}
										/>
									</SectionCard>
								</div>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['operations']}
							isReady={hasPhase('operations')}
							requestPhases={requestPhases}
							fallback={
								<div className="grid gap-4 xl:grid-cols-2">
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
							<div className="grid gap-4 xl:grid-cols-2">
								<SectionCard
									title={t('dashboardRoot.internalOperationTitle', 'Operação interna')}
									description={t('dashboardRoot.internalOperationDescription', 'Throughput, falhas e tipos de processos internos do admin.')}
								>
									<div className="grid gap-4 lg:grid-cols-2">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.processesMonthly', 'Processos por mês')}</h3>
											<LineChartCard data={processMonthlySeries} dataKey="value" titleKey="dashboardRoot.charts.processesMonthly" />
										</div>
										<div>
											<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.processStatus', 'Status dos processos')}</h3>
											<PieChartCard data={processStatusPie} />
										</div>
									</div>
									<div className="mt-4">
										<h3 className="mb-3 text-sm font-semibold text-slate-700">{t('dashboardRoot.charts.processTypes', 'Tipos de processo')}</h3>
										<BarChartCard data={processTypesBars} dataKey="value" />
									</div>
									<div className="mt-4 grid gap-4 lg:grid-cols-2">
										<div className="rounded-2xl border border-line/70 bg-slate-50 px-4 py-3">
											<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t('dashboardRoot.cards.processLogsErrors', 'Logs de erro')}</div>
											<div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{formatNumber(parseNumber(snapshot.processos?.logs_resumo?.erros))}</div>
										</div>
										<div className="rounded-2xl border border-line/70 bg-slate-50 px-4 py-3">
											<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t('dashboardRoot.cards.processLogsInfo', 'Logs de informação')}</div>
											<div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{formatNumber(parseNumber(snapshot.processos?.logs_resumo?.informacoes))}</div>
										</div>
									</div>
								</SectionCard>

								<SectionCard
									title={t('dashboardRoot.tables.processAlerts', 'Alertas de processos falhos recentes')}
									description={t('dashboardRoot.processAlertsDescription', 'Concentre aqui as últimas falhas operacionais para triagem rápida.')}
								>
									<SimpleTable
										rows={snapshot.processos?.alertas_falha_recente ?? []}
										maxHeightClass="max-h-[520px]"
										columns={[
											{ key: 'empresa_nome', label: t('dashboardRoot.table.company', 'Empresa') },
											{ key: 'tipo', label: t('dashboardRoot.table.type', 'Tipo'), formatter: (value) => formatDashboardRootProcessType(value, t) },
											{ key: 'status', label: t('dashboardRoot.table.status', 'Status'), formatter: (value) => formatDashboardRootProcessStatus(value, t) },
											{
												key: 'ultima_ocorrencia',
												label: t('dashboardRoot.table.lastOccurrence', 'Última ocorrência'),
												formatter: (value) => (parseText(value) !== '-' ? formatDate(String(value)) : '-'),
											},
										]}
									/>
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
