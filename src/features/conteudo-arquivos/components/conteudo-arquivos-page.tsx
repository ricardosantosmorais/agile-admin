'use client'

import Image from 'next/image'
import { Download, Eye, FileSpreadsheet, FileText, FileType2, RefreshCcw, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { useDataTableState } from '@/src/components/data-table/use-data-table-state'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { FormField } from '@/src/components/ui/form-field'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { conteudoArquivosClient } from '@/src/features/conteudo-arquivos/services/conteudo-arquivos-client'
import {
	CONTEUDO_ARQUIVOS_ACCEPT,
	CONTEUDO_ARQUIVOS_FORMATS_LABEL,
	type ConteudoArquivoRecord,
	type ConteudoArquivosFilters,
} from '@/src/features/conteudo-arquivos/services/conteudo-arquivos-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { createProfileUploadHandler, normalizeUploadResult } from '@/src/lib/uploads'

const DEFAULT_FILTERS: ConteudoArquivosFilters = {
	page: 1,
	perPage: 15,
	orderBy: 'data_envio',
	sort: 'desc',
	id: '',
	arquivo: '',
	data_inicio: '',
	data_fim: '',
}

type ToastState = {
	variant: 'success' | 'danger'
	message: string
}

type SelectedAssetState = {
	fileName: string
	extension: string
	isImage: boolean
	isPdf: boolean
	objectUrl: string
}

function getFileExtension(value: string) {
	const normalized = String(value || '').trim().split('?')[0]
	if (!normalized.includes('.')) {
		return ''
	}

	return (normalized.split('.').pop() || '').toLowerCase()
}

function isImageExtension(extension: string) {
	return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)
}

function getAssetPreviewIcon(extension: string) {
	if (['xls', 'xlsx', 'csv'].includes(extension)) {
		return FileSpreadsheet
	}

	if (['doc', 'docx', 'txt', 'html', 'ppt', 'pptx', 'zip'].includes(extension)) {
		return FileType2
	}

	return FileText
}

function buildAcceptAttribute() {
	return Object.values(CONTEUDO_ARQUIVOS_ACCEPT).flat().join(',')
}

