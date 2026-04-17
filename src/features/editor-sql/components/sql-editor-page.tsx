'use client';

import { Copy, Database, Download, Expand, FileCode2, FolderOpen, Loader2, Play, Plus, Save, Search, Table2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AsyncState } from '@/src/components/ui/async-state';
import { BooleanSegmentedField } from '@/src/components/ui/boolean-segmented-field';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { ResizableVerticalPanels } from '@/src/components/ui/resizable-vertical-panels';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { SqlEditorMonaco } from '@/src/features/editor-sql/components/sql-editor-monaco';
import { sqlEditorClient } from '@/src/features/editor-sql/services/sql-editor-client';
import type { SavedSqlQuery, SqlDataSource, SqlEditorExecuteResponse, SqlEditorResultRow } from '@/src/features/editor-sql/services/sql-editor-types';
import { getSqlEditorWorkspaceStorageKey, loadSqlEditorWorkspace, saveSqlEditorWorkspace } from '@/src/features/editor-sql/services/sql-editor-workspace';
import { useI18n } from '@/src/i18n/use-i18n';
import { downloadCsvFile, downloadJsonFile } from '@/src/lib/browser-files';
import { copyTextToClipboard } from '@/src/lib/clipboard';
import { formatDateTime } from '@/src/lib/date-time';

type ToastTone = 'success' | 'error';
type WorkspaceTab = {
	id: string;
	title: string;
	sql: string;
	fonteDados: SqlDataSource;
	savedQueryId: string;
	dirty: boolean;
	result: SqlEditorExecuteResponse | null;
	isExecuting: boolean;
	search: string;
};
type SaveQueryDraft = { id?: string; nome: string; descricao: string; publico: boolean };

const DATA_SOURCE_OPTIONS: Array<{ value: SqlDataSource; labelKey: string; fallback: string }> = [
	{ value: 'agileecommerce', labelKey: 'sqlEditor.sources.agileecommerce', fallback: 'Agile e-Commerce' },
	{ value: 'agilesync', labelKey: 'sqlEditor.sources.agilesync', fallback: 'AgileSync' },
	{ value: 'erp', labelKey: 'sqlEditor.sources.erp', fallback: 'ERP' },
];

const EMPTY_ROWS: SqlEditorResultRow[] = [];

function buildWorkspaceTab(partial?: Partial<WorkspaceTab>): WorkspaceTab {
	const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
	return {
		id: partial?.id || id,
		title: partial?.title || 'Consulta',
		sql: partial?.sql || '',
		fonteDados: partial?.fonteDados || 'agileecommerce',
		savedQueryId: partial?.savedQueryId || '',
		dirty: partial?.dirty || false,
		result: partial?.result || null,
		isExecuting: false,
		search: '',
	};
}

function inferColumns(rows: SqlEditorResultRow[]) {
	return Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
}

