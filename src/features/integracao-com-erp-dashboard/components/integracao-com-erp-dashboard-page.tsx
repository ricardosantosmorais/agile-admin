'use client';

import Image from 'next/image';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AlertTriangle, Building2, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AsyncState } from '@/src/components/ui/async-state';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { integracaoComErpDashboardClient } from '@/src/features/integracao-com-erp-dashboard/services/integracao-com-erp-dashboard-client';
import type {
	IntegracaoComErpDashboardFailureRow,
	IntegracaoComErpDashboardSnapshot,
} from '@/src/features/integracao-com-erp-dashboard/services/integracao-com-erp-dashboard-types';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';
import { formatDateTime } from '@/src/lib/date-time';
import { formatNumber } from '@/src/lib/formatters';

const POLLING_INTERVAL_MS = 60_000;

type ToastState = {
	tone: 'success' | 'error';
	message: string;
};

function SummaryMetric({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'success' | 'danger' }) {
	if (tone === 'success') {
		return (
			<div className="app-metric-card-success rounded-2xl px-4 py-3">
				<div className="app-metric-card-success-label text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</div>
				<div className="app-metric-card-success-value mt-2 text-2xl font-black tracking-tight">{formatNumber(value)}</div>
			</div>
		);
	}

	if (tone === 'danger') {
		return (
			<div className="app-metric-card-danger rounded-2xl px-4 py-3">
				<div className="app-metric-card-danger-label text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</div>
				<div className="app-metric-card-danger-value mt-2 text-2xl font-black tracking-tight">{formatNumber(value)}</div>
			</div>
		);
	}

	return (
		<div className="app-control-muted rounded-2xl px-4 py-3">
			<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</div>
			<div className="text-(--app-text) mt-2 text-2xl font-black tracking-tight">{formatNumber(value)}</div>
		</div>
	);
}

