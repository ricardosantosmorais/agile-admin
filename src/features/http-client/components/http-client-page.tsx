'use client';

import {
	BookOpen,
	CheckCircle2,
	Copy,
	FileJson2,
	FolderOpen,
	Globe2,
	KeyRound,
	Loader2,
	Plus,
	Save,
	Send,
	ShieldCheck,
	Sparkles,
	Timer,
	Trash2,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppDataTable } from '@/src/components/data-table/app-data-table';
import type { AppDataTableColumn } from '@/src/components/data-table/types';
import { AsyncState } from '@/src/components/ui/async-state';
import { BooleanChoice } from '@/src/components/ui/boolean-choice';
import { JsonCodeEditor } from '@/src/components/ui/json-code-editor';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { httpClientToolClient } from '@/src/features/http-client/services/http-client-client';
import { createDefaultHttpClientRequest } from '@/src/features/http-client/services/http-client-mappers';
import type { HttpClientCatalogItem, HttpClientContext, HttpClientRequestDraft, HttpClientResponsePayload } from '@/src/features/http-client/services/http-client-types';
import { useI18n } from '@/src/i18n/use-i18n';
import { copyTextToClipboard } from '@/src/lib/clipboard';

type TabState = {
	id: string;
	title: string;
	request: HttpClientRequestDraft;
	response: HttpClientResponsePayload | null;
	catalogId: string;
	catalogName: string;
	catalogDescription: string;
	catalogPublic: boolean;
	isSending: boolean;
};

type ToastState = {
	message: string;
	tone: 'success' | 'error';
};

const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
const BODY_TYPE_OPTIONS = ['application/json', 'application/x-www-form-urlencoded', 'text/plain', 'text/xml'] as const;
const fieldClassName = 'app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm outline-none';

function createTab(baseUrl: string, index: number): TabState {
	const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
	return {
		id,
		title: `Request ${index}`,
		request: createDefaultHttpClientRequest(baseUrl),
		response: null,
		catalogId: '',
		catalogName: '',
		catalogDescription: '',
		catalogPublic: true,
		isSending: false,
	};
}

function getResponseBody(response: HttpClientResponsePayload | null) {
	if (!response) return '';
	const body = response.response.body || '';
	try {
		return JSON.stringify(JSON.parse(body), null, 2);
	} catch {
		return body;
	}
}

function getEndpointLabel(request: HttpClientRequestDraft) {
	if (request.endpointMode === 'agile') {
		return request.endpointCatalogValue || 'Endpoint do catálogo não selecionado';
	}
	return request.endpointCustom || 'Endpoint customizado não informado';
}

function getStatusTone(status?: number) {
	if (!status) return 'text-[color:var(--app-muted)]';
	if (status >= 200 && status < 300) return 'text-emerald-600 dark:text-emerald-300';
	if (status >= 400) return 'text-rose-600 dark:text-rose-300';
	return 'text-amber-600 dark:text-amber-300';
}

