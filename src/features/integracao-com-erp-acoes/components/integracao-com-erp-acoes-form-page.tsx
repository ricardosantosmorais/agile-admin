'use client'

import { Building2, Copy, Edit, FileSearch, ListChecks, Loader2, Plus, Save, Settings, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { ScriptCodeEditor } from '@/src/features/integracao-com-erp-scripts/components/script-code-editor'
import { ACAO_EXECUTION_OPTIONS } from '@/src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes'
import { INTEGRACAO_COM_ERP_ACOES_CONFIG } from '@/src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes-config'
import { integracaoComErpAcoesClient } from '@/src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes-client'
import { loadErpCatalogLookup } from '@/src/lib/erp-catalog-lookups'
import { httpClient } from '@/src/services/http/http-client'

type Row = Record<string, unknown>

const inputClassName = 'app-input w-full rounded-2xl border border-line/60 bg-transparent px-4 py-3 text-sm'
const mutedPanelClassName = 'rounded-[1.25rem] border border-line/60 bg-[color:var(--app-control-muted-bg)] p-4'
const detailLanguageOptions = [
	{ value: 'agilescript', label: 'agilescript' },
	{ value: 'razor', label: 'razor' },
] as const
const detailObjectOptions = [
	{ value: 'query', label: 'query' },
	{ value: 'script', label: 'script' },
	{ value: 'razor', label: 'razor' },
] as const
const executionOptions = Array.isArray(ACAO_EXECUTION_OPTIONS) ? ACAO_EXECUTION_OPTIONS : [
	{ value: 'Leitura', label: 'Leitura' },
	{ value: 'Gravacao', label: 'Gravação' },
	{ value: 'Comparacao', label: 'Comparação' },
	{ value: 'LeituraApi', label: 'LeituraApi' },
	{ value: 'GravacaoApi', label: 'GravacaoApi' },
	{ value: 'ComparacaoApi', label: 'ComparacaoApi' },
]

function text(value: unknown) {
	return String(value ?? '').trim()
}

function bool(value: unknown, fallback = true) {
	if (value === null || value === undefined || value === '') return fallback
	if (typeof value === 'boolean') return value
	if (typeof value === 'number') return value === 1
	return ['1', 'true', 'sim', 'on', 'yes'].includes(String(value).trim().toLowerCase())
}

function lookup(id: unknown, label: unknown): LookupOption | null {
	const value = text(id)
	if (!value) return null
	return { id: value, label: text(label) || value }
}

function ModalField({ label, required, helper, children }: { label: string; required?: boolean; helper?: string; children: ReactNode }) {
	return (
		<label className="block min-w-0">
			<span className="mb-1.5 block text-sm font-semibold text-[color:var(--app-text)]">
				{label}{required ? ' *' : ''}
			</span>
			{children}
			{helper ? <span className="mt-1.5 block text-xs leading-relaxed text-[color:var(--app-muted)]">{helper}</span> : null}
		</label>
	)
}

function DetailLookupField({
	label,
	value,
	onChange,
	resource,
	required,
}: {
	label: string
	value: LookupOption | null
	onChange: (option: LookupOption | null) => void
	resource: 'gateways' | 'gateways_endpoints' | 'empresas'
	required?: boolean
}) {
	return (
		<ModalField label={label} required={required}>
			<LookupSelect label={label} value={value} onChange={onChange} loadOptions={(q, p, pp) => loadErpCatalogLookup(resource, q, p, pp)} pageSize={20} />
		</ModalField>
	)
}

function ScriptBlock({ id, label, value, language, onChange, height = '240px', required = false }: { id: string; label: string; value: string; language: string; onChange: (value: string) => void; height?: string; required?: boolean }) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-black text-[color:var(--app-text)]">{label}{required ? ' *' : ''}</span>
				<span className="rounded-full border border-line/60 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{language || 'texto'}</span>
			</div>
			<ScriptCodeEditor editorId={id} language={(language || 'agilescript').toLowerCase()} value={value} onChange={onChange} height={height} />
		</div>
	)
}

