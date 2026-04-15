'use client';

import { ExternalLink, Eye, Link2, Plus, RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppDataTable } from '@/src/components/data-table/app-data-table';
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters';
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar';
import type { AppDataTableColumn } from '@/src/components/data-table/types';
import { AsyncState } from '@/src/components/ui/async-state';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';
import { meusAtendimentosClient, DEFAULT_MEUS_ATENDIMENTOS_FILTERS } from '@/src/features/meus-atendimentos/services/meus-atendimentos-client';
import type { AtendimentoDetail, MeusAtendimentosFilters, MeusAtendimentosRow } from '@/src/features/meus-atendimentos/services/meus-atendimentos-types';

function formatUnixDateTime(value: number, locale: string) {
	if (!value) {
		return '-';
	}

	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(new Date(value * 1000));
}

function statusTone(status: string) {
	return status === 'open' ? 'success' : 'danger';
}

function statusLabel(status: string, t: ReturnType<typeof useI18n>['t']) {
	return status === 'open' ? t('clientMenu.myTickets.status.open', 'Aberto') : t('clientMenu.myTickets.status.closed', 'Fechado');
}

export function MeusAtendimentosPage() {
	const { t, locale } = useI18n();
	const [filters, setFilters] = useState<MeusAtendimentosFilters>(DEFAULT_MEUS_ATENDIMENTOS_FILTERS);
	const [draft, setDraft] = useState<MeusAtendimentosFilters>(DEFAULT_MEUS_ATENDIMENTOS_FILTERS);
	const [expanded, setExpanded] = useState(false);
	const [cursorMap, setCursorMap] = useState<Record<number, string>>({});
	const [selectedId, setSelectedId] = useState('');

	const listState = useAsyncData(async () => {
		const startingAfter = filters.page > 1 ? (cursorMap[filters.page] ?? '') : '';
		const result = await meusAtendimentosClient.list(filters, startingAfter);
		if (result.nextCursor) {
			setCursorMap((current) => ({ ...current, [filters.page + 1]: result.nextCursor as string }));
		}
		return result;
	}, [filters, cursorMap]);
	const detailState = useAsyncData<AtendimentoDetail | null>(() => (selectedId ? meusAtendimentosClient.getById(selectedId) : Promise.resolve(null)), [selectedId]);

	const columns = useMemo(
		() =>
			[
				{
					id: 'protocolo',
					label: t('clientMenu.myTickets.columns.protocol', 'Protocolo'),
					cell: (record: MeusAtendimentosRow) => <span className="font-semibold text-(--app-text)">{record.protocolo}</span>,
					filter: { id: 'protocolo', label: t('clientMenu.myTickets.columns.protocol', 'Protocolo'), kind: 'text', key: 'protocolo' as const },
				},
				{
					id: 'data_abertura',
					label: t('clientMenu.myTickets.columns.openedAt', 'Data de abertura'),
					cell: (record: MeusAtendimentosRow) => <span>{formatUnixDateTime(record.data_abertura, locale)}</span>,
					filter: { id: 'periodo', label: t('clientMenu.myTickets.filters.period', 'Período'), kind: 'date-range', fromKey: 'dataInicio' as const, toKey: 'dataFim' as const },
				},
				{
					id: 'data_encerramento',
					label: t('clientMenu.myTickets.columns.closedAt', 'Data de encerramento'),
					cell: (record: MeusAtendimentosRow) => <span>{record.status === 'open' ? '-' : formatUnixDateTime(record.data_encerramento, locale)}</span>,
				},
				{
					id: 'status',
					label: t('clientMenu.myTickets.columns.status', 'Status'),
					cell: (record: MeusAtendimentosRow) => <StatusBadge tone={statusTone(record.status)}>{statusLabel(record.status, t)}</StatusBadge>,
					filter: {
						id: 'status',
						label: t('clientMenu.myTickets.columns.status', 'Status'),
						kind: 'select',
						key: 'status' as const,
						options: [
							{ value: 'open', label: t('clientMenu.myTickets.status.open', 'Aberto') },
							{ value: 'closed', label: t('clientMenu.myTickets.status.closed', 'Fechado') },
						],
					},
				},
			] satisfies AppDataTableColumn<MeusAtendimentosRow, MeusAtendimentosFilters>[],
		[locale, t],
	);

	function patchDraft(patch: Partial<MeusAtendimentosFilters>) {
		setDraft((current) => ({ ...current, ...patch }));
	}

	function applyFilters() {
		setCursorMap({});
		setFilters({ ...draft, page: 1 });
	}

	function clearFilters() {
		setCursorMap({});
		setDraft(DEFAULT_MEUS_ATENDIMENTOS_FILTERS);
		setFilters(DEFAULT_MEUS_ATENDIMENTOS_FILTERS);
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[{ label: t('routes.dashboard', 'Início'), href: '/dashboard' }, { label: t('clientMenu.myTickets.title', 'Meus atendimentos') }]}
				actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={listState.reload} />}
			/>

			<AsyncState isLoading={listState.isLoading} error={listState.error}>
				<SectionCard
					title={t('clientMenu.myTickets.title', 'Meus atendimentos')}
					description={t('clientMenu.myTickets.description', 'Acompanhe os protocolos vinculados ao seu usuário e consulte o histórico das conversas no v2.')}
					action={
						<div className="flex w-full items-center justify-between gap-3">
							<DataTableFilterToggleAction
								expanded={expanded}
								onClick={() => setExpanded((current) => !current)}
								collapsedLabel={t('filters.button', 'Filtros')}
								expandedLabel={t('filters.hide', 'Ocultar filtros')}
							/>
							<DataTablePageActions
								actions={[
									{
										label: t('clientMenu.myTickets.intercomBinding', 'Vínculo Intercom'),
										icon: Link2,
										href: '/meus-atendimentos/vinculo-intercom',
										tone: 'secondary',
									},
									{
										label: t('clientMenu.myTickets.newTicket', 'Novo atendimento'),
										icon: Plus,
										tone: 'primary',
										onClick: () => {
											if (typeof window !== 'undefined') {
												window.open('https://app.intercom.com/', '_blank', 'noopener,noreferrer');
											}
										},
									},
								]}
							/>
						</div>
					}
				>
					<div className="space-y-4">
						<DataTableFiltersCard<MeusAtendimentosFilters>
							variant="embedded"
							columns={columns as AppDataTableColumn<unknown, MeusAtendimentosFilters>[]}
							draft={draft}
							applied={filters}
							expanded={expanded}
							onToggleExpanded={() => setExpanded((current) => !current)}
							onApply={applyFilters}
							onClear={clearFilters}
							patchDraft={(key, value) => patchDraft({ [key]: value } as Partial<MeusAtendimentosFilters>)}
						/>

						<AppDataTable<MeusAtendimentosRow, string, MeusAtendimentosFilters>
							rows={listState.data?.data || []}
							getRowId={(record) => record.id}
							columns={columns}
							emptyMessage={t('clientMenu.myTickets.empty', 'Nenhum atendimento encontrado com os filtros atuais.')}
							rowActions={(record) => [
								{
									id: 'view',
									label: t('simpleCrud.actions.view', 'Visualizar'),
									icon: Eye,
									onClick: () => setSelectedId(record.id),
								},
								{
									id: 'open-external',
									label: t('clientMenu.myTickets.openIntercom', 'Abrir no Intercom'),
									icon: ExternalLink,
									onClick: () => {
										if (typeof window !== 'undefined') {
											window.open('https://app.intercom.com/', '_blank', 'noopener,noreferrer');
										}
									},
								},
							]}
							mobileCard={{
								title: (record) => record.protocolo,
								subtitle: (record) => formatUnixDateTime(record.data_abertura, locale),
								meta: (record) => (record.status === 'open' ? t('clientMenu.myTickets.status.open', 'Aberto') : t('clientMenu.myTickets.status.closed', 'Fechado')),
								badges: (record) => <StatusBadge tone={statusTone(record.status)}>{statusLabel(record.status, t)}</StatusBadge>,
							}}
							pagination={listState.data?.meta}
							onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
							pageSize={{
								value: filters.perPage,
								options: [5, 10, 15, 20],
								onChange: (perPage) => {
									setCursorMap({});
									setDraft((current) => ({ ...current, perPage, page: 1 }));
									setFilters((current) => ({ ...current, perPage, page: 1 }));
								},
							}}
						/>
					</div>
				</SectionCard>
			</AsyncState>

			<OverlayModal
				open={Boolean(selectedId)}
				title={
					detailState.data?.protocolo
						? `${t('clientMenu.myTickets.modalTitle', 'Atendimento')} #${detailState.data.protocolo}`
						: t('clientMenu.myTickets.modalTitle', 'Atendimento')
				}
				onClose={() => setSelectedId('')}
				maxWidthClassName="max-w-4xl"
			>
				<AsyncState isLoading={detailState.isLoading} error={detailState.error}>
					{detailState.data ? (
						<div className="space-y-5">
							<div className="grid gap-3 md:grid-cols-3">
								<div className="app-control-muted rounded-[1rem] px-4 py-3">
									<div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('clientMenu.myTickets.columns.status', 'Status')}</div>
									<div className="mt-2">
										<StatusBadge tone={statusTone(detailState.data.status)}>{statusLabel(detailState.data.status, t)}</StatusBadge>
									</div>
								</div>
								<div className="app-control-muted rounded-[1rem] px-4 py-3">
									<div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('clientMenu.myTickets.columns.openedAt', 'Data de abertura')}</div>
									<div className="mt-2 text-sm font-semibold text-(--app-text)">{formatUnixDateTime(detailState.data.dataAbertura, locale)}</div>
								</div>
								<div className="app-control-muted rounded-[1rem] px-4 py-3">
									<div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('clientMenu.myTickets.columns.closedAt', 'Data de encerramento')}</div>
									<div className="mt-2 text-sm font-semibold text-(--app-text)">
										{detailState.data.status === 'open' ? '-' : formatUnixDateTime(detailState.data.dataEncerramento, locale)}
									</div>
								</div>
							</div>

							{detailState.data.assunto ? (
								<div className="app-pane rounded-[1rem] border px-4 py-3">
									<div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('clientMenu.myTickets.subject', 'Assunto')}</div>
									<div className="mt-2 text-sm text-(--app-text)">{detailState.data.assunto}</div>
								</div>
							) : null}

							<div className="space-y-3">
								{detailState.data.timeline.map((entry) => (
									<article key={entry.id} className="app-pane rounded-[1rem] border px-4 py-4">
										<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
											<div>
												<p className="text-sm font-semibold text-(--app-text)">{entry.authorName}</p>
												<p className="text-xs text-slate-500">
													{entry.authorType} • {formatUnixDateTime(entry.createdAt, locale)}
												</p>
											</div>
											<StatusBadge tone={entry.authorType === 'admin' ? 'info' : 'neutral'}>{entry.partType || entry.authorType}</StatusBadge>
										</div>
										<div
											className="prose prose-sm mt-3 max-w-none text-slate-700 dark:prose-invert [&_a]:text-accent [&_img]:rounded-xl [&_img]:shadow-sm"
											dangerouslySetInnerHTML={{ __html: entry.body || '<p>-</p>' }}
										/>
									</article>
								))}
							</div>
						</div>
					) : null}
				</AsyncState>
			</OverlayModal>
		</div>
	);
}
