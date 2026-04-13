'use client';

import { Info, Play, RefreshCcw, RotateCw } from 'lucide-react';
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
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { integracaoComErpServicosComFalhaClient } from '@/src/features/integracao-com-erp-servicos-com-falha/services/integracao-com-erp-servicos-com-falha-client';
import type {
	IntegracaoComErpServicoComFalhaRecord,
	IntegracaoComErpServicosComFalhaFilters,
} from '@/src/features/integracao-com-erp-servicos-com-falha/services/integracao-com-erp-servicos-com-falha-types';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';

const DEFAULT_FILTERS: IntegracaoComErpServicosComFalhaFilters = {
	page: 1,
	perPage: 15,
	orderBy: 'data_hora',
	sort: 'desc',
	id: '',
	nome: '',
	empresa: '',
	intervalo: '',
	idExecucao: '',
};

type ToastState = {
	tone: 'success' | 'error';
	message: string;
};

type ConfirmState = {
	kind: 'execute' | 'reload';
	ids: string[];
} | null;

function MetadataPanel({ record, t }: { record: IntegracaoComErpServicoComFalhaRecord; t: ReturnType<typeof useI18n>['t'] }) {
	if (!record.metadataEntries.length) {
		return (
			<div className="app-pane-muted rounded-[1rem] border border-dashed px-4 py-6 text-center text-sm text-[color:var(--app-muted)]">
				{t('maintenance.erpIntegration.failedServices.metadata.empty', 'Nenhuma metadata disponível para esta falha.')}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{record.metadataEntries.map((entry) => (
				<div key={`${entry.label}-${entry.value}`} className="rounded-[1rem] border border-line/40 px-4 py-3">
					<div className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{entry.label}</div>
					<div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--app-text)]">{entry.value}</div>
				</div>
			))}
		</div>
	);
}

