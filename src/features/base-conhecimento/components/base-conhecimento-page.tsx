'use client';

import { BookOpen, Eye, RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppDataTable } from '@/src/components/data-table/app-data-table';
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters';
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar';
import type { AppDataTableColumn } from '@/src/components/data-table/types';
import { AsyncState } from '@/src/components/ui/async-state';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionCard } from '@/src/components/ui/section-card';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';
import { baseConhecimentoClient, DEFAULT_BASE_CONHECIMENTO_FILTERS } from '@/src/features/base-conhecimento/services/base-conhecimento-client';
import type { BaseConhecimentoFilters, BaseConhecimentoItem } from '@/src/features/base-conhecimento/services/base-conhecimento-types';

function formatUnixDateTime(value: number, locale: string) {
	if (!value) {
		return '-';
	}

	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(new Date(value * 1000));
}

export function BaseConhecimentoPage() {
	const { t, locale } = useI18n();
	const [filters, setFilters] = useState<BaseConhecimentoFilters>(DEFAULT_BASE_CONHECIMENTO_FILTERS);
	const [draft, setDraft] = useState<BaseConhecimentoFilters>(DEFAULT_BASE_CONHECIMENTO_FILTERS);
	const [expanded, setExpanded] = useState(false);
	const [selectedArticle, setSelectedArticle] = useState<BaseConhecimentoItem | null>(null);

	const listState = useAsyncData(() => baseConhecimentoClient.list(filters), [filters]);

	const columns = useMemo(
		() =>
			[
				{
					id: 'titulo',
					label: t('clientMenu.knowledgeBase.columns.title', 'Artigos'),
					cell: (record: BaseConhecimentoItem) => (
						<div className="space-y-1">
							<div className="font-semibold text-(--app-text)">{record.titulo || '-'}</div>
							{record.descricao ? <div className="text-sm text-slate-500">{record.descricao}</div> : null}
						</div>
					),
					filter: { id: 'phrase', label: t('clientMenu.knowledgeBase.filters.keyword', 'Título / palavra-chave'), kind: 'text', key: 'phrase' as const },
				},
				{
					id: 'dataCriacao',
					label: t('clientMenu.knowledgeBase.columns.createdAt', 'Data de criação'),
					cell: (record: BaseConhecimentoItem) => <span>{formatUnixDateTime(record.dataCriacao, locale)}</span>,
				},
			] satisfies AppDataTableColumn<BaseConhecimentoItem, BaseConhecimentoFilters>[],
		[locale, t],
	);

	function patchDraft(patch: Partial<BaseConhecimentoFilters>) {
		setDraft((current) => ({ ...current, ...patch }));
	}

	function applyFilters() {
		setFilters({ ...draft, page: 1 });
	}

	function clearFilters() {
		setDraft(DEFAULT_BASE_CONHECIMENTO_FILTERS);
		setFilters(DEFAULT_BASE_CONHECIMENTO_FILTERS);
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[{ label: t('routes.dashboard', 'Início'), href: '/dashboard' }, { label: t('clientMenu.knowledgeBase.title', 'Base de conhecimento') }]}
				actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={listState.reload} />}
			/>

			<AsyncState isLoading={listState.isLoading} error={listState.error}>
				<SectionCard
					title={t('clientMenu.knowledgeBase.title', 'Base de conhecimento')}
					description={t('clientMenu.knowledgeBase.description', 'Consulte os artigos publicados no Intercom diretamente no shell do admin v2.')}
					action={
						<DataTableFilterToggleAction
							expanded={expanded}
							onClick={() => setExpanded((current) => !current)}
							collapsedLabel={t('filters.button', 'Filtros')}
							expandedLabel={t('filters.hide', 'Ocultar filtros')}
						/>
					}
				>
					<div className="space-y-4">
						<DataTableFiltersCard<BaseConhecimentoFilters>
							variant="embedded"
							columns={columns as AppDataTableColumn<unknown, BaseConhecimentoFilters>[]}
							draft={draft}
							applied={filters}
							expanded={expanded}
							onToggleExpanded={() => setExpanded((current) => !current)}
							onApply={applyFilters}
							onClear={clearFilters}
							patchDraft={(key, value) => patchDraft({ [key]: value } as Partial<BaseConhecimentoFilters>)}
						/>

						<AppDataTable<BaseConhecimentoItem, string, BaseConhecimentoFilters>
							rows={listState.data?.data || []}
							getRowId={(record) => record.id}
							columns={columns}
							emptyMessage={t('clientMenu.knowledgeBase.empty', 'Nenhum artigo encontrado com os filtros atuais.')}
							rowActions={(record) => [
								{
									id: 'view',
									label: t('simpleCrud.actions.view', 'Visualizar'),
									icon: Eye,
									onClick: () => setSelectedArticle(record),
								},
							]}
							mobileCard={{
								title: (record) => record.titulo || '-',
								subtitle: (record) => record.descricao || '-',
								meta: (record) => formatUnixDateTime(record.dataCriacao, locale),
								badges: () => (
									<div className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
										<BookOpen className="h-3.5 w-3.5" />
										{t('clientMenu.knowledgeBase.articleBadge', 'Artigo')}
									</div>
								),
							}}
							pagination={listState.data?.meta}
							onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
							pageSize={{
								value: filters.perPage,
								options: [15, 30, 45, 60],
								onChange: (perPage) => {
									setDraft((current) => ({ ...current, perPage, page: 1 }));
									setFilters((current) => ({ ...current, perPage, page: 1 }));
								},
							}}
						/>
					</div>
				</SectionCard>
			</AsyncState>

			<OverlayModal
				open={Boolean(selectedArticle)}
				title={selectedArticle?.titulo || t('clientMenu.knowledgeBase.title', 'Base de conhecimento')}
				onClose={() => setSelectedArticle(null)}
				maxWidthClassName="max-w-5xl"
			>
				{selectedArticle ? (
					<div className="space-y-4">
						<div className="text-sm text-slate-500">{formatUnixDateTime(selectedArticle.dataCriacao, locale)}</div>
						<div
							className="knowledge-base-html prose prose-sm max-w-none text-slate-700 dark:prose-invert [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:rounded-2xl [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:shadow-sm"
							dangerouslySetInnerHTML={{ __html: selectedArticle.html || '<p>-</p>' }}
						/>
					</div>
				) : null}
			</OverlayModal>
		</div>
	);
}
