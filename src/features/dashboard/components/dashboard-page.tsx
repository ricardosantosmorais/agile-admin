'use client';

import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, RefreshCw } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AsyncState } from '@/src/components/ui/async-state';
import { DateRangeComparativePicker } from '@/src/components/ui/date-range-comparative-picker';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatCard } from '@/src/components/ui/stat-card';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { useTenant } from '@/src/contexts/tenant-context';
import { useDashboardSequencedSnapshot, type DashboardPhaseId } from '@/src/features/dashboard/hooks/use-dashboard-sequenced-snapshot';
import { useIntersectionOnce } from '@/src/hooks/use-intersection-once';
import { translateDashboardMetricLabel } from '@/src/features/dashboard/services/dashboard-i18n';
import { useI18n } from '@/src/i18n/use-i18n';
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from '@/src/lib/formatters';

const chartPalette = ['#195f4d', '#0f766e', '#0284c7', '#f59e0b', '#e11d48', '#334155'];

type TooltipRow = {
	name?: string;
	dia?: string;
	data?: string;
	atual?: number;
	anterior?: number;
	valor?: number;
	value?: number;
	pedidos?: number;
	qtd?: number;
	ticket?: number;
	receita?: number;
	registros?: number;
	clientes?: number;
	pctCarrinho?: number;
	pctAprovados?: number;
	fonte?: string;
};

function hasMeaningfulRows(rows: TooltipRow[], keys: Array<keyof TooltipRow>) {
	return rows.some((row) =>
		keys.some((key) => {
			const value = row[key];
			return typeof value === 'number' ? value > 0 : false;
		}),
	);
}

function formatDateLabel(date: string) {
	const [year, month, day] = date.split('-');
	return `${day}/${month}/${year}`;
}

function formatWeekday(dateString: string | undefined, locale: string) {
	if (!dateString) {
		return '';
	}

	const date = new Date(`${dateString.slice(0, 10)}T12:00:00`);
	return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
}

function SectionSkeleton({ lines = 3, chart = false }: { lines?: number; chart?: boolean }) {
	return (
		<div className="space-y-3">
			{chart ? <div className="app-pane-muted h-56 animate-pulse rounded-[1rem]" /> : null}
			{Array.from({ length: lines }).map((_, index) => (
				<div key={index} className="app-pane-muted h-10 animate-pulse rounded-[1rem]" />
			))}
		</div>
	);
}

function ChartFrame({ children, heightClass = 'h-56' }: { children: ReactNode; heightClass?: string }) {
	return <div className={`${heightClass} min-w-0 w-full`}>{children}</div>;
}

function ResponsiveChart({ children }: { children: ReactNode }) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const element = containerRef.current;

		if (!element) {
			return;
		}

		const updateSize = () => {
			const nextWidth = element.clientWidth;
			const nextHeight = element.clientHeight;

			setSize((current) => {
				if (current.width === nextWidth && current.height === nextHeight) {
					return current;
				}

				return {
					width: nextWidth,
					height: nextHeight,
				};
			});
		};

		updateSize();

		const observer = new ResizeObserver(() => {
			updateSize();
		});

		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={containerRef} className="h-full min-h-[220px] w-full min-w-0">
			{size.width > 0 && size.height > 0 ? (
				<ResponsiveContainer width={size.width} height={size.height} minWidth={0} minHeight={220}>
					{children}
				</ResponsiveContainer>
			) : null}
		</div>
	);
}

function ChartEmptyState({ title, message = 'Nao ha informacoes suficientes neste periodo para montar este grafico.' }: { title: string; message?: string }) {
	return (
		<div className="app-pane-muted flex h-full min-h-[220px] items-center justify-center rounded-[1rem] border border-dashed px-6 text-center">
			<div className="max-w-[280px] space-y-2">
				<p className="text-sm font-semibold text-slate-700">{title}</p>
				<p className="text-sm leading-6 text-slate-500">{message}</p>
			</div>
		</div>
	);
}

function CustomTooltip({ active, payload, lines }: { active?: boolean; payload?: Array<{ payload?: TooltipRow }>; lines: (row: TooltipRow) => string[] }) {
	if (!active || !payload?.length) {
		return null;
	}

	const row = (payload[0]?.payload ?? {}) as TooltipRow;
	const content = lines(row).filter(Boolean);

	if (!content.length) {
		return null;
	}

	return (
		<div className="app-card-modern rounded-[1rem] px-3 py-2.5 text-[12px] text-slate-700 shadow-xl">
			{content.map((line) => (
				<div key={line}>{line}</div>
			))}
		</div>
	);
}

