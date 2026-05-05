'use client'

import { Building2, Loader2, Plus, RefreshCcw, Save, Settings, ToggleLeft, ToggleRight, Unlink } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { INTEGRACAO_COM_ERP_CADASTRO_SERVICOS_CONFIG } from '@/src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-config'
import { integracaoComErpCadastroServicosClient } from '@/src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-client'
import { httpClient } from '@/src/services/http/http-client'

type ServicoEmpresaRow = {
	id: string
	id_empresa: string
	empresa_nome: string
	intervalo_execucao: string
	ativo: boolean
}

type ServicoEmpresasPanelProps = {
	id: string
	refreshSignal: number
	createSignal: number
}

function text(value: unknown) {
	return String(value ?? '').trim()
}

async function loadEmpresasDisponiveis(servicoId: string, query: string, page: number, perPage: number): Promise<LookupOption[]> {
	const params = new URLSearchParams({ q: query, page: String(page), perPage: String(perPage) })
	return httpClient<LookupOption[]>(`/api/erp-cadastros/servicos/${servicoId}/empresas-options?${params.toString()}`)
}

export function IntegracaoComErpCadastroServicosFormPage({ id }: { id?: string }) {
	const [empresasRefreshSignal, setEmpresasRefreshSignal] = useState(0)
	const [empresasCreateSignal, setEmpresasCreateSignal] = useState(0)

	return (
		<TabbedCatalogFormPage
			config={INTEGRACAO_COM_ERP_CADASTRO_SERVICOS_CONFIG}
			client={integracaoComErpCadastroServicosClient}
			id={id}
			tabs={[
				{ key: 'dados', label: 'Dados do Serviço', icon: <Settings className="h-4 w-4" />, sectionIds: ['main', 'flags', 'gateway'] },
				{
					key: 'empresas',
					label: 'Serviços x Empresas',
					icon: <Building2 className="h-4 w-4" />,
					hidden: ({ isEditing }) => !isEditing,
					renderToolbar: () => (
						<div className="flex flex-wrap gap-2">
							<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" onClick={() => setEmpresasRefreshSignal((current) => current + 1)}>
								<RefreshCcw className="h-4 w-4" />
								Atualizar
							</button>
							<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" onClick={() => setEmpresasCreateSignal((current) => current + 1)}>
								<Plus className="h-4 w-4" />
								Novo vínculo
							</button>
						</div>
					),
					render: ({ id: servicoId }) => servicoId ? <ServicoEmpresasPanel id={servicoId} refreshSignal={empresasRefreshSignal} createSignal={empresasCreateSignal} /> : null,
				},
			]}
		/>
	)
}

