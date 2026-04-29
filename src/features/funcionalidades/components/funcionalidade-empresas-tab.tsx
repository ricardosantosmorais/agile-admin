'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { SectionCard } from '@/src/components/ui/section-card'
import { SelectableDataTable, type SelectableDataTableColumn } from '@/src/components/ui/selectable-data-table'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { funcionalidadesClient } from '@/src/features/funcionalidades/services/funcionalidades-client'
import { normalizeFuncionalidadeRecord } from '@/src/features/funcionalidades/services/funcionalidades-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

type FuncionalidadeEmpresa = {
	id: string
	nome?: string
	codigo?: string
	ativo?: boolean
}

type FuncionalidadeEmpresasTabProps = {
	id?: string
	form: CrudRecord
	readOnly: boolean
	refreshRecord: () => Promise<void>
	onFeedback: (message: string | null, tone?: 'success' | 'error') => void
}

export function FuncionalidadeEmpresasTab({
	id,
	form,
	readOnly,
	refreshRecord,
	onFeedback,
}: FuncionalidadeEmpresasTabProps) {
	const { t } = useI18n()
	const [selectedCompany, setSelectedCompany] = useState<LookupOption | null>(null)
	const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
	const [removingIds, setRemovingIds] = useState<string[] | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const empresas = useMemo(() => (normalizeFuncionalidadeRecord(form).empresas ?? []) as FuncionalidadeEmpresa[], [form])
	const columns = useMemo<Array<SelectableDataTableColumn<FuncionalidadeEmpresa>>>(() => [
		{
			header: t('simpleCrud.fields.id', 'ID'),
			headerClassName: 'w-[160px]',
			cellClassName: 'w-[160px] whitespace-nowrap text-sm font-semibold text-[color:var(--app-text)]',
			render: (empresa) => empresa.id,
		},
		{
			header: t('routes.empresas', 'Empresa'),
			cellClassName: 'min-w-[280px]',
			render: (empresa) => (
				<div>
					<div className="break-words text-sm font-semibold text-[color:var(--app-text)]">{empresa.nome || '-'}</div>
					{empresa.codigo ? <div className="mt-0.5 break-words text-xs text-[color:var(--app-muted)]">{empresa.codigo}</div> : null}
				</div>
			),
		},
		{
			header: t('simpleCrud.fields.active', 'Ativo'),
			headerClassName: 'w-[130px]',
			cellClassName: 'w-[130px]',
			render: (empresa) => (
				<StatusBadge tone={empresa.ativo === false ? 'warning' : 'success'}>
					{empresa.ativo === false ? t('common.inactive', 'Inativo') : t('common.active', 'Ativo')}
				</StatusBadge>
			),
		},
	], [t])

	async function handleAddEmpresa() {
		if (!id || !selectedCompany) return
		setIsSaving(true)
		try {
			await funcionalidadesClient.addEmpresa(id, selectedCompany.id)
			setSelectedCompany(null)
			await refreshRecord()
		} catch (error) {
			onFeedback(error instanceof Error ? error.message : t('registrations.features.companies.linkError', 'Não foi possível vincular a empresa.'), 'error')
		} finally {
			setIsSaving(false)
		}
	}

	async function handleRemoveEmpresas(ids: string[]) {
		if (!id || !ids.length) return
		setIsSaving(true)
		try {
			await funcionalidadesClient.removeEmpresas(id, ids)
			setSelectedCompanyIds((current) => current.filter((item) => !ids.includes(item)))
			setRemovingIds(null)
			await refreshRecord()
		} catch (error) {
			onFeedback(error instanceof Error ? error.message : t('registrations.features.companies.unlinkError', 'Não foi possível desvincular a empresa.'), 'error')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<>
			<SectionCard
				title={t('registrations.features.companies.title', 'Empresas vinculadas')}
				description={t('registrations.features.companies.description', 'Controle quais empresas possuem acesso explícito a esta funcionalidade.')}
				action={!readOnly ? (
					<div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[560px] lg:flex-row">
						<div className="min-w-0 flex-1">
							<LookupSelect label={t('routes.empresas', 'Empresas')} value={selectedCompany} onChange={setSelectedCompany} loadOptions={funcionalidadesClient.loadEmpresaOptions} pageSize={20} />
						</div>
						<button
							type="button"
							disabled={!selectedCompany || isSaving}
							onClick={handleAddEmpresa}
							className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
						>
							<Plus className="h-4 w-4" />
							{t('registrations.features.companies.link', 'Incluir')}
						</button>
					</div>
				) : null}
			>
				<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
					<div className="text-sm text-[color:var(--app-muted)]">
						{t('registrations.features.companies.total', '{{count}} empresa(s) vinculada(s).', { count: empresas.length })}
					</div>
					{selectedCompanyIds.length ? (
						<button type="button" onClick={() => setRemovingIds(selectedCompanyIds)} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-rose-600">
							<Trash2 className="h-4 w-4" />
							{t('simpleCrud.deleteSelected', 'Excluir ({{count}})', { count: selectedCompanyIds.length })}
						</button>
					) : null}
				</div>

				<SelectableDataTable
					items={empresas}
					selectedIds={selectedCompanyIds}
					onSelectedIdsChange={setSelectedCompanyIds}
					getRowId={(empresa) => empresa.id}
					columns={columns}
					emptyMessage={t('registrations.features.companies.empty', 'Nenhuma empresa vinculada a esta funcionalidade.')}
					actionsLabel={t('simpleCrud.actions.title', 'Ações')}
					rowActions={(empresa) => [
						{
							label: t('common.remove', 'Remover'),
							icon: Trash2,
							tone: 'danger',
							onClick: () => setRemovingIds([empresa.id]),
						},
					]}
				/>
			</SectionCard>

			<ConfirmDialog
				open={Boolean(removingIds?.length)}
				title={t('registrations.features.companies.confirmUnlinkTitle', 'Remover vínculo?')}
				description={t('registrations.features.companies.confirmUnlinkDescription', 'As empresas selecionadas deixarão de ter este vínculo de funcionalidade.')}
				confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
				cancelLabel={t('common.cancel', 'Cancelar')}
				isLoading={isSaving}
				onClose={() => setRemovingIds(null)}
				onConfirm={() => void handleRemoveEmpresas(removingIds ?? [])}
			/>
		</>
	)
}
