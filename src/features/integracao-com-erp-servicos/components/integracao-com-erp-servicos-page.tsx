'use client';

import { Info, Pencil, Play, Plus, RefreshCcw, RotateCw, ToggleRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppDataTable } from '@/src/components/data-table/app-data-table';
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters';
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar';
import type { AppDataTableColumn } from '@/src/components/data-table/types';
import { useDataTableState } from '@/src/components/data-table/use-data-table-state';
import { AsyncState } from '@/src/components/ui/async-state';
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { integracaoComErpServicosClient } from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-client';
import type {
	IntegracaoComErpServicoRecord,
	IntegracaoComErpServicosFilters,
	IntegracaoComErpServicosResponse,
} from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-types';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';

const DEFAULT_FILTERS: IntegracaoComErpServicosFilters = {
	page: 1,
	perPage: 15,
	orderBy: 'dthr_proxima_execucao',
	sort: 'asc',
	id: '',
	nome: '',
	intervalo: '',
	status: '',
};

const DEFAULT_INACTIVE_FILTERS: IntegracaoComErpServicosFilters = {
	page: 1,
	perPage: 10,
	orderBy: 'id_servico',
	sort: 'asc',
	id: '',
	nome: '',
	intervalo: '',
	status: '',
};

const EMPTY_RESPONSE: IntegracaoComErpServicosResponse = {
	data: [],
	meta: {
		total: 0,
		from: 0,
		to: 0,
		page: 1,
		pages: 1,
		perPage: 10,
	},
};

type ToastState = {
	tone: 'success' | 'error';
	message: string;
};

type ConfirmState = {
	kind: 'execute' | 'reload';
	ids: string[];
} | null;