export function IntegracaoComErpServicosComFalhaPage() {
	const { t } = useI18n();
	const access = useFeatureAccess('erpServicosFalha');
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [filters, setFilters] = useState<IntegracaoComErpServicosComFalhaFilters>(DEFAULT_FILTERS);
	const [filtersDraft, setFiltersDraft] = useState<IntegracaoComErpServicosComFalhaFilters>(DEFAULT_FILTERS);
	const [metadataTarget, setMetadataTarget] = useState<IntegracaoComErpServicoComFalhaRecord | null>(null);
	const [confirmState, setConfirmState] = useState<ConfirmState>(null);
	const [toast, setToast] = useState<ToastState | null>(null);
	const failuresState = useAsyncData(() => integracaoComErpServicosComFalhaClient.list(filters), [filters]);
	const rows = failuresState.data?.data ?? [];

	const tableState = useDataTableState<IntegracaoComErpServicoComFalhaRecord, IntegracaoComErpServicosComFalhaFilters, IntegracaoComErpServicosComFalhaFilters['orderBy']>({
		rows,
		getRowId: (row) => row.id,
		filters,
		setFilters,
		setFiltersDraft,
		selectableRowIds: rows.map((row) => row.id),
	});

	const columns = useMemo(
		() =>
			[
				{
					id: 'serviceId',
					label: t('maintenance.erpIntegration.failedServices.fields.id', 'ID Serviço'),
					sortKey: 'id_servico',
					thClassName: 'w-[120px]',
					cell: (row: IntegracaoComErpServicoComFalhaRecord) => <span className="font-semibold text-[color:var(--app-text)]">{row.serviceId}</span>,
					filter: {
						kind: 'text',
						id: 'id',
						key: 'id',
						label: t('maintenance.erpIntegration.failedServices.fields.id', 'ID Serviço'),
					},
				},
				{
					id: 'serviceName',
					label: t('maintenance.erpIntegration.failedServices.fields.name', 'Serviço'),
					sortKey: 'nome_servico',
					thClassName: 'min-w-[240px]',
					cell: (row: IntegracaoComErpServicoComFalhaRecord) => <span className="font-semibold text-[color:var(--app-text)]">{row.serviceName}</span>,
					filter: {
						kind: 'text',
						id: 'nome',
						key: 'nome',
						label: t('maintenance.erpIntegration.failedServices.fields.name', 'Serviço'),
					},
				},
				{
					id: 'companyName',
					label: t('maintenance.erpIntegration.failedServices.fields.company', 'Empresa'),
					sortKey: 'nome_fantasia',
					visibility: 'lg',
					cell: (row: IntegracaoComErpServicoComFalhaRecord) => row.companyName || '-',
					filter: {
						kind: 'text',
						id: 'empresa',
						key: 'empresa',
						label: t('maintenance.erpIntegration.failedServices.fields.company', 'Empresa'),
					},
				},
				{
					id: 'interval',
					label: t('maintenance.erpIntegration.failedServices.fields.interval', 'Intervalo'),
					sortKey: 'intervalo_execucao',
					visibility: 'lg',
					thClassName: 'w-[120px]',
					cell: (row: IntegracaoComErpServicoComFalhaRecord) => row.intervaloExecucao || '-',
					filter: {
						kind: 'text',
						id: 'intervalo',
						key: 'intervalo',
						label: t('maintenance.erpIntegration.failedServices.fields.interval', 'Intervalo'),
					},
				},
				{
					id: 'executionId',
					label: t('maintenance.erpIntegration.failedServices.fields.executionId', 'ID Execução'),
					sortKey: 'id_servico_execucao',
					visibility: 'xl',
					thClassName: 'w-[150px]',
					cell: (row: IntegracaoComErpServicoComFalhaRecord) => row.executionId || '-',
					filter: {
						kind: 'text',
						id: 'idExecucao',
						key: 'idExecucao',
						label: t('maintenance.erpIntegration.failedServices.fields.executionId', 'ID Execução'),
					},
				},
				{
					id: 'firstFailureAt',
					label: t('maintenance.erpIntegration.failedServices.fields.firstFailure', 'Primeira Falha'),
					sortKey: 'data_hora',
					visibility: 'xl',
					thClassName: 'w-[180px]',
					cell: (row: IntegracaoComErpServicoComFalhaRecord) => row.firstFailureAt,
				},
				{
					id: 'attempts',
					label: t('maintenance.erpIntegration.failedServices.fields.attempts', 'Tentativas'),
					sortKey: 'tentativas',
					thClassName: 'w-[120px]',
					tdClassName: 'text-right',
					cell: (row: IntegracaoComErpServicoComFalhaRecord) => row.attempts,
				},
			] satisfies AppDataTableColumn<IntegracaoComErpServicoComFalhaRecord, IntegracaoComErpServicosComFalhaFilters>[],
		[t],
	);

	function patchDraft<K extends keyof IntegracaoComErpServicosComFalhaFilters>(key: K, value: IntegracaoComErpServicosComFalhaFilters[K]) {
		setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }));
	}

	async function handleCommand(kind: 'execute' | 'reload', ids: string[]) {
		try {
			const result = kind === 'reload' ? await integracaoComErpServicosComFalhaClient.reload(ids) : await integracaoComErpServicosComFalhaClient.execute(ids);
			setToast({ tone: 'success', message: result.message });
			tableState.clearSelection();
			setConfirmState(null);
			await failuresState.reload();
		} catch (error) {
			setToast({
				tone: 'error',
				message:
					error instanceof Error ? error.message : t('maintenance.erpIntegration.modules.failedServices.feedback.commandError', 'Não foi possível enviar o comando ao integrador.'),
			});
		}
	}

	if (!access.canList) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.modules.failedServices.title', 'Serviços com Falha')} backHref="/dashboard" />;
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
					{ label: t('maintenance.erpIntegration.modules.failedServices.title', 'Serviços com Falha'), href: '/integracao-com-erp/servicos-com-falha' },
				]}
				actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={failuresState.reload} />}
			/>

			<AsyncState isLoading={failuresState.isLoading} error={failuresState.error}>
				<SectionCard
					title={t('maintenance.erpIntegration.modules.failedServices.title', 'Serviços com Falha')}
					description={t(
						'maintenance.erpIntegration.modules.failedServices.description',
						'Acompanhe a fila de falhas dos serviços ERP e reenfileire execuções imediatas ou cargas completas quando necessário.',
					)}
					action={
						<div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
							<DataTableFilterToggleAction
								expanded={filtersExpanded}
								onClick={() => setFiltersExpanded((current) => !current)}
								collapsedLabel={t('filters.button', 'Filtros')}
								expandedLabel={t('filters.hide', 'Ocultar filtros')}
							/>
							<DataTablePageActions
								actions={[
									access.canEdit
										? {
												label: t('maintenance.erpIntegration.failedServices.actions.executeSelected', 'Executar selecionados'),
												icon: Play,
												onClick: () => setConfirmState({ kind: 'execute', ids: tableState.selectedIds }),
												tone: 'secondary',
												disabled: tableState.selectedIds.length === 0,
											}
										: null,
									access.canEdit
										? {
												label: t('maintenance.erpIntegration.failedServices.actions.reloadSelected', 'Recarregar selecionados'),
												icon: RotateCw,
												onClick: () => setConfirmState({ kind: 'reload', ids: tableState.selectedIds }),
												tone: 'danger',
												disabled: tableState.selectedIds.length === 0,
											}
										: null,
								]}
							/>
						</div>
					}
				>
					<DataTableFiltersCard
						variant="embedded"
						columns={columns as AppDataTableColumn<unknown, IntegracaoComErpServicosComFalhaFilters>[]}
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

					<AppDataTable<IntegracaoComErpServicoComFalhaRecord, IntegracaoComErpServicosComFalhaFilters['orderBy'], IntegracaoComErpServicosComFalhaFilters>
						rows={rows}
						getRowId={(row) => row.id}
						emptyMessage={t('maintenance.erpIntegration.failedServices.empty', 'Nenhum serviço com falha encontrado com os filtros atuais.')}
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
							title: (row) => row.serviceName,
							subtitle: (row) => row.companyName,
							meta: (row) => `${t('maintenance.erpIntegration.failedServices.fields.firstFailure', 'Primeira Falha')}: ${row.firstFailureAt}`,
						}}
						rowActions={(row) => [
							{
								id: 'metadata',
								label: t('maintenance.erpIntegration.failedServices.actions.metadata', 'Metadata'),
								icon: Info,
								onClick: () => setMetadataTarget(row),
								visible: row.metadataEntries.length > 0 || Boolean(row.metadataRaw),
							},
							{
								id: 'execute',
								label: t('maintenance.erpIntegration.failedServices.actions.execute', 'Executar'),
								icon: Play,
								onClick: () => setConfirmState({ kind: 'execute', ids: [row.id] }),
								visible: access.canEdit,
							},
							{
								id: 'reload',
								label: t('maintenance.erpIntegration.failedServices.actions.reload', 'Recarregar'),
								icon: RotateCw,
								onClick: () => setConfirmState({ kind: 'reload', ids: [row.id] }),
								visible: access.canEdit,
								tone: 'danger',
							},
						]}
						actionsColumnClassName="w-[176px]"
						pagination={failuresState.data?.meta}
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
				title={t('maintenance.erpIntegration.failedServices.metadata.title', 'Metadata da falha')}
				maxWidthClassName="max-w-3xl"
				onClose={() => setMetadataTarget(null)}
			>
				{metadataTarget ? <MetadataPanel record={metadataTarget} t={t} /> : null}
			</OverlayModal>

			<ConfirmDialog
				open={Boolean(confirmState)}
				title={
					confirmState?.kind === 'reload'
						? t('maintenance.erpIntegration.failedServices.confirm.reloadTitle', 'Confirmar recarga completa?')
						: t('maintenance.erpIntegration.failedServices.confirm.executeTitle', 'Confirmar execução imediata?')
				}
				description={
					confirmState?.kind === 'reload'
						? t('maintenance.erpIntegration.failedServices.confirm.reloadDescription', 'Os serviços selecionados receberão uma carga completa. Essa ação não pode ser desfeita.')
						: t(
								'maintenance.erpIntegration.failedServices.confirm.executeDescription',
								'Os serviços selecionados receberão um comando de execução imediata. Essa ação não pode ser desfeita.',
							)
				}
				confirmLabel={
					confirmState?.kind === 'reload'
						? t('maintenance.erpIntegration.failedServices.actions.reload', 'Recarregar')
						: t('maintenance.erpIntegration.failedServices.actions.execute', 'Executar')
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
