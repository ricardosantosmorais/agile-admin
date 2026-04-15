'use client';

import { ArrowRight, CalendarRange, ChevronDown, Layers3, RefreshCcw, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters';
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar';
import type { AppDataTableFilterConfig } from '@/src/components/data-table/types';
import { AsyncState } from '@/src/components/ui/async-state';
import { FormField } from '@/src/components/ui/form-field';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { inputClasses } from '@/src/components/ui/input-styles';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { atualizacoesGeraisClient, DEFAULT_ATUALIZACOES_GERAIS_FILTERS } from '@/src/features/atualizacoes-gerais/services/atualizacoes-gerais-client';
import { filterVisibleUpdates, groupUpdatesByMonth } from '@/src/features/atualizacoes-gerais/services/atualizacoes-gerais-mappers';
import type { AtualizacaoGeralItem, AtualizacoesGeraisFilters } from '@/src/features/atualizacoes-gerais/services/atualizacoes-gerais-types';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';

function formatDate(value: string, locale: string) {
	const normalized = value.includes('T') ? value : value.replace(' ', 'T');
	const date = new Date(normalized);
	if (Number.isNaN(date.getTime())) {
		return value || '-';
	}

	return new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(date);
}

function stripHtml(value: string) {
	return value
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function summarizeHtml(value: string, maxLength = 180) {
	const plainText = stripHtml(value);
	if (!plainText) {
		return '';
	}

	if (plainText.length <= maxLength) {
		return plainText;
	}

	return `${plainText.slice(0, maxLength).trimEnd()}...`;
}

function platformLabel(value: string, t: ReturnType<typeof useI18n>['t']) {
	switch (value) {
		case 'admin':
			return t('clientMenu.generalUpdates.platform.admin', 'Admin');
		case 'ecommerce':
			return t('clientMenu.generalUpdates.platform.ecommerce', 'E-commerce');
		case 'integracao':
			return t('clientMenu.generalUpdates.platform.integration', 'Integração');
		default:
			return value || '-';
	}
}

function typeLabel(value: string, t: ReturnType<typeof useI18n>['t']) {
	switch (value) {
		case 'melhoria':
			return t('clientMenu.generalUpdates.type.improvement', 'Melhoria');
		case 'correcao':
			return t('clientMenu.generalUpdates.type.fix', 'Correção');
		default:
			return t('clientMenu.generalUpdates.type.general', 'Atualização');
	}
}

function badgeTone(value: string) {
	switch (value) {
		case 'melhoria':
			return 'success' as const;
		case 'correcao':
			return 'danger' as const;
		default:
			return 'info' as const;
	}
}

export function AtualizacoesGeraisPage() {
	const { t, locale } = useI18n();
	const { session } = useAuth();
	const [filters, setFilters] = useState<AtualizacoesGeraisFilters>(DEFAULT_ATUALIZACOES_GERAIS_FILTERS);
	const [draft, setDraft] = useState<AtualizacoesGeraisFilters>(DEFAULT_ATUALIZACOES_GERAIS_FILTERS);
	const [expanded, setExpanded] = useState(false);
	const [openMonthsOverride, setOpenMonthsOverride] = useState<string[] | null>(null);
	const [expandedItems, setExpandedItems] = useState<string[]>([]);

	const state = useAsyncData(() => atualizacoesGeraisClient.list(filters), [filters]);
	const visibleItems = useMemo(() => filterVisibleUpdates(state.data?.data || [], session?.user.master === true), [session?.user.master, state.data?.data]);
	const groups = useMemo(() => groupUpdatesByMonth(visibleItems, locale), [locale, visibleItems]);
	const openMonths = openMonthsOverride ?? groups.slice(0, 3).map((group) => group.key);
	const appliedFiltersCount = useMemo(() => [filters.plataforma, filters.tipo, filters.mesInicio, filters.mesFim, filters.busca.trim()].filter(Boolean).length, [filters]);
	const internalItemsCount = useMemo(() => visibleItems.filter((item) => item.apenasMaster).length, [visibleItems]);
	const latestPublicationDate = visibleItems.length ? formatDate(visibleItems[0]?.data || '', locale) : '';

	const extraFilters: AppDataTableFilterConfig<AtualizacoesGeraisFilters>[] = useMemo(
		() => [
			{
				id: 'plataforma',
				label: t('clientMenu.generalUpdates.filters.platform', 'Plataforma'),
				kind: 'select',
				key: 'plataforma',
				options: [
					{ value: 'admin', label: t('clientMenu.generalUpdates.platform.admin', 'Admin') },
					{ value: 'ecommerce', label: t('clientMenu.generalUpdates.platform.ecommerce', 'E-commerce') },
					{ value: 'integracao', label: t('clientMenu.generalUpdates.platform.integration', 'Integração') },
				],
			},
			{
				id: 'tipo',
				label: t('clientMenu.generalUpdates.filters.type', 'Tipo'),
				kind: 'select',
				key: 'tipo',
				options: [
					{ value: 'melhoria', label: t('clientMenu.generalUpdates.type.improvement', 'Melhoria') },
					{ value: 'correcao', label: t('clientMenu.generalUpdates.type.fix', 'Correção') },
					{ value: 'geral', label: t('clientMenu.generalUpdates.type.general', 'Atualização') },
				],
			},
			{
				id: 'meses',
				label: t('clientMenu.generalUpdates.filters.period', 'Período (mês/ano)'),
				kind: 'custom',
				getSummary: (applied) => (applied.mesInicio || applied.mesFim ? t('clientMenu.generalUpdates.filters.period', 'Período (mês/ano)') : null),
				render: ({ draft, patchDraft }) => (
					<FormField label={t('clientMenu.generalUpdates.filters.period', 'Período (mês/ano)')}>
						<div className="grid grid-cols-2 gap-3">
							<input type="month" value={draft.mesInicio} onChange={(event) => patchDraft('mesInicio', event.target.value)} className={inputClasses()} />
							<input type="month" value={draft.mesFim} onChange={(event) => patchDraft('mesFim', event.target.value)} className={inputClasses()} />
						</div>
					</FormField>
				),
			},
			{
				id: 'busca',
				label: t('clientMenu.generalUpdates.filters.search', 'Buscar por título'),
				kind: 'text',
				key: 'busca',
				placeholder: t('clientMenu.generalUpdates.filters.searchPlaceholder', 'Digite para filtrar'),
			},
		],
		[t],
	);

	function patchDraft(patch: Partial<AtualizacoesGeraisFilters>) {
		setDraft((current) => ({ ...current, ...patch }));
	}

	function applyFilters() {
		setFilters({ ...draft });
	}

	function clearFilters() {
		setDraft(DEFAULT_ATUALIZACOES_GERAIS_FILTERS);
		setFilters(DEFAULT_ATUALIZACOES_GERAIS_FILTERS);
	}

	function toggleMonth(key: string) {
		setOpenMonthsOverride((current) => {
			const base = current ?? groups.slice(0, 3).map((group) => group.key);
			return base.includes(key) ? base.filter((item) => item !== key) : [...base, key];
		});
	}

	function toggleItem(id: string) {
		setExpandedItems((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
	}

	const filterSummaryLabel =
		appliedFiltersCount === 0
			? t('clientMenu.generalUpdates.noFilters', 'Sem filtros ativos')
			: appliedFiltersCount === 1
				? t('clientMenu.generalUpdates.singleFilter', '1 filtro ativo')
				: t('clientMenu.generalUpdates.multipleFilters', '{{count}} filtros ativos', { count: appliedFiltersCount });

	return (
		<div className="space-y-5">
			<PageHeader
				title={t('clientMenu.generalUpdates.title', 'Atualizações gerais')}
				breadcrumbs={[{ label: t('routes.dashboard', 'Início'), href: '/dashboard' }, { label: t('clientMenu.generalUpdates.title', 'Atualizações gerais') }]}
				actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={state.reload} />}
			/>

			<AsyncState isLoading={state.isLoading} error={state.error}>
				<SectionCard
					action={
						<div className="flex w-full items-center justify-start gap-3">
							<DataTableFilterToggleAction
								expanded={expanded}
								onClick={() => setExpanded((current) => !current)}
								collapsedLabel={t('filters.button', 'Filtros')}
								expandedLabel={t('filters.hide', 'Ocultar filtros')}
								hint={t('clientMenu.generalUpdates.filtersHint', 'Refinar por plataforma, tipo e período')}
							/>
						</div>
					}
				>
					<div className="space-y-6">
						<DataTableFiltersCard<AtualizacoesGeraisFilters>
							variant="embedded"
							draft={draft}
							applied={filters}
							expanded={expanded}
							extraFilters={extraFilters}
							onToggleExpanded={() => setExpanded((current) => !current)}
							onApply={applyFilters}
							onClear={clearFilters}
							patchDraft={(key, value) => patchDraft({ [key]: value } as Partial<AtualizacoesGeraisFilters>)}
						/>

						<div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
							<div className="app-brand-panel rounded-[1.45rem] p-5 md:p-6">
								<div className="app-header-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
									<Sparkles className="h-3.5 w-3.5" />
									{t('clientMenu.generalUpdates.eyebrow', 'Changelog do produto')}
								</div>

								<h2 className="mt-4 text-[1.85rem] font-black tracking-tight text-(--app-text)">
									{t('clientMenu.generalUpdates.heroTitle', 'Novidades organizadas para leitura rápida e profissional.')}
								</h2>
								<p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--app-muted)]">
									{t(
										'clientMenu.generalUpdates.heroDescription',
										'Use os filtros para recortar o período, abra apenas os meses relevantes e leia cada publicação com contexto claro de plataforma, tipo e visibilidade.',
									)}
								</p>

								<div className="mt-5 flex flex-wrap gap-2">
									<StatusBadge tone={appliedFiltersCount > 0 ? 'info' : 'neutral'}>{filterSummaryLabel}</StatusBadge>
									{latestPublicationDate ? (
										<StatusBadge tone="success">{t('clientMenu.generalUpdates.latestPublication', 'Última publicação em {{date}}.', { date: latestPublicationDate })}</StatusBadge>
									) : null}
									{internalItemsCount > 0 ? (
										<StatusBadge tone="warning">{t('clientMenu.generalUpdates.internalSummary', '{{count}} itens internos visíveis', { count: internalItemsCount })}</StatusBadge>
									) : null}
								</div>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<article className="app-stat-card rounded-[1.25rem] px-4 py-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
												{t('clientMenu.generalUpdates.metrics.total', 'Atualizações visíveis')}
											</p>
											<strong className="mt-2 block text-[2rem] font-black tracking-tight text-(--app-text)">{visibleItems.length}</strong>
										</div>
										<div className="app-stat-card-icon app-stat-card-icon-sky flex h-10 w-10 items-center justify-center rounded-[1rem]">
											<Sparkles className="h-4 w-4" />
										</div>
									</div>
								</article>

								<article className="app-stat-card rounded-[1.25rem] px-4 py-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
												{t('clientMenu.generalUpdates.metrics.months', 'Meses publicados')}
											</p>
											<strong className="mt-2 block text-[2rem] font-black tracking-tight text-(--app-text)">{groups.length}</strong>
										</div>
										<div className="app-stat-card-icon app-stat-card-icon-amber flex h-10 w-10 items-center justify-center rounded-[1rem]">
											<CalendarRange className="h-4 w-4" />
										</div>
									</div>
								</article>

								<article className="app-stat-card rounded-[1.25rem] px-4 py-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
												{t('clientMenu.generalUpdates.metrics.filters', 'Filtros ativos')}
											</p>
											<strong className="mt-2 block text-[2rem] font-black tracking-tight text-(--app-text)">{appliedFiltersCount}</strong>
										</div>
										<div className="app-stat-card-icon app-stat-card-icon-emerald flex h-10 w-10 items-center justify-center rounded-[1rem]">
											<Layers3 className="h-4 w-4" />
										</div>
									</div>
								</article>

								<article className="app-stat-card rounded-[1.25rem] px-4 py-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
												{t('clientMenu.generalUpdates.metrics.internal', 'Escopo interno')}
											</p>
											<strong className="mt-2 block text-[2rem] font-black tracking-tight text-(--app-text)">{internalItemsCount}</strong>
										</div>
										<div className="app-stat-card-icon app-stat-card-icon-rose flex h-10 w-10 items-center justify-center rounded-[1rem]">
											<Sparkles className="h-4 w-4" />
										</div>
									</div>
								</article>
							</div>
						</div>

						{groups.length ? (
							<div className="space-y-4">
								{groups.map((group) => {
									const isOpen = openMonths.includes(group.key);
									const latestGroupDate = group.items[0] ? formatDate(group.items[0].data, locale) : '';
									const internalCount = group.items.filter((item) => item.apenasMaster).length;

									return (
										<section key={group.key} className="space-y-3">
											<button
												type="button"
												onClick={() => toggleMonth(group.key)}
												className="app-pane flex w-full rounded-[1.45rem] px-5 py-4 text-left transition hover:border-slate-300 dark:hover:border-slate-600"
											>
												<div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
													<div className="flex min-w-0 items-start gap-4">
														<div className="app-stat-card-icon app-stat-card-icon-emerald flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem]">
															<CalendarRange className="h-4 w-4" />
														</div>

														<div className="min-w-0">
															<div className="flex flex-wrap items-center gap-3">
																<h3 className="text-[1.35rem] font-black tracking-tight text-(--app-text)">{group.title}</h3>
																<StatusBadge tone="neutral">
																	{group.items.length === 1
																		? t('clientMenu.generalUpdates.singlePublication', '1 publicação')
																		: t('clientMenu.generalUpdates.multiplePublications', '{{count}} publicações', { count: group.items.length })}
																</StatusBadge>
																{internalCount > 0 ? (
																	<StatusBadge tone="warning">{t('clientMenu.generalUpdates.internalInMonth', '{{count}} internas', { count: internalCount })}</StatusBadge>
																) : null}
															</div>

															<p className="mt-2 text-sm leading-6 text-[color:var(--app-muted)]">
																{latestGroupDate
																	? t(
																			'clientMenu.generalUpdates.monthDescription',
																			'Publicações agrupadas por mês para facilitar leitura e acompanhamento. Última entrada em {{date}}.',
																			{ date: latestGroupDate },
																		)
																	: t('clientMenu.generalUpdates.monthDescriptionNoDate', 'Publicações agrupadas por mês para facilitar leitura e acompanhamento.')}
															</p>
														</div>
													</div>

													<div className="flex items-center gap-3 self-start lg:self-center">
														<span className="app-button-secondary inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold">
															{isOpen ? t('clientMenu.generalUpdates.collapseMonth', 'Recolher mês') : t('clientMenu.generalUpdates.expandMonth', 'Abrir mês')}
															<ChevronDown className={['h-4 w-4 transition', isOpen ? 'rotate-180' : ''].join(' ')} />
														</span>
													</div>
												</div>
											</button>

											{isOpen ? (
												<div className="space-y-3">
													{group.items.map((item: AtualizacaoGeralItem) => {
														const itemExpanded = expandedItems.includes(item.id);
														const excerpt = summarizeHtml(item.conteudo);
														const hasContent = Boolean(stripHtml(item.conteudo));

														return (
															<article key={item.id} className="app-pane rounded-[1.35rem] p-5 md:p-6">
																<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
																	<div className="min-w-0 flex-1">
																		<div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
																			<span>{formatDate(item.data, locale)}</span>
																		</div>
																		<h4 className="mt-2 text-[1.4rem] font-black tracking-tight text-(--app-text)">{item.titulo || '-'}</h4>
																		<p className="mt-3 max-w-3xl text-[15px] leading-7 text-[color:var(--app-text)]">
																			{excerpt || t('clientMenu.generalUpdates.excerptFallback', 'Resumo indisponível para esta publicação.')}
																		</p>
																	</div>

																	<div className="flex flex-wrap gap-2 xl:max-w-[260px] xl:justify-end">
																		<StatusBadge tone="neutral">{platformLabel(item.plataforma, t)}</StatusBadge>
																		<StatusBadge tone={badgeTone(item.tipo)}>{typeLabel(item.tipo, t)}</StatusBadge>
																		{item.apenasMaster ? <StatusBadge tone="warning">{t('clientMenu.generalUpdates.internalBadge', 'Interno')}</StatusBadge> : null}
																	</div>
																</div>

																{itemExpanded && hasContent ? (
																	<div className="mt-5 border-t border-line/60 pt-5">
																		<div
																			className="overflow-hidden text-[15px] leading-8 text-[color:var(--app-text)] [&_a]:font-semibold [&_a]:text-accent [&_a:hover]:opacity-80 [&_iframe]:min-h-[260px] [&_iframe]:w-full [&_iframe]:rounded-[1rem] [&_img]:rounded-[1rem] [&_img]:border [&_img]:border-line/60 [&_img]:shadow-sm [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-4 [&_strong]:font-bold"
																			dangerouslySetInnerHTML={{ __html: item.conteudo || '<p>-</p>' }}
																		/>
																	</div>
																) : null}

																{hasContent ? (
																	<div className="mt-5 flex items-center justify-end border-t border-line/60 pt-4">
																		<button
																			type="button"
																			onClick={() => toggleItem(item.id)}
																			className="app-button-secondary inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
																		>
																			{itemExpanded ? t('clientMenu.generalUpdates.readLess', 'Recolher atualização') : t('clientMenu.generalUpdates.readMore', 'Ler atualização')}
																			<ArrowRight className={['h-4 w-4 transition', itemExpanded ? 'rotate-90' : ''].join(' ')} />
																		</button>
																	</div>
																) : null}
															</article>
														);
													})}
												</div>
											) : null}
										</section>
									);
								})}
							</div>
						) : (
							<div className="app-pane-muted rounded-[1rem] border border-dashed px-4 py-8 text-center text-sm text-slate-500">
								{t('clientMenu.generalUpdates.empty', 'Nenhuma atualização encontrada para os filtros informados.')}
							</div>
						)}
					</div>
				</SectionCard>
			</AsyncState>
		</div>
	);
}
