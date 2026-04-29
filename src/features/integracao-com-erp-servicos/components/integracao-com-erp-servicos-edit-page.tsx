'use client';

import { Clock3, Eye, FileCode2, History, Info, Loader2, Play, RefreshCcw, RotateCw, Save, Settings2, StopCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppDataTable } from '@/src/components/data-table/app-data-table';
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters';
import { DataTableFilterToggleAction, DataTablePageActions } from '@/src/components/data-table/data-table-toolbar';
import type { AppDataTableColumn } from '@/src/components/data-table/types';
import { AsyncState } from '@/src/components/ui/async-state';
import { DynamicResultGrid } from '@/src/components/ui/dynamic-result-grid';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { ToggleCard } from '@/src/components/ui/toggle-card';
import { TabbedIntegrationFormPage, type IntegrationFormTab } from '@/src/features/integracoes/components/tabbed-integration-form-page';
import { SqlEditorMonaco } from '@/src/features/editor-sql/components/sql-editor-monaco';
import { sqlEditorClient } from '@/src/features/editor-sql/services/sql-editor-client';
import type { SqlEditorExecuteResponse } from '@/src/features/editor-sql/services/sql-editor-types';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { integracaoComErpServicosClient } from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-client';
import type {
	IntegracaoComErpServicoExecutionDetailResponse,
	IntegracaoComErpServicoExecutionDetailRecord,
	IntegracaoComErpServicoExecutionFailure,
	IntegracaoComErpServicoExecutionFilters,
	IntegracaoComErpServicoExecutionLogContent,
	IntegracaoComErpServicoExecutionRecord,
	IntegracaoComErpServicoExecutionResponse,
	IntegracaoComErpServicoConfigHistoryResponse,
	IntegracaoComErpServicoHistoryRecord,
	IntegracaoComErpServicoHistoryResponse,
	IntegracaoComErpServicoQuerySupportItem,
	IntegracaoComErpServicoQuerySupportResponse,
} from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-types';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';

type Props = {
	serviceId: string;
};

type ServiceFormState = {
	ativo: boolean;
	intervaloExecucao: string;
	urlFiltro: string;
	motivo: string;
};

const INTERVAL_OPTIONS = ['2', '5', '10', '15', '20', '30', '45', '60', '120', '180', '240', '300', '360', '720', '1440'];
const EMPTY_QUERY_SUPPORT: IntegracaoComErpServicoQuerySupportResponse = { fields: [], parameters: [] };
const EMPTY_HISTORY: IntegracaoComErpServicoHistoryResponse = {
	data: [],
	meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perPage: 20 },
};
const EMPTY_EXECUTIONS: IntegracaoComErpServicoExecutionResponse = {
	data: [],
	meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perPage: 10 },
};
const EMPTY_EXECUTION_DETAILS: IntegracaoComErpServicoExecutionDetailResponse = {
	data: [],
	meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perPage: 200 },
};
const EMPTY_CONFIG_HISTORY: IntegracaoComErpServicoConfigHistoryResponse = {
	data: [],
	meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perPage: 20 },
};
const DEFAULT_EXECUTION_FILTERS: IntegracaoComErpServicoExecutionFilters = {
	page: 1,
	perPage: 10,
	id: '',
	status: '',
	abortar: '',
};
const DEFAULT_EXECUTION_DETAILS_PAGINATION = {
	page: 1,
	perPage: 10,
};

function DetailStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="app-control-muted rounded-2xl px-4 py-3">
			<div className="text-(--app-muted) text-xs font-semibold uppercase tracking-[0.14em]">{label}</div>
			<div className="mt-2 text-(--app-text) text-sm font-semibold">{value || '-'}</div>
		</div>
	);
}

function SupportList({ title, subtitle, items }: { title: string; subtitle: string; items: IntegracaoComErpServicoQuerySupportItem[] }) {
	return (
		<div className="app-control-muted rounded-[1.15rem] p-4">
			<div className="border-b border-line/40 pb-4">
				<div className="text-(--app-text) text-lg font-semibold leading-6">{title}</div>
				<div className="text-(--app-muted) mt-1 text-sm leading-5">{subtitle}</div>
			</div>
			<div className="mt-4 max-h-70 space-y-3 overflow-y-auto pr-1">
				{items.length ? (
					items.map((item) => (
						<div key={`${item.kind}-${item.id}`} className="border-l-2 border-emerald-500/80 pl-4">
							<div className="flex flex-wrap items-center gap-2">
								<div className="text-(--app-text) text-base font-medium">{item.label}</div>
								{item.primaryKey ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700">PK</span> : null}
								{item.required ? <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Obrigatório</span> : null}
							</div>
							<div className="text-(--app-muted) mt-1 text-sm">{item.description || item.dataType || '-'}</div>
						</div>
					))
				) : (
					<div className="text-(--app-muted) text-sm">Nenhum item disponível.</div>
				)}
			</div>
		</div>
	);
}

function ExecutionWindowCell({ row }: { row: IntegracaoComErpServicoExecutionRecord }) {
	return (
		<div className="space-y-1.5">
			<div className="text-(--app-text) text-sm font-semibold">{row.dataHoraInicio}</div>
			<div className="text-(--app-muted) text-xs">Fim: {row.dataHoraFim}</div>
			<div className="text-(--app-muted) text-xs">Duração: {row.tempoExecucao}</div>
		</div>
	);
}

function ExecutionStatusCell({ row }: { row: IntegracaoComErpServicoExecutionRecord }) {
	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center gap-2">
				<StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>
				{row.abortar ? <StatusBadge tone={row.abortarTone}>{row.abortarLabel}</StatusBadge> : null}
			</div>
			<div className="text-(--app-muted) text-xs">Processos/Arquivos: {row.statusLog}</div>
		</div>
	);
}