function MetadataPanel({ record, t }: { record: IntegracaoComErpServicoRecord; t: ReturnType<typeof useI18n>['t'] }) {
	if (!record.metadataEntries.length) {
		return (
			<div className="app-pane-muted rounded-2xl border border-dashed px-4 py-6 text-center text-(--app-muted) text-sm">
				{t('maintenance.erpIntegration.services.metadata.empty', 'Nenhuma metadata disponível para este serviço.')}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{record.metadataEntries.map((entry) => (
				<div key={`${entry.label}-${entry.value}`} className="rounded-2xl border border-line/40 px-4 py-3">
					<div className="text-(--app-muted) text-xs font-semibold uppercase tracking-[0.14em]">{entry.label}</div>
					<div className="mt-2 whitespace-pre-wrap wrap-break-word text-(--app-text) text-sm leading-6">{entry.value}</div>
				</div>
			))}
		</div>
	);
}

export function IntegracaoComErpServicosPage() {
	const { t } = useI18n();
	const auth = useAuth();
	const access = useFeatureAccess('erpServicos');
	const isMaster = Boolean(auth.user?.master);
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [filters, setFilters] = useState<IntegracaoComErpServicosFilters>(DEFAULT_FILTERS);
	const [filtersDraft, setFiltersDraft] = useState<IntegracaoComErpServicosFilters>(DEFAULT_FILTERS);
	const [inactiveOpen, setInactiveOpen] = useState(false);
	const [inactiveFiltersExpanded, setInactiveFiltersExpanded] = useState(false);
	const [inactiveFilters, setInactiveFilters] = useState<IntegracaoComErpServicosFilters>(DEFAULT_INACTIVE_FILTERS);
	const [inactiveFiltersDraft, setInactiveFiltersDraft] = useState<IntegracaoComErpServicosFilters>(DEFAULT_INACTIVE_FILTERS);
	const [metadataTarget, setMetadataTarget] = useState<IntegracaoComErpServicoRecord | null>(null);
	const [activateTarget, setActivateTarget] = useState<IntegracaoComErpServicoRecord | null>(null);
	const [activationReason, setActivationReason] = useState('');
	const [confirmState, setConfirmState] = useState<ConfirmState>(null);
	const [toast, setToast] = useState<ToastState | null>(null);

	const servicesState = useAsyncData(() => integracaoComErpServicosClient.list(filters), [filters]);
	const inactiveState = useAsyncData(
		() => (inactiveOpen ? integracaoComErpServicosClient.listInactive(inactiveFilters) : Promise.resolve(EMPTY_RESPONSE)),
		[inactiveOpen, inactiveFilters],
	);
	const rows = servicesState.data?.data ?? [];
	const inactiveRows = inactiveState.data?.data ?? [];

	const tableState = useDataTableState<IntegracaoComErpServicoRecord, IntegracaoComErpServicosFilters, IntegracaoComErpServicosFilters['orderBy']>({
		rows,
		getRowId: (row) => row.id,
		filters,
		setFilters,
		setFiltersDraft,
		selectableRowIds: rows.map((row) => row.id),
	});

	const inactiveTableState = useDataTableState<IntegracaoComErpServicoRecord, IntegracaoComErpServicosFilters, IntegracaoComErpServicosFilters['orderBy']>({
		rows: inactiveRows,
		getRowId: (row) => row.id,
		filters: inactiveFilters,
		setFilters: setInactiveFilters,
		setFiltersDraft: setInactiveFiltersDraft,
	});

	const statusOptions = useMemo(
		() => [
			{ value: 'ok', label: t('maintenance.erpIntegration.services.status.ok', 'OK') },
			{ value: 'warning', label: t('maintenance.erpIntegration.services.status.warning', 'Alerta') },
			{ value: 'bad', label: t('maintenance.erpIntegration.services.status.bad', 'Falha') },
			{ value: 'working', label: t('maintenance.erpIntegration.services.status.working', 'Em Execução') },
			{ value: 'void', label: t('maintenance.erpIntegration.services.status.void', 'Inativo') },
		],
		[t],
	);

	const columns = useMemo(
		() =>
			[
				{
					id: 'id',
					label: t('maintenance.erpIntegration.services.fields.id', 'ID'),
					sortKey: 'id_servico',
					thClassName: 'w-[96px]',
					cell: (row: IntegracaoComErpServicoRecord) => <span className="font-semibold text-(--app-text)">{row.idServico}</span>,
					filter: {
						kind: 'text',
						id: 'id',
						key: 'id',
						label: t('maintenance.erpIntegration.services.fields.id', 'ID'),
					},
				},
				{
					id: 'nome',
					label: t('maintenance.erpIntegration.services.fields.name', 'Nome'),
					sortKey: 'servico.nome',
					thClassName: 'min-w-[280px]',
					cell: (row: IntegracaoComErpServicoRecord) => (
						<div className="space-y-2">
							<div className="font-semibold text-(--app-text)">{row.nome}</div>
							{isMaster ? (
								<div className="flex flex-wrap gap-2 text-xs">
									<StatusBadge tone="info">{row.caracteristicas.natureza.label}</StatusBadge>
									{row.caracteristicas.motorExecucao.key !== 'hibrido' ? <StatusBadge tone="neutral">{row.caracteristicas.motorExecucao.label}</StatusBadge> : null}
									<StatusBadge tone="neutral">{row.caracteristicas.tipoServico.label}</StatusBadge>
									{row.caracteristicas.motorExecucao.inferred ? (
										<StatusBadge tone="warning">{t('maintenance.erpIntegration.services.labels.inferredExecution', 'Execução inferida')}</StatusBadge>
									) : null}
								</div>
							) : null}
						</div>
					),
					filter: {
						kind: 'text',
						id: 'nome',
						key: 'nome',
						label: t('maintenance.erpIntegration.services.fields.name', 'Nome'),
					},
				},
				{
					id: 'intervalo',
					label: t('maintenance.erpIntegration.services.fields.interval', 'Intervalo'),
					sortKey: 'intervalo_execucao',
					visibility: 'lg',
					thClassName: 'w-[120px]',
					cell: (row: IntegracaoComErpServicoRecord) => row.intervaloExecucao || '-',
					filter: {
						kind: 'select',
						id: 'intervalo',
						key: 'intervalo',
						label: t('maintenance.erpIntegration.services.fields.interval', 'Intervalo'),
						options: [1, 2, 5, 10, 30, 60, 120].map((value) => ({ value: String(value), label: `${value} min` })),
					},
				},
				{
					id: 'ultimaExecucao',
					label: t('maintenance.erpIntegration.services.fields.lastExecution', 'Última Execução'),
					sortKey: 'dthr_ultima_execucao',
					visibility: 'xl',
					thClassName: 'w-[180px]',
					cell: (row: IntegracaoComErpServicoRecord) => row.ultimaExecucao,
				},
				{
					id: 'proximaExecucao',
					label: t('maintenance.erpIntegration.services.fields.nextExecution', 'Próxima Execução'),
					sortKey: 'dthr_proxima_execucao',
					visibility: 'xl',
					thClassName: 'w-[180px]',
					cell: (row: IntegracaoComErpServicoRecord) => row.proximaExecucao,
				},
				{
					id: 'status',
					label: t('maintenance.erpIntegration.services.fields.status', 'Status'),
					sortKey: 'status',
					thClassName: 'w-[160px]',
					cell: (row: IntegracaoComErpServicoRecord) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
					filter: {
						kind: 'select',
						id: 'status',
						key: 'status',
						label: t('maintenance.erpIntegration.services.fields.status', 'Status'),
						options: statusOptions,
					},
				},
			] satisfies AppDataTableColumn<IntegracaoComErpServicoRecord, IntegracaoComErpServicosFilters>[],
		[isMaster, statusOptions, t],
	);

	function patchDraft<K extends keyof IntegracaoComErpServicosFilters>(key: K, value: IntegracaoComErpServicosFilters[K]) {
		setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }));
	}

	function patchInactiveDraft<K extends keyof IntegracaoComErpServicosFilters>(key: K, value: IntegracaoComErpServicosFilters[K]) {
		setInactiveFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }));
	}

	async function reloadLists() {
		await servicesState.reload();
		if (inactiveOpen) {
			await inactiveState.reload();
		}
	}

	async function handleCommand(kind: 'execute' | 'reload', ids: string[]) {
		try {
			const result = kind === 'reload' ? await integracaoComErpServicosClient.reload(ids) : await integracaoComErpServicosClient.execute(ids);
			setToast({ tone: 'success', message: result.message });
			tableState.clearSelection();
			setConfirmState(null);
			await reloadLists();
		} catch (error) {
			setToast({
				tone: 'error',
				message:
					error instanceof Error ? error.message : t('maintenance.erpIntegration.modules.services.feedback.commandError', 'Não foi possível enviar o comando ao integrador.'),
			});
		}
	}

	async function handleActivate() {
		if (!activateTarget) {
			return;
		}

		try {
			const result = await integracaoComErpServicosClient.activate(activateTarget.id, activationReason);
			setToast({ tone: 'success', message: result.message });
			setActivateTarget(null);
			setActivationReason('');
			await reloadLists();
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : t('maintenance.erpIntegration.modules.services.feedback.activateError', 'Não foi possível ativar o serviço selecionado.'),
			});
		}
	}

	if (!access.canList) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.modules.services.title', 'Serviços')} backHref="/dashboard" />;
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
					{ label: t('maintenance.erpIntegration.modules.services.title', 'Serviços'), href: '/integracao-com-erp/servicos' },
				]}
				actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={servicesState.reload} />}
			/>

			<AsyncState isLoading={servicesState.isLoading} error={servicesState.error}>
				<SectionCard
					action={
						<div className="flex w-full items-center justify-between gap-3">
							<DataTableFilterToggleAction
								expanded={filtersExpanded}
								onClick={() => setFiltersExpanded((current) => !current)}
								collapsedLabel={t('filters.button', 'Filtros')}
								expandedLabel={t('filters.hide', 'Ocultar filtros')}
							/>
							<DataTablePageActions
								actions={[
									access.canEdit && isMaster
										? {
												label: t('maintenance.erpIntegration.services.actions.createService', 'Criar Serviço'),
												icon: Plus,
												href: '/integracao-com-erp/servicos/novo',
												tone: 'primary',
											}
										: null,
									isMaster
										? {
												label: t('maintenance.erpIntegration.services.actions.activate', 'Ativar Serviço'),
												icon: ToggleRight,
												onClick: () => setInactiveOpen(true),
												tone: 'primary',
											}
										: null,
									access.canEdit && tableState.selectedIds.length > 0
										? {
												label: t('maintenance.erpIntegration.services.actions.executeSelected', 'Executar selecionados'),
												icon: Play,
												onClick: () => setConfirmState({ kind: 'execute', ids: tableState.selectedIds }),
												tone: 'secondary',
											}
										: null,
									access.canEdit && isMaster && tableState.selectedIds.length > 0
										? {
												label: t('maintenance.erpIntegration.services.actions.reloadSelected', 'Recarregar selecionados'),
												icon: RotateCw,
												onClick: () => setConfirmState({ kind: 'reload', ids: tableState.selectedIds }),
												tone: 'danger',
											}
										: null,
								]}
							/>
						</div>
					}
				>
					<DataTableFiltersCard
						variant="embedded"
						columns={columns as AppDataTableColumn<unknown, IntegracaoComErpServicosFilters>[]}
						draft={filtersDraft}
						applied={filters}
						expanded={filtersExpanded}
						onToggleExpanded={() => setFiltersExpanded((current) => !current)}
						onApply={() => setFilters(filtersDraft)}
						onClear={() => {
							setFilters(DEFAULT_FILTERS);
							setFiltersDraft(DEFAULT_FILTERS);
						}}
						patchDraft={patchDraft}
					/>

					<AppDataTable<IntegracaoComErpServicoRecord, IntegracaoComErpServicosFilters['orderBy'], IntegracaoComErpServicosFilters>
						rows={rows}
						getRowId={(row) => row.id}
						emptyMessage={t('maintenance.erpIntegration.services.empty', 'Nenhum serviço ERP encontrado com os filtros atuais.')}
						columns={columns}
						selectable={access.canEdit}
						selectedIds={tableState.selectedIds}
						allSelected={tableState.allSelected}
						onToggleSelect={tableState.toggleSelection}
						onToggleSelectAll={tableState.toggleSelectAll}
						sort={{
							activeColumn: filters.orderBy,
							direction: filters.sort,
							onToggle: tableState.toggleSort,
						}}
						mobileCard={{
							title: (row) => row.nome,
							subtitle: (row) => `${t('maintenance.erpIntegration.services.fields.id', 'ID')}: ${row.idServico}`,
							meta: (row) => `${t('maintenance.erpIntegration.services.fields.nextExecution', 'Próxima Execução')}: ${row.proximaExecucao}`,
							badges: (row) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
						}}
						rowActions={(row) => [
							{
								id: 'execute',
								label: t('maintenance.erpIntegration.services.actions.execute', 'Executar'),
								icon: Play,
								onClick: () => setConfirmState({ kind: 'execute', ids: [row.id] }),
								visible: access.canEdit,
							},
							{
								id: 'reload',
								label: t('maintenance.erpIntegration.services.actions.reload', 'Recarregar'),
								icon: RotateCw,
								onClick: () => setConfirmState({ kind: 'reload', ids: [row.id] }),
								visible: access.canEdit && isMaster,
								tone: 'danger',
							},
							{
								id: 'metadata',
								label: t('maintenance.erpIntegration.services.actions.failureReason', 'Motivo da falha'),
								icon: Info,
								onClick: () => setMetadataTarget(row),
								visible: isMaster && row.status === 'bad' && row.metadataEntries.length > 0,
							},
							{
								id: 'edit',
								label: t('maintenance.erpIntegration.services.actions.edit', 'Editar'),
								icon: Pencil,
								href: `/integracao-com-erp/servicos/${row.idServico}/editar`,
							},
						]}
						actionsColumnClassName="w-[176px]"
						pagination={servicesState.data?.meta}
						onPageChange={tableState.setPage}
						pageSize={{
							value: filters.perPage,
							options: [15, 30, 45, 60],
							onChange: (perPage) => {
								const next = { ...filters, perPage, page: 1 };
								setFilters(next);
								setFiltersDraft(next);
							},
						}}
					/>
				</SectionCard>
			</AsyncState>

			<OverlayModal
				open={Boolean(metadataTarget)}
				title={t('maintenance.erpIntegration.services.metadata.title', 'Metadata')}
				maxWidthClassName="max-w-3xl"
				onClose={() => setMetadataTarget(null)}
			>
				{metadataTarget ? <MetadataPanel record={metadataTarget} t={t} /> : null}
			</OverlayModal>

			<OverlayModal
				open={inactiveOpen}
				title={t('maintenance.erpIntegration.services.inactive.title', 'Ativar Serviço')}
				maxWidthClassName="max-w-6xl"
				onClose={() => {
					setInactiveOpen(false);
					setInactiveFiltersExpanded(false);
				}}
			>
				<div className="space-y-5">
					<p className="text-(--app-muted) text-sm leading-6">
						{t(
							'maintenance.erpIntegration.services.inactive.description',
							'Consulte os serviços inativos do tenant atual e reative os itens necessários com justificativa operacional.',
						)}
					</p>
					<SectionCard
						action={
							<div className="flex w-full items-center justify-between gap-3">
								<DataTableFilterToggleAction
									expanded={inactiveFiltersExpanded}
									onClick={() => setInactiveFiltersExpanded((current) => !current)}
									collapsedLabel={t('filters.button', 'Filtros')}
									expandedLabel={t('filters.hide', 'Ocultar filtros')}
								/>
							</div>
						}
					>
						<DataTableFiltersCard
							variant="embedded"
							columns={columns as AppDataTableColumn<unknown, IntegracaoComErpServicosFilters>[]}
							draft={inactiveFiltersDraft}
							applied={inactiveFilters}
							expanded={inactiveFiltersExpanded}
							onToggleExpanded={() => setInactiveFiltersExpanded((current) => !current)}
							onApply={() => setInactiveFilters(inactiveFiltersDraft)}
							onClear={() => {
								setInactiveFilters(DEFAULT_INACTIVE_FILTERS);
								setInactiveFiltersDraft(DEFAULT_INACTIVE_FILTERS);
							}}
							patchDraft={patchInactiveDraft}
						/>
						<AsyncState isLoading={inactiveState.isLoading} error={inactiveState.error}>
							<AppDataTable<IntegracaoComErpServicoRecord, IntegracaoComErpServicosFilters['orderBy'], IntegracaoComErpServicosFilters>
								rows={inactiveRows}
								getRowId={(row) => row.id}
								emptyMessage={t('maintenance.erpIntegration.services.inactive.empty', 'Nenhum serviço inativo encontrado com os filtros atuais.')}
								columns={columns}
								sort={{
									activeColumn: inactiveFilters.orderBy,
									direction: inactiveFilters.sort,
									onToggle: inactiveTableState.toggleSort,
								}}
								mobileCard={{
									title: (row) => row.nome,
									subtitle: (row) => `${t('maintenance.erpIntegration.services.fields.id', 'ID')}: ${row.idServico}`,
									meta: (row) => `${t('maintenance.erpIntegration.services.fields.status', 'Status')}: ${row.statusLabel}`,
									badges: (row) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
								}}
								rowActions={(row) => [
									{
										id: 'activate',
										label: t('maintenance.erpIntegration.services.actions.activate', 'Ativar'),
										icon: ToggleRight,
										onClick: () => {
											setActivateTarget(row);
											setActivationReason('');
										},
									},
								]}
								actionsColumnClassName="w-[88px]"
								pagination={inactiveState.data?.meta}
								onPageChange={inactiveTableState.setPage}
								pageSize={{
									value: inactiveFilters.perPage,
									options: [10, 20, 40],
									onChange: (perPage) => {
										const next = { ...inactiveFilters, perPage, page: 1 };
										setInactiveFilters(next);
										setInactiveFiltersDraft(next);
									},
								}}
							/>
						</AsyncState>
					</SectionCard>
				</div>
			</OverlayModal>

			<OverlayModal
				open={Boolean(activateTarget)}
				title={t('maintenance.erpIntegration.services.inactive.activateTitle', 'Confirmar ativação do serviço')}
				maxWidthClassName="max-w-2xl"
				onClose={() => {
					setActivateTarget(null);
					setActivationReason('');
				}}
			>
				<div className="space-y-4">
					<p className="text-(--app-muted) text-sm leading-6">
						{t(
							'maintenance.erpIntegration.services.inactive.activateDescription',
							'Informe o motivo da ativação. Esse registro ficará associado à alteração da configuração do serviço.',
						)}
					</p>
					<div className="rounded-2xl border border-line/40 px-4 py-3">
						<div className="text-(--app-muted) text-xs font-semibold uppercase tracking-[0.14em]">{activateTarget?.nome}</div>
						<div className="mt-1 text-(--app-muted) text-sm">#{activateTarget?.idServico}</div>
					</div>
					<label className="block space-y-2">
						<span className="text-(--app-text) text-sm font-semibold">{t('maintenance.erpIntegration.services.fields.reason', 'Motivo')}</span>
						<textarea
							value={activationReason}
							onChange={(event) => setActivationReason(event.target.value)}
							maxLength={255}
							rows={4}
							className="app-textarea min-h-28 w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm outline-none"
							placeholder={t('maintenance.erpIntegration.services.inactive.reasonPlaceholder', 'Ativação solicitada pelo time operacional.')}
						/>
					</label>
					<div className="flex justify-end gap-3">
						<button type="button" className="app-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold" onClick={() => setActivateTarget(null)}>
							{t('common.cancel', 'Cancelar')}
						</button>
						<button type="button" className="app-button-primary rounded-full px-4 py-2.5 text-sm font-semibold" onClick={() => void handleActivate()}>
							{t('maintenance.erpIntegration.services.actions.activate', 'Ativar')}
						</button>
					</div>
				</div>
			</OverlayModal>

			<ConfirmDialog
				open={Boolean(confirmState)}
				title={
					confirmState?.kind === 'reload'
						? t('maintenance.erpIntegration.services.confirm.reloadTitle', 'Confirmar recarga completa?')
						: t('maintenance.erpIntegration.services.confirm.executeTitle', 'Confirmar execução imediata?')
				}
				description={
					confirmState?.kind === 'reload'
						? t(
								'maintenance.erpIntegration.services.confirm.reloadDescription',
								'Os serviços selecionados receberão um comando de carga completa. Essa ação não pode ser desfeita.',
							)
						: t(
								'maintenance.erpIntegration.services.confirm.executeDescription',
								'Os serviços selecionados receberão um comando de execução imediata. Essa ação não pode ser desfeita.',
							)
				}
				confirmLabel={
					confirmState?.kind === 'reload'
						? t('maintenance.erpIntegration.services.actions.reload', 'Recarregar')
						: t('maintenance.erpIntegration.services.actions.execute', 'Executar')
				}
				tone={confirmState?.kind === 'reload' ? 'danger' : 'default'}
				onCancel={() => setConfirmState(null)}
				onConfirm={() => {
					if (confirmState) {
						void handleCommand(confirmState.kind, confirmState.ids);
					}
				}}
			/>

			{toast ? <PageToast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}
		</div>
	);
}
