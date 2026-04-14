'use client';

import { RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppDataTable } from '@/src/components/data-table/app-data-table';
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters';
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar';
import type { AppDataTableColumn } from '@/src/components/data-table/types';
import { AsyncState } from '@/src/components/ui/async-state';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionCard } from '@/src/components/ui/section-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { integracaoComErpRotinasIntegradasClient } from '@/src/features/integracao-com-erp-rotinas-integradas/services/integracao-com-erp-rotinas-integradas-client';
import type {
	IntegracaoComErpRotinaIntegradaRecord,
	IntegracaoComErpRotinasIntegradasFilters,
} from '@/src/features/integracao-com-erp-rotinas-integradas/services/integracao-com-erp-rotinas-integradas-types';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useDataTableState } from '@/src/components/data-table/use-data-table-state';
import { useI18n } from '@/src/i18n/use-i18n';

const DEFAULT_FILTERS: IntegracaoComErpRotinasIntegradasFilters = {
	page: 1,
	perPage: 15,
	orderBy: 'codigo',
	sort: 'asc',
	codigo: '',
	modulo: '',
	nome: '',
};

export function IntegracaoComErpRotinasIntegradasPage() {
	const { t } = useI18n();
	const access = useFeatureAccess('erpRotinasIntegradas');
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [filters, setFilters] = useState<IntegracaoComErpRotinasIntegradasFilters>(DEFAULT_FILTERS);
	const [filtersDraft, setFiltersDraft] = useState<IntegracaoComErpRotinasIntegradasFilters>(DEFAULT_FILTERS);
	const routinesState = useAsyncData(() => integracaoComErpRotinasIntegradasClient.list(filters), [filters]);
	const routines = routinesState.data?.data ?? [];

	const tableState = useDataTableState<IntegracaoComErpRotinaIntegradaRecord, IntegracaoComErpRotinasIntegradasFilters, IntegracaoComErpRotinasIntegradasFilters['orderBy']>({
		rows: routines,
		getRowId: (routine) => routine.id || routine.codigo,
		filters,
		setFilters,
		setFiltersDraft,
	});

	const columns = useMemo(
		() =>
			[
				{
					id: 'codigo',
					label: t('maintenance.erpIntegration.integratedRoutines.fields.code', 'Código'),
					sortKey: 'codigo',
					thClassName: 'w-[160px]',
					cell: (routine: IntegracaoComErpRotinaIntegradaRecord) => <span className="font-semibold text-(--app-text)">{routine.codigo || '-'}</span>,
					filter: {
						kind: 'text',
						id: 'codigo',
						key: 'codigo',
						label: t('maintenance.erpIntegration.integratedRoutines.fields.code', 'Código'),
					},
				},
				{
					id: 'modulo',
					label: t('maintenance.erpIntegration.integratedRoutines.fields.module', 'Módulo'),
					sortKey: 'modulo',
					visibility: 'lg',
					cell: (routine: IntegracaoComErpRotinaIntegradaRecord) => routine.modulo || '-',
					filter: {
						kind: 'text',
						id: 'modulo',
						key: 'modulo',
						label: t('maintenance.erpIntegration.integratedRoutines.fields.module', 'Módulo'),
					},
				},
				{
					id: 'nome',
					label: t('maintenance.erpIntegration.integratedRoutines.fields.name', 'Nome'),
					sortKey: 'nome',
					tdClassName: 'font-semibold text-(--app-text)',
					cell: (routine: IntegracaoComErpRotinaIntegradaRecord) => <span className="truncate">{routine.nome || '-'}</span>,
					filter: {
						kind: 'text',
						id: 'nome',
						key: 'nome',
						label: t('maintenance.erpIntegration.integratedRoutines.fields.name', 'Nome'),
					},
				},
			] satisfies AppDataTableColumn<IntegracaoComErpRotinaIntegradaRecord, IntegracaoComErpRotinasIntegradasFilters>[],
		[t],
	);

	function patchDraft<K extends keyof IntegracaoComErpRotinasIntegradasFilters>(key: K, value: IntegracaoComErpRotinasIntegradasFilters[K]) {
		setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }));
	}

	if (!access.canList) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.modules.integratedRoutines.title', 'Rotinas Integradas')} backHref="/dashboard" />;
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
					{ label: t('maintenance.erpIntegration.modules.integratedRoutines.title', 'Rotinas Integradas'), href: '/integracao-com-erp/rotinas-integradas' },
				]}
				actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={routinesState.reload} />}
			/>

			<AsyncState isLoading={routinesState.isLoading} error={routinesState.error}>
				<SectionCard
					title={t('maintenance.erpIntegration.modules.integratedRoutines.title', 'Rotinas Integradas')}
					description={t('maintenance.erpIntegration.modules.integratedRoutines.description', 'Liste as rotinas integradas disponíveis para o ERP configurado no tenant atual.')}
					action={
						<div className="flex w-full items-center justify-between gap-3">
							<DataTableFilterToggleAction
								expanded={filtersExpanded}
								onClick={() => setFiltersExpanded((current) => !current)}
								collapsedLabel={t('filters.button', 'Filtros')}
								expandedLabel={t('filters.hide', 'Ocultar filtros')}
							/>
						</div>
					}
				>
					<DataTableFiltersCard
						variant="embedded"
						columns={columns as AppDataTableColumn<unknown, IntegracaoComErpRotinasIntegradasFilters>[]}
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

					<AppDataTable<IntegracaoComErpRotinaIntegradaRecord, IntegracaoComErpRotinasIntegradasFilters['orderBy'], IntegracaoComErpRotinasIntegradasFilters>
						rows={routines}
						getRowId={(routine) => routine.id || routine.codigo}
						emptyMessage={t('maintenance.erpIntegration.integratedRoutines.empty', 'Nenhuma rotina integrada encontrada com os filtros atuais.')}
						columns={columns}
						sort={{
							activeColumn: filters.orderBy,
							direction: filters.sort,
							onToggle: tableState.toggleSort,
						}}
						mobileCard={{
							title: (routine) => routine.nome || '-',
							subtitle: (routine) => routine.modulo || '-',
							meta: (routine) => routine.codigo || '-',
						}}
						pagination={routinesState.data?.meta}
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
		</div>
	);
}