export function ConteudoArquivosPage() {
	const { t } = useI18n()
	const { session } = useAuth()
	const access = useFeatureAccess('conteudoArquivos')
	const [filters, setFilters] = useState<ConteudoArquivosFilters>(DEFAULT_FILTERS)
	const [draft, setDraft] = useState<ConteudoArquivosFilters>(DEFAULT_FILTERS)
	const [expanded, setExpanded] = useState(false)
	const [toast, setToast] = useState<ToastState | null>(null)
	const [uploadOpen, setUploadOpen] = useState(false)
	const [folder, setFolder] = useState('')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [selectedAsset, setSelectedAsset] = useState<SelectedAssetState | null>(null)
	const [submittingUpload, setSubmittingUpload] = useState(false)
	const [deleteIds, setDeleteIds] = useState<string[]>([])
	const [previewTarget, setPreviewTarget] = useState<ConteudoArquivoRecord | null>(null)

	const listState = useAsyncData(() => conteudoArquivosClient.list(filters), [filters])
	const rows = listState.data?.data || []

	const tableState = useDataTableState<ConteudoArquivoRecord, ConteudoArquivosFilters, ConteudoArquivosFilters['orderBy']>({
		rows,
		getRowId: (row) => row.id,
		filters,
		setFilters,
		setFiltersDraft: setDraft,
	})

	useEffect(() => {
		return () => {
			if (selectedAsset?.objectUrl) {
				URL.revokeObjectURL(selectedAsset.objectUrl)
			}
		}
	}, [selectedAsset])

	const columns = [
		{
			id: 'id',
			label: t('contentFiles.columns.id', 'ID'),
			sortKey: 'id',
			thClassName: 'w-[96px]',
			cell: (record: ConteudoArquivoRecord) => <span className="font-semibold text-(--app-text)">{record.id}</span>,
			filter: {
				id: 'id',
				label: t('contentFiles.columns.id', 'ID'),
				kind: 'text' as const,
				key: 'id' as const,
			},
		},
		{
			id: 'arquivo',
			label: t('contentFiles.columns.file', 'Arquivo'),
			sortKey: 'arquivo',
			tdClassName: 'max-w-[460px]',
			cell: (record: ConteudoArquivoRecord) => (
				<div className="min-w-0 space-y-2">
					<div className="break-words text-sm font-medium text-(--app-text)">{record.arquivoNome || '-'}</div>
					<div className="flex flex-wrap items-center gap-2">
						{record.pasta ? <StatusBadge tone="neutral">{record.pasta}</StatusBadge> : null}
						{record.extensao ? <StatusBadge tone="info">{record.extensao.toUpperCase()}</StatusBadge> : null}
					</div>
					<div className="break-all text-xs leading-5 text-(--app-muted)">
						{record.arquivoUrl}
					</div>
				</div>
			),
			filter: {
				id: 'arquivo',
				label: t('contentFiles.columns.file', 'Arquivo'),
				kind: 'text' as const,
				key: 'arquivo' as const,
			},
		},
		{
			id: 'dataEnvio',
			label: t('contentFiles.columns.sentAt', 'Data de envio'),
			sortKey: 'data_envio',
			thClassName: 'w-[180px]',
			cell: (record: ConteudoArquivoRecord) => <span>{record.dataEnvioLabel || '-'}</span>,
			filter: {
				id: 'dataEnvio',
				label: t('contentFiles.columns.sentAt', 'Data de envio'),
				kind: 'date-range' as const,
				fromKey: 'data_inicio' as const,
				toKey: 'data_fim' as const,
			},
		},
	] satisfies AppDataTableColumn<ConteudoArquivoRecord, ConteudoArquivosFilters>[]

	function patchDraft<K extends keyof ConteudoArquivosFilters>(key: K, value: ConteudoArquivosFilters[K]) {
		setDraft((current) => ({ ...current, [key]: value, page: 1 }))
	}

	function handleSelectFile(file: File | null) {
		if (selectedAsset?.objectUrl) {
			URL.revokeObjectURL(selectedAsset.objectUrl)
		}

		if (!file) {
			setSelectedFile(null)
			setSelectedAsset(null)
			return
		}

		const extension = getFileExtension(file.name)
		setSelectedFile(file)
		setSelectedAsset({
			fileName: file.name,
			extension,
			isImage: isImageExtension(extension),
			isPdf: extension === 'pdf',
			objectUrl: URL.createObjectURL(file),
		})
	}

	function resetUploadModal() {
		setUploadOpen(false)
		setFolder('')
		setSelectedFile(null)
		if (selectedAsset?.objectUrl) {
			URL.revokeObjectURL(selectedAsset.objectUrl)
		}
		setSelectedAsset(null)
		setSubmittingUpload(false)
	}

	async function handleCreateArquivo() {
		if (!selectedFile) {
			setToast({ variant: 'danger', message: t('contentFiles.feedback.fileRequired', 'Envie um arquivo antes de salvar o registro.') })
			return
		}

		setSubmittingUpload(true)
		try {
			const uploadHandler = createProfileUploadHandler({
				profileId: 'tenant-public-files',
				tenantBucketUrl: session?.currentTenant.assetsBucketUrl ?? null,
				folder,
			})
			const result = normalizeUploadResult(await uploadHandler(selectedFile))
			await conteudoArquivosClient.create(result.value)
			setToast({ variant: 'success', message: t('contentFiles.feedback.createSuccess', 'Arquivo enviado com sucesso.') })
			resetUploadModal()
			await listState.reload()
		} catch (error) {
			setToast({
				variant: 'danger',
				message: error instanceof Error ? error.message : t('contentFiles.feedback.createError', 'Não foi possível salvar o arquivo enviado.'),
			})
		} finally {
			setSubmittingUpload(false)
		}
	}

	async function handleDelete(ids: string[]) {
		if (!ids.length) {
			return
		}

		try {
			await conteudoArquivosClient.delete(ids)
			setToast({
				variant: 'success',
				message: ids.length === 1
					? t('contentFiles.feedback.deleteSuccessSingle', 'Arquivo excluído com sucesso.')
					: t('contentFiles.feedback.deleteSuccessBatch', 'Arquivos excluídos com sucesso.'),
			})
			setDeleteIds([])
			tableState.clearSelection()
			await listState.reload()
		} catch (error) {
			setToast({
				variant: 'danger',
				message: error instanceof Error ? error.message : t('contentFiles.feedback.deleteError', 'Não foi possível excluir os arquivos selecionados.'),
			})
		}
	}

	if (!access.canList) {
		return <AccessDeniedState title={t('contentFiles.title', 'Arquivos')} backHref="/dashboard" />
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.conteudo', 'Conteúdo') },
					{ label: t('contentFiles.title', 'Arquivos'), href: '/conteudo/arquivos' },
				]}
				actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={listState.reload} />}
			/>

			{toast ? <PageToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

			<AsyncState isLoading={listState.isLoading} error={listState.error}>
				<SectionCard
					action={(
						<div className="flex w-full items-center justify-between gap-3">
							<DataTableFilterToggleAction
								expanded={expanded}
								onClick={() => setExpanded((current) => !current)}
								collapsedLabel={t('filters.button', 'Filtros')}
								expandedLabel={t('filters.hide', 'Ocultar filtros')}
							/>
							<DataTablePageActions
								actions={[
									access.canDelete && tableState.selectedIds.length > 0
										? {
												label: t('simpleCrud.deleteSelected', 'Excluir ({{count}})', { count: tableState.selectedIds.length }),
												icon: Trash2,
												onClick: () => setDeleteIds(tableState.selectedIds),
												tone: 'danger',
											}
										: null,
									access.canCreate
										? {
												label: t('contentFiles.actions.upload', 'Enviar arquivo'),
												icon: Upload,
												onClick: () => setUploadOpen(true),
												tone: 'primary',
											}
										: null,
								]}
							/>
						</div>
					)}
				>
					<DataTableFiltersCard<ConteudoArquivosFilters>
						variant="embedded"
						columns={columns as AppDataTableColumn<unknown, ConteudoArquivosFilters>[]}
						draft={draft}
						applied={filters}
						expanded={expanded}
						onToggleExpanded={() => setExpanded((current) => !current)}
						onApply={() => setFilters({ ...draft, page: 1 })}
						onClear={() => {
							setDraft(DEFAULT_FILTERS)
							setFilters(DEFAULT_FILTERS)
						}}
						patchDraft={patchDraft}
					/>

					<AppDataTable<ConteudoArquivoRecord, ConteudoArquivosFilters['orderBy'], ConteudoArquivosFilters>
						rows={rows}
						getRowId={(row) => row.id}
						columns={columns}
						emptyMessage={t('contentFiles.empty', 'Nenhum arquivo foi encontrado com os filtros atuais.')}
						selectable={access.canDelete}
						selectedIds={tableState.selectedIds}
						allSelected={tableState.allSelected}
						onToggleSelect={tableState.toggleSelection}
						onToggleSelectAll={tableState.toggleSelectAll}
						sort={{
							activeColumn: filters.orderBy,
							direction: filters.sort,
							onToggle: tableState.toggleSort,
						}}
						rowActions={(record) => [
							{
								id: 'open',
								label: record.isPreviewable
									? t('contentFiles.actions.view', 'Visualizar arquivo')
									: t('contentFiles.actions.download', 'Abrir arquivo'),
								icon: record.isPreviewable ? Eye : Download,
								onClick: () => setPreviewTarget(record),
								visible: Boolean(record.arquivoUrl),
							},
							{
								id: 'delete',
								label: t('simpleCrud.actions.delete', 'Excluir'),
								icon: Trash2,
								tone: 'danger',
								onClick: () => setDeleteIds([record.id]),
								visible: access.canDelete,
							},
						]}
						actionsColumnClassName="w-[144px]"
						mobileCard={{
							title: (record) => record.arquivoNome || '-',
							subtitle: (record) => record.pasta || record.arquivoUrl || '-',
							meta: (record) => record.dataEnvioLabel || '-',
							badges: (record) => (
								<div className="flex flex-wrap gap-2">
									{record.extensao ? <StatusBadge tone="info">{record.extensao.toUpperCase()}</StatusBadge> : null}
									{record.pasta ? <StatusBadge tone="neutral">{record.pasta}</StatusBadge> : null}
								</div>
							),
						}}
						pagination={listState.data?.meta}
						onPageChange={tableState.setPage}
						pageSize={{
							value: filters.perPage,
							options: [15, 30, 45, 60],
							onChange: (perPage) => {
								const next = { ...filters, perPage, page: 1 }
								setFilters(next)
								setDraft(next)
							},
						}}
					/>
				</SectionCard>
			</AsyncState>

			<OverlayModal
				open={uploadOpen}
				title={t('contentFiles.modal.title', 'Enviar arquivo')}
				maxWidthClassName="max-w-4xl"
				bodyClassName="pb-1"
				onClose={() => {
					if (!submittingUpload) {
						resetUploadModal()
					}
				}}
			>
				<div className="space-y-4">
					<div className="grid gap-3 lg:grid-cols-[minmax(0,260px)_1fr]">
						<FormField
							label={t('contentFiles.fields.folder', 'Pasta opcional')}
							helperText={t('contentFiles.fields.folderHint', 'Use uma pasta curta para organizar os arquivos do bucket da empresa.')}
						>
							<input
								type="text"
								value={folder}
								onChange={(event) => setFolder(event.target.value)}
								placeholder={t('contentFiles.fields.folderPlaceholder', 'Ex.: contratos, catálogo, campanhas')}
								className="app-input h-11 rounded-full px-4"
							/>
						</FormField>

						<div className="app-pane-muted rounded-[1.1rem] px-4 py-3 text-sm leading-6 text-(--app-muted)">
							<p>{t('contentFiles.modal.description', 'O arquivo é enviado para o bucket público da empresa, em arquivos/ com pasta opcional, seguindo o comportamento do legado.')}</p>
						</div>
					</div>

					<div className="app-pane rounded-[1.35rem] border border-[color:var(--app-card-border)] p-4">
						<div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
							<div className="app-pane-muted overflow-hidden rounded-[1rem] border border-[color:var(--app-card-border)]">
								{selectedAsset?.isImage ? (
									<div className="relative h-[18rem] w-full">
										<Image src={selectedAsset.objectUrl} alt={selectedAsset.fileName} fill className="object-cover object-top" unoptimized />
									</div>
								) : selectedAsset?.isPdf ? (
									<iframe title={selectedAsset.fileName} src={selectedAsset.objectUrl} className="h-[18rem] w-full" />
								) : (
									<div className="flex h-[18rem] w-full flex-col items-center justify-center gap-2 px-4 text-center text-[color:var(--app-muted)]">
										{selectedAsset ? (
											<>
												{(() => {
													const PreviewIcon = getAssetPreviewIcon(selectedAsset.extension)
													return <PreviewIcon className="h-12 w-12 text-[color:var(--app-muted)]/70" />
												})()}
												<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
													{selectedAsset.extension ? selectedAsset.extension.toUpperCase() : t('uploads.noFile', 'Sem arquivo')}
												</span>
											</>
										) : (
											<>
												<FileText className="h-9 w-9 text-[color:var(--app-muted)]/70" />
												<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
													{t('uploads.noFile', 'Sem arquivo')}
												</span>
											</>
										)}
									</div>
								)}
							</div>

							<div className="flex min-h-[18rem] flex-col justify-between gap-4">
								<div className="space-y-3 text-center lg:text-left">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-300 lg:mx-0">
										<Upload className="h-6 w-6" />
									</div>
									<div className="space-y-1.5">
										<h3 className="text-[1.05rem] font-semibold tracking-tight text-[color:var(--app-text)]">
											{t('uploads.fileTitle', 'Arraste o arquivo ou clique para enviar')}
										</h3>
										<p className="max-w-2xl text-sm leading-6 text-[color:var(--app-muted)]">
											{t('uploads.fileDescription', 'Use este campo para uploads de arquivos não visuais, incluindo integrações futuras com bucket privado ou público.')}
										</p>
										<p className="text-sm text-[color:var(--app-muted)]">{CONTEUDO_ARQUIVOS_FORMATS_LABEL}</p>
									</div>

									{selectedAsset ? (
										<p className="text-sm text-[color:var(--app-muted)]">
											{t('contentFiles.upload.savePending', 'O arquivo será enviado ao bucket e salvo na listagem quando você clicar em salvar.')}
										</p>
									) : null}
								</div>

								<div className="flex flex-wrap items-center gap-3">
									<label className="app-button-primary inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold">
										<Upload className="h-4 w-4" />
										{t('uploads.chooseFile', 'Escolher arquivo')}
										<input
											type="file"
											className="sr-only"
											accept={buildAcceptAttribute()}
											onChange={(event) => handleSelectFile(event.target.files?.[0] ?? null)}
										/>
									</label>
									<button
										type="button"
										onClick={() => handleSelectFile(null)}
										disabled={!selectedAsset}
										className="app-button-danger inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
									>
										<Trash2 className="h-4 w-4" />
										{t('common.clear', 'Limpar')}
									</button>
								</div>
							</div>
						</div>
					</div>

					<div className="flex justify-end">
						<button
							type="button"
							onClick={() => void handleCreateArquivo()}
							disabled={submittingUpload || !selectedFile}
							className="app-button-primary inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Upload className="h-4 w-4" />
							{submittingUpload
								? t('contentFiles.upload.statusUploading', 'Enviando...')
								: t('contentFiles.actions.confirmUpload', 'Salvar arquivo')}
						</button>
					</div>
				</div>
			</OverlayModal>

			<ConfirmDialog
				open={deleteIds.length > 0}
				title={t('contentFiles.confirm.deleteTitle', 'Confirmar exclusão?')}
				description={
					deleteIds.length === 1
						? t('contentFiles.confirm.deleteDescriptionSingle', 'O registro do arquivo será removido da listagem. Essa ação não pode ser desfeita.')
						: t('contentFiles.confirm.deleteDescriptionBatch', 'Os registros selecionados serão removidos da listagem. Essa ação não pode ser desfeita.')
				}
				confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
				tone="danger"
				onCancel={() => setDeleteIds([])}
				onConfirm={() => {
					void handleDelete(deleteIds)
				}}
			/>

			<OverlayModal
				open={Boolean(previewTarget)}
				title={previewTarget?.arquivoNome || t('contentFiles.preview.title', 'Pré-visualização do arquivo')}
				onClose={() => setPreviewTarget(null)}
				maxWidthClassName="max-w-5xl"
			>
				{previewTarget ? (
					<div className="space-y-4">
						<div className="flex flex-wrap items-center gap-2">
							{previewTarget.extensao ? <StatusBadge tone="info">{previewTarget.extensao.toUpperCase()}</StatusBadge> : null}
							{previewTarget.pasta ? <StatusBadge tone="neutral">{previewTarget.pasta}</StatusBadge> : null}
						</div>

						<div className="app-pane min-h-[420px] overflow-hidden rounded-[1.2rem] border border-[color:var(--app-card-border)]">
							{isImageExtension(previewTarget.extensao) ? (
								<div className="relative h-[420px] w-full">
									<Image
										src={previewTarget.arquivoUrl}
										alt={previewTarget.arquivoNome}
										fill
										className="object-contain p-4"
										unoptimized
									/>
								</div>
							) : previewTarget.extensao === 'pdf' ? (
								<iframe
									title={previewTarget.arquivoNome}
									src={previewTarget.arquivoUrl}
									className="h-[420px] w-full"
								/>
							) : (
								<div className="flex h-[420px] flex-col items-center justify-center gap-4 px-6 text-center text-(--app-muted)">
									<FileText className="h-12 w-12" />
									<p className="max-w-lg text-sm leading-6">
										{t('contentFiles.preview.unsupported', 'Este formato não possui pré-visualização embutida. Você ainda pode abrir o arquivo em uma nova aba.')}
									</p>
									<a
										href={previewTarget.arquivoUrl}
										target="_blank"
										rel="noreferrer"
										className="app-button-secondary inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold"
									>
										{t('contentFiles.actions.download', 'Abrir arquivo')}
									</a>
								</div>
							)}
						</div>

						<div className="break-all text-xs leading-5 text-(--app-muted)">
							{previewTarget.arquivoUrl}
						</div>
					</div>
				) : null}
			</OverlayModal>
		</div>
	)
}