function ServicoEmpresasPanel({ id, refreshSignal, createSignal }: ServicoEmpresasPanelProps) {
	const [rows, setRows] = useState<ServicoEmpresaRow[]>([])
	const [empresa, setEmpresa] = useState<LookupOption | null>(null)
	const [modalOpen, setModalOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const loadRows = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const result = await httpClient<{ data: ServicoEmpresaRow[] }>(`/api/erp-cadastros/servicos/${id}/empresas`)
			setRows(result.data || [])
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os vínculos de empresas.')
		} finally {
			setLoading(false)
		}
	}, [id])

	async function saveLink() {
		if (!empresa) return
		setSaving(true)
		setError(null)
		try {
			await httpClient(`/api/erp-cadastros/servicos/${id}/empresas`, {
				method: 'POST',
				body: JSON.stringify({ id_empresa: empresa.id }),
			})
			setEmpresa(null)
			setModalOpen(false)
			await loadRows()
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : 'Não foi possível vincular a empresa.')
		} finally {
			setSaving(false)
		}
	}

	async function updateStatus(row: ServicoEmpresaRow, ativo: boolean) {
		setSaving(true)
		setError(null)
		try {
			await httpClient(`/api/erp-cadastros/servicos/${id}/empresas`, {
				method: 'POST',
				body: JSON.stringify({
					id: row.id,
					id_empresa: row.id_empresa,
					intervalo_execucao: row.intervalo_execucao,
					ativo,
				}),
			})
			await loadRows()
		} catch (statusError) {
			setError(statusError instanceof Error ? statusError.message : 'Não foi possível atualizar o status do vínculo.')
		} finally {
			setSaving(false)
		}
	}

	async function unlink(row: ServicoEmpresaRow) {
		if (typeof window !== 'undefined' && !window.confirm('Deseja realmente desvincular este serviço da empresa selecionada?')) {
			return
		}
		setSaving(true)
		setError(null)
		try {
			await httpClient(`/api/erp-cadastros/servicos/${id}/empresas?id_vinculo=${encodeURIComponent(row.id)}`, { method: 'DELETE' })
			await loadRows()
		} catch (unlinkError) {
			setError(unlinkError instanceof Error ? unlinkError.message : 'Não foi possível desvincular a empresa.')
		} finally {
			setSaving(false)
		}
	}

	useEffect(() => {
		void loadRows()
	}, [loadRows])

	useEffect(() => {
		if (refreshSignal > 0) void loadRows()
	}, [loadRows, refreshSignal])

	useEffect(() => {
		if (createSignal > 0) {
			setEmpresa(null)
			setModalOpen(true)
		}
	}, [createSignal])

	const columns: AppDataTableColumn<ServicoEmpresaRow, never>[] = [
		{ id: 'id', label: 'ID', thClassName: 'w-[90px]', cell: (row) => row.id || '-' },
		{ id: 'empresa_nome', label: 'Empresa', cell: (row) => <span className="block whitespace-normal font-semibold text-[color:var(--app-text)] [overflow-wrap:anywhere]">{row.empresa_nome || row.id_empresa}</span> },
		{ id: 'intervalo_execucao', label: 'Intervalo (min)', thClassName: 'w-[150px]', cell: (row) => row.intervalo_execucao || '-' },
		{ id: 'ativo', label: 'Ativo', thClassName: 'w-[110px]', cell: (row) => <StatusBadge tone={row.ativo ? 'success' : 'warning'}>{row.ativo ? 'Sim' : 'Não'}</StatusBadge> },
	]

	return (
		<>
			<SectionCard
				title="Empresas vinculadas"
				description="Cada linha segue o intervalo do serviço e pode ser ativada, inativada ou desvinculada."
				className="overflow-hidden"
			>
				{error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{error}</div> : null}
				{loading ? (
					<div className="flex min-h-36 items-center justify-center text-sm font-semibold text-[color:var(--app-muted)]">
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Carregando vínculos...
					</div>
				) : (
					<AppDataTable
						columns={columns}
						rows={rows}
						getRowId={(row) => row.id || row.id_empresa}
						actionsColumnClassName="w-[128px] whitespace-nowrap"
						rowActions={(row) => [
							{ id: 'status', label: row.ativo ? 'Inativar vínculo' : 'Ativar vínculo', icon: row.ativo ? ToggleLeft : ToggleRight, onClick: () => void updateStatus(row, !row.ativo) },
							{ id: 'unlink', label: 'Desvincular', icon: Unlink, onClick: () => void unlink(row) },
						]}
						emptyMessage="Nenhuma empresa vinculada a este serviço."
						mobileCard={{
							title: (row) => row.empresa_nome || row.id_empresa,
							subtitle: (row) => `Intervalo: ${row.intervalo_execucao || '-'}`,
							badges: (row) => <StatusBadge tone={row.ativo ? 'success' : 'warning'}>{row.ativo ? 'Sim' : 'Não'}</StatusBadge>,
						}}
					/>
				)}
			</SectionCard>

			<OverlayModal
				open={modalOpen}
				title="Vincular empresa"
				onClose={() => setModalOpen(false)}
				maxWidthClassName="max-w-2xl"
				headerActions={(
					<>
						<button type="button" className="app-button-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => setModalOpen(false)}>Cancelar</button>
						<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" disabled={!empresa || saving} onClick={() => void saveLink()}>
							{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
							Vincular
						</button>
					</>
				)}
			>
				<div className="rounded-[1.25rem] border border-line/60 bg-[color:var(--app-control-muted-bg)] p-4">
					<label className="block">
						<span className="mb-1.5 block text-sm font-semibold text-[color:var(--app-text)]">Empresa para vínculo *</span>
						<LookupSelect label="Empresa para vínculo" value={empresa} loadOptions={(query, page, perPage) => loadEmpresasDisponiveis(id, query, page, perPage)} onChange={setEmpresa} pageSize={20} />
						<span className="mt-1.5 block text-xs leading-relaxed text-[color:var(--app-muted)]">A lista exibe apenas empresas compatíveis com o template do serviço e ainda não vinculadas.</span>
					</label>
				</div>
				{text(error) ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{error}</div> : null}
			</OverlayModal>
		</>
	)
}