function CompanyListItem({ logoUrl, title, subtitle, badge }: { logoUrl: string; title: string; subtitle: string; badge?: React.ReactNode }) {
	return (
		<div className="app-control flex items-center gap-3 rounded-2xl px-4 py-3">
			<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-(--app-surface-muted)">
				{logoUrl ? (
					<Image src={logoUrl} alt={title} fill sizes="44px" className="object-contain p-1.5" />
				) : (
					<div className="flex h-full w-full items-center justify-center text-(--app-muted)">
						<Building2 className="h-5 w-5" />
					</div>
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-semibold text-(--app-text)">{title}</div>
				<div className="text-(--app-muted) mt-1 text-xs leading-5">{subtitle}</div>
			</div>
			{badge ? <div className="shrink-0">{badge}</div> : null}
		</div>
	);
}

function EmptyListState({ message }: { message: string }) {
	return <div className="text-(--app-muted) rounded-2xl border border-dashed border-(--app-card-border) px-4 py-5 text-sm leading-6">{message}</div>;
}

function IntegratorStatusChart({ snapshot, t }: { snapshot: IntegracaoComErpDashboardSnapshot; t: ReturnType<typeof useI18n>['t'] }) {
	const chartData = useMemo(
		() => [
			{ id: 'connected', name: t('maintenance.erpIntegration.dashboard.labels.connected', 'Conectados'), value: snapshot.integrators.connected, color: '#15803d' },
			{ id: 'disconnected', name: t('maintenance.erpIntegration.dashboard.labels.disconnected', 'Desconectados'), value: snapshot.integrators.disconnected, color: '#dc2626' },
		],
		[snapshot.integrators.connected, snapshot.integrators.disconnected, t],
	);

	const total = chartData.reduce((current, item) => current + item.value, 0);

	return (
		<div className="grid gap-4 lg:grid-cols-[200px_1fr] lg:items-center">
			<div className="h-52 min-w-0">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={2} strokeWidth={0}>
							{chartData.map((item) => (
								<Cell key={item.id} fill={item.color} />
							))}
						</Pie>
						<Tooltip formatter={(value: number) => formatNumber(value)} />
					</PieChart>
				</ResponsiveContainer>
			</div>
			<div className="space-y-3">
				<div className="app-control-muted rounded-2xl px-4 py-3">
					<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.16em]">
						{t('maintenance.erpIntegration.dashboard.labels.totalIntegrators', 'Total monitorado')}
					</div>
					<div className="text-(--app-text) mt-2 text-2xl font-black tracking-tight">{formatNumber(total)}</div>
				</div>
				{chartData.map((item) => (
					<div key={item.id} className="app-control flex items-center justify-between rounded-2xl px-4 py-3">
						<div className="flex items-center gap-3">
							<span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
							<span className="text-sm font-semibold text-(--app-text)">{item.name}</span>
						</div>
						<span className="text-(--app-muted) text-sm font-semibold">{formatNumber(item.value)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function IntegracaoComErpDashboardPage() {
	const { locale, t } = useI18n();
	const access = useFeatureAccess('erpDashboard');
	const [selectedFailure, setSelectedFailure] = useState<IntegracaoComErpDashboardFailureRow | null>(null);
	const [toast, setToast] = useState<ToastState | null>(null);
	const { data: snapshot, error, isLoading, reload } = useAsyncData(() => integracaoComErpDashboardClient.get(), []);

	useEffect(() => {
		if (!access.canOpen) {
			return;
		}

		const timer = window.setInterval(() => {
			reload();
		}, POLLING_INTERVAL_MS);

		return () => window.clearInterval(timer);
	}, [access.canOpen, reload]);

	if (!access.canOpen) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.modules.dashboard.title', 'Dashboard ERP')} backHref="/dashboard" />;
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
					{ label: t('maintenance.erpIntegration.modules.dashboard.title', 'Dashboard ERP') },
				]}
				actions={
					<button
						type="button"
						onClick={() => {
							void reload();
							setToast({ tone: 'success', message: t('maintenance.erpIntegration.dashboard.feedback.refreshRequested', 'Atualização solicitada.') });
						}}
						className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
					>
						<RefreshCcw className="h-4 w-4" />
						{t('common.refresh', 'Atualizar')}
					</button>
				}
			/>

			<AsyncState isLoading={isLoading} error={error}>
				{toast ? <PageToast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}

				{snapshot ? (
					<>
						<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
							<div className="app-control-muted rounded-2xl px-4 py-3">
								<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.16em]">
									{t('maintenance.erpIntegration.dashboard.labels.lastUpdated', 'Última atualização')}
								</div>
								<div className="text-(--app-text) mt-2 text-sm font-semibold">{formatDateTime(snapshot.refreshedAt, locale)}</div>
							</div>
							<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.connected', 'Conectados')} value={snapshot.integrators.connected} tone="success" />
							<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.disconnected', 'Desconectados')} value={snapshot.integrators.disconnected} tone="danger" />
							<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.failedServices', 'Falhas monitoradas')} value={snapshot.failedServices.length} tone="neutral" />
						</div>

						<div className="grid gap-4 xl:grid-cols-3">
							<div className="space-y-4">
								<SectionCard
									title={t('maintenance.erpIntegration.dashboard.sections.integrators.title', 'Status dos Integradores')}
									description={t('maintenance.erpIntegration.dashboard.sections.integrators.description', 'Visão consolidada da conectividade atual dos integradores ERP.')}
								>
									<IntegratorStatusChart snapshot={snapshot} t={t} />
								</SectionCard>
								<SectionCard
									title={t('maintenance.erpIntegration.dashboard.sections.disconnectedCompanies.title', 'Integradores Desconectados')}
									description={t(
										'maintenance.erpIntegration.dashboard.sections.disconnectedCompanies.description',
										'Empresas que exigem verificação imediata da conectividade do integrador.',
									)}
								>
									<div className="space-y-3">
										{snapshot.disconnectedCompanies.length ? (
											snapshot.disconnectedCompanies.map((company) => (
												<CompanyListItem
													key={company.id}
													logoUrl={company.logoUrl}
													title={company.name}
													subtitle={`${t('maintenance.erpIntegration.dashboard.labels.lastSeen', 'Última leitura')}: ${company.disconnectedAt ? formatDateTime(company.disconnectedAt, locale) : '-'}`}
													badge={<StatusBadge tone="danger">{t('maintenance.erpIntegration.dashboard.labels.disconnected', 'Desconectados')}</StatusBadge>}
												/>
											))
										) : (
											<EmptyListState message={t('maintenance.erpIntegration.dashboard.empty.noDisconnectedCompanies', 'Nenhum integrador desconectado no momento.')} />
										)}
									</div>
								</SectionCard>
							</div>

							<div className="space-y-4">
								<SectionCard
									title={t('maintenance.erpIntegration.dashboard.sections.orders.title', 'Internalização dos Pedidos')}
									description={t('maintenance.erpIntegration.dashboard.sections.orders.description', 'Resumo diário e acumulado dos pedidos internalizados pelo ERP.')}
								>
									<div className="space-y-4">
										<div>
											<div className="text-(--app-muted) mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
												{t('maintenance.erpIntegration.dashboard.labels.today', 'Hoje')}
											</div>
											<div className="grid gap-3 sm:grid-cols-3">
												<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.total', 'Total')} value={snapshot.orders.today.total} />
												<SummaryMetric
													label={t('maintenance.erpIntegration.dashboard.labels.internalized', 'Internalizados')}
													value={snapshot.orders.today.internalized}
													tone="success"
												/>
												<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.pending', 'Pendentes')} value={snapshot.orders.today.pending} tone="danger" />
											</div>
										</div>
										<div>
											<div className="text-(--app-muted) mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
												{t('maintenance.erpIntegration.dashboard.labels.last30Days', 'Últimos 30 dias')}
											</div>
											<div className="grid gap-3 sm:grid-cols-3">
												<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.total', 'Total')} value={snapshot.orders.last30Days.total} />
												<SummaryMetric
													label={t('maintenance.erpIntegration.dashboard.labels.internalized', 'Internalizados')}
													value={snapshot.orders.last30Days.internalized}
													tone="success"
												/>
												<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.pending', 'Pendentes')} value={snapshot.orders.last30Days.pending} tone="danger" />
											</div>
										</div>
									</div>
								</SectionCard>
								<SectionCard
									title={t('maintenance.erpIntegration.dashboard.sections.pendingCompanies.title', 'Empresas com Pedidos Pendentes')}
									description={t(
										'maintenance.erpIntegration.dashboard.sections.pendingCompanies.description',
										'Priorize os tenants com acúmulo de pedidos pendentes para internalização.',
									)}
								>
									<div className="space-y-3">
										{snapshot.orders.pendingCompanies.length ? (
											snapshot.orders.pendingCompanies.map((company) => (
												<CompanyListItem
													key={company.id}
													logoUrl={company.logoUrl}
													title={company.name}
													subtitle={`${t('maintenance.erpIntegration.dashboard.labels.pendingToday', 'Hoje')}: ${formatNumber(company.pendingToday)} | ${t('maintenance.erpIntegration.dashboard.labels.pendingLast30Days', 'Últimos 30 dias')}: ${formatNumber(company.pendingLast30Days)}${company.pendingAt ? ` • ${formatDateTime(company.pendingAt, locale)}` : ''}`}
													badge={<StatusBadge tone="warning">{t('maintenance.erpIntegration.dashboard.labels.pending', 'Pendentes')}</StatusBadge>}
												/>
											))
										) : (
											<EmptyListState
												message={t('maintenance.erpIntegration.dashboard.empty.noPendingCompanies', 'Nenhuma empresa com pedidos pendentes no período monitorado.')}
											/>
										)}
									</div>
								</SectionCard>
							</div>

							<div className="space-y-4">
								<SectionCard
									title={t('maintenance.erpIntegration.dashboard.sections.services.title', 'Resumo dos Serviços')}
									description={t(
										'maintenance.erpIntegration.dashboard.sections.services.description',
										'Acompanhe o volume processado e os sinais de falha na execução dos serviços ERP.',
									)}
								>
									<div className="grid gap-3 sm:grid-cols-3">
										<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.total', 'Total')} value={snapshot.services.total} />
										<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.finalized', 'Finalizados')} value={snapshot.services.finalized} tone="success" />
										<SummaryMetric label={t('maintenance.erpIntegration.dashboard.labels.failed', 'Falha na execução')} value={snapshot.services.failed} tone="danger" />
									</div>
								</SectionCard>
								<SectionCard
									title={t('maintenance.erpIntegration.dashboard.sections.failures.title', 'Serviços Monitorados em Situação de Falha')}
									description={t('maintenance.erpIntegration.dashboard.sections.failures.description', 'Últimas falhas registradas para investigação rápida do time operacional.')}
								>
									<div className="space-y-3">
										{snapshot.failedServices.length ? (
											snapshot.failedServices.slice(0, 10).map((failure) => (
												<div key={failure.executionId || `${failure.companyId}-${failure.serviceName}`} className="app-control rounded-2xl px-4 py-3">
													<div className="flex items-start gap-3">
														<div className="mt-0.5 shrink-0 text-red-600">
															<AlertTriangle className="h-5 w-5" />
														</div>
														<div className="min-w-0 flex-1">
															<div className="text-sm font-semibold text-(--app-text)">
																{failure.companyName || t('maintenance.erpIntegration.dashboard.labels.unknownCompany', 'Empresa não identificada')}
															</div>
															<div className="text-(--app-muted) mt-1 text-xs leading-5">
																{failure.serviceName || t('maintenance.erpIntegration.dashboard.labels.unknownService', 'Serviço não identificado')}
															</div>
															<div className="text-(--app-muted) mt-1 text-xs">{failure.startedAt ? formatDateTime(failure.startedAt, locale) : '-'}</div>
														</div>
														<button
															type="button"
															className="app-button-secondary shrink-0 rounded-full px-3 py-2 text-xs font-semibold"
															onClick={() => setSelectedFailure(failure)}
														>
															{t('maintenance.erpIntegration.dashboard.actions.viewDetails', 'Detalhes')}
														</button>
													</div>
												</div>
											))
										) : (
											<EmptyListState message={t('maintenance.erpIntegration.dashboard.empty.noFailures', 'Nenhum serviço em situação de falha no momento.')} />
										)}
									</div>
								</SectionCard>
							</div>
						</div>
					</>
				) : null}
			</AsyncState>

			<OverlayModal
				open={Boolean(selectedFailure)}
				onClose={() => setSelectedFailure(null)}
				title={selectedFailure?.serviceName || t('maintenance.erpIntegration.dashboard.modal.failureTitle', 'Detalhes da Falha')}
				maxWidthClassName="max-w-3xl"
			>
				{selectedFailure ? (
					<div className="space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="app-control rounded-2xl px-4 py-3">
								<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.14em]">
									{t('maintenance.erpIntegration.dashboard.labels.company', 'Empresa')}
								</div>
								<div className="text-(--app-text) mt-2 text-sm font-semibold">{selectedFailure.companyName}</div>
							</div>
							<div className="app-control rounded-2xl px-4 py-3">
								<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.14em]">
									{t('maintenance.erpIntegration.dashboard.labels.startedAt', 'Início da execução')}
								</div>
								<div className="text-(--app-text) mt-2 text-sm font-semibold">{selectedFailure.startedAt ? formatDateTime(selectedFailure.startedAt, locale) : '-'}</div>
							</div>
						</div>
						{selectedFailure.metadataDetails.length ? (
							<div className="space-y-3">
								{selectedFailure.metadataDetails.map((detail, index) => (
									<div key={`${detail.label}-${index}`} className="app-control rounded-2xl px-4 py-3">
										<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.14em]">{detail.label}</div>
										<div className="text-(--app-text) mt-2 whitespace-pre-wrap break-words text-sm leading-6">{detail.value}</div>
									</div>
								))}
							</div>
						) : selectedFailure.metadataRaw ? (
							<div className="app-control rounded-2xl px-4 py-3">
								<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.14em]">
									{t('maintenance.erpIntegration.dashboard.labels.metadata', 'Metadata')}
								</div>
								<div className="text-(--app-text) mt-2 whitespace-pre-wrap break-words text-sm leading-6">{selectedFailure.metadataRaw}</div>
							</div>
						) : (
							<EmptyListState message={t('maintenance.erpIntegration.dashboard.empty.emptyMetadata', 'Nenhum detalhe adicional foi enviado para esta falha.')} />
						)}
					</div>
				) : null}
			</OverlayModal>
		</div>
	);
}
