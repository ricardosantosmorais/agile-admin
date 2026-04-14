'use client'

import { Download, Eye, RefreshCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { enviosFormulariosClient } from '@/src/features/consultas-envios-formularios/services/envios-formularios-client'
import type {
	EnvioFormularioDetail,
	EnvioFormularioFilters,
	EnvioFormularioRecord,
} from '@/src/features/consultas-envios-formularios/services/envios-formularios-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

const defaultFilters: EnvioFormularioFilters = {
	page: 1,
	perPage: 15,
	orderBy: 'data',
	sort: 'desc',
	id_formulario: '',
	cliente: '',
	data_inicio: '',
	data_fim: '',
	internalizado: '',
}

function downloadCsv(filename: string, rows: Record<string, string>[]) {
	if (!rows.length || typeof window === 'undefined') {
		return
	}

	const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
	const escapeCsv = (value: string) => `"${String(value || '').replace(/"/g, '""')}"`
	const lines = [
		columns.map(escapeCsv).join(';'),
		...rows.map((row) => columns.map((column) => escapeCsv(row[column] || '')).join(';')),
	]

	const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
	const url = window.URL.createObjectURL(blob)
	const anchor = document.createElement('a')
	anchor.href = url
	anchor.download = filename
	anchor.click()
	window.URL.revokeObjectURL(url)
}

export function EnviosFormulariosPage() {
	const { t } = useI18n()
	const access = useFeatureAccess('consultasEnviosFormularios')
	const [filters, setFilters] = useState<EnvioFormularioFilters>(defaultFilters)
	const [draft, setDraft] = useState<EnvioFormularioFilters>(defaultFilters)
	const [expanded, setExpanded] = useState(false)
	const [toast, setToast] = useState<{ variant: 'danger' | 'success'; message: string } | null>(null)
	const [selectedId, setSelectedId] = useState('')
	const [isExporting, setIsExporting] = useState(false)

	const contextState = useAsyncData(() => enviosFormulariosClient.getContext(), [])
	const listState = useAsyncData(() => enviosFormulariosClient.list(filters), [filters])
	const detailState = useAsyncData(
		() => (selectedId ? enviosFormulariosClient.getById(selectedId) : Promise.resolve({ data: null as EnvioFormularioDetail | null })),
		[selectedId],
	)

	function patchDraft(patch: Partial<EnvioFormularioFilters>) {
		setDraft((current) => ({ ...current, ...patch, page: 1 }))
	}

	function applyFilters() {
		setFilters({ ...draft, page: 1 })
	}

	function clearFilters() {
		setDraft(defaultFilters)
		setFilters(defaultFilters)
	}

	async function handleExport() {
		const formId = draft.id_formulario || filters.id_formulario
		if (!formId) {
			setToast({ variant: 'danger', message: t('consultasPages.formSubmissions.selectFormFirst', 'Selecione o formulário para exportar os dados.') })
			return
		}

		const selectedForm = contextState.data?.data.formularios.find((entry) => entry.id === formId)
		setIsExporting(true)
		try {
			const response = await enviosFormulariosClient.exportByForm(formId)
			if (!response.data.length) {
				setToast({ variant: 'danger', message: t('consultasPages.formSubmissions.emptyExport', 'O formulário selecionado não contém dados para exportação.') })
				return
			}

			downloadCsv(`${selectedForm?.titulo || 'envios-formulario'}.csv`, response.data)
			setToast({ variant: 'success', message: t('consultasPages.formSubmissions.exportSuccess', 'Exportação concluída com sucesso.') })
		} catch (error) {
			setToast({
				variant: 'danger',
				message: error instanceof Error ? error.message : t('consultasPages.formSubmissions.exportError', 'Não foi possível exportar os envios do formulário.'),
			})
		} finally {
			setIsExporting(false)
		}
	}

	const columns = useMemo(
		() => [
			{
				id: 'formulario',
				label: t('consultasPages.formSubmissions.columns.form', 'Formulário'),
				sortKey: 'formulario:titulo',
				cell: (record: EnvioFormularioRecord) => <span className="font-medium text-(--app-text)">{record.formularioTitulo || '-'}</span>,
				filter: {
					id: 'id_formulario',
					label: t('consultasPages.formSubmissions.columns.form', 'Formulário'),
					kind: 'select',
					key: 'id_formulario' as const,
					options: (contextState.data?.data.formularios || []).map((entry) => ({ value: entry.id, label: entry.titulo })),
				},
			},
			{
				id: 'cliente',
				label: t('orders.fields.customer', 'Cliente'),
				cell: (record: EnvioFormularioRecord) => (
					<div className="space-y-1">
						<div className="font-medium text-(--app-text)">{record.clienteNome || '-'}</div>
						{record.clienteDocumento ? <div className="text-xs text-(--app-muted)">{record.clienteDocumento}</div> : null}
					</div>
				),
				filter: { id: 'cliente', label: t('orders.fields.customer', 'Cliente'), kind: 'text', key: 'cliente' as const },
			},
			{
				id: 'data',
				label: t('orders.fields.date', 'Data'),
				sortKey: 'data',
				cell: (record: EnvioFormularioRecord) => <span>{record.data ? formatDateTime(record.data) : record.dataLabel || '-'}</span>,
				filter: {
					id: 'periodo',
					label: t('orders.fields.period', 'Período'),
					kind: 'date-range',
					fromKey: 'data_inicio' as const,
					toKey: 'data_fim' as const,
				},
			},
			{
				id: 'internalizado',
				label: t('consultasPages.formSubmissions.columns.internalized', 'Internalizado'),
				sortKey: 'internalizado',
				cell: (record: EnvioFormularioRecord) => (
					<StatusBadge tone={record.internalizado ? 'success' : 'warning'}>{record.internalizadoLabel}</StatusBadge>
				),
				filter: {
					id: 'internalizado',
					label: t('consultasPages.formSubmissions.columns.internalized', 'Internalizado'),
					kind: 'select',
					key: 'internalizado' as const,
					options: [
						{ value: '1', label: t('common.yes', 'Sim') },
						{ value: '0', label: t('common.no', 'Não') },
					],
				},
			},
		] satisfies AppDataTableColumn<EnvioFormularioRecord, EnvioFormularioFilters>[],
		[contextState.data?.data.formularios, t],
	)

	if (!access.canOpen) {
		return <AccessDeniedState title={t('consultasPages.formSubmissions.title', 'Envios de Formulários')} />
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Home'), href: '/dashboard' },
					{ label: t('menuKeys.consultas', 'Consultas') },
					{ label: t('consultasPages.formSubmissions.title', 'Envios de Formulários') },
				]}
				actions={
					<DataTablePageActions
						actions={[
							{
								label: t('common.refresh', 'Atualizar'),
								icon: RefreshCcw,
								onClick: () => {
									contextState.reload()
									listState.reload()
								},
							},
						]}
					/>
				}
			/>

			{toast ? <PageToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

			<AsyncState isLoading={contextState.isLoading || listState.isLoading} error={contextState.error || listState.error}>
				<SectionCard
					title={t('consultasPages.formSubmissions.title', 'Envios de Formulários')}
					description={t(
						'consultasPages.formSubmissions.description',
						'Listagem server-side dos envios com visualização em modal e exportação dos dados recebidos por formulário.',
					)}
					action={<DataTableSectionAction label={isExporting ? t('common.loading', 'Carregando...') : t('consultasPages.formSubmissions.export', 'Exportar')} icon={Download} onClick={handleExport} />}
				>
					<div className="space-y-4">
						<div className="flex justify-start">
							<DataTableFilterToggleAction
								expanded={expanded}
								onClick={() => setExpanded((current) => !current)}
								collapsedLabel={t('filters.button', 'Filtros')}
								expandedLabel={t('filters.hide', 'Ocultar filtros')}
							/>
						</div>

						<DataTableFiltersCard<EnvioFormularioFilters>
							variant="embedded"
							columns={columns as AppDataTableColumn<unknown, EnvioFormularioFilters>[]}
							draft={draft}
							applied={filters}
							expanded={expanded}
							onToggleExpanded={() => setExpanded((current) => !current)}
							onApply={applyFilters}
							onClear={clearFilters}
							patchDraft={(key, value) => patchDraft({ [key]: value } as Partial<EnvioFormularioFilters>)}
						/>

						<AppDataTable<EnvioFormularioRecord, string, EnvioFormularioFilters>
							rows={listState.data?.data || []}
							getRowId={(record) => record.id}
							columns={columns}
							emptyMessage={t('consultasPages.formSubmissions.empty', 'Nenhum envio encontrado com os filtros atuais.')}
							sort={{
								activeColumn: filters.orderBy,
								direction: filters.sort,
								onToggle: (columnId) => setFilters((current) => ({
									...current,
									orderBy: columnId,
									sort: current.orderBy === columnId && current.sort === 'asc' ? 'desc' : 'asc',
								})),
							}}
							rowActions={(record) => [
								{
									id: 'view',
									label: t('simpleCrud.actions.view', 'Visualizar'),
									icon: Eye,
									onClick: () => setSelectedId(record.id),
									visible: access.canView || access.canEdit || access.canOpen,
								},
							]}
							mobileCard={{
								title: (record) => record.formularioTitulo || '-',
								subtitle: (record) => record.clienteNome || '-',
								meta: (record) => record.dataLabel || '-',
								badges: (record) => <StatusBadge tone={record.internalizado ? 'success' : 'warning'}>{record.internalizadoLabel}</StatusBadge>,
							}}
							pagination={listState.data?.meta}
							onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
							pageSize={{
								value: filters.perPage,
								options: [15, 30, 45, 60],
								onChange: (perPage) => {
									setFilters((current) => ({ ...current, perPage, page: 1 }))
									setDraft((current) => ({ ...current, perPage, page: 1 }))
								},
							}}
						/>
					</div>
				</SectionCard>
			</AsyncState>

			<OverlayModal
				open={Boolean(selectedId)}
				title={t('consultasPages.formSubmissions.detailTitle', 'Informações do envio')}
				onClose={() => setSelectedId('')}
				maxWidthClassName="max-w-4xl"
			>
				<AsyncState isLoading={Boolean(selectedId) && detailState.isLoading} error={selectedId ? detailState.error : ''}>
					{detailState.data?.data ? (
						<div className="space-y-5">
							<div className="grid gap-3 md:grid-cols-3">
								<div className="app-pane-muted rounded-[1rem] px-4 py-3">
									<div className="text-xs uppercase tracking-[0.16em] text-(--app-muted)">{t('consultasPages.formSubmissions.columns.form', 'Formulário')}</div>
									<div className="mt-2 font-semibold text-(--app-text)">{detailState.data.data.formularioTitulo || '-'}</div>
								</div>
								<div className="app-pane-muted rounded-[1rem] px-4 py-3">
									<div className="text-xs uppercase tracking-[0.16em] text-(--app-muted)">{t('orders.fields.date', 'Data')}</div>
									<div className="mt-2 font-semibold text-(--app-text)">{detailState.data.data.data ? formatDateTime(detailState.data.data.data) : '-'}</div>
								</div>
								<div className="app-pane-muted rounded-[1rem] px-4 py-3">
									<div className="text-xs uppercase tracking-[0.16em] text-(--app-muted)">{t('orders.fields.customer', 'Cliente')}</div>
									<div className="mt-2 font-semibold text-(--app-text)">{detailState.data.data.clienteNome || '-'}</div>
									{detailState.data.data.clienteDocumento ? <div className="text-xs text-(--app-muted)">{detailState.data.data.clienteDocumento}</div> : null}
								</div>
							</div>

							<div className="app-table-shell overflow-hidden rounded-[1.1rem]">
								<table className="w-full table-auto border-separate border-spacing-0">
									<tbody>
										{detailState.data.data.campos.map((campo) => (
											<tr key={campo.id}>
												<td className="border-b border-line/40 px-4 py-3 align-top text-sm font-medium text-(--app-text)">{campo.titulo}</td>
												<td className="border-b border-line/40 px-4 py-3 text-sm text-(--app-muted)">
													{campo.arquivoUrl ? (
														<a href={campo.arquivoUrl} target="_blank" rel="noreferrer" className="app-button-secondary inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold">
															{t('consultasPages.formSubmissions.viewFile', 'Visualizar arquivo')}
														</a>
													) : (
														campo.valor || '-'
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					) : null}
				</AsyncState>
			</OverlayModal>
		</div>
	)
}