function LightTable({
	columns,
	rows,
	disableScroll = false,
}: {
	columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>;
	rows: Array<Record<string, string>>;
	disableScroll?: boolean;
}) {
	return (
		<div className={['app-table-shell rounded-[1rem]', disableScroll ? 'overflow-visible' : 'overflow-x-auto'].join(' ')}>
			<table className="min-w-full text-left text-[12px]">
				<thead className="app-table-muted border-b border-line/70 text-slate-500">
					<tr>
						{columns.map((column) => (
							<th key={column.key} className={['px-3.5 py-2.5 font-semibold uppercase tracking-[0.18em]', column.align === 'right' ? 'text-right' : 'text-left'].join(' ')}>
								{column.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr key={index} className="border-t border-line/60 text-slate-700">
							{columns.map((column) => (
								<td
									key={column.key}
									className={['px-3.5 py-2.5', column.align === 'right' ? 'text-right' : 'text-left', column.key === columns[0]?.key ? 'font-semibold text-slate-950' : ''].join(
										' ',
									)}
								>
									{row[column.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
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
	phaseIds: DashboardPhaseId[];
	isReady: boolean;
	fallback: ReactNode;
	requestPhases: (phaseIds: DashboardPhaseId | DashboardPhaseId[]) => void;
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

export function DashboardPage() {
	const dashboardRef = useRef<HTMLDivElement | null>(null);
	const { currentTenant } = useTenant();
	const { locale, t } = useI18n();
	const [isExportingPdf, setIsExportingPdf] = useState(false);
	const {
		allPhaseIds,
		presetRanges,
		selectedRange,
		setSelectedRange,
		selectedPreviousRange,
		setSelectedPreviousRange,
		snapshot,
		completedPhases,
		error,
		requestPhases,
		ensurePhasesLoaded,
		refreshSnapshot,
	} = useDashboardSequencedSnapshot(currentTenant.id);
	const hasPreviousComparison = selectedPreviousRange !== null;

	const hasPhase = (phase: DashboardPhaseId) => completedPhases.includes(phase);
	const initialLoaded = hasPhase('summary');
	const seriesRows = (snapshot?.serie ?? []) as TooltipRow[];
	const ticketRows = (snapshot?.ticketByDay ?? []) as TooltipRow[];
	const channelRows = (snapshot?.channel ?? []) as TooltipRow[];
	const emitenteRows = (snapshot?.emitente ?? []) as TooltipRow[];
	const funilRows = (snapshot?.funil ?? []) as TooltipRow[];
	const coorteRows = (snapshot?.coorte ?? []) as TooltipRow[];
	const paymentRows = (snapshot?.payments ?? []) as TooltipRow[];
	const hourlyRows = (snapshot?.hourlyRevenue ?? []) as TooltipRow[];
	const marketingMixExclusiveRows = (snapshot?.marketingMixExclusive ?? []) as TooltipRow[];
	const marketingMixInclusiveRows = (snapshot?.marketingMixInclusive ?? []) as TooltipRow[];
	const marketingTicketRows = (snapshot?.marketingTicketComparison ?? []) as TooltipRow[];
	const couponRows = (snapshot?.topCoupons ?? []) as TooltipRow[];
	const promotionRows = (snapshot?.topPromotions ?? []) as TooltipRow[];
	const hasSeriesData = hasMeaningfulRows(seriesRows, hasPreviousComparison ? ['atual', 'anterior'] : ['atual']);
	const hasFunilData = hasMeaningfulRows(funilRows, ['value', 'qtd', 'valor']);
	const hasTicketData = hasMeaningfulRows(ticketRows, ['valor', 'pedidos']);
	const hasChannelData = hasMeaningfulRows(channelRows, ['value', 'qtd', 'valor']);
	const hasEmitenteData = hasMeaningfulRows(emitenteRows, ['value', 'qtd', 'valor']);
	const hasTopProductsData = snapshot?.topProducts.some((product) => product.quantidade > 0 || product.valor > 0);
	const hasHourlyData = hasMeaningfulRows(hourlyRows, ['valor']);
	const hasPaymentData = hasMeaningfulRows(paymentRows, ['value', 'valor', 'registros']);
	const hasMarketingExclusiveData = hasMeaningfulRows(marketingMixExclusiveRows, ['value', 'qtd', 'receita']);
	const hasMarketingInclusiveData = hasMeaningfulRows(marketingMixInclusiveRows, ['value', 'qtd']);
	const hasMarketingTicketData = hasMeaningfulRows(marketingTicketRows, ['value']);
	const hasCouponData = hasMeaningfulRows(couponRows, ['receita', 'pedidos', 'value']);
	const hasPromotionData = hasMeaningfulRows(promotionRows, ['receita', 'pedidos', 'value']);
	const selectedRangeDisplay = useMemo(() => `${formatDateLabel(selectedRange.start)} a ${formatDateLabel(selectedRange.end)}`, [selectedRange.end, selectedRange.start]);
	const previousRangeDisplay = useMemo(
		() => (selectedPreviousRange ? `${formatDateLabel(selectedPreviousRange.start)} a ${formatDateLabel(selectedPreviousRange.end)}` : ''),
		[selectedPreviousRange],
	);

	async function handleExportPdf() {
		if (!dashboardRef.current || isExportingPdf || !snapshot) {
			return;
		}

		setIsExportingPdf(true);

		try {
			await ensurePhasesLoaded(allPhaseIds);
			await new Promise<void>((resolve) => {
				window.requestAnimationFrame(() => {
					window.requestAnimationFrame(() => resolve());
				});
			});

			const canvas = await toCanvas(dashboardRef.current, {
				cacheBust: true,
				pixelRatio: 1.5,
				backgroundColor: '#f8fafc',
				canvasWidth: dashboardRef.current.scrollWidth,
			});

			const imageData = canvas.toDataURL('image/jpeg', 0.82);
			const pdf = new jsPDF('p', 'mm', 'a4');
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const imageWidth = pageWidth;
			const imageHeight = (canvas.height * imageWidth) / canvas.width;

			let remainingHeight = imageHeight;
			let position = 0;

			pdf.addImage(imageData, 'JPEG', 0, position, imageWidth, imageHeight, undefined, 'FAST');
			remainingHeight -= pageHeight;

			while (remainingHeight > 0) {
				position = remainingHeight - imageHeight;
				pdf.addPage();
				pdf.addImage(imageData, 'JPEG', 0, position, imageWidth, imageHeight, undefined, 'FAST');
				remainingHeight -= pageHeight;
			}

			pdf.save(`dashboard-${currentTenant.codigo}-${selectedRange.start}-${selectedRange.end}.pdf`);
		} finally {
			setIsExportingPdf(false);
		}
	}

	return (
		<div ref={dashboardRef} className={['space-y-4 xl:space-y-5', isExportingPdf ? 'dashboard-exporting' : ''].join(' ')}>
			<PageHeader
				actions={
					<>
						<DateRangeComparativePicker
							value={selectedRange}
							onChange={setSelectedRange}
							previousValue={selectedPreviousRange}
							onPreviousChange={setSelectedPreviousRange}
							presets={presetRanges}
							maxDays={90}
						/>
						<button
							type="button"
							onClick={refreshSnapshot}
							className="app-button-secondary inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold text-slate-700 transition hover:border-accent/20 hover:text-accent"
						>
							<RefreshCw className="h-4 w-4" />
							{t('dashboard.refresh', 'Atualizar dados')}
						</button>
						<button
							type="button"
							onClick={handleExportPdf}
							className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-3.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
							disabled={isExportingPdf}
						>
							<Download className="h-4 w-4" />
							{isExportingPdf ? t('dashboard.generatingPdf', 'Gerando PDF...') : t('dashboard.exportPdf', 'Exportar PDF')}
						</button>
					</>
				}
			/>

			<AsyncState isLoading={!initialLoaded && !error} error={!initialLoaded ? error : ''}>
				{snapshot ? (
					<>
						{error && initialLoaded ? <div className="app-warning-panel rounded-[1rem] px-3.5 py-2.5 text-sm">{error}</div> : null}

						{hasPhase('summary') ? (
							<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
								{snapshot.primaryMetrics.map((metric) => (
									<StatCard key={metric.label} {...metric} showComparison={hasPreviousComparison} />
								))}
							</section>
						) : null}

						<LazyDashboardSection
							phaseIds={['customers']}
							isReady={hasPhase('customers')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.customersIndicatorsTitle', 'Indicadores de clientes')}
									description={t('dashboard.customersIndicatorsLoading', 'Carregando a base de clientes do periodo.')}
								>
									<SectionSkeleton lines={4} />
								</SectionCard>
							}
						>
							<SectionCard
								title={t('dashboard.customersIndicatorsTitle', 'Indicadores de clientes')}
								description={t('dashboard.customersIndicatorsDescription', 'Indicadores complementares do tenant no periodo selecionado.')}
							>
								<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
									{snapshot.customerMetrics.map((metric) => (
										<div key={metric.label} className="app-pane-muted rounded-[1rem] px-3.5 py-3">
											<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{translateDashboardMetricLabel(metric.label, t)}</p>
											<strong className="mt-2 block text-[1.55rem] font-black tracking-tight text-slate-950">
												{metric.type === 'currency' ? formatCompactCurrency(metric.value) : metric.type === 'percent' ? formatPercent(metric.value) : formatNumber(metric.value)}
											</strong>
											{hasPreviousComparison ? (
												<p className="mt-1 text-[11px] text-slate-500">
													{metric.variation > 0 ? '+' : ''}
													{formatPercent(metric.variation)} {t('dashboard.vsPreviousPeriod', 'vs previous period')}
												</p>
											) : null}
										</div>
									))}
								</div>
							</SectionCard>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['series']}
							isReady={hasPhase('series')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.dailyRevenueTitle', 'Faturamento por dia')}
									description={t('dashboard.dailyRevenueLoading', 'Carregando a serie historica e os alertas do periodo.')}
								>
									<SectionSkeleton chart />
								</SectionCard>
							}
						>
							<div className="space-y-4 xl:space-y-5">
								<SectionCard
									title={t('dashboard.dailyRevenueTitle', 'Faturamento por dia')}
									description={
										hasPreviousComparison && selectedPreviousRange
											? t('dashboard.dailyRevenueDescriptionWithRanges', 'Comparando o período selecionado ({{currentRange}}) com o período anterior ({{previousRange}}).', {
													currentRange: selectedRangeDisplay,
													previousRange: previousRangeDisplay,
												})
											: hasPreviousComparison
												? t('dashboard.dailyRevenueDescription', 'Comparando o periodo selecionado ({{range}}) com o periodo anterior equivalente.', {
														range: snapshot.rangeLabel,
													})
												: t('dashboard.dailyRevenueCurrentDescription', 'Evolucao diaria do faturamento no periodo selecionado ({{range}}).', {
														range: selectedRangeDisplay,
													})
									}
								>
									<ChartFrame heightClass="h-72">
										{hasSeriesData ? (
											<ResponsiveChart>
												<AreaChart data={seriesRows}>
													<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
													<XAxis dataKey="dia" stroke="#64748b" fontSize={11} />
													<YAxis stroke="#64748b" fontSize={11} tickFormatter={(value) => formatCompactCurrency(Number(value))} />
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	row.data ? `${formatDateLabel(row.data)} (${formatWeekday(row.data, locale)})` : row.dia || '',
																	`${t('dashboard.tooltip.orderCount', 'Order count')}: ${formatNumber(row.pedidos ?? 0)}`,
																	`${t('dashboard.tooltip.averageTicket', 'Average ticket')}: ${formatCurrency(row.ticket ?? 0)}`,
																	`${t('dashboard.tooltip.totalValue', 'Total value')}: ${formatCurrency(row.atual ?? 0)}`,
																	hasPreviousComparison
																		? `${t('dashboard.tooltip.totalValuePrevious', 'Total value (previous period)')}: ${formatCurrency(row.anterior ?? 0)}`
																		: '',
																]}
															/>
														}
													/>
													{hasPreviousComparison ? <Legend wrapperStyle={{ fontSize: '12px' }} /> : null}
													<Area type="monotone" dataKey="atual" name={t('dashboard.currentPeriod', 'Current period')} stroke="#195f4d" fill="#b6dfd5" strokeWidth={2.5} />
													{hasPreviousComparison ? (
														<Area
															type="monotone"
															dataKey="anterior"
															name={t('dashboard.previousPeriod', 'Previous period')}
															stroke="#94a3b8"
															fill="#e2e8f0"
															strokeDasharray="6 6"
														/>
													) : null}
												</AreaChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState
												title={t('dashboard.empty.dailyRevenueTitle', 'Sem faturamento por dia neste periodo')}
												message={t('dashboard.empty.generic', 'Nao ha informacoes suficientes neste periodo para montar este grafico.')}
											/>
										)}
									</ChartFrame>
								</SectionCard>

								<SectionCard
									title={t('dashboard.monitoringTitle', 'Monitoramento do periodo')}
									description={t('dashboard.monitoringDescription', 'Alertas operacionais e sinais de atencao do tenant ativo.')}
								>
									<div className="space-y-2">
										{snapshot.monitoringAlerts.map((alert) => (
											<div key={alert} className="app-pane-muted rounded-[0.95rem] px-3 py-2.5">
												<p className="text-[12px] leading-5 text-slate-700">{alert}</p>
											</div>
										))}
									</div>
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['funnel']}
							isReady={hasPhase('funnel')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard title={t('dashboard.funnelTitle', 'Funil de conversao')} description={t('dashboard.funnelLoading', 'Carregando as etapas principais do funil.')}>
									<SectionSkeleton chart />
								</SectionCard>
							}
						>
							<div className="grid gap-4 xl:grid-cols-2">
								<SectionCard title={t('dashboard.funnelTitle', 'Funil de conversao')} description={t('dashboard.funnelDescription', 'Carrinho, pedidos validos e faturado.')}>
									<ChartFrame>
										{hasFunilData ? (
											<ResponsiveChart>
												<BarChart data={funilRows} layout="vertical">
													<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
													<XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(value) => formatNumber(Number(value))} />
													<YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={112} />
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	row.name || '',
																	`${t('dashboard.tooltip.quantity', 'Quantity')}: ${formatNumber(row.qtd ?? row.value ?? 0)}`,
																	`${t('dashboard.tooltip.value', 'Value')}: ${formatCurrency(row.valor ?? 0)}`,
																	row.name === 'Carrinho' ? '' : `${t('dashboard.tooltip.cartUsage', 'Usage over cart')}: ${formatPercent(row.pctCarrinho ?? 0)}`,
																	row.name === 'Carrinho' || row.name === 'Aprovados' ? '' : `Aproveitamento sobre aprovados: ${formatPercent(row.pctAprovados ?? 0)}`,
																]}
															/>
														}
													/>
													<Bar dataKey="value" fill="#195f4d" radius={[0, 10, 10, 0]} />
												</BarChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState
												title={t('dashboard.empty.funnelTitle', 'Sem dados de funil neste periodo')}
												message={t('dashboard.empty.generic', 'Nao ha informacoes suficientes neste periodo para montar este grafico.')}
											/>
										)}
									</ChartFrame>
								</SectionCard>

								<SectionCard
									title={t('dashboard.ticketPerDayTitle', 'Ticket medio por dia')}
									description={t('dashboard.ticketPerDayDescription', 'Evolucao do valor medio por pedido ao longo do periodo.')}
								>
									<ChartFrame>
										{hasTicketData ? (
											<ResponsiveChart>
												<BarChart data={ticketRows}>
													<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
													<XAxis dataKey="dia" stroke="#64748b" fontSize={11} />
													<YAxis stroke="#64748b" fontSize={11} tickFormatter={(value) => formatCurrency(Number(value))} />
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	row.data ? formatDateLabel(row.data) : row.dia || '',
																	`${t('dashboard.tooltip.averageTicket', 'Average ticket')}: ${formatCurrency(row.valor ?? 0)}`,
																	`${t('dashboard.tooltip.validOrders', 'Valid orders')}: ${formatNumber(row.pedidos ?? 0)}`,
																]}
															/>
														}
													/>
													<Bar dataKey="valor" fill="#0284c7" radius={[10, 10, 0, 0]} />
												</BarChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState title={t('dashboard.empty.ticketPerDayTitle', 'Sem ticket medio diario neste periodo')} />
										)}
									</ChartFrame>
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['mix']}
							isReady={hasPhase('mix')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.deviceSalesTitle', 'Vendas por dispositivo')}
									description={t('dashboard.mixLoading', 'Carregando a distribuicao de canais e emitentes.')}
								>
									<SectionSkeleton chart />
								</SectionCard>
							}
						>
							<div className="grid gap-4 xl:grid-cols-2">
								<SectionCard
									title={t('dashboard.deviceSalesTitle', 'Vendas por dispositivo')}
									description={t('dashboard.deviceSalesDescription', 'Participacao das vendas por canal de origem.')}
								>
									<ChartFrame>
										{hasChannelData ? (
											<ResponsiveChart>
												<PieChart>
													<Pie data={channelRows} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
														{channelRows.map((item, index) => (
															<Cell key={String(item.name ?? index)} fill={chartPalette[index % chartPalette.length]} />
														))}
													</Pie>
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	`${t('dashboard.tooltip.channel', 'Channel')}: ${row.name || ''}`,
																	`${t('dashboard.table.orders', 'Orders')}: ${formatNumber(row.qtd ?? 0)}`,
																	`${t('dashboard.tooltip.averageTicket', 'Average ticket')}: ${formatCurrency(row.ticket ?? 0)}`,
																	`${t('dashboard.tooltip.value', 'Value')}: ${formatCurrency(row.valor ?? 0)}`,
																]}
															/>
														}
													/>
													<Legend wrapperStyle={{ fontSize: '12px' }} />
												</PieChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState title={t('dashboard.empty.deviceSalesTitle', 'Sem vendas por dispositivo neste periodo')} />
										)}
									</ChartFrame>
								</SectionCard>

								<SectionCard
									title={t('dashboard.issuerSalesTitle', 'Vendas por emitente')}
									description={t('dashboard.issuerSalesDescription', 'Compara pedidos feitos pelo cliente com pedidos feitos com apoio de vendedor.')}
								>
									<ChartFrame>
										{hasEmitenteData ? (
											<ResponsiveChart>
												<BarChart data={emitenteRows}>
													<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
													<XAxis dataKey="name" stroke="#64748b" fontSize={11} />
													<YAxis stroke="#64748b" fontSize={11} tickFormatter={(value) => formatCompactCurrency(Number(value))} />
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	`${t('dashboard.tooltip.issuer', 'Issuer')}: ${row.name || t('dashboard.notAvailable', 'N/A')}`,
																	`${t('dashboard.table.orders', 'Orders')}: ${formatNumber(row.qtd ?? 0)}`,
																	`${t('dashboard.tooltip.averageTicket', 'Average ticket')}: ${formatCurrency(row.ticket ?? 0)}`,
																	`${t('dashboard.tooltip.value', 'Value')}: ${formatCurrency(row.valor ?? row.value ?? 0)}`,
																]}
															/>
														}
													/>
													<Bar dataKey="value" fill="#f59e0b" radius={[10, 10, 0, 0]} />
												</BarChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState title={t('dashboard.empty.issuerSalesTitle', 'Sem vendas por emitente neste periodo')} />
										)}
									</ChartFrame>
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['clients']}
							isReady={hasPhase('clients')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.topClientsTitle', 'Top clientes do periodo')}
									description={t('dashboard.topClientsLoading', 'Carregando listas e recompra do periodo.')}
								>
									<SectionSkeleton chart />
								</SectionCard>
							}
						>
							<SectionCard
								title={t('dashboard.topClientsTitle', 'Top clientes do periodo')}
								description={t('dashboard.topClientsDescription', 'Clientes com maior valor vendido no periodo selecionado.')}
							>
								<LightTable
									disableScroll={isExportingPdf}
									columns={[
										{ key: 'nome', label: t('dashboard.table.customer', 'Customer') },
										{ key: 'pedidos', label: t('dashboard.table.orders', 'Orders'), align: 'right' },
										{ key: 'valor', label: t('dashboard.table.value', 'Value'), align: 'right' },
									]}
									rows={snapshot.topClients.map((client) => ({
										nome: client.nome,
										pedidos: formatNumber(client.pedidos),
										valor: formatCurrency(client.valor),
									}))}
								/>
							</SectionCard>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['operations']}
							isReady={hasPhase('operations')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.revenuePerHourTitle', 'Receita por hora')}
									description={t('dashboard.operationsLoading', 'Carregando operacao e ranking de produtos.')}
								>
									<SectionSkeleton chart />
								</SectionCard>
							}
						>
							<div className="space-y-4 xl:space-y-5">
								<SectionCard
									title={t('dashboard.topProductsTitle', 'Top produtos do periodo')}
									description={t('dashboard.topProductsDescription', 'Produtos com maior valor vendido no periodo selecionado.')}
								>
									{hasTopProductsData ? (
										<LightTable
											disableScroll={isExportingPdf}
											columns={[
												{ key: 'nome', label: t('dashboard.table.product', 'Product') },
												{ key: 'quantidade', label: t('dashboard.table.quantityShort', 'Qty.'), align: 'right' },
												{ key: 'valor', label: t('dashboard.table.value', 'Value'), align: 'right' },
											]}
											rows={snapshot.topProducts.map((product) => ({
												nome: product.nome,
												quantidade: formatNumber(product.quantidade),
												valor: formatCurrency(product.valor),
											}))}
										/>
									) : (
										<ChartEmptyState title={t('dashboard.empty.topProductsTitle', 'Sem produtos com vendas neste periodo')} />
									)}
								</SectionCard>

								<SectionCard
									title={t('dashboard.revenuePerHourTitle', 'Receita por hora')}
									description={t('dashboard.revenuePerHourDescription', 'Horarios com maior volume de vendas, destacando o horario comercial.')}
								>
									<div className="app-pane-muted mb-2.5 rounded-[0.95rem] px-3 py-2.5 text-[11px] text-slate-600">
										{t('dashboard.revenuePerHourNote', 'Horario comercial (08h as 18h): acompanhamento da distribuicao de receita ao longo do dia.')}
									</div>
									<ChartFrame>
										{hasHourlyData ? (
											<ResponsiveChart>
												<BarChart data={hourlyRows}>
													<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
													<XAxis dataKey="hora" stroke="#64748b" fontSize={11} />
													<YAxis stroke="#64748b" fontSize={11} tickFormatter={(value) => formatCompactCurrency(Number(value))} />
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	`${t('dashboard.tooltip.hour', 'Hour')}: ${(row.name || row.dia || row.data || '').replace('undefined', '')}`,
																	`${t('dashboard.tooltip.revenue', 'Revenue')}: ${formatCurrency(row.valor ?? 0)}`,
																]}
															/>
														}
													/>
													<Bar dataKey="valor" radius={[10, 10, 0, 0]}>
														{hourlyRows.map((item, index) => (
															<Cell key={String(item.name ?? index)} fill={index <= 10 ? '#195f4d' : '#94a3b8'} />
														))}
													</Bar>
												</BarChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState title={t('dashboard.empty.revenuePerHourTitle', 'Sem receita por hora neste periodo')} />
										)}
									</ChartFrame>
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['clients', 'payments']}
							isReady={hasPhase('clients') && hasPhase('payments')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.paymentMethodsTitle', 'Formas de pagamento')}
									description={t('dashboard.paymentsLoading', 'Carregando pagamentos e resumo de incentivos.')}
								>
									<SectionSkeleton chart />
								</SectionCard>
							}
						>
							<div className="grid gap-4 xl:grid-cols-2">
								<SectionCard
									title={t('dashboard.rebuyRateTitle', 'Taxa de recompra')}
									description={t('dashboard.rebuyRateDescription', 'Clientes do periodo que voltaram a comprar em 30, 60 e 90 dias.')}
								>
									<div className="app-pane-muted mb-2.5 flex items-center justify-between rounded-[0.95rem] px-3 py-2.5 text-[11px] text-slate-600">
										<span>{t('dashboard.fixedBaseLabel', 'Base fixa: total de clientes que compraram no periodo')}</span>
										<StatusBadge tone="info">
											{formatNumber(Number(coorteRows[2]?.clientes ?? 0))} {t('dashboard.customersUnit', 'clientes')}
										</StatusBadge>
									</div>
									<ChartFrame heightClass="h-52">
										<ResponsiveChart>
											<BarChart data={coorteRows}>
												<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
												<XAxis dataKey="janela" stroke="#64748b" fontSize={11} />
												<YAxis stroke="#64748b" fontSize={11} tickFormatter={(value) => `${value}%`} />
												<Tooltip
													content={
														<CustomTooltip
															lines={(row) => [
																`${t('dashboard.tooltip.window', 'Window')}: ${(row.name || row.dia || '').replace('undefined', '')}`,
																`${t('dashboard.tooltip.rebuyRate', 'Rebuy rate')}: ${formatPercent(row.value ?? row.valor ?? row.atual ?? 0)}`,
																`${t('dashboard.tooltip.rebuyCustomers', 'Customers with rebuy')}: ${formatNumber(row.clientes ?? 0)}`,
															]}
														/>
													}
												/>
												<Bar dataKey="taxa" fill="#e11d48" radius={[10, 10, 0, 0]} />
											</BarChart>
										</ResponsiveChart>
									</ChartFrame>
								</SectionCard>

								<SectionCard
									title={t('dashboard.paymentMethodsTitle', 'Formas de pagamento')}
									description={t('dashboard.paymentMethodsDescription', 'Distribuicao do valor vendido por tipo de pagamento.')}
								>
									<ChartFrame>
										{hasPaymentData ? (
											<ResponsiveChart>
												<PieChart>
													<Pie data={paymentRows} dataKey="value" nameKey="name" innerRadius={48} outerRadius={92} paddingAngle={4}>
														{paymentRows.map((item, index) => (
															<Cell key={String(item.name ?? index)} fill={chartPalette[index % chartPalette.length]} />
														))}
													</Pie>
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	`${t('dashboard.tooltip.type', 'Type')}: ${row.name || t('dashboard.noType', 'No type')}`,
																	`${t('dashboard.tooltip.records', 'Records')}: ${formatNumber(row.registros ?? 0)}`,
																	`${t('dashboard.tooltip.value', 'Value')}: ${formatCurrency(row.valor ?? row.value ?? 0)}`,
																	`${t('dashboard.tooltip.share', 'Share')}: ${formatPercent(row.value ?? 0)}`,
																]}
															/>
														}
													/>
													<Legend wrapperStyle={{ fontSize: '12px' }} />
												</PieChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState title={t('dashboard.empty.paymentMethodsTitle', 'Sem formas de pagamento neste periodo')} />
										)}
									</ChartFrame>
								</SectionCard>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['payments']}
							isReady={hasPhase('payments')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.marketingOverviewTitle', 'Visao de marketing')}
									description={t('dashboard.paymentsLoading', 'Carregando pagamentos e resumo de incentivos.')}
								>
									<SectionSkeleton lines={4} />
								</SectionCard>
							}
						>
							<SectionCard
								title={t('dashboard.marketingOverviewTitle', 'Visao de marketing')}
								description={t('dashboard.marketingOverviewDescription', 'Indicadores de incentivo e impacto comercial do periodo.')}
							>
								<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
									{snapshot.marketingMetrics.map((metric) => (
										<StatCard
											key={metric.label}
											{...metric}
											description={undefined}
											descriptionKey={hasPreviousComparison ? metric.descriptionKey : undefined}
											showComparison={hasPreviousComparison}
										/>
									))}
								</div>
							</SectionCard>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['marketingMix']}
							isReady={hasPhase('marketingMix')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.incentivesMixTitle', 'Mix de incentivos')}
									description={t('dashboard.incentivesLoading', 'Carregando a distribuicao dos incentivos.')}
								>
									<SectionSkeleton chart />
								</SectionCard>
							}
						>
							<div className="space-y-4 xl:space-y-5">
								<SectionCard
									title={t('dashboard.incentivesMixTitle', 'Mix de incentivos')}
									description={t('dashboard.incentivesMixDescription', 'Distribuicao exclusiva por tipo de incentivo.')}
								>
									<ChartFrame>
										{hasMarketingExclusiveData ? (
											<ResponsiveChart>
												<PieChart>
													<Pie data={marketingMixExclusiveRows} dataKey="value" nameKey="name" outerRadius={95}>
														{marketingMixExclusiveRows.map((item, index) => (
															<Cell key={String(item.name ?? index)} fill={chartPalette[index % chartPalette.length]} />
														))}
													</Pie>
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	row.name || '',
																	`${t('dashboard.tooltip.items', 'Items')}: ${formatNumber(row.qtd ?? 0)}`,
																	`${t('dashboard.tooltip.revenue', 'Revenue')}: ${formatCurrency(row.receita ?? row.valor ?? 0)}`,
																	`${t('dashboard.tooltip.share', 'Share')}: ${formatPercent(row.value ?? 0)}`,
																]}
															/>
														}
													/>
													<Legend wrapperStyle={{ fontSize: '12px' }} />
												</PieChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState title={t('dashboard.empty.incentivesMixTitle', 'Sem mix de incentivos neste periodo')} />
										)}
									</ChartFrame>
								</SectionCard>

								<div className="grid gap-4 xl:grid-cols-2">
									<SectionCard
										title={t('dashboard.incentiveRevenueTitle', 'Receita por tipo de incentivo')}
										description={t('dashboard.incentiveRevenueDescription', 'Receita dos itens com cada tipo de incentivo.')}
									>
										<ChartFrame>
											{hasMarketingInclusiveData ? (
												<ResponsiveChart>
													<BarChart data={marketingMixInclusiveRows}>
														<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
														<XAxis dataKey="name" angle={-20} textAnchor="end" height={62} stroke="#64748b" fontSize={11} />
														<YAxis stroke="#64748b" fontSize={11} tickFormatter={(value) => formatCompactCurrency(Number(value))} />
														<Tooltip
															content={
																<CustomTooltip
																	lines={(row) => [
																		`${t('dashboard.tooltip.type', 'Type')}: ${row.name || ''}`,
																		`${t('dashboard.tooltip.items', 'Items')}: ${formatNumber(row.qtd ?? 0)}`,
																		`${t('dashboard.tooltip.revenue', 'Revenue')}: ${formatCurrency(row.value ?? 0)}`,
																	]}
																/>
															}
														/>
														<Bar dataKey="value" fill="#0f766e" radius={[10, 10, 0, 0]} />
													</BarChart>
												</ResponsiveChart>
											) : (
												<ChartEmptyState title={t('dashboard.empty.incentiveRevenueTitle', 'Sem receita por tipo de incentivo neste periodo')} />
											)}
										</ChartFrame>
									</SectionCard>

									<SectionCard
										title={t('dashboard.ticketComparisonTitle', 'Ticket medio')}
										description={t('dashboard.ticketComparisonDescription', 'Comparativo entre pedidos com e sem incentivo.')}
									>
										<ChartFrame>
											{hasMarketingTicketData ? (
												<ResponsiveChart>
													<BarChart data={marketingTicketRows}>
														<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
														<XAxis dataKey="name" stroke="#64748b" fontSize={11} />
														<YAxis stroke="#64748b" fontSize={11} tickFormatter={(value) => formatCurrency(Number(value))} />
														<Tooltip
															content={
																<CustomTooltip lines={(row) => [row.name || '', `${t('dashboard.tooltip.averageTicket', 'Average ticket')}: ${formatCurrency(row.value ?? 0)}`]} />
															}
														/>
														<Bar dataKey="value" fill="#f59e0b" radius={[10, 10, 0, 0]} />
													</BarChart>
												</ResponsiveChart>
											) : (
												<ChartEmptyState title={t('dashboard.empty.ticketComparisonTitle', 'Sem comparativo de ticket neste periodo')} />
											)}
										</ChartFrame>
									</SectionCard>
								</div>
							</div>
						</LazyDashboardSection>

						<LazyDashboardSection
							phaseIds={['marketingTops']}
							isReady={hasPhase('marketingTops')}
							requestPhases={requestPhases}
							fallback={
								<SectionCard
									title={t('dashboard.topCouponsTitle', 'Top cupons por receita')}
									description={t('dashboard.marketingTopsLoading', 'Carregando os rankings finais do periodo.')}
								>
									<SectionSkeleton chart />
								</SectionCard>
							}
						>
							<div className="grid gap-4 xl:grid-cols-2">
								<SectionCard
									title={t('dashboard.topCouponsTitle', 'Top cupons por receita')}
									description={t('dashboard.topCouponsDescription', 'Cupons com maior receita no periodo.')}
								>
									<ChartFrame>
										{hasCouponData ? (
											<ResponsiveChart>
												<BarChart data={couponRows} layout="vertical">
													<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
													<XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(value) => formatCompactCurrency(Number(value))} />
													<YAxis type="category" dataKey="nome" width={116} stroke="#64748b" fontSize={11} />
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	`${t('dashboard.tooltip.coupon', 'Coupon')}: ${(row.name || row.dia || '').replace('undefined', '')}`,
																	row.fonte
																		? `${t('dashboard.tooltip.source', 'Source')}: ${
																				row.fonte === 'automatico' ? t('dashboard.couponAutomatic', 'Automatic coupon') : t('dashboard.couponManual', 'Manual coupon')
																			}`
																		: '',
																	`${t('dashboard.table.orders', 'Orders')}: ${formatNumber(row.pedidos ?? 0)}`,
																	`${t('dashboard.tooltip.revenue', 'Revenue')}: ${formatCurrency(row.receita ?? row.value ?? 0)}`,
																]}
															/>
														}
													/>
													<Bar dataKey="receita" fill="#0284c7" radius={[0, 10, 10, 0]} />
												</BarChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState title={t('dashboard.empty.topCouponsTitle', 'Sem cupons com receita neste periodo')} />
										)}
									</ChartFrame>
								</SectionCard>

								<SectionCard
									title={t('dashboard.topPromotionsTitle', 'Top promocoes por receita')}
									description={t('dashboard.topPromotionsDescription', 'Promocoes com maior impacto em receita no periodo.')}
								>
									<ChartFrame>
										{hasPromotionData ? (
											<ResponsiveChart>
												<BarChart data={promotionRows} layout="vertical">
													<CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
													<XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(value) => formatCompactCurrency(Number(value))} />
													<YAxis type="category" dataKey="nome" width={132} stroke="#64748b" fontSize={11} />
													<Tooltip
														content={
															<CustomTooltip
																lines={(row) => [
																	`${t('dashboard.tooltip.promotion', 'Promotion')}: ${(row.name || row.dia || '').replace('undefined', '')}`,
																	`${t('dashboard.table.orders', 'Orders')}: ${formatNumber(row.pedidos ?? 0)}`,
																	`${t('dashboard.tooltip.revenue', 'Revenue')}: ${formatCurrency(row.receita ?? row.value ?? 0)}`,
																]}
															/>
														}
													/>
													<Bar dataKey="receita" fill="#e11d48" radius={[0, 10, 10, 0]} />
												</BarChart>
											</ResponsiveChart>
										) : (
											<ChartEmptyState title={t('dashboard.empty.topPromotionsTitle', 'Sem promocoes com receita neste periodo')} />
										)}
									</ChartFrame>
								</SectionCard>
							</div>
						</LazyDashboardSection>
					</>
				) : null}
			</AsyncState>
		</div>
	);
}