export function IntegracaoComErpAcoesFormPage({ id }: { id?: string }) {
	const router = useRouter()
	const [duplicateOpen, setDuplicateOpen] = useState(false)
	const [duplicateName, setDuplicateName] = useState('')
	const [duplicateLoading, setDuplicateLoading] = useState(false)
	const [currentName, setCurrentName] = useState('')
	const [duplicateError, setDuplicateError] = useState<string | null>(null)

	useEffect(() => {
		let alive = true
		if (!id) return
		integracaoComErpAcoesClient.getById(id)
			.then((record) => {
				if (alive) setCurrentName(text(record.nome))
			})
			.catch(() => undefined)
		return () => { alive = false }
	}, [id])

	function openDuplicate() {
		setDuplicateError(null)
		setDuplicateName(currentName ? `Cópia de ${currentName}` : '')
		setDuplicateOpen(true)
	}

	const config = {
		...INTEGRACAO_COM_ERP_ACOES_CONFIG,
		renderHeaderActions: id ? () => (
			<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" onClick={openDuplicate}>
				<Copy className="h-4 w-4" />
				Duplicar ação
			</button>
		) : undefined,
	}

	async function duplicate() {
		if (!id || !duplicateName.trim()) return
		setDuplicateLoading(true)
		setDuplicateError(null)
		try {
			const result = await httpClient<{ id?: string | number }>(`/api/erp-cadastros/acoes/${id}/duplicar`, { method: 'POST', body: JSON.stringify({ nome: duplicateName }) })
			setDuplicateOpen(false)
			const newId = text(result.id)
			if (newId) router.push(`/integracao-com-erp/cadastros/acoes/${newId}/editar`)
		} catch (error) {
			setDuplicateError(error instanceof Error ? error.message : 'Não foi possível duplicar a ação.')
		} finally {
			setDuplicateLoading(false)
		}
	}

	return (
		<>
			<TabbedCatalogFormPage
				config={config}
				client={integracaoComErpAcoesClient}
				id={id}
				tabs={[
					{ key: 'dados', label: 'Dados Gerais', icon: <Settings className="h-4 w-4" />, sectionIds: ['main'] },
					{ key: 'detalhes', label: 'Detalhes da Ação', icon: <ListChecks className="h-4 w-4" />, hidden: ({ isEditing }) => !isEditing, render: ({ id: acaoId }) => acaoId ? <AcaoDetailsPanel id={acaoId} /> : null },
				]}
			/>
			<OverlayModal
				open={duplicateOpen}
				title="Duplicar ação"
				onClose={() => setDuplicateOpen(false)}
				maxWidthClassName="max-w-xl"
				headerActions={(
					<>
						<button type="button" className="app-button-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => setDuplicateOpen(false)}>Cancelar</button>
						<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" disabled={duplicateLoading || !duplicateName.trim()} onClick={() => void duplicate()}>
							{duplicateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
							{duplicateLoading ? 'Duplicando...' : 'Duplicar'}
						</button>
					</>
				)}
			>
				<div className="space-y-4">
					<div className={mutedPanelClassName}>
						<div className="text-sm font-black text-[color:var(--app-text)]">Nova ação</div>
						<div className="mt-1 text-xs leading-relaxed text-[color:var(--app-muted)]">A duplicação copia os dados gerais e todos os detalhes da ação original.</div>
					</div>
					<label className="block">
						<span className="mb-1.5 block text-sm font-semibold text-[color:var(--app-text)]">Nome da nova ação *</span>
						<input className={inputClassName} value={duplicateName} onChange={(event) => setDuplicateName(event.target.value)} placeholder="Nome da nova ação" autoFocus />
					</label>
					{duplicateError ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">{duplicateError}</div> : null}
				</div>
			</OverlayModal>
		</>
	)
}

function AcaoDetailsPanel({ id }: { id: string }) {
	const [rows, setRows] = useState<Row[]>([])
	const [loading, setLoading] = useState(false)
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
	const [modalOpen, setModalOpen] = useState(false)
	const [saving, setSaving] = useState(false)
	const [editing, setEditing] = useState<Row | null>(null)
	const [overridesOpen, setOverridesOpen] = useState(false)
	const [selectedDetail, setSelectedDetail] = useState<Row | null>(null)
	const [overrides, setOverrides] = useState<Row[]>([])
	const [overridesLoading, setOverridesLoading] = useState(false)
	const [overrideFormOpen, setOverrideFormOpen] = useState(false)
	const [overrideEditing, setOverrideEditing] = useState<Row | null>(null)
	const [overrideSaving, setOverrideSaving] = useState(false)
	const [logsOpen, setLogsOpen] = useState(false)
	const [logs, setLogs] = useState<Row[]>([])
	const [logsLoading, setLogsLoading] = useState(false)
	const [logsTitle, setLogsTitle] = useState('')

	async function loadDetails() {
		setLoading(true)
		try {
			const result = await httpClient<{ data: Row[] }>(`/api/erp-cadastros/acoes/${id}/detalhes`, { method: 'GET' })
			setRows(result.data || [])
		} catch (error) {
			setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível carregar os detalhes.' })
			setRows([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadDetails()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id])

	function patch(key: string, value: unknown) {
		setEditing((current) => ({ ...(current || {}), [key]: value }))
	}

	function patchOverride(key: string, value: unknown) {
		setOverrideEditing((current) => ({ ...(current || {}), [key]: value }))
	}

	function buildDetail(row?: Row): Row {
		return row ? {
			...row,
			id_gateway_lookup: lookup(row.id_gateway, row.gateway_nome),
			id_gateway_execucao_lookup: lookup(row.id_gateway_execucao, row.gateway_execucao_nome),
			id_gateway_endpoint_execucao_lookup: lookup(row.id_gateway_endpoint_execucao, row.gateway_endpoint_execucao_nome),
			id_gateway_endpoint_embed_lookup: lookup(row.id_gateway_endpoint_embed, row.gateway_endpoint_embed_nome),
		} : {
			ativo: true,
			tipo_execucao: 'Leitura',
			linguagem: 'agilescript',
			tipo_objeto: 'query',
			script: '',
			script_retorno: '',
			script_embed: '',
		}
	}

	function openModal(row?: Row) {
		setFeedback(null)
		setEditing(buildDetail(row))
		setModalOpen(true)
	}

	async function saveDetail() {
		if (!editing) return
		setSaving(true)
		setFeedback(null)
		try {
			await httpClient(`/api/erp-cadastros/acoes/${id}/detalhes`, { method: 'POST', body: JSON.stringify(editing) })
			setModalOpen(false)
			setEditing(null)
			await loadDetails()
			setFeedback({ tone: 'success', message: 'Detalhe da ação salvo com sucesso.' })
		} catch (error) {
			setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar o detalhe.' })
		} finally {
			setSaving(false)
		}
	}

	async function loadOverrides(detail: Row) {
		setSelectedDetail(detail)
		setOverridesOpen(true)
		setOverridesLoading(true)
		setFeedback(null)
		try {
			const result = await httpClient<{ data: Row[] }>(`/api/erp-cadastros/acoes/${id}/detalhes/${text(detail.id)}/empresas`, { method: 'GET' })
			setOverrides(result.data || [])
		} catch (error) {
			setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível carregar os overrides.' })
			setOverrides([])
		} finally {
			setOverridesLoading(false)
		}
	}

	function openOverrideForm(row?: Row) {
		setOverrideEditing(row ? {
			...row,
			id_empresa_alvo: row.id_empresa,
			id_empresa_alvo_lookup: lookup(row.id_empresa, row.empresa_nome),
			id_gateway_endpoint_embed_lookup: lookup(row.id_gateway_endpoint_embed, row.gateway_endpoint_embed_nome),
		} : {
			id_acao_detalhe: selectedDetail?.id,
			ativo: true,
			linguagem: text(selectedDetail?.linguagem) || 'agilescript',
			script: text(selectedDetail?.script),
			script_retorno: text(selectedDetail?.script_retorno),
			script_embed: text(selectedDetail?.script_embed),
			id_gateway_endpoint_embed: text(selectedDetail?.id_gateway_endpoint_embed),
			id_gateway_endpoint_embed_lookup: lookup(selectedDetail?.id_gateway_endpoint_embed, selectedDetail?.gateway_endpoint_embed_nome),
			observacao: '',
		})
		setOverrideFormOpen(true)
	}

	async function saveOverride() {
		if (!selectedDetail || !overrideEditing) return
		setOverrideSaving(true)
		setFeedback(null)
		try {
			await httpClient(`/api/erp-cadastros/acoes/${id}/detalhes/${text(selectedDetail.id)}/empresas`, { method: 'POST', body: JSON.stringify(overrideEditing) })
			setOverrideFormOpen(false)
			setOverrideEditing(null)
			await loadOverrides(selectedDetail)
			setFeedback({ tone: 'success', message: 'Override salvo com sucesso.' })
		} catch (error) {
			setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar o override.' })
		} finally {
			setOverrideSaving(false)
		}
	}

	async function openLogs(row: Row) {
		if (!selectedDetail) return
		setLogsOpen(true)
		setLogsTitle(text(row.id))
		setLogsLoading(true)
		try {
			const result = await httpClient<{ data: Row[] }>(`/api/erp-cadastros/acoes/${id}/detalhes/${text(selectedDetail.id)}/empresas/${text(row.id)}/logs`, { method: 'GET' })
			setLogs(result.data || [])
		} catch (error) {
			setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível carregar os logs.' })
			setLogs([])
		} finally {
			setLogsLoading(false)
		}
	}

	const columns: AppDataTableColumn<Row, never>[] = [
		{ id: 'ordem', label: 'Ordem', thClassName: 'w-[90px]', cell: (row) => text(row.ordem) || '-' },
		{ id: 'tipo_execucao', label: 'Execução', thClassName: 'w-[140px]', cell: (row) => <StatusBadge tone="neutral">{text(row.tipo_execucao) || '-'}</StatusBadge> },
		{ id: 'linguagem', label: 'Linguagem', thClassName: 'w-[140px]', cell: (row) => text(row.linguagem) || '-' },
		{ id: 'tipo_objeto', label: 'Tipo objeto', cell: (row) => <span className="whitespace-normal [overflow-wrap:anywhere]">{text(row.tipo_objeto) || '-'}</span> },
		{ id: 'id_gateway', label: 'Gateway Origem', cell: (row) => text(row.gateway_nome) || '-' },
		{ id: 'id_gateway_execucao', label: 'Gateway Execução', cell: (row) => text(row.gateway_execucao_nome) || '-' },
		{ id: 'id_gateway_endpoint_execucao', label: 'Endpoint Execução', cell: (row) => text(row.gateway_endpoint_execucao_nome) || '-' },
		{ id: 'ativo', label: 'Ativo', thClassName: 'w-[100px]', cell: (row) => <StatusBadge tone={bool(row.ativo) ? 'success' : 'warning'}>{bool(row.ativo) ? 'Sim' : 'Não'}</StatusBadge> },
	]

	const overrideColumns: AppDataTableColumn<Row, never>[] = [
		{ id: 'id', label: 'ID', thClassName: 'w-[80px]', cell: (row) => text(row.id) || '-' },
		{ id: 'empresa', label: 'Empresa', cell: (row) => text(row.empresa_nome) || `Empresa #${text(row.id_empresa)}` },
		{ id: 'linguagem', label: 'Linguagem', thClassName: 'w-[140px]', cell: (row) => text(row.linguagem) || '-' },
		{ id: 'data_hora', label: 'Atualizado em', thClassName: 'w-[180px]', cell: (row) => text(row.data_hora) || '-' },
		{ id: 'id_usuario', label: 'Usuário', thClassName: 'w-[120px]', cell: (row) => text(row.id_usuario) || '-' },
		{ id: 'ativo', label: 'Ativo', thClassName: 'w-[100px]', cell: (row) => <StatusBadge tone={bool(row.ativo) ? 'success' : 'warning'}>{bool(row.ativo) ? 'Sim' : 'Não'}</StatusBadge> },
	]

	const logColumns: AppDataTableColumn<Row, never>[] = [
		{ id: 'id', label: 'ID', thClassName: 'w-[80px]', cell: (row) => text(row.id) || '-' },
		{ id: 'data_hora', label: 'Data', thClassName: 'w-[180px]', cell: (row) => text(row.data_hora) || '-' },
		{ id: 'usuario', label: 'Usuário', thClassName: 'w-[160px]', cell: (row) => text(row.usuario) || '-' },
		{ id: 'linguagem', label: 'Linguagem', thClassName: 'w-[140px]', cell: (row) => text(row.linguagem) || '-' },
		{ id: 'observacao', label: 'Observação', cell: (row) => <span className="whitespace-normal [overflow-wrap:anywhere]">{text(row.observacao) || '-'}</span> },
		{ id: 'data_hora_script', label: 'Data Script', thClassName: 'w-[180px]', cell: (row) => text(row.data_hora_script) || '-' },
	]

	const language = text(editing?.linguagem) || 'agilescript'
	const overrideLanguage = text(overrideEditing?.linguagem) || 'agilescript'

	return (
		<SectionCard title="Detalhes da ação" description="Cadastre os passos de execução, configure gateways, scripts, overrides por empresa e consulte o histórico operacional.">
			<div className="space-y-4">
				{feedback ? <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${feedback.tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'}`}>{feedback.message}</div> : null}
				<div className="flex justify-end">
					<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" onClick={() => openModal()}>
						<Plus className="h-4 w-4" />
						Novo detalhe
					</button>
				</div>
				{loading ? (
					<div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-line/60 text-sm font-semibold text-[color:var(--app-muted)]">
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Carregando detalhes...
					</div>
				) : (
					<AppDataTable
						columns={columns}
						rows={rows}
						getRowId={(row) => text(row.id || row.ordem)}
						rowActions={(row) => [
							{ id: 'edit', label: 'Editar detalhe', icon: Edit, onClick: () => openModal(row) },
							{ id: 'overrides', label: 'Overrides por empresa', icon: Building2, onClick: () => void loadOverrides(row) },
						]}
						emptyMessage="Nenhum detalhe cadastrado para esta ação."
						mobileCard={{
							title: (row) => `Ordem ${text(row.ordem) || '-'}`,
							subtitle: (row) => `${text(row.tipo_execucao) || '-'} · ${text(row.tipo_objeto) || '-'}`,
							badges: (row) => <StatusBadge tone={bool(row.ativo) ? 'success' : 'warning'}>{bool(row.ativo) ? 'Sim' : 'Não'}</StatusBadge>,
						}}
					/>
				)}
			</div>

			<OverlayModal
				open={modalOpen}
				title={editing?.id ? 'Editar detalhe da ação' : 'Novo detalhe da ação'}
				onClose={() => setModalOpen(false)}
				maxWidthClassName="max-w-[min(1500px,calc(100vw-3rem))]"
				headerActions={(
					<>
						<button type="button" className="app-button-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => setModalOpen(false)}>Cancelar</button>
						<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" disabled={saving} onClick={() => void saveDetail()}>
							{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
							{saving ? 'Salvando...' : 'Salvar detalhe'}
						</button>
					</>
				)}
			>
				{editing ? (
					<div className="space-y-5">
						<div className="rounded-[1.35rem] border border-line/60 bg-[linear-gradient(135deg,var(--app-control-muted-bg),transparent_58%)] p-5">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-0">
									<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line/60 bg-[color:var(--app-panel-solid)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[color:var(--app-text)] shadow-sm">
										<ShieldCheck className="h-3.5 w-3.5" />
										Detalhe da ação
									</div>
									<div className="text-2xl font-black text-[color:var(--app-text)]">Ordem {text(editing.ordem) || '-'}</div>
									<div className="mt-1 text-sm text-[color:var(--app-muted)]">{text(editing.tipo_execucao) || 'Execução pendente'} · {text(editing.linguagem) || 'Linguagem pendente'}</div>
								</div>
								<BooleanChoice value={bool(editing.ativo)} onChange={(next) => patch('ativo', next)} trueLabel="Ativo" falseLabel="Inativo" />
							</div>
						</div>

						<div className="space-y-5">
							<div className={mutedPanelClassName}>
								<div className="mb-4 flex items-center justify-between gap-3">
									<div>
										<div className="text-sm font-black text-[color:var(--app-text)]">Configuração do detalhe</div>
										<div className="mt-1 text-xs leading-relaxed text-[color:var(--app-muted)]">Dados que definem como este passo participa da execução da ação.</div>
									</div>
								</div>
								<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[140px_minmax(190px,1fr)_minmax(190px,1fr)_minmax(190px,1fr)]">
									<ModalField label="Ordem" required helper="Ordem de execução dentro da ação."><input className={inputClassName} type="number" min={1} value={text(editing.ordem)} onChange={(event) => patch('ordem', event.target.value)} /></ModalField>
									<ModalField label="Tipo Execução" required helper="Determina como o script será tratado."><select className={inputClassName} value={text(editing.tipo_execucao)} onChange={(event) => patch('tipo_execucao', event.target.value)}><option value="">Selecione</option>{executionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></ModalField>
									<ModalField label="Linguagem" required helper="Linguagem usada para compilar e executar os scripts."><select className={inputClassName} value={language} onChange={(event) => patch('linguagem', event.target.value)}><option value="">Selecione</option>{detailLanguageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></ModalField>
									<ModalField label="Tipo Objeto" required helper="Classificação do conteúdo processado."><select className={inputClassName} value={text(editing.tipo_objeto)} onChange={(event) => patch('tipo_objeto', event.target.value)}><option value="">Selecione</option>{detailObjectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></ModalField>
								</div>
								<div className="mt-4 grid gap-4 md:grid-cols-2">
									<ModalField label="Nome Objeto" helper="Nome lógico do objeto para referência no fluxo."><input className={inputClassName} value={text(editing.nome_objeto)} onChange={(event) => patch('nome_objeto', event.target.value)} /></ModalField>
									<ModalField label="Saída Objeto" helper="Identificador da saída para uso nos próximos passos."><input className={inputClassName} value={text(editing.saida_objeto)} onChange={(event) => patch('saida_objeto', event.target.value)} /></ModalField>
								</div>
							</div>

							<div className={mutedPanelClassName}>
								<div className="mb-4 flex items-center justify-between gap-3">
									<div>
										<div className="text-sm font-black text-[color:var(--app-text)]">Gateways e endpoints</div>
										<div className="mt-1 text-xs leading-relaxed text-[color:var(--app-muted)]">Origem, execução e enriquecimento usados por este detalhe quando aplicável.</div>
									</div>
								</div>
								<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
									<DetailLookupField label="Gateway Origem" resource="gateways" value={(editing.id_gateway_lookup as LookupOption | null) || null} onChange={(option) => { patch('id_gateway', option?.id || ''); patch('id_gateway_lookup', option) }} />
									<DetailLookupField label="Gateway Execução" resource="gateways" value={(editing.id_gateway_execucao_lookup as LookupOption | null) || null} onChange={(option) => { patch('id_gateway_execucao', option?.id || ''); patch('id_gateway_execucao_lookup', option) }} />
									<DetailLookupField label="Endpoint Execução" resource="gateways_endpoints" value={(editing.id_gateway_endpoint_execucao_lookup as LookupOption | null) || null} onChange={(option) => { patch('id_gateway_endpoint_execucao', option?.id || ''); patch('id_gateway_endpoint_execucao_lookup', option) }} />
									<DetailLookupField label="Endpoint Embed" resource="gateways_endpoints" value={(editing.id_gateway_endpoint_embed_lookup as LookupOption | null) || null} onChange={(option) => { patch('id_gateway_endpoint_embed', option?.id || ''); patch('id_gateway_endpoint_embed_lookup', option) }} />
								</div>
							</div>
						</div>

						<div className="grid gap-5 xl:grid-cols-2">
							<div className="xl:col-span-2"><ScriptBlock id="acao-detalhe-script" label="Script Principal" required language={language} value={text(editing.script)} onChange={(value) => patch('script', value)} height="340px" /></div>
							<ScriptBlock id="acao-detalhe-script-retorno" label="Script Retorno" language={language} value={text(editing.script_retorno)} onChange={(value) => patch('script_retorno', value)} />
							<ScriptBlock id="acao-detalhe-script-embed" label="Script Embed" language={language} value={text(editing.script_embed)} onChange={(value) => patch('script_embed', value)} />
						</div>
					</div>
				) : null}
			</OverlayModal>

			<OverlayModal
				open={overridesOpen}
				title={`Overrides por Empresa${selectedDetail?.ordem ? ` - Detalhe ${text(selectedDetail.ordem)}` : ''}`}
				onClose={() => setOverridesOpen(false)}
				maxWidthClassName="max-w-[min(1320px,calc(100vw-3rem))]"
				headerActions={<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" onClick={() => openOverrideForm()}><Plus className="h-4 w-4" />Novo override</button>}
			>
				{overridesLoading ? (
					<div className="flex min-h-40 items-center justify-center text-sm font-semibold text-[color:var(--app-muted)]"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando overrides...</div>
				) : (
					<AppDataTable
						columns={overrideColumns}
						rows={overrides}
						getRowId={(row) => text(row.id)}
						actionsColumnClassName="w-[120px] whitespace-nowrap"
						rowActions={(row) => [
							{ id: 'edit', label: 'Editar override', icon: Edit, onClick: () => openOverrideForm(row) },
							{ id: 'logs', label: 'Logs do override', icon: FileSearch, onClick: () => void openLogs(row) },
						]}
						emptyMessage="Nenhum override cadastrado para este detalhe."
						mobileCard={{
							title: (row) => text(row.empresa_nome) || `Empresa #${text(row.id_empresa)}`,
							subtitle: (row) => text(row.data_hora) || '',
							badges: (row) => <StatusBadge tone={bool(row.ativo) ? 'success' : 'warning'}>{bool(row.ativo) ? 'Sim' : 'Não'}</StatusBadge>,
						}}
					/>
				)}
			</OverlayModal>

			<OverlayModal
				open={overrideFormOpen}
				title={overrideEditing?.id ? 'Editar override por empresa' : 'Novo override por empresa'}
				onClose={() => setOverrideFormOpen(false)}
				maxWidthClassName="max-w-[min(1400px,calc(100vw-3rem))]"
				headerActions={(
					<>
						<button type="button" className="app-button-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => setOverrideFormOpen(false)}>Cancelar</button>
						<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" disabled={overrideSaving} onClick={() => void saveOverride()}>
							{overrideSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
							{overrideSaving ? 'Salvando...' : 'Salvar override'}
						</button>
					</>
				)}
			>
				{overrideEditing ? (
					<div className="space-y-5">
						<div className="rounded-[1.35rem] border border-line/60 bg-[linear-gradient(135deg,var(--app-control-muted-bg),transparent_58%)] p-5">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-0">
									<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line/60 bg-[color:var(--app-panel-solid)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[color:var(--app-text)] shadow-sm">
										<Building2 className="h-3.5 w-3.5" />
										Override por empresa
									</div>
									<div className="text-2xl font-black text-[color:var(--app-text)]">{text((overrideEditing.id_empresa_alvo_lookup as LookupOption | null)?.label) || 'Empresa pendente'}</div>
									<div className="mt-1 text-sm text-[color:var(--app-muted)]">Detalhe {text(selectedDetail?.ordem) || '-'} · {overrideLanguage}</div>
								</div>
								<BooleanChoice value={bool(overrideEditing.ativo)} onChange={(next) => patchOverride('ativo', next)} trueLabel="Ativo" falseLabel="Inativo" />
							</div>
						</div>
						<div className={mutedPanelClassName}>
							<div className="grid gap-4 lg:grid-cols-[minmax(240px,1.3fr)_180px_160px_minmax(240px,1.2fr)]">
								<DetailLookupField label="Empresa" required resource="empresas" value={(overrideEditing.id_empresa_alvo_lookup as LookupOption | null) || null} onChange={(option) => { patchOverride('id_empresa_alvo', option?.id || ''); patchOverride('id_empresa_alvo_lookup', option) }} />
								<ModalField label="Linguagem" required><select className={inputClassName} value={overrideLanguage} onChange={(event) => patchOverride('linguagem', event.target.value)}><option value="">Selecione</option>{detailLanguageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></ModalField>
								<ModalField label="Usuário"><input className={inputClassName} value={text(overrideEditing.id_usuario)} onChange={(event) => patchOverride('id_usuario', event.target.value)} /></ModalField>
								<DetailLookupField label="Endpoint Embed" resource="gateways_endpoints" value={(overrideEditing.id_gateway_endpoint_embed_lookup as LookupOption | null) || null} onChange={(option) => { patchOverride('id_gateway_endpoint_embed', option?.id || ''); patchOverride('id_gateway_endpoint_embed_lookup', option) }} />
							</div>
						</div>
						<div className="grid gap-5 xl:grid-cols-2">
							<div className="xl:col-span-2"><ScriptBlock id="acao-override-script" label="Script Principal" required language={overrideLanguage} value={text(overrideEditing.script)} onChange={(value) => patchOverride('script', value)} height="320px" /></div>
							<ScriptBlock id="acao-override-script-retorno" label="Script Retorno" language={overrideLanguage} value={text(overrideEditing.script_retorno)} onChange={(value) => patchOverride('script_retorno', value)} />
							<ScriptBlock id="acao-override-script-embed" label="Script Embed" language={overrideLanguage} value={text(overrideEditing.script_embed)} onChange={(value) => patchOverride('script_embed', value)} />
						</div>
						<ModalField label="Observação"><textarea className={`${inputClassName} min-h-28`} value={text(overrideEditing.observacao)} onChange={(event) => patchOverride('observacao', event.target.value)} /></ModalField>
					</div>
				) : null}
			</OverlayModal>

			<OverlayModal open={logsOpen} title={`Histórico do Override #${logsTitle}`} onClose={() => setLogsOpen(false)} maxWidthClassName="max-w-[min(1200px,calc(100vw-3rem))]">
				{logsLoading ? (
					<div className="flex min-h-40 items-center justify-center text-sm font-semibold text-[color:var(--app-muted)]"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando logs...</div>
				) : (
					<AppDataTable
						columns={logColumns}
						rows={logs}
						getRowId={(row) => text(row.id)}
						emptyMessage="Nenhum log encontrado para este override."
						mobileCard={{
							title: (row) => text(row.data_hora) || `Log #${text(row.id)}`,
							subtitle: (row) => text(row.observacao) || text(row.linguagem),
						}}
					/>
				)}
			</OverlayModal>
		</SectionCard>
	)
}