function formatCellValue(value: unknown) {
	if (value === null || value === undefined || value === '') return '-';
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

function ResultTable({ rows, search }: { rows: SqlEditorResultRow[]; search: string }) {
	const { t } = useI18n();
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const scrollbarRef = useRef<HTMLDivElement | null>(null);
	const [scrollWidth, setScrollWidth] = useState(0);
	const columns = useMemo(() => inferColumns(rows), [rows]);
	const normalizedSearch = search.trim().toLowerCase();
	const filteredRows = useMemo(() => {
		if (!normalizedSearch) return rows;
		return rows.filter((row) => columns.some((column) => formatCellValue(row[column]).toLowerCase().includes(normalizedSearch)));
	}, [columns, normalizedSearch, rows]);

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport || typeof ResizeObserver === 'undefined') {
			return;
		}

		const syncWidths = () => {
			setScrollWidth(viewport.scrollWidth);
		};

		syncWidths();

		const observer = new ResizeObserver(() => {
			syncWidths();
		});

		observer.observe(viewport);

		return () => {
			observer.disconnect();
		};
	}, [filteredRows, columns]);

	function syncScroll(source: 'viewport' | 'bar') {
		const viewport = viewportRef.current;
		const bar = scrollbarRef.current;
		if (!viewport || !bar) return;

		if (source === 'viewport') {
			bar.scrollLeft = viewport.scrollLeft;
			return;
		}

		viewport.scrollLeft = bar.scrollLeft;
	}

	if (!filteredRows.length) {
		return (
			<div className="app-control-muted rounded-[1rem] border border-dashed px-5 py-8 text-sm text-[color:var(--app-muted)]">
				{t('sqlEditor.messages.noRowsForQuery', 'No records were returned for the current query.')}
			</div>
		);
	}

	return (
		<div className="app-pane flex h-full min-h-0 flex-col overflow-hidden rounded-[1rem]">
			<div ref={viewportRef} onScroll={() => syncScroll('viewport')} className="sql-result-grid-scroll min-h-0 flex-1 overflow-auto">
				<table className="min-w-full border-collapse text-left text-sm">
					<thead className="app-table-muted sticky top-0 z-[1] text-[color:var(--app-text)]">
						<tr>
							{columns.map((column) => (
								<th key={column} className="whitespace-nowrap px-4 py-3 font-semibold">
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{filteredRows.map((row, rowIndex) => (
							<tr key={`${rowIndex}-${JSON.stringify(row)}`} className="border-t border-[color:var(--app-card-border)] align-top">
								{columns.map((column) => (
									<td key={`${rowIndex}-${column}`} className="max-w-[320px] px-4 py-3 text-[color:var(--app-text)]">
										<div className="break-words whitespace-pre-wrap">{formatCellValue(row[column])}</div>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="app-table-muted border-t border-[color:var(--app-card-border)] px-2 py-1">
				<div ref={scrollbarRef} onScroll={() => syncScroll('bar')} className="sql-result-grid-scrollbar overflow-x-auto overflow-y-hidden">
					<div style={{ width: `${scrollWidth}px`, height: '1px' }} />
				</div>
			</div>
		</div>
	);
}

function ToolbarIconButton({
	label,
	onClick,
	children,
	disabled = false,
	prominent = false,
}: {
	label: string;
	onClick: () => void;
	children: ReactNode;
	disabled?: boolean;
	prominent?: boolean;
}) {
	return (
		<TooltipIconButton label={label}>
			<button
				type="button"
				onClick={onClick}
				disabled={disabled}
				aria-label={label}
				className={[
					'inline-flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
					prominent ? 'app-button-primary hover:brightness-110' : 'app-button-secondary hover:border-[color:var(--app-control-border-strong)] hover:text-[color:var(--app-text)]',
				].join(' ')}
			>
				{children}
			</button>
		</TooltipIconButton>
	);
}

export function SqlEditorPage() {
	const { t } = useI18n();
	const { session } = useAuth();
	const access = useFeatureAccess('editorSql');
	const defaultTabTitle = t('sqlEditor.defaultTab', 'Consulta principal');
	const initialTabRef = useRef<WorkspaceTab | null>(null);
	if (!initialTabRef.current) {
		initialTabRef.current = buildWorkspaceTab({ title: defaultTabTitle });
	}
	const [tabs, setTabs] = useState<WorkspaceTab[]>(() => [initialTabRef.current!]);
	const [activeTabId, setActiveTabId] = useState<string>(() => initialTabRef.current?.id ?? '');
	const [resultMode, setResultMode] = useState<'table' | 'json'>('table');
	const [splitNormal, setSplitNormal] = useState(36);
	const [splitFullscreen, setSplitFullscreen] = useState(36);
	const [workspaceHydrated, setWorkspaceHydrated] = useState(false);
	const [hydratedWorkspaceKey, setHydratedWorkspaceKey] = useState('');
	const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
	const [savedQueriesOpen, setSavedQueriesOpen] = useState(false);
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [fullscreenOpen, setFullscreenOpen] = useState(false);
	const [savedQueries, setSavedQueries] = useState<SavedSqlQuery[]>([]);
	const [savedQueriesLoading, setSavedQueriesLoading] = useState(false);
	const [savedQueriesError, setSavedQueriesError] = useState('');
	const [savedQueriesSearch, setSavedQueriesSearch] = useState('');
	const [saveDraft, setSaveDraft] = useState<SaveQueryDraft>({ nome: '', descricao: '', publico: false });
	const [saveLoading, setSaveLoading] = useState(false);
	const workspaceStorageKey = useMemo(() => {
		const userId = session?.user.id;
		const tenantId = session?.currentTenant.id;
		if (!userId || !tenantId) return '';

		return getSqlEditorWorkspaceStorageKey(userId, tenantId);
	}, [session?.currentTenant.id, session?.user.id]);

	const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
	const activeRows = activeTab?.result?.rows ?? EMPTY_ROWS;
	const activePagination = activeTab?.result?.pagination;
	const loadSavedQueries = useCallback(async () => {
		setSavedQueriesLoading(true);
		setSavedQueriesError('');
		try {
			setSavedQueries(await sqlEditorClient.listSavedQueries());
		} catch (error) {
			setSavedQueriesError(error instanceof Error ? error.message : t('sqlEditor.messages.loadSavedQueriesError', 'Não foi possível carregar as consultas salvas.'));
		} finally {
			setSavedQueriesLoading(false);
		}
	}, [t]);

	useEffect(() => {
		if (savedQueriesOpen) void loadSavedQueries();
	}, [loadSavedQueries, savedQueriesOpen]);

	useEffect(() => {
		setWorkspaceHydrated(false);

		if (!workspaceStorageKey) {
			setWorkspaceHydrated(true);
			setHydratedWorkspaceKey('');
			return;
		}

		const snapshot = loadSqlEditorWorkspace(workspaceStorageKey);

		if (!snapshot) {
			const initialTab = buildWorkspaceTab({ title: defaultTabTitle });
			setTabs([initialTab]);
			setActiveTabId(initialTab.id);
			setResultMode('table');
			setSplitNormal(36);
			setSplitFullscreen(36);
			setWorkspaceHydrated(true);
			setHydratedWorkspaceKey(workspaceStorageKey);
			return;
		}

		const restoredTabs = snapshot.tabs.map((tab) => buildWorkspaceTab(tab));
		setTabs(restoredTabs);
		setActiveTabId(snapshot.activeTabId);
		setResultMode(snapshot.resultMode);
		setSplitNormal(snapshot.splitNormal);
		setSplitFullscreen(snapshot.splitFullscreen);
		setWorkspaceHydrated(true);
		setHydratedWorkspaceKey(workspaceStorageKey);
	}, [defaultTabTitle, workspaceStorageKey]);

	useEffect(() => {
		if (!workspaceHydrated || !workspaceStorageKey || !tabs.length || hydratedWorkspaceKey !== workspaceStorageKey) {
			return;
		}

		saveSqlEditorWorkspace(workspaceStorageKey, {
			activeTabId: tabs.some((tab) => tab.id === activeTabId) ? activeTabId : tabs[0].id,
			resultMode,
			splitNormal,
			splitFullscreen,
			tabs: tabs.map((tab) => ({
				id: tab.id,
				title: tab.title,
				sql: tab.sql,
				fonteDados: tab.fonteDados,
				savedQueryId: tab.savedQueryId,
				dirty: tab.dirty,
				result: tab.result,
				search: tab.search,
			})),
		});
	}, [activeTabId, hydratedWorkspaceKey, resultMode, splitFullscreen, splitNormal, tabs, workspaceHydrated, workspaceStorageKey]);

	function patchActiveTab(patch: Partial<WorkspaceTab>) {
		if (!activeTab) return;
		setTabs((current) => current.map((tab) => (tab.id === activeTab.id ? { ...tab, ...patch } : tab)));
	}

	function createNewTab() {
		const nextTab = buildWorkspaceTab({ title: `${t('sqlEditor.queryLabel', 'Consulta')} ${tabs.length + 1}` });
		setTabs((current) => [...current, nextTab]);
		setActiveTabId(nextTab.id);
	}

	function closeTab(tabId: string) {
		if (tabs.length === 1) return;
		const nextTabs = tabs.filter((tab) => tab.id !== tabId);
		setTabs(nextTabs);
		if (activeTabId === tabId) setActiveTabId(nextTabs[0]?.id ?? '');
	}

	async function runQuery(targetTab = activeTab) {
		if (!targetTab) return;
		if (!targetTab.sql.trim()) {
			setToast({ message: t('sqlEditor.messages.sqlRequired', 'Informe a consulta SQL antes de executar.'), tone: 'error' });
			return;
		}
		setTabs((current) => current.map((tab) => (tab.id === targetTab.id ? { ...tab, isExecuting: true } : tab)));
		try {
			const result = await sqlEditorClient.execute({
				fonteDados: targetTab.fonteDados,
				sql: targetTab.sql,
				page: targetTab.result?.pagination.page || 1,
				perPage: targetTab.result?.pagination.perPage || 100,
			});
			setTabs((current) => current.map((tab) => (tab.id === targetTab.id ? { ...tab, result, isExecuting: false } : tab)));
		} catch (error) {
			setTabs((current) => current.map((tab) => (tab.id === targetTab.id ? { ...tab, isExecuting: false } : tab)));
			setToast({ message: error instanceof Error ? error.message : t('sqlEditor.messages.queryExecutionError', 'Não foi possível executar a consulta.'), tone: 'error' });
		}
	}

	async function changePage(nextPage: number) {
		if (!activeTab || !activePagination) return;
		try {
			patchActiveTab({ isExecuting: true });
			const result = await sqlEditorClient.execute({ fonteDados: activeTab.fonteDados, sql: activeTab.sql, page: nextPage, perPage: activePagination.perPage });
			patchActiveTab({ result, isExecuting: false });
		} catch (error) {
			patchActiveTab({ isExecuting: false });
			setToast({ message: error instanceof Error ? error.message : t('sqlEditor.messages.navigateResultsError', 'Não foi possível navegar pelos resultados.'), tone: 'error' });
		}
	}

	function openSaveModal() {
		if (!activeTab) return;
		setSaveDraft({ id: activeTab.savedQueryId || undefined, nome: activeTab.savedQueryId ? activeTab.title : '', descricao: '', publico: false });
		setSaveModalOpen(true);
	}

	async function saveCurrentQuery() {
		if (!activeTab) return;
		setSaveLoading(true);
		try {
			const saved = await sqlEditorClient.saveQuery({
				id: saveDraft.id,
				nome: saveDraft.nome,
				descricao: saveDraft.descricao,
				publico: saveDraft.publico,
				fonteDados: activeTab.fonteDados,
				sql: activeTab.sql,
			});
			patchActiveTab({ title: saveDraft.nome, savedQueryId: saved.data.id, dirty: false });
			setSaveModalOpen(false);
			setToast({ message: saved.message, tone: 'success' });
			if (savedQueriesOpen) await loadSavedQueries();
		} catch (error) {
			setToast({ message: error instanceof Error ? error.message : t('sqlEditor.messages.saveQueryError', 'Não foi possível salvar a consulta.'), tone: 'error' });
		} finally {
			setSaveLoading(false);
		}
	}

	function loadSavedQuery(query: SavedSqlQuery) {
		const nextTab = buildWorkspaceTab({ title: query.nome, sql: query.sql, fonteDados: (query.fonteDados as SqlDataSource) || 'agileecommerce', savedQueryId: query.id });
		setTabs((current) => [...current, nextTab]);
		setActiveTabId(nextTab.id);
		setSavedQueriesOpen(false);
	}

	const filteredSavedQueries = useMemo(() => {
		const normalized = savedQueriesSearch.trim().toLowerCase();
		if (!normalized) return savedQueries;
		return savedQueries.filter((query) =>
			[query.nome, query.descricao, query.usuarioNome, query.fonteDados].some((value) =>
				String(value || '')
					.toLowerCase()
					.includes(normalized),
			),
		);
	}, [savedQueries, savedQueriesSearch]);

	const filteredRowsCount = useMemo(() => {
		const normalizedSearch = activeTab?.search.trim().toLowerCase() || '';
		if (!normalizedSearch) return activeRows.length;
		const columns = inferColumns(activeRows);
		return activeRows.filter((row) => columns.some((column) => formatCellValue(row[column]).toLowerCase().includes(normalizedSearch))).length;
	}, [activeRows, activeTab?.search]);

	function renderWorkspace(height: string, mode: 'default' | 'fullscreen' = 'default') {
		if (!activeTab) return null;

		return (
			<ResizableVerticalPanels
				initialTopPercentage={mode === 'fullscreen' ? 36 : 26}
				topPercentage={mode === 'fullscreen' ? splitFullscreen : splitNormal}
				onTopPercentageChange={mode === 'fullscreen' ? setSplitFullscreen : setSplitNormal}
				minTopPx={220}
				minBottomPx={280}
				height={height}
				minHeightClassName={mode === 'fullscreen' ? 'min-h-0' : 'min-h-[620px]'}
				top={
					<div className="app-pane flex h-full min-h-0 flex-col overflow-hidden rounded-[1rem]">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--app-card-border)] px-3 py-2.5">
							<div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
								{tabs.map((tab) => (
									<div
										key={tab.id}
										className={['inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1', tab.id === activeTab.id ? 'app-pill-tab-active' : 'app-pill-tab'].join(
											' ',
										)}
									>
										<button type="button" onClick={() => setActiveTabId(tab.id)} className="px-2 text-[13px] font-semibold">
											{tab.title}
											{tab.dirty ? ' *' : ''}
										</button>
										{tabs.length > 1 ? (
											<button
												type="button"
												onClick={() => closeTab(tab.id)}
												className={tab.id === activeTab.id ? 'text-white/80' : 'text-[color:var(--app-muted)]'}
												aria-label={t('sqlEditor.actions.closeTab', 'Fechar aba')}
											>
												<X className="h-4 w-4" />
											</button>
										) : null}
									</div>
								))}
								<button
									type="button"
									onClick={createNewTab}
									aria-label={t('sqlEditor.actions.newTab', 'Nova aba')}
									className="app-button-secondary inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:border-[color:var(--app-control-border-strong)] hover:text-[color:var(--app-text)]"
								>
									<Plus className="h-4 w-4" />
								</button>
							</div>
							<div className="flex items-center gap-2 text-[11px] text-[color:var(--app-muted)]">
								{activeTab.isExecuting ? (
									<StatusBadge tone="warning">
										<span className="inline-flex items-center gap-1.5">
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
											{t('sqlEditor.status.executing', 'Executando')}
										</span>
									</StatusBadge>
								) : null}
								<span className="shrink-0">{t('sqlEditor.shortcut.runQuery', 'Ctrl/Cmd + Enter')}</span>
							</div>
						</div>
						<div className="min-h-0 flex-1 overflow-hidden">
							<SqlEditorMonaco
								tabId={mode === 'fullscreen' ? `${activeTab.id}-fullscreen` : activeTab.id}
								value={activeTab.sql}
								onChange={(value) => patchActiveTab({ sql: value, dirty: true })}
								onRunShortcut={(sql) => {
									const nextSql = activeTab.sql.trim() ? activeTab.sql : sql;
									const nextTab = {
										...activeTab,
										sql: nextSql,
									};
									void runQuery(nextTab);
								}}
								height="100%"
							/>
						</div>
					</div>
				}
				bottom={
					<div className="app-pane flex h-full min-h-0 flex-col overflow-hidden rounded-[1rem]">
						<div className="min-h-0 flex-1 overflow-hidden">
							{activeTab.isExecuting ? (
								<div className="app-control-muted m-4 rounded-[1rem] border border-dashed px-5 py-8 text-sm text-[color:var(--app-muted)]">
									<div className="flex items-center gap-2 font-medium text-[color:var(--app-text)]">
										<Loader2 className="h-4 w-4 animate-spin" />
										{t('sqlEditor.status.executingQuery', 'Executando consulta...')}
									</div>
								</div>
							) : !activeTab.result ? (
								<div className="app-control-muted m-4 rounded-[1rem] border border-dashed px-5 py-8 text-sm text-[color:var(--app-muted)]">
									{t('sqlEditor.emptyResult', 'Execute uma consulta para visualizar o resultado aqui.')}
								</div>
							) : resultMode === 'table' ? (
								<ResultTable rows={activeRows} search={activeTab.search} />
							) : (
								<pre className="h-full overflow-auto rounded-none border-0 bg-[#0f172a] px-5 py-4 text-sm text-slate-100">{JSON.stringify(activeTab.result.raw, null, 2)}</pre>
							)}
						</div>

						<div className="sticky bottom-0 z-10 border-t border-[color:var(--app-card-border)] bg-[color:var(--app-control-muted-bg)]/95 px-4 py-2.5 backdrop-blur">
							<div className="overflow-x-auto">
								<div className="flex min-w-max items-center gap-2 whitespace-nowrap">
									<button
										type="button"
										onClick={() => setResultMode('table')}
										className={[
											'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
											resultMode === 'table' ? 'app-pill-tab-active' : 'app-pill-tab',
										].join(' ')}
									>
										<Table2 className="h-3.5 w-3.5" />
										{t('sqlEditor.resultModes.table', 'Tabela')}
									</button>
									<button
										type="button"
										onClick={() => setResultMode('json')}
										className={[
											'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
											resultMode === 'json' ? 'app-pill-tab-active' : 'app-pill-tab',
										].join(' ')}
									>
										<FileCode2 className="h-3.5 w-3.5" />
										{t('sqlEditor.resultModes.json', 'JSON')}
									</button>
									{activeTab.result ? <StatusBadge tone="info">{t('sqlEditor.labels.rows', '{{count}} linhas', { count: String(activeRows.length) })}</StatusBadge> : null}
									{activeTab.result ? (
										<StatusBadge tone="neutral">{t('sqlEditor.labels.filteredRows', '{{count}} visíveis', { count: String(filteredRowsCount) })}</StatusBadge>
									) : null}
									{activePagination?.total !== null ? (
										<StatusBadge tone="success">{t('sqlEditor.labels.totalRows', 'Total {{count}}', { count: String(activePagination?.total || 0) })}</StatusBadge>
									) : null}
									{activePagination ? (
										<span className="px-1 text-xs text-[color:var(--app-muted)]">
											{t('sqlEditor.paginationInfo', 'Página {{page}} com {{perPage}} registros por vez.', {
												page: String(activePagination.page),
												perPage: String(activePagination.perPage),
											})}
										</span>
									) : null}
									{activePagination ? (
										<>
											<button
												type="button"
												disabled={activePagination.page <= 1 || activeTab.isExecuting}
												onClick={() => void changePage(activePagination.page - 1)}
												className="app-button-secondary rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
											>
												{t('common.previous', 'Anterior')}
											</button>
											<button
												type="button"
												disabled={!activePagination.hasMore || activeTab.isExecuting}
												onClick={() => void changePage(activePagination.page + 1)}
												className="app-button-secondary rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
											>
												{t('common.next', 'Próximo')}
											</button>
										</>
									) : null}
									<ToolbarIconButton
										label={t('sqlEditor.actions.exportCsv', 'Exportar CSV')}
										onClick={() => downloadCsvFile(`editor-sql-${activeTab.id}.csv`, activeRows)}
										disabled={!activeTab.result}
									>
										<Download className="h-4 w-4" />
									</ToolbarIconButton>
									<ToolbarIconButton
										label={t('sqlEditor.actions.exportJson', 'Exportar JSON')}
										onClick={() => downloadJsonFile(`editor-sql-${activeTab.id}.json`, activeTab.result?.raw)}
										disabled={!activeTab.result}
									>
										<FileCode2 className="h-4 w-4" />
									</ToolbarIconButton>
									<ToolbarIconButton
										label={t('sqlEditor.actions.copyResult', 'Copiar resultado')}
										onClick={() =>
											void copyTextToClipboard(JSON.stringify(activeTab.result?.raw, null, 2))
												.then(() => {
													setToast({ message: t('sqlEditor.messages.resultCopied', 'Resultado copiado para a área de transferência.'), tone: 'success' });
												})
												.catch((error) => {
													setToast({
														message: error instanceof Error ? error.message : t('sqlEditor.messages.copyResultError', 'Não foi possível copiar o resultado.'),
														tone: 'error',
													});
												})
										}
										disabled={!activeTab.result}
									>
										<Copy className="h-4 w-4" />
									</ToolbarIconButton>
								</div>
							</div>
						</div>
					</div>
				}
			/>
		);
	}

	if (!access.canOpen) return <AccessDeniedState title={t('sqlEditor.title', 'Editor SQL')} />;

	return (
		<div className="space-y-5">
			<style jsx>{`
				:global(.sql-result-grid-scroll) {
					scrollbar-width: auto;
				}

				:global(.sql-result-grid-scroll::-webkit-scrollbar:vertical) {
					width: 10px;
				}

				:global(.sql-result-grid-scroll::-webkit-scrollbar-thumb:vertical) {
					background: #c8cdd6;
					border-radius: 999px;
				}

				:global(.sql-result-grid-scroll::-webkit-scrollbar-track:vertical) {
					background: #ece7dc;
					border-radius: 999px;
				}

				:global(.sql-result-grid-scroll::-webkit-scrollbar:horizontal) {
					height: 0;
				}

				:global(.sql-result-grid-scrollbar::-webkit-scrollbar) {
					height: 10px;
				}

				:global(.sql-result-grid-scrollbar::-webkit-scrollbar-thumb) {
					background: #c8cdd6;
					border-radius: 999px;
				}

				:global(.sql-result-grid-scrollbar::-webkit-scrollbar-track) {
					background: #ece7dc;
					border-radius: 999px;
				}

				:global(.sql-result-grid-scrollbar) {
					scrollbar-color: #c8cdd6 #ece7dc;
				}
			`}</style>
			<PageHeader
				title={t('sqlEditor.title', 'Editor SQL')}
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Home'), href: '/dashboard' },
					{ label: t('menuKeys.ferramentas', 'Ferramentas') },
					{ label: t('sqlEditor.title', 'Editor SQL') },
				]}
				actions={
					activeTab ? (
						<div className="flex flex-wrap items-center gap-2">
							<div className="app-control inline-flex items-center gap-2 rounded-full px-3 py-2">
								<Database className="h-4 w-4 text-[color:var(--app-muted)]" />
								<select
									value={activeTab.fonteDados}
									onChange={(event) => patchActiveTab({ fonteDados: event.target.value as SqlDataSource, dirty: true })}
									aria-label={t('sqlEditor.fields.dataSource', 'Fonte de dados')}
									className="bg-transparent text-sm font-semibold text-[color:var(--app-text)] outline-none"
								>
									{DATA_SOURCE_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{t(option.labelKey, option.fallback)}
										</option>
									))}
								</select>
							</div>
							<ToolbarIconButton label={t('sqlEditor.actions.openQuery', 'Carregar consulta')} onClick={() => setSavedQueriesOpen(true)}>
								<FolderOpen className="h-4 w-4" />
							</ToolbarIconButton>
							<ToolbarIconButton label={t('sqlEditor.actions.saveQuery', 'Salvar consulta')} onClick={openSaveModal}>
								<Save className="h-4 w-4" />
							</ToolbarIconButton>
							<ToolbarIconButton
								label={t('sqlEditor.actions.copySql', 'Copiar SQL')}
								onClick={() =>
									void copyTextToClipboard(activeTab.sql)
										.then(() => {
											setToast({ message: t('sqlEditor.messages.sqlCopied', 'SQL copiado para a área de transferência.'), tone: 'success' });
										})
										.catch((error) => {
											setToast({ message: error instanceof Error ? error.message : t('sqlEditor.messages.copySqlError', 'Não foi possível copiar o SQL.'), tone: 'error' });
										})
								}
							>
								<Copy className="h-4 w-4" />
							</ToolbarIconButton>
							<ToolbarIconButton label={t('sqlEditor.actions.fullscreen', 'Tela cheia')} onClick={() => setFullscreenOpen(true)}>
								<Expand className="h-4 w-4" />
							</ToolbarIconButton>
							<ToolbarIconButton label={t('sqlEditor.actions.runQuery', 'Executar')} onClick={() => void runQuery()} disabled={activeTab.isExecuting} prominent>
								{activeTab.isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
							</ToolbarIconButton>
						</div>
					) : null
				}
			/>

			{activeTab ? (
				<SectionCard className="overflow-hidden px-0 py-0">
					<div className="px-2 py-2 sm:px-3 sm:py-3">{renderWorkspace('calc(100vh - 150px)')}</div>
				</SectionCard>
			) : null}

			<OverlayModal open={savedQueriesOpen} title={t('sqlEditor.savedQueriesTitle', 'Consultas salvas')} onClose={() => setSavedQueriesOpen(false)} maxWidthClassName="max-w-6xl">
				<div className="space-y-4">
					<div className="app-control flex items-center gap-2 rounded-full px-4 py-3">
						<Search className="h-4 w-4 text-[color:var(--app-muted)]" />
						<input
							value={savedQueriesSearch}
							onChange={(event) => setSavedQueriesSearch(event.target.value)}
							placeholder={t('sqlEditor.placeholders.searchSaved', 'Buscar consultas salvas')}
							className="w-full bg-transparent text-sm text-[color:var(--app-text)] outline-none placeholder:text-[color:var(--app-muted)]"
						/>
					</div>
					<AsyncState isLoading={savedQueriesLoading} error={savedQueriesError}>
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{filteredSavedQueries.map((query) => (
								<article key={query.id} className="app-pane-muted rounded-[1.2rem] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<h3 className="truncate text-base font-bold text-[color:var(--app-text)]">{query.nome}</h3>
											<p className="mt-1 text-xs text-[color:var(--app-muted)]">{query.descricao || t('sqlEditor.withoutDescription', 'Sem descrição')}</p>
										</div>
										<StatusBadge tone={query.publico ? 'success' : 'neutral'}>
											{query.publico ? t('sqlEditor.publicQuery', 'Pública') : t('sqlEditor.privateQuery', 'Privada')}
										</StatusBadge>
									</div>
									<div className="mt-4 space-y-2 text-sm text-[color:var(--app-muted)]">
										<p>
											<strong>{t('sqlEditor.fields.dataSource', 'Fonte de dados')}:</strong> {query.fonteDados}
										</p>
										<p>
											<strong>{t('sqlEditor.fields.author', 'Usuário')}:</strong> {query.usuarioNome || '-'}
										</p>
										<p>
											<strong>{t('sqlEditor.fields.createdAt', 'Criação')}:</strong> {query.criadoEm ? formatDateTime(query.criadoEm) : '-'}
										</p>
									</div>
									<div className="app-pane mt-4 rounded-[1rem] px-3 py-3 text-xs text-[color:var(--app-muted)]">
										<pre className="overflow-hidden whitespace-pre-wrap break-words line-clamp-6">{query.sql}</pre>
									</div>
									<div className="mt-4 flex justify-end">
										<button
											type="button"
											onClick={() => loadSavedQuery(query)}
											className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
										>
											<FolderOpen className="h-4 w-4" />
											{t('sqlEditor.actions.loadSavedQuery', 'Carregar consulta')}
										</button>
									</div>
								</article>
							))}
						</div>
					</AsyncState>
				</div>
			</OverlayModal>

			<OverlayModal open={saveModalOpen} title={t('sqlEditor.saveModalTitle', 'Salvar consulta SQL')} onClose={() => setSaveModalOpen(false)} maxWidthClassName="max-w-2xl">
				<div className="space-y-4">
					<div className="grid gap-4">
						<label className="space-y-2">
							<span className="text-sm font-semibold text-[color:var(--app-text)]">{t('sqlEditor.fields.name', 'Nome')}</span>
							<input
								value={saveDraft.nome}
								onChange={(event) => setSaveDraft((current) => ({ ...current, nome: event.target.value }))}
								className="app-control w-full rounded-[0.95rem] px-4 py-3 text-sm outline-none"
							/>
						</label>
						<label className="space-y-2">
							<span className="text-sm font-semibold text-[color:var(--app-text)]">{t('sqlEditor.fields.description', 'Descrição')}</span>
							<textarea
								value={saveDraft.descricao}
								onChange={(event) => setSaveDraft((current) => ({ ...current, descricao: event.target.value }))}
								rows={4}
								className="app-control w-full rounded-[0.95rem] px-4 py-3 text-sm outline-none"
							/>
						</label>
						<div className="space-y-2">
							<span className="text-sm font-semibold text-[color:var(--app-text)]">{t('sqlEditor.fields.public', 'Pública')}</span>
							<BooleanSegmentedField value={saveDraft.publico} onChange={(value) => setSaveDraft((current) => ({ ...current, publico: value }))} />
						</div>
					</div>
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => setSaveModalOpen(false)} className="app-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold">
							{t('common.cancel', 'Cancelar')}
						</button>
						<button
							type="button"
							disabled={saveLoading}
							onClick={() => void saveCurrentQuery()}
							className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
						>
							{saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
							{t('common.save', 'Salvar')}
						</button>
					</div>
				</div>
			</OverlayModal>

			<OverlayModal
				open={fullscreenOpen}
				title={t('sqlEditor.fullscreenTitle', 'Editor SQL em tela cheia')}
				onClose={() => setFullscreenOpen(false)}
				maxWidthClassName="max-w-[calc(100vw-2rem)]"
				headerClassName="mb-3"
				bodyScrollable={false}
				bodyClassName="flex flex-col"
				headerActions={
					activeTab ? (
						<>
							<div className="text-xs text-[color:var(--app-muted)]">
								{activeTab.isExecuting ? t('sqlEditor.status.executingEllipsis', 'Executando...') : t('sqlEditor.shortcut.runQuery', 'Ctrl/Cmd + Enter')}
							</div>
							<button
								type="button"
								onClick={() => void runQuery()}
								disabled={activeTab.isExecuting}
								className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
							>
								{activeTab.isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
								{t('sqlEditor.actions.runQuery', 'Executar')}
							</button>
						</>
					) : null
				}
			>
				{activeTab ? renderWorkspace('calc(100vh - 170px)', 'fullscreen') : null}
			</OverlayModal>

			{toast ? <PageToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}
		</div>
	);
}