function KeyValueTable({
	rows,
	onChange,
	addLabel,
	keyPlaceholder,
	valuePlaceholder,
	removeLabel,
}: {
	rows: Array<{ key: string; value: string }>;
	onChange: (rows: Array<{ key: string; value: string }>) => void;
	addLabel: string;
	keyPlaceholder: string;
	valuePlaceholder: string;
	removeLabel: string;
}) {
	return (
		<div className="space-y-3">
			<div className="space-y-2">
				{rows.map((row, index) => (
					<div key={`${index}-${row.key}`} className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
						<input
							value={row.key}
							onChange={(event) => {
								const next = [...rows];
								next[index] = { ...next[index], key: event.target.value };
								onChange(next);
							}}
							className={fieldClassName}
							placeholder={keyPlaceholder}
						/>
						<input
							value={row.value}
							onChange={(event) => {
								const next = [...rows];
								next[index] = { ...next[index], value: event.target.value };
								onChange(next);
							}}
							className={fieldClassName}
							placeholder={valuePlaceholder}
						/>
						<button
							type="button"
							onClick={() => {
								const next = rows.filter((_, currentIndex) => currentIndex !== index);
								onChange(next.length ? next : [{ key: '', value: '' }]);
							}}
							className="app-button-secondary inline-flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--app-muted)] transition hover:border-red-300 hover:text-red-600"
							aria-label={removeLabel}
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={() => onChange([...rows, { key: '', value: '' }])}
				className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold"
			>
				<Plus className="h-3.5 w-3.5" />
				{addLabel}
			</button>
		</div>
	);
}

export function HttpClientPage() {
	const { t } = useI18n();
	const requestTitle = t('httpClient.requestTitle', 'Request');
	const access = useFeatureAccess('httpClient');
	const [contextState, setContextState] = useState<{
		isLoading: boolean;
		error: string;
		data: HttpClientContext | null;
	}>({
		isLoading: true,
		error: '',
		data: null,
	});
	const [tabs, setTabs] = useState<TabState[]>([]);
	const [activeTabId, setActiveTabId] = useState('');
	const [catalogModalOpen, setCatalogModalOpen] = useState(false);
	const [catalogLoading, setCatalogLoading] = useState(false);
	const [catalogRows, setCatalogRows] = useState<HttpClientCatalogItem[]>([]);
	const [catalogSearch, setCatalogSearch] = useState('');
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [saveLoading, setSaveLoading] = useState(false);
	const [toast, setToast] = useState<ToastState | null>(null);
	const [responseMode, setResponseMode] = useState<'body' | 'headers'>('body');

	useEffect(() => {
		void (async () => {
			try {
				const data = await httpClientToolClient.getContext();
				const firstTab = createTab(data.baseUrl, 1);
				setTabs([firstTab]);
				setActiveTabId(firstTab.id);
				setContextState({ isLoading: false, error: '', data });
			} catch (error) {
				setContextState({
					isLoading: false,
					error: error instanceof Error ? error.message : t('httpClient.feedback.loadContextError', 'Could not load the HTTP Client context.'),
					data: null,
				});
			}
		})();
	}, [t]);

	const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];
	const filteredCatalogRows = useMemo(() => {
		const normalizedSearch = catalogSearch.trim().toLowerCase();
		if (!normalizedSearch) return catalogRows;
		return catalogRows.filter((item) =>
			[item.nome, item.descricao, item.usuario].some((value) =>
				String(value || '')
					.toLowerCase()
					.includes(normalizedSearch),
			),
		);
	}, [catalogRows, catalogSearch]);

	const catalogColumns = useMemo<AppDataTableColumn<HttpClientCatalogItem>[]>(() => [
		{
			id: 'id',
			label: 'ID',
			cell: (item) => item.id,
			thClassName: 'w-[96px]',
			tdClassName: 'text-xs font-semibold text-[color:var(--app-muted)]',
		},
		{
			id: 'nome',
			label: t('sqlEditor.fields.name', 'Name'),
			cell: (item) => item.nome,
			tdClassName: 'font-semibold text-[color:var(--app-text)]',
		},
		{
			id: 'descricao',
			label: t('sqlEditor.fields.description', 'Description'),
			cell: (item) => item.descricao || '-',
			tdClassName: 'text-[color:var(--app-muted)]',
		},
		{
			id: 'publico',
			label: t('sqlEditor.fields.public', 'Public'),
			cell: (item) => item.publico ? t('common.yes', 'Yes') : t('common.no', 'No'),
			thClassName: 'w-[120px]',
			tdClassName: 'text-[color:var(--app-muted)]',
		},
		{
			id: 'usuario',
			label: t('httpClient.catalog.user', 'User'),
			cell: (item) => item.usuario || '-',
			thClassName: 'w-[180px]',
			tdClassName: 'text-[color:var(--app-muted)]',
		},
	], [t]);

	if (!access.canOpen) {
		return <AccessDeniedState title={t('httpClient.title', 'HTTP Client')} />;
	}

	function patchActiveTab(patch: Partial<TabState>) {
		if (!activeTab) return;
		setTabs((current) => current.map((tab) => (tab.id === activeTab.id ? { ...tab, ...patch } : tab)));
	}

	function patchActiveRequest(patch: Partial<HttpClientRequestDraft>) {
		if (!activeTab) return;
		patchActiveTab({
			request: {
				...activeTab.request,
				...patch,
			},
		});
	}

	function createNewTab() {
		const next = createTab(contextState.data?.baseUrl || '', tabs.length + 1);
		setTabs((current) => [...current, next]);
		setActiveTabId(next.id);
	}

	function closeTab(id: string) {
		if (tabs.length <= 1) return;
		const nextTabs = tabs.filter((tab) => tab.id !== id);
		setTabs(nextTabs);
		if (activeTabId === id) {
			setActiveTabId(nextTabs[0]?.id || '');
		}
	}

	async function sendRequest() {
		if (!activeTab) return;
		patchActiveTab({ isSending: true });
		try {
			const response = await httpClientToolClient.sendRequest(activeTab.request);
			patchActiveTab({ response, isSending: false });
			setResponseMode('body');
		} catch (error) {
			patchActiveTab({ isSending: false });
			setToast({ message: error instanceof Error ? error.message : t('httpClient.feedback.sendError', 'Could not send the request.'), tone: 'error' });
		}
	}

	async function openCatalogModal() {
		setCatalogModalOpen(true);
		setCatalogLoading(true);
		setCatalogSearch('');
		try {
			const response = await httpClientToolClient.listCatalog();
			setCatalogRows(response.data || []);
		} catch (error) {
			setToast({ message: error instanceof Error ? error.message : t('httpClient.feedback.loadCatalogError', 'Could not load the catalog.'), tone: 'error' });
		} finally {
			setCatalogLoading(false);
		}
	}

	async function loadCatalogItem(catalogId: string) {
		try {
			const response = await httpClientToolClient.getCatalogItem(catalogId);
			const loaded = response.data;
			const nextTab: TabState = {
				...createTab(contextState.data?.baseUrl || '', tabs.length + 1),
				title: loaded.nome || `${requestTitle} ${tabs.length + 1}`,
				request: loaded.request,
				catalogId: loaded.id,
				catalogName: loaded.nome,
				catalogDescription: loaded.descricao,
				catalogPublic: loaded.publico,
			};
			setTabs((current) => [...current, nextTab]);
			setActiveTabId(nextTab.id);
			setCatalogModalOpen(false);
		} catch (error) {
			setToast({ message: error instanceof Error ? error.message : t('httpClient.feedback.loadRequestError', 'Could not load the request.'), tone: 'error' });
		}
	}

	async function saveActiveTab() {
		if (!activeTab) return;
		setSaveLoading(true);
		try {
			const response = await httpClientToolClient.saveCatalogItem({
				id: activeTab.catalogId || undefined,
				nome: activeTab.catalogName || activeTab.title,
				descricao: activeTab.catalogDescription,
				publico: activeTab.catalogPublic,
				request: activeTab.request,
			});
			patchActiveTab({
				catalogId: response.data.id,
				title: activeTab.catalogName || activeTab.title,
			});
			setToast({ message: response.message, tone: 'success' });
			setSaveModalOpen(false);
		} catch (error) {
			setToast({ message: error instanceof Error ? error.message : t('httpClient.feedback.saveRequestError', 'Could not save the request.'), tone: 'error' });
		} finally {
			setSaveLoading(false);
		}
	}

	const endpointLabel = activeTab ? getEndpointLabel(activeTab.request) : '-';
	const status = activeTab?.response?.response.status;
	const duration = activeTab?.response?.response.durationMs;
	const contentType = activeTab?.response?.response.contentType;
	const isReady = Boolean(activeTab?.request.baseUrl && (activeTab.request.endpointMode === 'custom' ? activeTab.request.endpointCustom : activeTab.request.endpointCatalogValue));
	const responseHeaders = activeTab?.response
		? Object.entries(activeTab.response.response.headers)
				.map(([key, value]) => `${key}: ${value}`)
				.join('\n')
		: '';

	return (
		<div className="space-y-5">
			<PageHeader
				title={t('httpClient.title', 'HTTP Client')}
				breadcrumbs={[{ label: t('routes.dashboard', 'Home'), href: '/dashboard' }, { label: t('menuKeys.ferramentas', 'Ferramentas') }, { label: t('httpClient.title', 'HTTP Client') }]}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={createNewTab} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold">
							<Plus className="h-4 w-4" />
							{t('common.new', 'Novo')}
						</button>
						<button type="button" onClick={() => void openCatalogModal()} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold">
							<FolderOpen className="h-4 w-4" />
							{t('httpClient.actions.catalog', 'Catalog')}
						</button>
						<button type="button" onClick={() => setSaveModalOpen(true)} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold">
							<Save className="h-4 w-4" />
							{t('common.save', 'Save')}
						</button>
						<button
							type="button"
							onClick={() => void sendRequest()}
							disabled={!activeTab || activeTab.isSending || !isReady}
							className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
						>
							{activeTab?.isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
							{t('httpClient.actions.send', 'Send')}
						</button>
					</div>
				}
			/>

			<SectionCard className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					{tabs.map((tab) => (
						<div key={tab.id} className={['inline-flex items-center gap-1 rounded-full border px-2 py-1', tab.id === activeTab?.id ? 'app-pill-tab-active' : 'app-pill-tab'].join(' ')}>
							<button type="button" onClick={() => setActiveTabId(tab.id)} className="px-2 py-0.5 text-sm font-semibold">
								{tab.title}
							</button>
							{tabs.length > 1 ? (
								<button type="button" onClick={() => closeTab(tab.id)} aria-label={t('httpClient.actions.closeTab', 'Close tab')} className={tab.id === activeTab?.id ? 'text-white/80' : 'text-[color:var(--app-muted)]'}>
									<X className="h-3.5 w-3.5" />
								</button>
							) : null}
						</div>
					))}
				</div>

				<AsyncState isLoading={contextState.isLoading} error={contextState.error}>
					{activeTab ? (
						<div className="space-y-5">
							<div className="relative overflow-hidden rounded-[1.35rem] border border-line/60 bg-[linear-gradient(135deg,var(--app-control-muted-bg),transparent_72%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.16),transparent_30%)] px-4 py-3 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
								<div className="absolute -right-12 -top-20 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
								<div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
									<div className="min-w-0 flex-1">
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
												<Sparkles className="h-3 w-3" />
												Workspace
											</span>
											<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] ${isReady ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
												{isReady ? 'Pronto' : 'Pendente'}
											</span>
										</div>
										<div className="flex min-w-0 flex-wrap items-center gap-2.5">
											<span className="inline-flex shrink-0 rounded-xl bg-[color:var(--app-text)] px-2.5 py-1 text-xs font-black text-[color:var(--app-panel-solid)]">{activeTab.request.method}</span>
											<div className="min-w-[180px] flex-1 text-xl font-black leading-tight text-[color:var(--app-text)] [overflow-wrap:anywhere] md:line-clamp-2">{endpointLabel}</div>
										</div>
										<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[color:var(--app-muted)]">
											<span className="inline-flex min-w-0 items-center gap-1.5">
												<Globe2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
												<span className="max-w-[420px] truncate">{activeTab.request.baseUrl || 'Base URL não informada'}</span>
											</span>
											<span className="hidden h-1 w-1 rounded-full bg-[color:var(--app-muted)] sm:inline-flex" />
											<span className="inline-flex items-center gap-1.5">
												<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
												{activeTab.request.authType === 'platform' ? 'Autenticação da plataforma' : activeTab.request.authType}
											</span>
										</div>
									</div>
									<div className="grid shrink-0 grid-cols-3 gap-2 lg:min-w-[430px]">
										<div className="rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/60 px-3 py-2">
											<div className="text-[0.68rem] font-semibold text-[color:var(--app-muted)]">Status</div>
											<div className={`text-base font-black leading-tight ${getStatusTone(status)}`}>{status ?? '-'}</div>
										</div>
										<div className="rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/60 px-3 py-2">
											<div className="flex items-center gap-1 text-[0.68rem] font-semibold text-[color:var(--app-muted)]">
												<Timer className="h-3 w-3" />
												Tempo
											</div>
											<div className="truncate text-base font-black leading-tight text-[color:var(--app-text)]">{duration ? `${duration} ms` : '-'}</div>
										</div>
										<div className="rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/60 px-3 py-2">
											<div className="text-[0.68rem] font-semibold text-[color:var(--app-muted)]">Tipo</div>
											<div className="truncate text-sm font-black leading-tight text-[color:var(--app-text)]">{contentType || '-'}</div>
										</div>
									</div>
								</div>
							</div>

							<div className="grid gap-5 xl:grid-cols-[minmax(360px,0.95fr)_minmax(0,1.05fr)]">
								<div className="space-y-5">
									<div className="app-control-muted rounded-[1.25rem] p-4">
										<div className="mb-4 flex items-center justify-between gap-3 border-b border-line/40 pb-3">
											<div>
												<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
													<BookOpen className="h-4 w-4 text-emerald-500" />
													Preparar requisição
												</div>
												<div className="mt-1 text-xs text-[color:var(--app-muted)]">Escolha origem, método, URL e timeout.</div>
											</div>
										</div>
										<div className="space-y-4">
											<div className="grid gap-3 md:grid-cols-[180px_1fr]">
												<label className="space-y-1.5">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.endpointSource', 'Endpoint source')}</span>
													<select value={activeTab.request.endpointMode} onChange={(event) => patchActiveRequest({ endpointMode: event.target.value === 'custom' ? 'custom' : 'agile' })} className={fieldClassName}>
														<option value="agile">{t('httpClient.options.agileCatalog', 'Agile API (catalog)')}</option>
														<option value="custom">{t('httpClient.options.custom', 'Custom')}</option>
													</select>
												</label>
												<label className="space-y-1.5">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.method', 'Method')}</span>
													<select value={activeTab.request.method} onChange={(event) => patchActiveRequest({ method: event.target.value as HttpClientRequestDraft['method'] })} className={fieldClassName}>
														{METHOD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
													</select>
												</label>
											</div>
											<label className="space-y-1.5">
												<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.baseUrl', 'Base URL')}</span>
												<input value={activeTab.request.baseUrl} onChange={(event) => patchActiveRequest({ baseUrl: event.target.value })} className={fieldClassName} placeholder="https://api.seucluster.com" />
											</label>
											{activeTab.request.endpointMode === 'agile' ? (
												<label className="space-y-1.5">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.agileEndpoint', 'Agile API endpoint')}</span>
													<select
														value={activeTab.request.endpointCatalogValue}
														onChange={(event) => {
															const value = event.target.value;
															const method = value.includes(' ') ? value.split(' ')[0] : '';
															patchActiveRequest({
																endpointCatalogValue: value,
																method: METHOD_OPTIONS.includes(method as HttpClientRequestDraft['method']) ? (method as HttpClientRequestDraft['method']) : activeTab.request.method,
															});
														}}
														className={fieldClassName}
													>
														<option value="">{t('httpClient.placeholders.selectEndpoint', 'Select the endpoint')}</option>
														{(contextState.data?.endpointCatalog || []).map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
													</select>
												</label>
											) : (
												<label className="space-y-1.5">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.customEndpoint', 'Custom endpoint')}</span>
													<input value={activeTab.request.endpointCustom} onChange={(event) => patchActiveRequest({ endpointCustom: event.target.value })} className={fieldClassName} placeholder="/clientes ou https://host/path" />
												</label>
											)}
											<div className="grid gap-3 md:grid-cols-2">
												<label className="space-y-1.5">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.queryFilters', 'Filters (querystring)')}</span>
													<input value={activeTab.request.filtersQuery} onChange={(event) => patchActiveRequest({ filtersQuery: event.target.value })} className={fieldClassName} placeholder={t('httpClient.placeholders.queryFilters', 'id=123&status=active')} />
												</label>
												<label className="space-y-1.5">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.timeout', 'Timeout (seconds)')}</span>
													<input type="number" min={1} max={300} value={activeTab.request.timeoutSeconds} onChange={(event) => patchActiveRequest({ timeoutSeconds: Number(event.target.value) || 60 })} className={fieldClassName} />
												</label>
											</div>
										</div>
									</div>

									<div className="app-control-muted rounded-[1.25rem] p-4">
										<div className="mb-4 flex items-center gap-2 border-b border-line/40 pb-3 text-base font-black text-[color:var(--app-text)]">
											<KeyRound className="h-4 w-4 text-emerald-500" />
											Autenticação e contexto
										</div>
										<div className="space-y-4">
											<div className="grid gap-3 md:grid-cols-2">
												<label className="space-y-1.5">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.authentication', 'Authentication')}</span>
													<select value={activeTab.request.authType} onChange={(event) => patchActiveRequest({ authType: event.target.value as HttpClientRequestDraft['authType'] })} className={fieldClassName}>
														<option value="platform">{t('httpClient.options.platformDefault', 'Platform (default)')}</option>
														<option value="bearer">Bearer token</option>
														<option value="basic">Basic auth</option>
														<option value="none">{t('httpClient.options.noAuthentication', 'No authentication')}</option>
													</select>
												</label>
												<div className="rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/60 p-3">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.includeCompanyHeader', 'Include Company header automatically')}</span>
													<div className="mt-2"><BooleanChoice value={activeTab.request.includeEmpresaHeader} onChange={(value) => patchActiveRequest({ includeEmpresaHeader: value })} /></div>
												</div>
											</div>
											<div className="grid gap-3 md:grid-cols-2">
												<div className="rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/60 px-4 py-3 text-sm text-[color:var(--app-muted)]">
													{t('httpClient.labels.company', 'Company')}: <strong className="text-[color:var(--app-text)]">{contextState.data?.empresaHeader || '-'}</strong>
												</div>
												<div className="rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/60 px-4 py-3 text-sm text-[color:var(--app-muted)]">
													{t('httpClient.labels.platformToken', 'Platform token')}: <strong className="text-[color:var(--app-text)]">{contextState.data?.tokenMasked || '-'}</strong>
												</div>
											</div>
											{activeTab.request.authType === 'bearer' ? (
												<label className="space-y-1.5">
													<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.customBearerToken', 'Custom bearer token')}</span>
													<input type="password" value={activeTab.request.bearerToken} onChange={(event) => patchActiveRequest({ bearerToken: event.target.value })} className={fieldClassName} placeholder={t('httpClient.placeholders.token', 'Enter the token')} />
												</label>
											) : null}
											{activeTab.request.authType === 'basic' ? (
												<div className="grid gap-3 md:grid-cols-2">
													<label className="space-y-1.5">
														<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.username', 'Username')}</span>
														<input value={activeTab.request.basicUser} onChange={(event) => patchActiveRequest({ basicUser: event.target.value })} className={fieldClassName} />
													</label>
													<label className="space-y-1.5">
														<span className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.password', 'Password')}</span>
														<input type="password" value={activeTab.request.basicPass} onChange={(event) => patchActiveRequest({ basicPass: event.target.value })} className={fieldClassName} />
													</label>
												</div>
											) : null}
										</div>
									</div>
								</div>

								<div className="space-y-5">
									<div className="app-control-muted rounded-[1.25rem] p-4">
										<div className="mb-4 flex items-center gap-2 border-b border-line/40 pb-3 text-base font-black text-[color:var(--app-text)]">
											<FileJson2 className="h-4 w-4 text-emerald-500" />
											Payload e metadados
										</div>
										<div className="space-y-5">
											<div className="grid gap-4 lg:grid-cols-2">
												<div className="space-y-2">
													<p className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.additionalQueryParams', 'Additional query params')}</p>
													<KeyValueTable rows={activeTab.request.queryRows} onChange={(rows) => patchActiveRequest({ queryRows: rows })} addLabel={t('httpClient.actions.addParam', 'Add param')} keyPlaceholder={t('httpClient.placeholders.key', 'Key')} valuePlaceholder={t('httpClient.placeholders.value', 'Value')} removeLabel={t('httpClient.actions.removeRow', 'Remove row')} />
												</div>
												<div className="space-y-2">
													<p className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.customHeaders', 'Custom headers')}</p>
													<KeyValueTable rows={activeTab.request.headers} onChange={(rows) => patchActiveRequest({ headers: rows })} addLabel={t('httpClient.actions.addHeader', 'Add header')} keyPlaceholder={t('httpClient.placeholders.key', 'Key')} valuePlaceholder={t('httpClient.placeholders.value', 'Value')} removeLabel={t('httpClient.actions.removeRow', 'Remove row')} />
												</div>
											</div>
											<div className="space-y-2">
												<div className="flex flex-wrap items-center justify-between gap-3">
													<p className="text-xs font-semibold text-[color:var(--app-muted)]">{t('httpClient.fields.requestBody', 'Request body')}</p>
													<select value={activeTab.request.bodyType} onChange={(event) => patchActiveRequest({ bodyType: event.target.value as HttpClientRequestDraft['bodyType'] })} className="app-input rounded-full border border-line/50 bg-transparent px-3 py-2 text-xs font-semibold">
														{BODY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
													</select>
												</div>
												<JsonCodeEditor id={`http-client-body-${activeTab.id}`} value={activeTab.request.body} onChange={(value) => patchActiveRequest({ body: value })} height="320px" />
											</div>
										</div>
									</div>

									<div className="app-control-muted min-w-0 overflow-hidden rounded-[1.25rem]">
										<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 px-4 py-3">
											<div>
												<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
													<CheckCircle2 className="h-4 w-4 text-emerald-500" />
													{t('httpClient.response.title', 'Response')}
												</div>
												<div className="mt-1 text-xs text-[color:var(--app-muted)]">{status ? `HTTP ${status}` : 'Execute a requisição para visualizar o retorno.'}</div>
											</div>
											<div className="flex flex-wrap items-center gap-2">
												<div className="inline-flex overflow-hidden rounded-xl border border-line/60 bg-[color:var(--app-panel-solid)]/50 p-1">
													<button type="button" className={`rounded-lg px-4 py-2 text-sm font-semibold ${responseMode === 'body' ? 'app-button-primary' : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]'}`} onClick={() => setResponseMode('body')}>{t('httpClient.response.body', 'Body')}</button>
													<button type="button" className={`rounded-lg px-4 py-2 text-sm font-semibold ${responseMode === 'headers' ? 'app-button-primary' : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]'}`} onClick={() => setResponseMode('headers')}>{t('httpClient.response.headers', 'Headers')}</button>
												</div>
												<button
													type="button"
													onClick={() =>
														void copyTextToClipboard(responseMode === 'body' ? getResponseBody(activeTab.response) : responseHeaders)
															.then(() => setToast({ message: t('httpClient.feedback.copyResponseSuccess', 'Response copied to the clipboard.'), tone: 'success' }))
															.catch(() => setToast({ message: t('httpClient.feedback.copyResponseError', 'Could not copy the response.'), tone: 'error' }))
													}
													className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
												>
													<Copy className="h-3.5 w-3.5" />
													{t('httpClient.actions.copyResponse', 'Copy response')}
												</button>
											</div>
										</div>
										<div className="p-3">
											{responseMode === 'body' ? (
												<JsonCodeEditor id={`http-client-response-body-${activeTab.id}`} value={getResponseBody(activeTab.response)} onChange={() => undefined} readOnly height="420px" />
											) : (
												<pre className="min-h-[420px] overflow-auto rounded-2xl border border-line/40 bg-[color:var(--app-panel-solid)]/70 p-4 font-mono text-sm leading-relaxed text-[color:var(--app-text)]">{responseHeaders}</pre>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					) : null}
				</AsyncState>
			</SectionCard>

			<OverlayModal open={catalogModalOpen} onClose={() => setCatalogModalOpen(false)} title={t('httpClient.catalog.title', 'Request catalog')} maxWidthClassName="max-w-5xl">
				<div className="space-y-3">
					<input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm" placeholder={t('httpClient.catalog.searchPlaceholder', 'Search catalog')} />
					<AsyncState isLoading={catalogLoading} error="">
						<AppDataTable
							rows={filteredCatalogRows}
							getRowId={(item) => item.id}
							columns={catalogColumns}
							emptyMessage={t('httpClient.catalog.empty', 'No saved requests.')}
							mobileCard={{
								title: (item) => item.nome,
								subtitle: (item) => item.descricao || '-',
								meta: (item) => item.usuario || `ID ${item.id}`,
								badges: (item) => item.publico ? t('common.yes', 'Yes') : t('common.no', 'No'),
							}}
							actionsLabel={t('common.actions', 'Actions')}
							rowActions={(item) => [
								{
									id: 'open',
									label: t('common.open', 'Open'),
									icon: FolderOpen,
									onClick: () => void loadCatalogItem(item.id),
								},
							]}
						/>
					</AsyncState>
				</div>
			</OverlayModal>

			<OverlayModal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} title={t('httpClient.saveModal.title', 'Save request')} maxWidthClassName="max-w-2xl">
				{activeTab ? (
					<div className="space-y-4">
						<label className="space-y-1">
							<span className="text-sm font-semibold text-[color:var(--app-text)]">{t('sqlEditor.fields.name', 'Name')}</span>
							<input value={activeTab.catalogName} onChange={(event) => patchActiveTab({ catalogName: event.target.value })} className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm" placeholder={t('httpClient.saveModal.namePlaceholder', 'Example: Search active customers')} />
						</label>
						<label className="space-y-1">
							<span className="text-sm font-semibold text-[color:var(--app-text)]">{t('sqlEditor.fields.description', 'Description')}</span>
							<textarea value={activeTab.catalogDescription} onChange={(event) => patchActiveTab({ catalogDescription: event.target.value })} rows={4} className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm" />
						</label>
						<div className="space-y-1">
							<span className="text-sm font-semibold text-[color:var(--app-text)]">{t('sqlEditor.fields.public', 'Public')}</span>
							<BooleanChoice value={activeTab.catalogPublic} onChange={(value) => patchActiveTab({ catalogPublic: value })} />
						</div>
						<div className="flex justify-end gap-2">
							<button type="button" onClick={() => setSaveModalOpen(false)} className="app-button-secondary rounded-full px-4 py-2 text-sm font-semibold">{t('common.cancel', 'Cancelar')}</button>
							<button type="button" onClick={() => void saveActiveTab()} disabled={saveLoading} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50">
								{saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
								{t('common.save', 'Salvar')}
							</button>
						</div>
					</div>
				) : null}
			</OverlayModal>

			{toast ? <PageToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}
		</div>
	);
}