function ExecutionMetricsCell({ row }: { row: IntegracaoComErpServicoExecutionRecord }) {
	const metrics = [
		{ label: 'Consult.', value: row.qtdRegistros },
		{ label: 'Incl.', value: row.qtdIncluidos },
		{ label: 'Alt.', value: row.qtdAlterados },
		{ label: 'Del.', value: row.qtdDeletados },
	];

	return (
		<div className="grid grid-cols-2 gap-2">
			{metrics.map((metric) => (
				<div key={metric.label} className="app-control-muted rounded-xl px-3 py-2">
					<div className="text-(--app-muted) text-[11px] uppercase tracking-[0.12em]">{metric.label}</div>
					<div className="text-(--app-text) mt-1 text-sm font-semibold">{metric.value}</div>
				</div>
			))}
		</div>
	);
}

export function IntegracaoComErpServicosEditPage({ serviceId }: Props) {
	const { t } = useI18n();
	const auth = useAuth();
	const access = useFeatureAccess('erpServicos');
	const isMaster = Boolean(auth.user?.master);
	const [form, setForm] = useState<ServiceFormState | null>(null);
	const [querySql, setQuerySql] = useState('');
	const [queryReason, setQueryReason] = useState('');
	const [querySaveOpen, setQuerySaveOpen] = useState(false);
	const [querySaving, setQuerySaving] = useState(false);
	const [queryHistoryOpen, setQueryHistoryOpen] = useState(false);
	const [queryResult, setQueryResult] = useState<SqlEditorExecuteResponse | null>(null);
	const [queryResultOpen, setQueryResultOpen] = useState(false);
	const [queryResultMode, setQueryResultMode] = useState<'json' | 'grid'>('json');
	const [queryRunning, setQueryRunning] = useState(false);
	const [activeTab, setActiveTab] = useState('settings');
	const [configHistoryOpen, setConfigHistoryOpen] = useState(false);
	const [executionFiltersExpanded, setExecutionFiltersExpanded] = useState(false);
	const [executionFilters, setExecutionFilters] = useState<IntegracaoComErpServicoExecutionFilters>(DEFAULT_EXECUTION_FILTERS);
	const [executionFiltersDraft, setExecutionFiltersDraft] = useState<IntegracaoComErpServicoExecutionFilters>(DEFAULT_EXECUTION_FILTERS);
	const [selectedExecution, setSelectedExecution] = useState<IntegracaoComErpServicoExecutionRecord | null>(null);
	const [executionDetailsPagination, setExecutionDetailsPagination] = useState(DEFAULT_EXECUTION_DETAILS_PAGINATION);
	const [executionLogModal, setExecutionLogModal] = useState<IntegracaoComErpServicoExecutionLogContent | null>(null);
	const [failureModal, setFailureModal] = useState<IntegracaoComErpServicoExecutionFailure | null>(null);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [saving, setSaving] = useState(false);
	const hydratedQueryServiceIdRef = useRef('');
	const detailState = useAsyncData(() => integracaoComErpServicosClient.getById(serviceId), [serviceId]);
	const detail = detailState.data;
	const querySupportState = useAsyncData(
		() =>
			detail && activeTab === 'query' && detail.caracteristicas.tipoServico.key === 'query'
				? integracaoComErpServicosClient.getQuerySupport(detail.idServico)
				: Promise.resolve(EMPTY_QUERY_SUPPORT),
		[activeTab, detail?.caracteristicas.tipoServico.key, detail?.idServico],
	);
	const historyState = useAsyncData(
		() => (queryHistoryOpen && detail ? integracaoComErpServicosClient.listHistory(detail.idServico) : Promise.resolve(EMPTY_HISTORY)),
		[queryHistoryOpen, detail?.idServico],
	);
	const configHistoryState = useAsyncData(
		() => (configHistoryOpen && detail ? integracaoComErpServicosClient.listConfigHistory(detail.idServico) : Promise.resolve(EMPTY_CONFIG_HISTORY)),
		[configHistoryOpen, detail?.idServico],
	);
	const executionsState = useAsyncData(
		() => (detail && activeTab === 'executions' ? integracaoComErpServicosClient.listExecutions(detail.idServico, executionFilters) : Promise.resolve(EMPTY_EXECUTIONS)),
		[activeTab, detail?.idServico, executionFilters],
	);
	const executionDetailsState = useAsyncData(
		() => (selectedExecution ? integracaoComErpServicosClient.listExecutionDetails(selectedExecution.id, executionDetailsPagination) : Promise.resolve(EMPTY_EXECUTION_DETAILS)),
		[selectedExecution?.id, executionDetailsPagination],
	);

	useEffect(() => {
		if (!detail) return;
		setActiveTab('settings');
		setForm({
			ativo: detail.ativo,
			intervaloExecucao: detail.intervaloExecucao && detail.intervaloExecucao !== '-' ? detail.intervaloExecucao : '10',
			urlFiltro: detail.urlFiltro ?? '',
			motivo: '',
		});
		if (hydratedQueryServiceIdRef.current !== detail.idServico) {
			setQuerySql(detail.querySql ?? '');
			hydratedQueryServiceIdRef.current = detail.idServico;
		}
	}, [detail]);

	const canAccess = access.canEdit || access.canView;
	const canSaveConfig = access.canEdit && isMaster && Boolean(form);
	const canSaveQuery = access.canEdit && Boolean(detail?.hash);
	const hasConfigChanges = Boolean(
		detail &&
		form &&
		(form.ativo !== detail.ativo ||
			form.intervaloExecucao !== (detail.intervaloExecucao && detail.intervaloExecucao !== '-' ? detail.intervaloExecucao : '10') ||
			form.urlFiltro !== (detail.urlFiltro ?? '') ||
			form.motivo.trim().length > 0),
	);
	const hasQueryChanges = Boolean(detail && querySql !== (detail.querySql ?? ''));

	const pageTitle = `${t('maintenance.erpIntegration.modules.servicesEdit.detailTitle', 'Detalhes do Serviço')} #${serviceId}`;
	const breadcrumbs = [
		{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
		{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
		{ label: t('maintenance.erpIntegration.modules.services.title', 'Serviços'), href: '/integracao-com-erp/servicos' },
		{ label: t('maintenance.erpIntegration.modules.servicesEdit.breadcrumb', 'Detalhes') },
	];

	function patchExecutionDraft<K extends keyof IntegracaoComErpServicoExecutionFilters>(key: K, value: IntegracaoComErpServicoExecutionFilters[K]) {
		setExecutionFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }));
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!detail || !form || !canSaveConfig) return;

		setSaving(true);
		setFeedback(null);
		try {
			const result = await integracaoComErpServicosClient.update(detail.idServico, {
				ativo: form.ativo,
				intervaloExecucao: form.intervaloExecucao,
				urlFiltro: form.urlFiltro,
				motivo: form.motivo,
			});
			setFeedback({ tone: 'success', message: result.message });
			await detailState.reload();
		} catch (error) {
			setFeedback({
				tone: 'error',
				message: error instanceof Error ? error.message : t('maintenance.erpIntegration.servicesEdit.feedback.saveError', 'Não foi possível salvar a configuração do serviço.'),
			});
		} finally {
			setSaving(false);
		}
	}

	const handleRunQuery = useCallback(async () => {
		if (!querySql.trim()) {
			setFeedback({ tone: 'error', message: t('maintenance.erpIntegration.servicesEdit.feedback.queryRequired', 'Informe uma query antes de executar.') });
			return;
		}

		setQueryRunning(true);
		setFeedback(null);
		try {
			const result = await sqlEditorClient.execute({ fonteDados: 'erp', sql: querySql, page: 1, perPage: 100 });
			setQueryResult(result);
			setQueryResultMode('json');
			setQueryResultOpen(true);
		} catch (error) {
			setFeedback({
				tone: 'error',
				message: error instanceof Error ? error.message : t('maintenance.erpIntegration.servicesEdit.feedback.queryRunError', 'Não foi possível executar a query do serviço.'),
			});
		} finally {
			setQueryRunning(false);
		}
	}, [querySql, t]);

	const handleQueryChange = useCallback((nextValue: string) => {
		setQuerySql(nextValue);
	}, []);

	const handleRunQueryShortcut = useCallback(() => {
		void handleRunQuery();
	}, [handleRunQuery]);

	async function confirmSaveQuery() {
		if (!detail || !detail.hash || !queryReason.trim()) {
			setFeedback({ tone: 'error', message: t('maintenance.erpIntegration.servicesEdit.feedback.queryReasonRequired', 'Informe o motivo da alteração para salvar a query.') });
			return;
		}

		setQuerySaving(true);
		setFeedback(null);
		try {
			const result = await integracaoComErpServicosClient.saveQuery(detail.idServico, detail.hash, querySql, queryReason.trim());
			setFeedback({ tone: 'success', message: result.message });
			setQuerySaveOpen(false);
			setQueryReason('');
			await detailState.reload();
		} catch (error) {
			setFeedback({
				tone: 'error',
				message: error instanceof Error ? error.message : t('maintenance.erpIntegration.servicesEdit.feedback.querySaveError', 'Não foi possível salvar a query do serviço.'),
			});
		} finally {
			setQuerySaving(false);
		}
	}

	async function restoreHistory(record: IntegracaoComErpServicoHistoryRecord) {
		try {
			const restored = await integracaoComErpServicosClient.rollbackQuery(record.id);
			setQuerySql(restored.sql);
			setQueryHistoryOpen(false);
			setFeedback({ tone: 'success', message: t('maintenance.erpIntegration.servicesEdit.feedback.historyRestored', 'Versão histórica carregada no editor.') });
		} catch (error) {
			setFeedback({
				tone: 'error',
				message:
					error instanceof Error ? error.message : t('maintenance.erpIntegration.servicesEdit.feedback.historyRestoreError', 'Não foi possível restaurar a versão selecionada.'),
			});
		}
	}

	const handleExecutionCommand = useCallback(
		async (kind: 'execute' | 'reload') => {
			if (!detail) return;
			try {
				const result = kind === 'reload' ? await integracaoComErpServicosClient.reload([detail.idServico]) : await integracaoComErpServicosClient.execute([detail.idServico]);
				setFeedback({ tone: 'success', message: result.message });
				await executionsState.reload();
			} catch (error) {
				setFeedback({
					tone: 'error',
					message:
						error instanceof Error
							? error.message
							: t('maintenance.erpIntegration.servicesEdit.feedback.executionCommandError', 'Não foi possível enviar o comando para o serviço.'),
				});
			}
		},
		[detail, executionsState, t],
	);

	const handleAbortExecution = useCallback(
		async (execution: IntegracaoComErpServicoExecutionRecord) => {
			try {
				const result = await integracaoComErpServicosClient.abortExecution(execution.id);
				setFeedback({ tone: 'success', message: result.message });
				await executionsState.reload();
			} catch (error) {
				setFeedback({
					tone: 'error',
					message:
						error instanceof Error ? error.message : t('maintenance.erpIntegration.servicesEdit.feedback.abortError', 'Não foi possível solicitar o abortamento da execução.'),
				});
			}
		},
		[executionsState, t],
	);

	const handleShowFailure = useCallback(
		async (execution: IntegracaoComErpServicoExecutionRecord) => {
			try {
				setFailureModal(await integracaoComErpServicosClient.getExecutionFailure(execution.id));
			} catch (error) {
				setFeedback({
					tone: 'error',
					message: error instanceof Error ? error.message : t('maintenance.erpIntegration.servicesEdit.feedback.failureLoadError', 'Não foi possível carregar o detalhe da falha.'),
				});
			}
		},
		[t],
	);

	const handleShowExecutionDetails = useCallback((execution: IntegracaoComErpServicoExecutionRecord) => {
		setExecutionDetailsPagination(DEFAULT_EXECUTION_DETAILS_PAGINATION);
		setSelectedExecution(execution);
	}, []);

	const handleShowExecutionContent = useCallback(
		async (detailRow: IntegracaoComErpServicoExecutionDetailRecord, kind: 'detail' | 'metadata') => {
			try {
				const content = await integracaoComErpServicosClient.getExecutionDetailContent(detailRow.id, kind);
				setExecutionLogModal({
					...content,
					title: kind === 'metadata' ? t('maintenance.erpIntegration.services.actions.failureReason', 'Motivo da falha') : detailRow.detalhe,
					fileName: kind === 'metadata' ? content.fileName || detailRow.metadataPreview : content.fileName || detailRow.detalhe,
				});
			} catch (error) {
				setFeedback({
					tone: 'error',
					message:
						error instanceof Error
							? error.message
							: t('maintenance.erpIntegration.servicesEdit.feedback.executionDetailLoadError', 'Não foi possível carregar o conteúdo do detalhe da execução.'),
				});
			}
		},
		[t],
	);

	const executionDetailColumns = useMemo(
		() =>
			[
				{
					id: 'id',
					label: 'ID',
					thClassName: 'w-[110px]',
					cell: (row: IntegracaoComErpServicoExecutionDetailRecord) => <span className="text-(--app-text) font-semibold">{row.id}</span>,
				},
				{
					id: 'tipoDetalhe',
					label: 'Tipo Detalhe',
					thClassName: 'w-[150px]',
					cell: (row: IntegracaoComErpServicoExecutionDetailRecord) => <span className="text-(--app-text)">{row.tipoDetalhe}</span>,
				},
				{
					id: 'detalhe',
					label: 'Detalhe',
					thClassName: 'min-w-[320px]',
					cell: (row: IntegracaoComErpServicoExecutionDetailRecord) => <div className="wrap-break-word whitespace-pre-wrap text-(--app-text)">{row.detalhe}</div>,
				},
				{
					id: 'dataHoraInicio',
					label: 'Data/Hora Inicio',
					thClassName: 'w-[150px]',
					cell: (row: IntegracaoComErpServicoExecutionDetailRecord) => row.dataHoraInicio,
				},
				{
					id: 'dataHoraFim',
					label: 'Data/Hora Fim',
					thClassName: 'w-[150px]',
					cell: (row: IntegracaoComErpServicoExecutionDetailRecord) => row.dataHoraFim,
				},
				{
					id: 'tempoExecucao',
					label: 'Tempo de Execução',
					thClassName: 'w-[130px]',
					cell: (row: IntegracaoComErpServicoExecutionDetailRecord) => row.tempoExecucao,
				},
				{
					id: 'status',
					label: 'Status',
					thClassName: 'w-[140px]',
					cell: (row: IntegracaoComErpServicoExecutionDetailRecord) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
				},
				{
					id: 'tentativas',
					label: 'Tentativas',
					thClassName: 'w-[100px]',
					cell: (row: IntegracaoComErpServicoExecutionDetailRecord) => row.tentativas,
				},
			] satisfies AppDataTableColumn<IntegracaoComErpServicoExecutionDetailRecord, never>[],
		[],
	);

	const executionColumns = useMemo(
		() =>
			[
				{
					id: 'id',
					label: t('maintenance.erpIntegration.servicesEdit.executions.fields.id', 'ID'),
					thClassName: 'w-[96px]',
					cell: (row: IntegracaoComErpServicoExecutionRecord) => <span className="text-(--app-text) font-semibold">{row.id}</span>,
					filter: { kind: 'text', id: 'id', key: 'id', label: t('maintenance.erpIntegration.servicesEdit.executions.fields.id', 'ID') },
				},
				{
					id: 'janela',
					label: t('maintenance.erpIntegration.servicesEdit.executions.fields.executionWindow', 'Execução'),
					thClassName: 'w-[240px]',
					cell: (row: IntegracaoComErpServicoExecutionRecord) => <ExecutionWindowCell row={row} />,
				},
				{
					id: 'status',
					label: t('maintenance.erpIntegration.servicesEdit.executions.fields.statusAndProcess', 'Status e Processamento'),
					thClassName: 'w-[260px]',
					cell: (row: IntegracaoComErpServicoExecutionRecord) => <ExecutionStatusCell row={row} />,
					filter: {
						kind: 'select',
						id: 'status',
						key: 'status',
						label: t('maintenance.erpIntegration.services.fields.status', 'Status'),
						options: [
							{ value: 'finalizado', label: 'Finalizado' },
							{ value: 'finalizado_parcial', label: 'Finalizado Parcial' },
							{ value: 'executando_mysql', label: 'Em Execução' },
							{ value: 'falha_na_execucao', label: 'Falha' },
							{ value: 'abortado', label: 'Abortado' },
						],
					},
				},
				{
					id: 'metricas',
					label: t('maintenance.erpIntegration.servicesEdit.executions.fields.groupedMetrics', 'Registros Processados'),
					thClassName: 'w-[280px]',
					cell: (row: IntegracaoComErpServicoExecutionRecord) => <ExecutionMetricsCell row={row} />,
					filter: {
						kind: 'select',
						id: 'abortar',
						key: 'abortar',
						label: t('maintenance.erpIntegration.servicesEdit.executions.fields.abort', 'Abortar'),
						options: [
							{ value: 'true', label: 'Sim' },
							{ value: 'false', label: 'Não' },
						],
					},
				},
			] satisfies AppDataTableColumn<IntegracaoComErpServicoExecutionRecord, IntegracaoComErpServicoExecutionFilters>[],
		[t],
	);

	const tabs = useMemo<IntegrationFormTab[]>(() => {
		if (!detail || !form) return [];

		const queryTabLabel =
			detail.caracteristicas.tipoServico.key === 'endpoint_gateway'
				? t('maintenance.erpIntegration.servicesEdit.tabs.endpoint', 'Endpoint')
				: detail.caracteristicas.tipoServico.key === 'acao'
					? t('maintenance.erpIntegration.servicesEdit.tabs.action', 'Ação')
					: t('maintenance.erpIntegration.servicesEdit.tabs.query', 'Query');

		return [
			{
				key: 'settings',
				label: t('maintenance.erpIntegration.servicesEdit.tabs.settings', 'Configurações do Serviço'),
				icon: <Settings2 className="h-4 w-4" />,
				toolbar: detail.idServico ? (
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
							onClick={() => setConfigHistoryOpen(true)}
						>
							<History className="h-4 w-4" />
							{t('maintenance.erpIntegration.servicesEdit.configurationLogs', 'Logs')}
						</button>
					</div>
				) : null,
				content: (
					<SectionCard title={t('maintenance.erpIntegration.servicesEdit.sections.settings', 'Configurações do serviço')}>
						<div className="space-y-6">
							<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
								<ToggleCard
									label={t('maintenance.erpIntegration.servicesEdit.fields.active', 'Ativo')}
									checked={form.ativo}
									onChange={(value) => setForm((current) => (current ? { ...current, ativo: value } : current))}
									disabled={!canSaveConfig}
									hint={t('maintenance.erpIntegration.servicesEdit.hints.active', 'Controla se o integrador pode executar o serviço.')}
								/>
								<ToggleCard
									label={t('maintenance.erpIntegration.servicesEdit.fields.customized', 'Customizado')}
									checked={Boolean(detail.customizado)}
									onChange={() => undefined}
									disabled
									hint={t('maintenance.erpIntegration.servicesEdit.hints.customized', 'Indicador retornado pela configuração atual do tenant.')}
								/>
								<DetailStat label={t('maintenance.erpIntegration.services.fields.status', 'Status')} value={detail.statusLabel || '-'} />
								<DetailStat label={t('maintenance.erpIntegration.services.fields.id', 'ID')} value={detail.idServico} />
							</div>

							<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
								<div className="space-y-2">
									<label className="text-(--app-text) text-sm font-semibold">{t('maintenance.erpIntegration.servicesEdit.fields.interval', 'Intervalo de execução')}</label>
									<select
										value={form.intervaloExecucao}
										onChange={(event) => setForm((current) => (current ? { ...current, intervaloExecucao: event.target.value } : current))}
										disabled={!canSaveConfig}
										className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm"
									>
										{INTERVAL_OPTIONS.map((value) => (
											<option key={value} value={value}>
												{value} min
											</option>
										))}
									</select>
								</div>
								<DetailStat label={t('maintenance.erpIntegration.services.fields.lastExecution', 'Última Execução')} value={detail.ultimaExecucao} />
								<DetailStat label={t('maintenance.erpIntegration.services.fields.nextExecution', 'Próxima Execução')} value={detail.proximaExecucao} />
							</div>

							{detail.caracteristicas.tipoServico.key === 'acao' ? (
								<>
									<div className="grid gap-4 md:grid-cols-2">
										<DetailStat label={t('maintenance.erpIntegration.servicesEdit.fields.gateway', 'Gateway')} value={detail.gatewayName || '-'} />
										<DetailStat label={t('maintenance.erpIntegration.servicesEdit.fields.endpointUrl', 'URL')} value={detail.endpointUrl || '-'} />
									</div>
									<div className="space-y-2">
										<label className="text-(--app-text) text-sm font-semibold">{t('maintenance.erpIntegration.servicesEdit.fields.urlFilter', 'Url filtro')}</label>
										<textarea
											value={form.urlFiltro}
											onChange={(event) => setForm((current) => (current ? { ...current, urlFiltro: event.target.value } : current))}
											rows={5}
											disabled={!canSaveConfig}
											className="app-textarea min-h-32 w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm outline-none"
										/>
									</div>
								</>
							) : null}

							<div className="space-y-2">
								<label className="text-(--app-text) text-sm font-semibold">{t('maintenance.erpIntegration.servicesEdit.fields.reason', 'Motivo da alteração')}</label>
								<textarea
									value={form.motivo}
									onChange={(event) => setForm((current) => (current ? { ...current, motivo: event.target.value } : current))}
									rows={4}
									disabled={!canSaveConfig}
									className="app-textarea min-h-28 w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm outline-none"
									placeholder={t('maintenance.erpIntegration.servicesEdit.fields.reasonPlaceholder', 'Descreva por que a configuração está sendo alterada.')}
								/>
							</div>
						</div>
					</SectionCard>
				),
			},
			{
				key: 'query',
				label: queryTabLabel,
				icon: <FileCode2 className="h-4 w-4" />,
				content:
					detail.caracteristicas.tipoServico.key === 'query' ? (
						<SectionCard>
							<AsyncState isLoading={querySupportState.isLoading} error={querySupportState.error}>
								<div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
									<div className="space-y-4">
										<SupportList
											title={detail.caracteristicas.objeto.label || t('maintenance.erpIntegration.servicesEdit.query.fieldsTitle', 'Tabela plataforma')}
											subtitle={t('maintenance.erpIntegration.servicesEdit.query.fieldsSubtitle', 'Campos expostos para autocomplete e referência rápida.')}
											items={querySupportState.data?.fields ?? []}
										/>
										<SupportList
											title={t('maintenance.erpIntegration.servicesEdit.query.parametersTitle', 'Parâmetros')}
											subtitle={t('maintenance.erpIntegration.servicesEdit.query.parametersSubtitle', 'Parâmetros dinâmicos aceitos pela query do serviço.')}
											items={querySupportState.data?.parameters ?? []}
										/>
									</div>

									<div className="relative min-w-0">
										<div className="pr-16">
											{queryRunning ? (
												<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-800">
													<Loader2 className="h-4 w-4 animate-spin" />
													{t('maintenance.erpIntegration.servicesEdit.query.running', 'Executando query...')}
												</div>
											) : null}
											<div className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
												<DetailStat label={t('maintenance.erpIntegration.services.fields.object', 'Objeto')} value={detail.caracteristicas.objeto.label} />
												<DetailStat label={t('maintenance.erpIntegration.services.fields.engine', 'Motor de execução')} value={detail.caracteristicas.motorExecucao.label} />
											</div>
											<div className="h-105">
												<SqlEditorMonaco tabId={`erp-servico-${serviceId}`} value={querySql} onChange={handleQueryChange} onRunShortcut={handleRunQueryShortcut} height="420px" />
											</div>
										</div>
										<div className="absolute right-0 top-0 flex flex-col gap-3">
											<button
												type="button"
												onClick={() => void handleRunQuery()}
												disabled={queryRunning}
												className="app-button-secondary inline-flex h-12 w-12 items-center justify-center rounded-xl"
												aria-label={t('maintenance.erpIntegration.services.actions.execute', 'Executar')}
											>
												{queryRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
											</button>
											<button
												type="button"
												onClick={() => setQuerySaveOpen(true)}
												disabled={!canSaveQuery || !hasQueryChanges}
												className="app-button-secondary inline-flex h-12 w-12 items-center justify-center rounded-xl disabled:opacity-50"
												aria-label={t('common.save', 'Salvar')}
											>
												<Save className="h-5 w-5" />
											</button>
											<button
												type="button"
												onClick={() => setQueryHistoryOpen(true)}
												className="app-button-secondary inline-flex h-12 w-12 items-center justify-center rounded-xl"
												aria-label={t('maintenance.erpIntegration.servicesEdit.query.history', 'Histórico')}
											>
												<History className="h-5 w-5" />
											</button>
										</div>
									</div>
								</div>
							</AsyncState>
						</SectionCard>
					) : (
						<SectionCard title={detail.caracteristicas.tipoServico.label}>
							<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
								<DetailStat label={t('maintenance.erpIntegration.services.fields.nature', 'Natureza')} value={detail.caracteristicas.natureza.label} />
								<DetailStat label={t('maintenance.erpIntegration.services.fields.engine', 'Motor de execução')} value={detail.caracteristicas.motorExecucao.label} />
								<DetailStat label={t('maintenance.erpIntegration.services.fields.object', 'Objeto')} value={detail.caracteristicas.objeto.label} />
								<DetailStat label={t('maintenance.erpIntegration.servicesEdit.fields.gateway', 'Gateway')} value={detail.gatewayName || '-'} />
								<DetailStat label={t('maintenance.erpIntegration.servicesEdit.fields.endpointUrl', 'URL do endpoint')} value={detail.endpointUrl || '-'} />
								<DetailStat label={t('maintenance.erpIntegration.servicesEdit.fields.hash', 'Hash técnico')} value={detail.hash || '-'} />
							</div>
						</SectionCard>
					),
			},
			{
				key: 'executions',
				label: t('maintenance.erpIntegration.servicesEdit.tabs.executions', 'Execuções'),
				icon: <Clock3 className="h-4 w-4" />,
				toolbar: (
					<DataTablePageActions
						actions={[
							{ label: t('maintenance.erpIntegration.servicesEdit.executions.refreshList', 'Atualizar Lista'), icon: RefreshCcw, onClick: () => void executionsState.reload() },
							access.canEdit
								? {
										label: t('maintenance.erpIntegration.services.actions.execute', 'Executar'),
										icon: Play,
										onClick: () => void handleExecutionCommand('execute'),
										tone: 'secondary',
									}
								: null,
							access.canEdit && isMaster
								? {
										label: t('maintenance.erpIntegration.services.actions.reload', 'Recarregar'),
										icon: RotateCw,
										onClick: () => void handleExecutionCommand('reload'),
										tone: 'danger',
									}
								: null,
						]}
					/>
				),
				content: (
					<SectionCard
						action={
							<div className="flex w-full items-center justify-between gap-3">
								<DataTableFilterToggleAction
									expanded={executionFiltersExpanded}
									onClick={() => setExecutionFiltersExpanded((current) => !current)}
									collapsedLabel={t('filters.button', 'Filtros')}
									expandedLabel={t('filters.hide', 'Ocultar filtros')}
								/>
							</div>
						}
					>
						<DataTableFiltersCard
							variant="embedded"
							columns={executionColumns as AppDataTableColumn<unknown, IntegracaoComErpServicoExecutionFilters>[]}
							draft={executionFiltersDraft}
							applied={executionFilters}
							expanded={executionFiltersExpanded}
							onToggleExpanded={() => setExecutionFiltersExpanded((current) => !current)}
							onApply={() => setExecutionFilters(executionFiltersDraft)}
							onClear={() => {
								setExecutionFilters(DEFAULT_EXECUTION_FILTERS);
								setExecutionFiltersDraft(DEFAULT_EXECUTION_FILTERS);
							}}
							patchDraft={patchExecutionDraft}
						/>
						<AsyncState isLoading={executionsState.isLoading} error={executionsState.error}>
							<AppDataTable<IntegracaoComErpServicoExecutionRecord, never, IntegracaoComErpServicoExecutionFilters>
								rows={executionsState.data?.data ?? []}
								getRowId={(row) => row.id}
								emptyMessage={t('maintenance.erpIntegration.servicesEdit.executions.empty', 'Nenhuma execução encontrada com os filtros atuais.')}
								columns={executionColumns}
								mobileCard={{
									title: (row) => `#${row.id}`,
									subtitle: (row) => row.dataHoraInicio,
									meta: (row) => row.tempoExecucao,
									badges: (row) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
								}}
								rowActions={(row) => [
									{
										id: 'details',
										label: t('maintenance.erpIntegration.servicesEdit.executions.actions.details', 'Detalhes da execução'),
										icon: FileCode2,
										onClick: () => handleShowExecutionDetails(row),
										visible: row.statusLog !== '0/0',
									},
									{
										id: 'failure',
										label: t('maintenance.erpIntegration.services.actions.failureReason', 'Motivo da falha'),
										icon: Info,
										onClick: () => void handleShowFailure(row),
										visible: row.status === 'falha_na_execucao',
									},
									{
										id: 'abort',
										label: t('maintenance.erpIntegration.servicesEdit.executions.actions.abort', 'Abortar execução'),
										icon: StopCircle,
										onClick: () => void handleAbortExecution(row),
										visible: access.canEdit && row.abortar && !['finalizado', 'falha_na_execucao', 'abortado'].includes(row.status),
										tone: 'danger',
									},
								]}
								actionsColumnClassName="w-[132px]"
								pagination={executionsState.data?.meta}
								onPageChange={(page) => setExecutionFilters((current) => ({ ...current, page }))}
								pageSize={{
									value: executionFilters.perPage,
									options: [10, 20, 40],
									onChange: (perPage) => {
										const next = { ...executionFilters, perPage, page: 1 };
										setExecutionFilters(next);
										setExecutionFiltersDraft(next);
									},
								}}
							/>
						</AsyncState>
					</SectionCard>
				),
			},
		];
	}, [
		access.canEdit,
		canSaveConfig,
		canSaveQuery,
		detail,
		executionColumns,
		executionFilters,
		executionFiltersDraft,
		executionFiltersExpanded,
		executionsState,
		form,
		handleAbortExecution,
		handleExecutionCommand,
		handleQueryChange,
		handleRunQuery,
		handleRunQueryShortcut,
		handleShowExecutionDetails,
		handleShowFailure,
		hasQueryChanges,
		isMaster,
		queryRunning,
		querySql,
		querySupportState.data?.fields,
		querySupportState.data?.parameters,
		querySupportState.error,
		querySupportState.isLoading,
		serviceId,
		t,
	]);

	if (!canAccess) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.modules.services.title', 'Serviços')} backHref="/integracao-com-erp/servicos" />;
	}

	return (
		<AsyncState isLoading={detailState.isLoading} error={detailState.error}>
			{detail && form ? (
				<>
					<TabbedIntegrationFormPage
						title={pageTitle}
						description={t(
							'maintenance.erpIntegration.modules.servicesEdit.description',
							'Edite a configuração do serviço, sua query operacional e acompanhe as execuções usando a mesma base tabulada das demais integrações do v2.',
						)}
						breadcrumbs={breadcrumbs}
						formId="integracao-com-erp-servico-edit-form"
						loading={false}
						feedback={feedback}
						onCloseFeedback={() => setFeedback(null)}
						onRefresh={detailState.reload}
						tabs={tabs}
						activeTabKey={activeTab}
						onTabChange={setActiveTab}
						canSave={canSaveConfig}
						hasChanges={hasConfigChanges}
						saving={saving}
						backHref="/integracao-com-erp/servicos"
						onSubmit={handleSubmit}
					/>

					<OverlayModal
						open={querySaveOpen}
						title={t('maintenance.erpIntegration.servicesEdit.query.saveTitle', 'Salvar Query do Serviço')}
						maxWidthClassName="max-w-2xl"
						onClose={() => {
							setQuerySaveOpen(false);
							setQueryReason('');
						}}
					>
						<div className="space-y-4">
							<p className="text-(--app-muted) text-sm leading-6">
								{t(
									'maintenance.erpIntegration.servicesEdit.query.saveDescription',
									'O legado exige motivo para versionar a query customizada do serviço. Informe o motivo antes de salvar.',
								)}
							</p>
							<textarea
								value={queryReason}
								onChange={(event) => setQueryReason(event.target.value)}
								rows={5}
								className="app-textarea min-h-28 w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm outline-none"
								placeholder={t('maintenance.erpIntegration.servicesEdit.query.savePlaceholder', 'Descreva a alteração aplicada nesta query.')}
							/>
							<div className="flex justify-end gap-3">
								<button type="button" className="app-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold" onClick={() => setQuerySaveOpen(false)}>
									{t('common.cancel', 'Cancelar')}
								</button>
								<button type="button" className="app-button-primary rounded-full px-4 py-2.5 text-sm font-semibold" onClick={() => void confirmSaveQuery()} disabled={querySaving}>
									{querySaving ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
								</button>
							</div>
						</div>
					</OverlayModal>

					<OverlayModal
						open={queryHistoryOpen}
						title={t('maintenance.erpIntegration.servicesEdit.query.historyTitle', 'Histórico da Query')}
						maxWidthClassName="max-w-4xl"
						onClose={() => setQueryHistoryOpen(false)}
					>
						<AsyncState isLoading={historyState.isLoading} error={historyState.error}>
							<div className="space-y-3">
								{(historyState.data?.data ?? []).map((record) => (
									<div key={record.id} className="rounded-2xl border border-line/40 px-4 py-3">
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div>
												<div className="text-(--app-text) font-semibold">
													#{record.id} • {record.usuario}
												</div>
												<div className="text-(--app-muted) mt-1 text-sm">
													{record.dataHora} • {record.dataHoraCriacao}
												</div>
												<div className="text-(--app-muted) mt-2 text-sm leading-6">{record.motivo}</div>
											</div>
											<button type="button" className="app-button-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void restoreHistory(record)}>
												{t('maintenance.erpIntegration.servicesEdit.query.restoreHistory', 'Carregar versão')}
											</button>
										</div>
									</div>
								))}
								{!(historyState.data?.data ?? []).length ? (
									<div className="text-(--app-muted) rounded-2xl border border-dashed px-4 py-5 text-sm">
										{t('maintenance.erpIntegration.servicesEdit.query.historyEmpty', 'Nenhuma versão histórica encontrada para este serviço.')}
									</div>
								) : null}
							</div>
						</AsyncState>
					</OverlayModal>

					<OverlayModal
						open={queryResultOpen}
						title={t('maintenance.erpIntegration.servicesEdit.query.resultTitle', 'Resultado da Consulta')}
						maxWidthClassName="max-w-6xl"
						bodyScrollable={false}
						onClose={() => setQueryResultOpen(false)}
					>
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									className={
										queryResultMode === 'json'
											? 'app-button-primary rounded-full px-4 py-2 text-sm font-semibold'
											: 'app-button-secondary rounded-full px-4 py-2 text-sm font-semibold'
									}
									onClick={() => setQueryResultMode('json')}
								>
									Json
								</button>
								<button
									type="button"
									className={
										queryResultMode === 'grid'
											? 'app-button-primary rounded-full px-4 py-2 text-sm font-semibold'
											: 'app-button-secondary rounded-full px-4 py-2 text-sm font-semibold'
									}
									onClick={() => setQueryResultMode('grid')}
								>
									Grid
								</button>
							</div>
							{queryResult ? (
								queryResultMode === 'json' ? (
									<pre className="app-control-muted h-[min(70vh,640px)] overflow-auto rounded-2xl p-4 text-sm">{JSON.stringify(queryResult.raw, null, 2)}</pre>
								) : (
									<DynamicResultGrid
										rows={queryResult.rows}
										emptyMessage={t('maintenance.erpIntegration.servicesEdit.query.resultEmpty', 'Nenhum registro retornado pela query.')}
										maxColumns={60}
										maxHeightClassName="h-[min(70vh,640px)]"
									/>
								)
							) : null}
						</div>
					</OverlayModal>

					<OverlayModal
						open={configHistoryOpen}
						title={t('maintenance.erpIntegration.servicesEdit.configurationLogsTitle', 'Logs da Configuração')}
						maxWidthClassName="max-w-5xl"
						onClose={() => setConfigHistoryOpen(false)}
					>
						<AsyncState isLoading={configHistoryState.isLoading} error={configHistoryState.error}>
							<div className="space-y-3">
								{(configHistoryState.data?.data ?? []).map((record) => (
									<div key={record.id} className="rounded-2xl border border-line/40 px-4 py-4">
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div>
												<div className="text-(--app-text) font-semibold">
													#{record.id} • {record.usuario}
												</div>
												<div className="text-(--app-muted) mt-1 text-sm">{record.dataHora}</div>
												<div className="text-(--app-muted) mt-2 text-sm leading-6">{record.motivo}</div>
											</div>
										</div>
										<div className="app-control-muted mt-4 rounded-2xl px-4 py-3 text-sm leading-6 text-(--app-text)" dangerouslySetInnerHTML={{ __html: record.diff }} />
									</div>
								))}
								{!(configHistoryState.data?.data ?? []).length ? (
									<div className="text-(--app-muted) rounded-2xl border border-dashed px-4 py-5 text-sm">
										{t('maintenance.erpIntegration.servicesEdit.configurationLogsEmpty', 'Nenhum log de configuração encontrado para este serviço.')}
									</div>
								) : null}
							</div>
						</AsyncState>
					</OverlayModal>

					<OverlayModal
						open={Boolean(selectedExecution)}
						title={t('maintenance.erpIntegration.servicesEdit.executions.detailsTitle', 'Detalhes do Serviço de Execução')}
						maxWidthClassName="max-w-7xl"
						onClose={() => setSelectedExecution(null)}
					>
						<AsyncState isLoading={executionDetailsState.isLoading} error={executionDetailsState.error}>
							<AppDataTable<IntegracaoComErpServicoExecutionDetailRecord, never, never>
								rows={executionDetailsState.data?.data ?? []}
								getRowId={(row) => row.id}
								emptyMessage={t('maintenance.erpIntegration.servicesEdit.executions.detailsEmpty', 'Nenhum detalhe operacional encontrado para esta execução.')}
								columns={executionDetailColumns}
								mobileCard={{
									title: (row) => `#${row.id} • ${row.tipoDetalhe}`,
									subtitle: (row) => row.detalhe,
									meta: (row) => `${row.dataHoraInicio} • ${row.tempoExecucao}`,
									badges: (row) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
								}}
								rowActions={(row) => [
									{
										id: 'view-detail',
										label: t('maintenance.erpIntegration.servicesEdit.executions.actions.viewScript', 'Visualizar script'),
										icon: Eye,
										onClick: () => void handleShowExecutionContent(row, 'detail'),
										visible: row.hasDetailContent,
									},
									{
										id: 'view-metadata',
										label: t('maintenance.erpIntegration.services.actions.failureReason', 'Motivo da falha'),
										icon: Info,
										onClick: () => void handleShowExecutionContent(row, 'metadata'),
										visible: row.hasMetadataContent,
									},
								]}
								actionsColumnClassName="w-[110px]"
								pagination={executionDetailsState.data?.meta}
								onPageChange={(page) => setExecutionDetailsPagination((current) => ({ ...current, page }))}
								pageSize={{
									value: executionDetailsPagination.perPage,
									options: [10],
									onChange: (perPage) => setExecutionDetailsPagination({ page: 1, perPage }),
								}}
							/>
						</AsyncState>
					</OverlayModal>

					<OverlayModal
						open={Boolean(executionLogModal)}
						title={executionLogModal?.title || 'Conteúdo da execução'}
						maxWidthClassName="max-w-5xl"
						onClose={() => setExecutionLogModal(null)}
					>
						{executionLogModal ? (
							<div className="space-y-3">
								{executionLogModal.fileName ? (
									<div className="text-sm text-(--app-text)">
										<strong>Arquivo:</strong> {executionLogModal.fileName}
									</div>
								) : null}
								<pre className="app-control-muted max-h-[70vh] overflow-auto rounded-2xl p-4 text-sm whitespace-pre-wrap">{executionLogModal.content}</pre>
							</div>
						) : null}
					</OverlayModal>

					<OverlayModal
						open={Boolean(failureModal)}
						title={t('maintenance.erpIntegration.services.actions.failureReason', 'Motivo da falha')}
						maxWidthClassName="max-w-3xl"
						onClose={() => setFailureModal(null)}
					>
						{failureModal ? (
							<div className="space-y-4">
								<DetailStat label={t('maintenance.erpIntegration.servicesEdit.executions.failureStep', 'Etapa')} value={failureModal.step} />
								<div className="rounded-2xl border border-line/40 px-4 py-4 text-sm leading-6 text-(--app-text)">{failureModal.message}</div>
							</div>
						) : null}
					</OverlayModal>
				</>
			) : null}
		</AsyncState>
	);
}
