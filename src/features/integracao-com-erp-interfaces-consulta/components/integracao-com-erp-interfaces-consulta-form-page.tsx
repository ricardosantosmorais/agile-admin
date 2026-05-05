'use client'

import { Building2, CheckCircle2, Code2, Database, Edit3, Eye, Layers, Loader2, Play, Plus, RefreshCcw, RotateCcw, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn, AppDataTableRowAction } from '@/src/components/data-table/types'
import { CodeEditor } from '@/src/components/ui/code-editor'
import { DynamicResultGrid } from '@/src/components/ui/dynamic-result-grid'
import { FormRow } from '@/src/components/ui/form-row'
import { JsonCodeEditor } from '@/src/components/ui/json-code-editor'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { TabbedIntegrationFormPage, type IntegrationFormTab } from '@/src/features/integracoes/components/tabbed-integration-form-page'
import { INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG } from '@/src/features/integracao-com-erp-interfaces-consulta/services/integracao-com-erp-interfaces-consulta-config'
import { integracaoComErpInterfacesConsultaClient } from '@/src/features/integracao-com-erp-interfaces-consulta/services/integracao-com-erp-interfaces-consulta-client'
import { useI18n } from '@/src/i18n/use-i18n'
import { httpClient } from '@/src/services/http/http-client'

type LinkRow = Record<string, unknown>
type ModalMode = 'template' | 'override'
type PreviewView = 'tree' | 'json' | 'grid'
type QuerySideTab = 'fields' | 'params'

type SelectOption = { value: string; label: string; id_tabela?: string }
type InterfaceContext = { tabela?: Record<string, unknown>; metrics?: { templates?: number; overrides?: number } }
type AliasValidation = {
	ok: boolean
	aliases: string[]
	campos_interface: string[]
	matched_fields: string[]
	missing_fields: string[]
	extra_aliases: string[]
	query_id?: number
} | null

const inputClassName = 'app-input w-full rounded-2xl border border-line/60 bg-transparent px-4 py-3'
const modalPillClassName = 'inline-flex items-center gap-2 rounded-full border border-line/70 bg-[color:var(--app-panel-solid)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[color:var(--app-text)] shadow-sm'
const statePillBaseClassName = 'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] shadow-sm'
const previewPillClassName = 'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.12em] shadow-sm'
const successPillStyle = { backgroundColor: '#d1fae5', borderColor: '#34d399', color: '#064e3b', textShadow: 'none' } as const
const warningPillStyle = { backgroundColor: '#fef3c7', borderColor: '#f59e0b', color: '#78350f', textShadow: 'none' } as const

function statePillClassName(tone: 'success' | 'warning' | 'neutral') {
	if (tone !== 'neutral') return statePillBaseClassName
	return 'inline-flex items-center rounded-full border border-line/70 bg-[color:var(--app-panel-solid)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[color:var(--app-text)] shadow-sm'
}

function statePillStyle(tone: 'success' | 'warning' | 'neutral') {
	if (tone === 'success') return successPillStyle
	if (tone === 'warning') return warningPillStyle
	return undefined
}

function buildInitialRecord() {
	const record: CrudRecord = {}
	for (const section of INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG.sections) {
		for (const field of section.fields) record[field.key] = field.defaultValue ?? ''
	}
	return record
}

function formatJson(value: unknown) {
	try {
		return JSON.stringify(value ?? {}, null, 2)
	} catch {
		return '{}'
	}
}

function parseJsonArray(value: string) {
	try {
		const parsed = JSON.parse(value || '[]')
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

function sourceLabel(value: unknown) {
	const normalized = String(value || '').trim()
	if (normalized === 'query') return 'Query'
	if (normalized === 'endpoint_gateway') return 'Endpoint Gateway'
	return normalized || '-'
}

function rowString(row: LinkRow, key: string) {
	return String(row[key] || '').trim()
}

function optionValueLabel(options: SelectOption[], value: unknown) {
	const id = String(value || '').trim()
	if (!id) return ''
	return options.find((option) => option.value === id)?.label || `#${id}`
}

async function loadCompanyOptions(query: string, page: number, perPage: number): Promise<LookupOption[]> {
	const params = new URLSearchParams({ mode: 'companies', q: query, page: String(page), perPage: String(perPage) })
	const result = await httpClient<{ data?: Array<{ id: string; nome: string }> }>(`/api/querys?${params.toString()}`)
	return (result.data || []).map((item) => ({ id: String(item.id), label: String(item.nome || item.id) }))
}

export function IntegracaoComErpInterfacesConsultaFormPage({ id }: { id?: string }) {
	const router = useRouter()
	const { t } = useI18n()
	const access = useFeatureAccess(INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG.featureKey)
	const isEditing = Boolean(id)
	const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
	const readOnly = isEditing ? !access.canEdit && access.canView : false
	const canSave = !readOnly && (isEditing ? access.canEdit : access.canCreate)
	const [form, setForm] = useState<CrudRecord>(buildInitialRecord)
	const [loading, setLoading] = useState(Boolean(id))
	const [error, setError] = useState<string | null>(null)
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
	const [saving, setSaving] = useState(false)
	const initialRef = useRef<CrudRecord>(buildInitialRecord())

	async function loadRecord() {
		if (!id) return
		setLoading(true)
		setError(null)
		try {
			const loaded = await integracaoComErpInterfacesConsultaClient.getById(id)
			const normalized = INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG.normalizeRecord?.(loaded) ?? loaded
			setForm(normalized)
			initialRef.current = normalized
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a interface de consulta.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadRecord()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!canSave) return
		setFeedback(null)
		setSaving(true)
		try {
			const payload = INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG.beforeSave?.(form) ?? form
			await integracaoComErpInterfacesConsultaClient.save(payload)
			router.push(INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG.routeBase)
		} catch (saveError) {
			setFeedback({ tone: 'error', message: saveError instanceof Error ? saveError.message : 'Não foi possível salvar a interface de consulta.' })
		} finally {
			setSaving(false)
		}
	}

	const breadcrumbs = [
		{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
		{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
		{ label: t('menuKeys.integracao-erp-cadastros-list', 'Cadastros'), href: '/integracao-com-erp/cadastros' },
		{ label: t('maintenance.erpIntegration.catalogs.items.interfacesConsulta.title', 'Interfaces de Consulta'), href: INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG.routeBase },
		{ label: isEditing ? t('routes.editar', 'Editar') : t('routes.novo', 'Novo') },
	]

	const tabs = useMemo<IntegrationFormTab[]>(() => [
		{
			key: 'dados',
			label: 'Dados gerais',
			icon: <Database className="h-4 w-4" />,
			content: id ? <GeneralDataPanel id={id} fallbackForm={form} /> : <PendingSavePanel />,
		},
		{
			key: 'templates',
			label: 'Interface x Templates',
			icon: <Layers className="h-4 w-4" />,
			content: id ? <TemplateLinksPanel id={id} readOnly={readOnly} /> : <PendingSavePanel />,
			hidden: !id,
		},
		{
			key: 'overrides',
			label: 'Override por Empresa',
			icon: <Building2 className="h-4 w-4" />,
			content: id ? <OverrideLinksPanel id={id} readOnly={readOnly} /> : <PendingSavePanel />,
			hidden: !id,
		},
		{
			key: 'preview',
			label: 'Preview',
			icon: <Eye className="h-4 w-4" />,
			content: id ? <PreviewPanel id={id} fallbackForm={form} /> : <PendingSavePanel />,
			hidden: !id,
		},
	], [form, id, readOnly])

	if (!canAccess) {
		return <AccessDeniedState title="Interface de Consulta" backHref={INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG.routeBase} />
	}

	return (
		<TabbedIntegrationFormPage
			title={isEditing ? `Editar Interface de Consulta - ID #${id}` : 'Nova Interface de Consulta'}
			description="Configure a fonte da interface de consulta e acompanhe vínculos operacionais."
			breadcrumbs={breadcrumbs}
			formId="integracao-com-erp-interface-consulta-form"
			loading={loading}
			error={error}
			feedback={feedback}
			onCloseFeedback={() => setFeedback(null)}
			onRefresh={() => void loadRecord()}
			tabs={tabs}
			canSave={canSave}
			hasChanges={JSON.stringify(form) !== JSON.stringify(initialRef.current)}
			saving={saving}
			backHref={INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG.routeBase}
			onSubmit={handleSubmit}
		/>
	)
}

function GeneralDataPanel({ id, fallbackForm }: { id: string; fallbackForm: CrudRecord }) {
	const [context, setContext] = useState<InterfaceContext | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let alive = true
		async function load() {
			setLoading(true)
			try {
				const result = await httpClient<InterfaceContext>(`/api/erp-cadastros/interfaces-consulta/${id}/context`)
				if (alive) setContext(result)
			} catch (loadError) {
				if (alive) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados gerais.')
			} finally {
				if (alive) setLoading(false)
			}
		}
		void load()
		return () => { alive = false }
	}, [id])

	const tabela = context?.tabela || fallbackForm
	return (
		<SectionCard title="Dados gerais">
			{error ? <ErrorPanel message={error} /> : null}
			{loading ? <FormSkeleton /> : (
				<div className="grid gap-4 lg:grid-cols-2">
					<ReadOnlyField label="ID da Interface" value={String(tabela.id || tabela.id_tabela || id)} />
					<ReadOnlyField label="Interface" value={String(tabela.nome || fallbackForm.nome || '-')} />
					<ReadOnlyField label="Templates Configurados" value={String(context?.metrics?.templates ?? 0)} />
					<ReadOnlyField label="Overrides por Empresa" value={String(context?.metrics?.overrides ?? 0)} />
				</div>
			)}
		</SectionCard>
	)
}

function TemplateLinksPanel({ id, readOnly }: { id: string; readOnly: boolean }) {
	const [rows, setRows] = useState<LinkRow[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [modalTemplateId, setModalTemplateId] = useState<string | null>(null)

	const loadRows = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const result = await httpClient<{ data: LinkRow[] }>(`/api/erp-cadastros/interfaces-consulta/${id}/template-links`)
			setRows(result.data || [])
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os vínculos por template.')
		} finally {
			setLoading(false)
		}
	}, [id])

	useEffect(() => { void loadRows() }, [loadRows])

	const columns: AppDataTableColumn<LinkRow, never>[] = [
		{ id: 'template', label: 'Template', cell: (row) => <span className="block whitespace-normal font-semibold text-[color:var(--app-text)] [overflow-wrap:anywhere]">{String(row.template || '-')}</span> },
		{ id: 'effective_source', label: 'Fonte Configurada', thClassName: 'w-[180px]', cell: (row) => <StatusBadge tone="neutral">{sourceLabel(row.effective_source)}</StatusBadge> },
		{ id: 'query_label', label: 'Query', cell: (row) => <span className="block whitespace-normal [overflow-wrap:anywhere]">{String(row.query_label || '-')}</span> },
		{ id: 'endpoint_label', label: 'Endpoint Gateway', cell: (row) => <span className="block whitespace-normal [overflow-wrap:anywhere]">{String(row.endpoint_label || '-')}</span> },
	]

	return (
		<>
			<RelationTableCard
				title="Interface x Templates"
				rows={rows}
				loading={loading}
				error={error}
				emptyMessage="Nenhum template vinculado a esta interface."
				columns={columns}
				getTitle={(row) => String(row.template || '-')}
				getSubtitle={(row) => sourceLabel(row.effective_source)}
				action={!readOnly ? <AddButton label="Adicionar Template" onClick={() => setModalTemplateId('')} /> : null}
				rowActions={(row) => [{
					id: 'edit',
					label: 'Editar',
					icon: Edit3,
					onClick: () => setModalTemplateId(rowString(row, 'id_template')),
				}]}
				onRefresh={loadRows}
			/>
			<InterfaceConfigModal mode="template" interfaceId={id} targetId={modalTemplateId} open={modalTemplateId !== null} onClose={() => setModalTemplateId(null)} onSaved={loadRows} />
		</>
	)
}

function OverrideLinksPanel({ id, readOnly }: { id: string; readOnly: boolean }) {
	const [rows, setRows] = useState<LinkRow[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [modalEmpresaId, setModalEmpresaId] = useState<string | null>(null)

	const loadRows = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const result = await httpClient<{ data: LinkRow[] }>(`/api/erp-cadastros/interfaces-consulta/${id}/override-links`)
			setRows(result.data || [])
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os overrides por empresa.')
		} finally {
			setLoading(false)
		}
	}, [id])

	useEffect(() => { void loadRows() }, [loadRows])

	const columns: AppDataTableColumn<LinkRow, never>[] = [
		{ id: 'empresa', label: 'Empresa', cell: (row) => <span className="block whitespace-normal font-semibold text-[color:var(--app-text)] [overflow-wrap:anywhere]">{String(row.empresa || row.id_empresa || '-')}</span> },
		{ id: 'template', label: 'Template', cell: (row) => <span>{String(row.template || row.id_template || '-')}</span> },
		{ id: 'effective_source', label: 'Fonte Configurada', thClassName: 'w-[180px]', cell: (row) => <StatusBadge tone="neutral">{sourceLabel(row.effective_source)}</StatusBadge> },
		{ id: 'query_label', label: 'Query', cell: (row) => <span className="block whitespace-normal [overflow-wrap:anywhere]">{String(row.query_label || '-')}</span> },
		{ id: 'endpoint_label', label: 'Endpoint Gateway', cell: (row) => <span className="block whitespace-normal [overflow-wrap:anywhere]">{String(row.endpoint_label || '-')}</span> },
		{ id: 'ativo', label: 'Ativo', thClassName: 'w-[100px]', cell: (row) => <StatusBadge tone={row.ativo ? 'success' : 'warning'}>{row.ativo ? 'Sim' : 'Não'}</StatusBadge> },
		{ id: 'observacao', label: 'Observação', cell: (row) => <span className="block whitespace-normal [overflow-wrap:anywhere]">{String(row.observacao || '-')}</span> },
	]

	return (
		<>
			<RelationTableCard
				title="Override por Empresa"
				rows={rows}
				loading={loading}
				error={error}
				emptyMessage="Nenhum override configurado para esta interface."
				columns={columns}
				getTitle={(row) => String(row.empresa || row.id_empresa || '-')}
				getSubtitle={(row) => sourceLabel(row.effective_source)}
				action={!readOnly ? <AddButton label="Adicionar Override" onClick={() => setModalEmpresaId('')} /> : null}
				rowActions={(row) => [{
					id: 'edit',
					label: 'Editar',
					icon: Edit3,
					onClick: () => setModalEmpresaId(rowString(row, 'id_empresa')),
				}]}
				onRefresh={loadRows}
			/>
			<InterfaceConfigModal mode="override" interfaceId={id} targetId={modalEmpresaId} open={modalEmpresaId !== null} onClose={() => setModalEmpresaId(null)} onSaved={loadRows} />
		</>
	)
}

function RelationTableCard({
	title,
	rows,
	loading,
	error,
	emptyMessage,
	columns,
	getTitle,
	getSubtitle,
	action,
	rowActions,
	onRefresh,
}: {
	title: string
	rows: LinkRow[]
	loading: boolean
	error: string | null
	emptyMessage: string
	columns: AppDataTableColumn<LinkRow, never>[]
	getTitle: (row: LinkRow) => string
	getSubtitle: (row: LinkRow) => string
	action: ReactNode
	rowActions: (row: LinkRow) => AppDataTableRowAction<LinkRow>[]
	onRefresh: () => Promise<void>
}) {
	return (
		<SectionCard
			title={title}
			className="min-w-0 overflow-hidden"
			action={<div className="flex items-center gap-2">{action}<RefreshButton loading={loading} onClick={onRefresh} /></div>}
		>
			{error ? <ErrorPanel message={error} /> : null}
			{loading ? <TableSkeleton /> : (
				<div className="overflow-hidden rounded-[1.25rem] border border-line/50">
					<AppDataTable
						columns={columns}
						rows={rows}
						getRowId={(row) => `${String(row.id_template || row.id_empresa || '')}-${String(row.id_query || row.id_gateway_endpoint || '')}`}
						emptyMessage={emptyMessage}
						mobileCard={{ title: getTitle, subtitle: getSubtitle }}
						rowActions={rowActions}
						actionsLabel="Ações"
						actionsColumnClassName="w-[110px] whitespace-nowrap"
					/>
				</div>
			)}
		</SectionCard>
	)
}

function InterfaceConfigModal({ mode, interfaceId, targetId, open, onClose, onSaved }: { mode: ModalMode; interfaceId: string; targetId: string | null; open: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<Record<string, unknown>>({})
	const [draft, setDraft] = useState<Record<string, unknown>>({ tipo_fonte: '' })
	const [consultaMaps, setConsultaMaps] = useState('[]')
	const [retornoMaps, setRetornoMaps] = useState('[]')
	const [querySql, setQuerySql] = useState('')
	const [queryName, setQueryName] = useState('')
	const [queryCompany, setQueryCompany] = useState<LookupOption | null>(null)
	const [queryFonteDados, setQueryFonteDados] = useState('erp')
	const [queryVariables, setQueryVariables] = useState<Array<Record<string, unknown>>>([])
	const [queryResult, setQueryResult] = useState<unknown>(null)
	const [queryResultView, setQueryResultView] = useState<PreviewView>('json')
	const [querySideTab, setQuerySideTab] = useState<QuerySideTab>('fields')
	const [queryRunning, setQueryRunning] = useState(false)
	const [aliasValidation, setAliasValidation] = useState<AliasValidation>(null)

	function patch(key: string, value: unknown) {
		setDraft((current) => ({ ...current, [key]: value }))
	}

	const applyModalResult = useCallback((result: Record<string, unknown>) => {
		setData(result)
		const gateway = (result.gateway_endpoint || {}) as Record<string, unknown>
		const empresa = (result.empresa || {}) as Record<string, unknown>
		const query = (result.query || result.query_override || {}) as Record<string, unknown>
		setDraft({
			id_template: String(result.id_template || ''),
			id_empresa_alvo: String(empresa.id || ''),
			empresa_lookup: empresa.id ? { id: String(empresa.id), label: String(empresa.nome || empresa.nome_fantasia || empresa.id) } : null,
			tipo_fonte: String(result.tipo_fonte || ''),
			id_query: String(query.id || query.id_query || ''),
			id_gateway_endpoint: String(gateway.id || ''),
			ativo: gateway.ativo === undefined ? true : Boolean(gateway.ativo),
			observacao: String(((result.gateway_override || {}) as Record<string, unknown>).observacao || gateway.observacao || ''),
			...gateway,
		})
		setQuerySql(String(query.query || ''))
		setQueryName(String(query.nome || ''))
		setQueryFonteDados(String(query.fonte_dados || query.fonteDados || 'erp'))
		setConsultaMaps(formatJson(result.consulta_maps || []))
		setRetornoMaps(formatJson(result.retorno_maps || []))
		setAliasValidation((result.validation || null) as AliasValidation)
		setQueryResult(null)
	}, [])

	const loadModal = useCallback(async () => {
		if (!open) return
		setLoading(true)
		setError(null)
		try {
			const path = mode === 'template'
				? `/api/erp-cadastros/interfaces-consulta/${interfaceId}/template-form?id_template=${encodeURIComponent(targetId || '')}`
				: `/api/erp-cadastros/interfaces-consulta/${interfaceId}/override-form?id_empresa_alvo=${encodeURIComponent(targetId || '')}`
			const result = await httpClient<Record<string, unknown>>(path)
			applyModalResult(result)
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o modal.')
		} finally {
			setLoading(false)
		}
	}, [applyModalResult, interfaceId, mode, open, targetId])

	useEffect(() => { void loadModal() }, [loadModal])

	async function reloadTemplate(templateId: string) {
		patch('id_template', templateId)
		if (!templateId) return
		setLoading(true)
		setError(null)
		try {
			const result = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/template-form?id_template=${encodeURIComponent(templateId)}`)
			applyModalResult(result)
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a configuração do template.')
		} finally {
			setLoading(false)
		}
	}

	async function reloadOverrideEmpresa(option: LookupOption | null) {
		patch('empresa_lookup', option)
		patch('id_empresa_alvo', option?.id || '')
		if (!option?.id) return
		setLoading(true)
		setError(null)
		try {
			const result = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/override-form?id_empresa_alvo=${encodeURIComponent(option.id)}`)
			applyModalResult(result)
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a configuração da empresa.')
		} finally {
			setLoading(false)
		}
	}

	async function reloadEndpoint(endpointId: string) {
		patch('id_gateway_endpoint', endpointId)
		if (!endpointId) return
		setError(null)
		try {
			const params = new URLSearchParams({ id_gateway_endpoint: endpointId })
			const empresaId = String(draft.id_empresa_alvo || '')
			if (mode === 'override' && empresaId) params.set('id_empresa_alvo', empresaId)
			const result = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/endpoint-detail?${params.toString()}`)
			const endpoint = (result.gateway_endpoint || {}) as Record<string, unknown>
			setDraft((current) => ({ ...current, id_gateway_endpoint: endpointId, ...endpoint }))
			setConsultaMaps(formatJson(result.consulta_maps || []))
			setRetornoMaps(formatJson(result.retorno_maps || []))
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o endpoint selecionado.')
		}
	}

	async function reloadQuery(queryId: string) {
		patch('id_query', queryId)
		setQueryResult(null)
		setAliasValidation(null)
		if (!queryId) {
			setQuerySql('')
			setQueryName('')
			return
		}
		setError(null)
		try {
			const params = new URLSearchParams({
				id_query: queryId,
				id_template: String(draft.id_template || ''),
				id_empresa_alvo: String(draft.id_empresa_alvo || ''),
				id_empresa_execucao: queryCompany?.id || '',
			})
			const result = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/query_load?${params.toString()}`)
			const query = (result.query || {}) as Record<string, unknown>
			setQuerySql(String(query.query || ''))
			setQueryName(String(query.nome || ''))
			setQueryFonteDados(String(query.fonte_dados || query.fonteDados || 'erp'))
			setAliasValidation((result.validation || null) as AliasValidation)
			const variaveis = (result.variaveis || {}) as Record<string, unknown>
			setQueryVariables(Array.isArray(variaveis.parametros) ? variaveis.parametros as Array<Record<string, unknown>> : [])
			const empresaExecucaoId = String(result.empresa_execucao_id || '')
			const empresaExecucao = ((result.empresas_execucao || []) as Array<Record<string, unknown>>).find((item) => String(item.value || '') === empresaExecucaoId)
			if (empresaExecucaoId && empresaExecucao) {
				setQueryCompany({ id: empresaExecucaoId, label: String(empresaExecucao.text || empresaExecucao.value) })
			}
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a query selecionada.')
		}
	}

	async function validateAliases(preferSql = true) {
		const result = await httpClient<NonNullable<AliasValidation>>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/query_aliases_validate`, {
			method: 'POST',
			body: JSON.stringify({
				id_query: preferSql ? '' : draft.id_query || '',
				sql: preferSql ? querySql : '',
			}),
		})
		setAliasValidation(result)
		return result
	}

	async function saveQuery() {
		const templateId = String(draft.id_template || '').trim()
		if (!templateId) {
			setError('Selecione o template antes de salvar a query.')
			return
		}
		if (!queryName.trim()) {
			setError('Informe o nome da query para salvar.')
			return
		}
		if (!querySql.trim()) {
			setError('Informe a query SQL.')
			return
		}
		setQueryRunning(true)
		setError(null)
		try {
			const result = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/query_save`, {
				method: 'POST',
				body: JSON.stringify({
					id_query: draft.id_query || '',
					nome: queryName,
					id_template: templateId,
					query: querySql,
				}),
			})
			const saved = (result.query || {}) as Record<string, unknown>
			if (saved?.id) patch('id_query', String(saved.id))
			if (saved?.nome) setQueryName(String(saved.nome))
			if (Array.isArray(result.queries)) {
				setData((current) => ({ ...current, queries: result.queries }))
			}
			setAliasValidation((result.validation || null) as AliasValidation)
			setQueryResult({ success: result.success || { message: 'Query salva com sucesso.' }, query: saved, validation: result.validation })
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a query.')
		} finally {
			setQueryRunning(false)
		}
	}

	async function loadQueryVariables(option: LookupOption | null) {
		setQueryCompany(option)
		setQueryVariables([])
		if (!option?.id) return
		try {
			const params = new URLSearchParams({
				id_template: String(draft.id_template || ''),
				id_empresa_alvo: String(draft.id_empresa_alvo || ''),
				id_empresa_execucao: option.id,
				id_query: String(draft.id_query || ''),
			})
			const result = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/query_editor_context?${params.toString()}`)
			const variaveis = (result.variaveis || {}) as Record<string, unknown>
			setQueryVariables(Array.isArray(variaveis.parametros) ? variaveis.parametros as Array<Record<string, unknown>> : [])
		} catch {
			setQueryVariables([])
		}
	}

	async function refreshQueryContext() {
		const templateId = String(draft.id_template || '').trim()
		const empresaAlvo = String(draft.id_empresa_alvo || '').trim()
		if (!templateId && !empresaAlvo) {
			setError(mode === 'template' ? 'Selecione o template para atualizar o contexto.' : 'Selecione a empresa para atualizar o contexto.')
			return
		}
		setQueryRunning(true)
		setError(null)
		try {
			const params = new URLSearchParams({
				id_template: templateId,
				id_empresa_alvo: empresaAlvo,
				id_empresa_execucao: queryCompany?.id || '',
				id_query: String(draft.id_query || ''),
			})
			const result = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/query_editor_context?${params.toString()}`)
			const variaveis = (result.variaveis || {}) as Record<string, unknown>
			setQueryVariables(Array.isArray(variaveis.parametros) ? variaveis.parametros as Array<Record<string, unknown>> : [])
			setAliasValidation((result.validation || null) as AliasValidation)
			if (Array.isArray(result.queries)) {
				setData((current) => ({ ...current, queries: result.queries }))
			}
			const empresaExecucaoId = String(result.empresa_execucao_id || '')
			const empresaExecucao = ((result.empresas_execucao || []) as Array<Record<string, unknown>>).find((item) => String(item.value || '') === empresaExecucaoId)
			if (!queryCompany && empresaExecucaoId && empresaExecucao) {
				setQueryCompany({ id: empresaExecucaoId, label: String(empresaExecucao.text || empresaExecucao.value) })
			}
		} catch (contextError) {
			setError(contextError instanceof Error ? contextError.message : 'Não foi possível atualizar o contexto da query.')
		} finally {
			setQueryRunning(false)
		}
	}

	async function executeQuery() {
		if (!queryCompany?.id) {
			setError('Selecione a empresa para executar a query.')
			return
		}
		if (!querySql.trim()) {
			setError('Informe a query SQL para executar.')
			return
		}
		setQueryRunning(true)
		setError(null)
		try {
			const result = await httpClient(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/query_execute`, {
				method: 'POST',
				body: JSON.stringify({ id_empresa_execucao: queryCompany.id, fonte_dados: queryFonteDados, sql: querySql }),
			})
			setQueryResult(result)
			await validateAliases(true)
		} catch (runError) {
			setError(runError instanceof Error ? runError.message : 'Não foi possível executar a query.')
		} finally {
			setQueryRunning(false)
		}
	}

	async function save() {
		setSaving(true)
		setError(null)
		try {
			if (draft.tipo_fonte === 'query') {
				if (!draft.id_query) throw new Error(mode === 'template' ? 'Selecione a query da configuração.' : 'Selecione a query do override.')
				const validation = await validateAliases(false)
				if (!validation.ok) {
					throw new Error(mode === 'template'
						? 'A query selecionada não cobre todos os campos da interface. Ajuste os aliases antes de salvar a configuração.'
						: 'A query selecionada não cobre todos os campos da interface. Ajuste os aliases antes de salvar o override.')
				}
			}
			const endpointPayload = {
				id: draft.id || draft.id_gateway_endpoint || '',
				id_gateway: draft.id_gateway || '',
				endpoint: draft.endpoint || '',
				verbo: draft.verbo || 'get',
				parametros: draft.parametros || '',
				url_filtro: draft.url_filtro || '',
				tipo: draft.tipo || 'consulta',
				ativo: draft.ativo ?? true,
				body: draft.body || '',
				data_array: draft.data_array || '',
				tipo_paginacao: draft.tipo_paginacao || 'SemPaginacao',
				nome_propriedade_pagina: draft.nome_propriedade_pagina || '',
				nome_propriedade_por_pagina: draft.nome_propriedade_por_pagina || '',
				quantidade_por_pagina: draft.quantidade_por_pagina || '',
				nome_retorno_pagina_atual: draft.nome_retorno_pagina_atual || '',
				nome_retorno_total_paginas: draft.nome_retorno_total_paginas || '',
			}
			const body = mode === 'template'
				? {
					id_template: draft.id_template,
					tipo_fonte: draft.tipo_fonte,
					id_query: draft.id_query,
					gateway_endpoint: endpointPayload,
					consulta_maps: parseJsonArray(consultaMaps),
					retorno_maps: parseJsonArray(retornoMaps),
				}
				: {
					id_empresa_alvo: draft.id_empresa_alvo,
					tipo_fonte: draft.tipo_fonte,
					id_query: draft.id_query,
					ativo: draft.ativo,
					observacao: draft.observacao,
					gateway_endpoint: endpointPayload,
					consulta_maps: parseJsonArray(consultaMaps),
					retorno_maps: parseJsonArray(retornoMaps),
				}
			await httpClient(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/${mode === 'template' ? 'template-form' : 'override-form'}`, {
				method: 'POST',
				body: JSON.stringify(body),
			})
			onClose()
			await onSaved()
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar.')
		} finally {
			setSaving(false)
		}
	}

	const title = mode === 'template' ? (targetId ? 'Editar Template da Interface' : 'Adicionar Template') : (targetId ? 'Editar Override por Empresa' : 'Adicionar Override')
	const templateOptions = (data.templates || []) as SelectOption[]
	const queryOptions = (data.queries || []) as SelectOption[]
	const gatewayOptions = (data.gateways || []) as SelectOption[]
	const endpointOptions = (data.endpoints || []) as SelectOption[]
	const isEndpoint = draft.tipo_fonte === 'endpoint_gateway'
	const isQuery = draft.tipo_fonte === 'query'
	const modalSubjectLabel = mode === 'template'
		? optionValueLabel(templateOptions, draft.id_template) || String(draft.id_template || 'Template não selecionado')
		: String(((draft.empresa_lookup as LookupOption | null)?.label || optionValueLabel(templateOptions, draft.id_template) || draft.id_empresa_alvo || 'Empresa não selecionada'))
	const sourceReady = isQuery ? Boolean(draft.id_query && aliasValidation?.ok) : isEndpoint ? Boolean(draft.id_gateway && draft.endpoint) : false
	const sourceStatusLabel = !draft.tipo_fonte ? 'Fonte pendente' : sourceReady ? 'Configuração pronta' : 'Configuração pendente'
	async function loadTemplateOptions(query: string, page: number, perPage: number): Promise<LookupOption[]> {
		const params = new URLSearchParams({ q: query, page: String(page), perPage: String(perPage) })
		const result = await httpClient<{ data?: LookupOption[] }>(`/api/erp-cadastros/interfaces-consulta/${interfaceId}/template-options?${params.toString()}`)
		return result.data || []
	}

	return (
		<OverlayModal
			open={open}
			title={title}
			onClose={onClose}
			maxWidthClassName="max-w-[min(1600px,calc(100vw-3rem))]"
			bodyClassName="pr-2"
			headerActions={(
				<>
					<button type="button" className="app-button-secondary inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold" onClick={onClose} disabled={saving}>Cancelar</button>
					<button type="button" className="app-button-primary inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60" onClick={() => void save()} disabled={saving}>
						{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
						{saving ? 'Salvando...' : 'Salvar configuração'}
					</button>
				</>
			)}
		>
			{error ? <ErrorPanel message={error} /> : null}
			{loading ? <FormSkeleton /> : (
				<div className="space-y-5">
					<section className="overflow-hidden rounded-[1.6rem] border border-line/60 bg-[linear-gradient(135deg,var(--app-control-muted-bg),transparent_58%)] p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
						<div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
							<div className="min-w-0 space-y-4">
								<div className="flex flex-wrap items-center gap-2">
									<span className={modalPillClassName}>
										<Sparkles className="h-3.5 w-3.5" />
										{mode === 'template' ? 'Template da interface' : 'Override por empresa'}
									</span>
									<span className={statePillClassName(sourceReady ? 'success' : 'warning')} style={statePillStyle(sourceReady ? 'success' : 'warning')}>
										{sourceStatusLabel}
									</span>
								</div>
								<div className="space-y-2">
									<div className="flex flex-wrap items-center gap-3">
										<span className="inline-flex rounded-2xl bg-[color:var(--app-text)] px-3 py-1.5 text-sm font-black text-[color:var(--app-panel-solid)]">{sourceLabel(draft.tipo_fonte)}</span>
										<div className="min-w-0 flex-1 text-2xl font-black text-[color:var(--app-text)] [overflow-wrap:anywhere]">{modalSubjectLabel}</div>
									</div>
									<div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--app-muted)]">
										<span className="inline-flex items-center gap-1.5">
											<ShieldCheck className="h-4 w-4 text-emerald-500" />
											{isQuery ? `${aliasValidation?.matched_fields?.length || 0}/${(data.campos as unknown[] | undefined)?.length || 0} campos cobertos` : 'Configuração de gateway vinculada à interface'}
										</span>
										<span className="hidden h-1 w-1 rounded-full bg-[color:var(--app-muted)] sm:inline-flex" />
										<span>{isQuery ? optionValueLabel(queryOptions, draft.id_query) || 'Query não selecionada' : String(draft.endpoint || 'Endpoint não informado')}</span>
									</div>
								</div>
							</div>
							{isQuery ? (
								<div className="flex shrink-0 flex-wrap gap-2">
									<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" onClick={() => { patch('id_query', ''); setQueryName(''); setQuerySql(''); setAliasValidation(null); setQueryResult(null) }} disabled={queryRunning}>
										<Code2 className="h-4 w-4" />
										Nova query
									</button>
									<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" onClick={() => void refreshQueryContext()} disabled={queryRunning}>
										{queryRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
										Atualizar contexto
									</button>
									<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void executeQuery()} disabled={queryRunning}>
										{queryRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
										{queryRunning ? 'Executando...' : 'Executar query'}
									</button>
									<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" onClick={() => void saveQuery()} disabled={queryRunning}>
										<CheckCircle2 className="h-4 w-4" />
										Salvar query
									</button>
								</div>
							) : null}
						</div>
					</section>

					<div className="app-control-muted rounded-[1.25rem] p-4">
						<div className={`grid gap-4 ${isQuery ? 'xl:grid-cols-[minmax(170px,0.75fr)_minmax(240px,1fr)_minmax(260px,1.25fr)_minmax(220px,1fr)_minmax(220px,1fr)_minmax(150px,0.65fr)]' : 'xl:grid-cols-[minmax(180px,0.8fr)_minmax(280px,1fr)_minmax(260px,1fr)_minmax(190px,0.75fr)]'}`}>
							<ModalField label="Tipo da Fonte" required>
								<select className={inputClassName} value={String(draft.tipo_fonte || '')} onChange={(event) => patch('tipo_fonte', event.target.value)}>
									<option value="">Selecione</option>
									<option value="query">Query</option>
									<option value="endpoint_gateway">Endpoint Gateway</option>
								</select>
							</ModalField>
							{mode === 'template' ? (
								<ModalField label="Template" required>
									<LookupSelect
										label="Template"
										value={draft.id_template ? { id: String(draft.id_template), label: optionValueLabel(templateOptions, draft.id_template) || String(draft.id_template) } : null}
										disabled={Boolean(targetId)}
										loadOptions={loadTemplateOptions}
										onChange={(option) => void reloadTemplate(option?.id || '')}
										pageSize={20}
									/>
								</ModalField>
							) : (
								<ModalField label="Empresa" required>
									<LookupSelect label="Empresa" value={(draft.empresa_lookup as LookupOption | null) || null} disabled={Boolean(targetId)} loadOptions={loadCompanyOptions} onChange={(option) => void reloadOverrideEmpresa(option)} />
								</ModalField>
							)}
							{mode === 'override' && !isQuery ? <ModalField label="Template da Empresa"><input className={inputClassName} value={optionValueLabel(templateOptions, draft.id_template) || String(draft.id_template || '')} readOnly /></ModalField> : null}
							{isQuery ? (
								<>
									<ModalField label="Query" required>
										<select className={inputClassName} value={String(draft.id_query || '')} onChange={(event) => void reloadQuery(event.target.value)}>
											<option value="">Selecione</option>
											{queryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
										</select>
									</ModalField>
									<ModalField label="Nome da Query" required>
										<input className={inputClassName} value={queryName} onChange={(event) => setQueryName(event.target.value)} placeholder="Ex.: Q_Pedidos_APS" />
									</ModalField>
									<ModalField label="Empresa para Execução" required>
										<LookupSelect label="Empresa para Execução" value={queryCompany} loadOptions={loadCompanyOptions} onChange={(option) => void loadQueryVariables(option)} pageSize={20} />
									</ModalField>
									<ModalField label="Fonte">
										<select className={inputClassName} value={queryFonteDados} onChange={(event) => setQueryFonteDados(event.target.value)}>
											<option value="erp">ERP</option>
											<option value="agileecommerce">Agile Ecommerce</option>
										</select>
									</ModalField>
								</>
							) : null}
						</div>
					</div>

					{isQuery ? (
						<QueryWorkbench
							mode={mode}
							draft={draft}
							querySql={querySql}
							setQuerySql={setQuerySql}
							queryVariables={queryVariables}
							fields={(data.campos || []) as Array<Record<string, unknown>>}
							aliasValidation={aliasValidation}
							sideTab={querySideTab}
							setSideTab={setQuerySideTab}
							result={queryResult}
							resultView={queryResultView}
							setResultView={setQueryResultView}
						/>
					) : null}

					{isEndpoint ? (
						<EndpointGatewayWorkbench
							mode={mode}
							draft={draft}
							patch={patch}
							gatewayOptions={gatewayOptions}
							endpointOptions={endpointOptions}
							consultaMaps={consultaMaps}
							setConsultaMaps={setConsultaMaps}
							retornoMaps={retornoMaps}
							setRetornoMaps={setRetornoMaps}
							reloadEndpoint={reloadEndpoint}
						/>
					) : null}
				</div>
			)}
		</OverlayModal>
	)
}

function QueryWorkbench({
	mode,
	draft,
	querySql,
	setQuerySql,
	queryVariables,
	fields,
	aliasValidation,
	sideTab,
	setSideTab,
	result,
	resultView,
	setResultView,
}: {
	mode: ModalMode
	draft: Record<string, unknown>
	querySql: string
	setQuerySql: (value: string) => void
	queryVariables: Array<Record<string, unknown>>
	fields: Array<Record<string, unknown>>
	aliasValidation: AliasValidation
	sideTab: QuerySideTab
	setSideTab: (tab: QuerySideTab) => void
	result: unknown
	resultView: PreviewView
	setResultView: (view: PreviewView) => void
}) {
	const rows = result && typeof result === 'object' && Array.isArray((result as Record<string, unknown>).rows)
		? (result as Record<string, unknown>).rows as Record<string, unknown>[]
		: result && typeof result === 'object' && Array.isArray((result as Record<string, unknown>).data)
			? (result as Record<string, unknown>).data as Record<string, unknown>[]
			: []
	return (
		<div className="space-y-5">
			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
				<section className="app-control-muted min-w-0 overflow-hidden rounded-[1.25rem]">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 px-4 py-3">
						<div>
							<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
								<Code2 className="h-4.5 w-4.5 text-emerald-500" />
								Editor SQL
							</div>
							<div className="mt-1 text-xs text-[color:var(--app-muted)]">{mode === 'template' ? 'Query padrão deste template.' : 'Query específica para esta empresa.'}</div>
						</div>
						<span className={statePillClassName(aliasValidation?.ok ? 'success' : 'warning')} style={statePillStyle(aliasValidation?.ok ? 'success' : 'warning')}>
							{aliasValidation?.ok ? 'Aliases OK' : 'Validar aliases'}
						</span>
					</div>
					<div className="h-[560px] p-3">
						<CodeEditor editorId={`interface-query-${mode}-${String(draft.id_query || 'new')}`} language="sql" value={querySql} onChange={setQuerySql} />
					</div>
				</section>

				<section className="app-control-muted overflow-hidden rounded-[1.25rem]">
					<div className="grid grid-cols-2 gap-2 border-b border-line/40 p-2">
						<button type="button" className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${sideTab === 'fields' ? 'bg-[color:var(--app-panel-solid)] text-[color:var(--app-text)] shadow-sm' : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]'}`} onClick={() => setSideTab('fields')}>Campos da Interface</button>
						<button type="button" className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${sideTab === 'params' ? 'bg-[color:var(--app-panel-solid)] text-[color:var(--app-text)] shadow-sm' : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]'}`} onClick={() => setSideTab('params')}>Parâmetros</button>
					</div>
					<div className="max-h-[560px] overflow-auto p-4">
						{sideTab === 'fields' ? <InterfaceFieldsList fields={fields} querySql={querySql} validation={aliasValidation} /> : <QueryParamsList variables={queryVariables} />}
					</div>
				</section>
			</div>

			<section className="app-control-muted min-w-0 overflow-hidden rounded-[1.25rem]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 px-4 py-3">
					<div>
						<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
							<Database className="h-4.5 w-4.5 text-emerald-500" />
							Resultado da execução
						</div>
						<div className="mt-1 text-xs text-[color:var(--app-muted)]">Retorno da última execução da query.</div>
					</div>
					<ViewSwitcher view={resultView} onChange={setResultView} />
				</div>
				<div className="p-3">
					{resultView === 'grid' ? <DynamicResultGrid rows={rows} emptyMessage="Execute a query para visualizar o grid." maxHeightClassName="max-h-[340px]" /> : <JsonCodeEditor id={`query-workbench-${mode}-result`} value={formatJson(result)} onChange={() => undefined} readOnly height="340px" />}
				</div>
			</section>
		</div>
	)
}

function EndpointGatewayWorkbench({
	mode,
	draft,
	patch,
	gatewayOptions,
	endpointOptions,
	consultaMaps,
	setConsultaMaps,
	retornoMaps,
	setRetornoMaps,
	reloadEndpoint,
}: {
	mode: ModalMode
	draft: Record<string, unknown>
	patch: (key: string, value: unknown) => void
	gatewayOptions: SelectOption[]
	endpointOptions: SelectOption[]
	consultaMaps: string
	setConsultaMaps: (value: string) => void
	retornoMaps: string
	setRetornoMaps: (value: string) => void
	reloadEndpoint: (endpointId: string) => void
}) {
	const gatewayLabel = optionValueLabel(gatewayOptions, draft.id_gateway) || 'Gateway não selecionado'
	const endpointLabel = optionValueLabel(endpointOptions, draft.id_gateway_endpoint) || String(draft.endpoint || 'Endpoint não selecionado')
	return (
		<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
			<section className="app-control-muted min-w-0 overflow-hidden rounded-[1.25rem]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 px-4 py-3">
					<div>
						<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
							<ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
							Endpoint Gateway
						</div>
						<div className="mt-1 text-xs text-[color:var(--app-muted)]">{gatewayLabel} · {endpointLabel}</div>
					</div>
					<span className={statePillClassName('neutral')}>
						{String(draft.verbo || 'get').toUpperCase()}
					</span>
				</div>
				<div className="space-y-5 p-4">
					<div className="grid gap-4 lg:grid-cols-2">
						<ModalField label="Gateway" required>
							<select className={inputClassName} value={String(draft.id_gateway || '')} onChange={(event) => patch('id_gateway', event.target.value)}>
								<option value="">Selecione</option>
								{gatewayOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
							</select>
						</ModalField>
						<ModalField label="Endpoint Existente">
							<select className={inputClassName} value={String(draft.id_gateway_endpoint || '')} onChange={(event) => reloadEndpoint(event.target.value)}>
								<option value="">Novo endpoint</option>
								{endpointOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
							</select>
						</ModalField>
						<ModalField label="Path" required>
							<input className={inputClassName} value={String(draft.endpoint || '')} onChange={(event) => patch('endpoint', event.target.value)} placeholder="/pedidos" />
						</ModalField>
						<ModalField label="Verbo">
							<select className={inputClassName} value={String(draft.verbo || 'get')} onChange={(event) => patch('verbo', event.target.value)}>
								<option value="get">GET</option>
								<option value="post">POST</option>
								<option value="put">PUT</option>
								<option value="patch">PATCH</option>
								<option value="delete">DELETE</option>
							</select>
						</ModalField>
						<ModalField label="Parâmetros">
							<input className={inputClassName} value={String(draft.parametros || '')} onChange={(event) => patch('parametros', event.target.value)} placeholder="id={id}&page={page}" />
						</ModalField>
						<ModalField label="Tipo">
							<select className={inputClassName} value={String(draft.tipo || 'consulta')} onChange={(event) => patch('tipo', event.target.value)}>
								<option value="consulta">Consulta</option>
								<option value="autenticacao">Autenticação</option>
								<option value="token">Token</option>
							</select>
						</ModalField>
					</div>
					<ModalField label="URL Filtro">
						<textarea className={`${inputClassName} min-h-28 resize-y`} value={String(draft.url_filtro || '')} onChange={(event) => patch('url_filtro', event.target.value)} />
					</ModalField>
					<ModalField label="Body">
						<JsonCodeEditor id={`interface-gateway-body-${mode}`} value={String(draft.body || '')} onChange={(value) => patch('body', value)} height="260px" />
					</ModalField>
					<div className="grid gap-4 lg:grid-cols-2">
						<ModalField label="Data Array">
							<input className={inputClassName} value={String(draft.data_array || '')} onChange={(event) => patch('data_array', event.target.value)} />
						</ModalField>
						<ModalField label="Tipo Paginação">
							<select className={inputClassName} value={String(draft.tipo_paginacao || 'SemPaginacao')} onChange={(event) => patch('tipo_paginacao', event.target.value)}>
								<option value="SemPaginacao">Sem paginação</option>
								<option value="PorPagina">Por página</option>
								<option value="ProximaPagina">Próxima página</option>
								<option value="Cursor">Cursor</option>
							</select>
						</ModalField>
						<ModalField label="Nome Propriedade Página">
							<input className={inputClassName} value={String(draft.nome_propriedade_pagina || '')} onChange={(event) => patch('nome_propriedade_pagina', event.target.value)} />
						</ModalField>
						<ModalField label="Nome Propriedade Por Página">
							<input className={inputClassName} value={String(draft.nome_propriedade_por_pagina || '')} onChange={(event) => patch('nome_propriedade_por_pagina', event.target.value)} />
						</ModalField>
						<ModalField label="Quantidade Por Página">
							<input className={inputClassName} value={String(draft.quantidade_por_pagina || '')} onChange={(event) => patch('quantidade_por_pagina', event.target.value)} />
						</ModalField>
						<ModalField label="Retorno Página Atual">
							<input className={inputClassName} value={String(draft.nome_retorno_pagina_atual || '')} onChange={(event) => patch('nome_retorno_pagina_atual', event.target.value)} />
						</ModalField>
						<ModalField label="Retorno Total de Páginas">
							<input className={inputClassName} value={String(draft.nome_retorno_total_paginas || '')} onChange={(event) => patch('nome_retorno_total_paginas', event.target.value)} />
						</ModalField>
						{mode === 'override' ? (
							<ModalField label="Observação">
								<input className={inputClassName} value={String(draft.observacao || '')} onChange={(event) => patch('observacao', event.target.value)} />
							</ModalField>
						) : null}
					</div>
				</div>
			</section>

			<aside className="space-y-5">
				<section className="app-control-muted min-w-0 overflow-hidden rounded-[1.25rem]">
					<div className="flex items-center justify-between gap-3 border-b border-line/40 px-4 py-3">
						<div>
							<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
								<Search className="h-4.5 w-4.5 text-emerald-500" />
								Mapeamento de Consulta
							</div>
							<div className="mt-1 text-xs text-[color:var(--app-muted)]">Entrada enviada ao endpoint.</div>
						</div>
					</div>
					<div className="p-3">
						<JsonCodeEditor id={`interface-gateway-consulta-maps-${mode}`} value={consultaMaps} onChange={setConsultaMaps} height="300px" />
					</div>
				</section>
				<section className="app-control-muted min-w-0 overflow-hidden rounded-[1.25rem]">
					<div className="flex items-center justify-between gap-3 border-b border-line/40 px-4 py-3">
						<div>
							<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
								<Database className="h-4.5 w-4.5 text-emerald-500" />
								Mapeamento de Retorno
							</div>
							<div className="mt-1 text-xs text-[color:var(--app-muted)]">Saída convertida para a interface.</div>
						</div>
					</div>
					<div className="p-3">
						<JsonCodeEditor id={`interface-gateway-retorno-maps-${mode}`} value={retornoMaps} onChange={setRetornoMaps} height="300px" />
					</div>
				</section>
			</aside>
		</div>
	)
}
function ModalField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
	return (
		<label className="block min-w-0">
			<span className="mb-2 block text-sm font-semibold text-[color:var(--app-text)]">
				{label}
				{required ? <span className="ml-1 text-red-500">*</span> : null}
			</span>
			{children}
		</label>
	)
}

function InterfaceFieldsList({ fields, querySql, validation }: { fields: Array<Record<string, unknown>>; querySql: string; validation: AliasValidation }) {
	if (!fields.length) return <div className="text-sm text-[color:var(--app-muted)]">Nenhum campo cadastrado para esta interface.</div>
	const normalizedSql = querySql.toLowerCase()
	const covered = validation ? validation.ok : fields.every((field) => normalizedSql.includes(String(field.nome || '').toLowerCase()))
	const missing = new Set((validation?.missing_fields || []).map((field) => field.toLowerCase()))
	const matched = new Set((validation?.matched_fields || []).map((field) => field.toLowerCase()))
	return (
		<div className="space-y-3">
			<div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${covered ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100' : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100'}`}>
				{covered ? 'Todos os campos da interface possuem alias correspondente.' : 'Alguns campos podem não estar cobertos pela query.'}
			</div>
			{validation?.extra_aliases.length ? (
				<div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-xs text-sky-700 dark:text-sky-200">
					Aliases adicionais: {validation.extra_aliases.join(', ')}
				</div>
			) : null}
			<div className="divide-y divide-line/50">
				{fields.map((field) => {
					const name = String(field.nome || '-')
					const normalized = name.toLowerCase()
					const isCovered = validation ? matched.has(normalized) && !missing.has(normalized) : normalizedSql.includes(normalized)
					return (
						<div key={String(field.id_tabela_campo || name)} className="flex items-center justify-between gap-4 py-3">
							<div>
								<div className="font-semibold text-[color:var(--app-text)]">{name}</div>
								<div className="text-xs text-[color:var(--app-muted)]">{String(field.tipo || '-')}</div>
							</div>
							<span className={`text-xs font-black uppercase tracking-[0.14em] ${isCovered ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>{isCovered ? 'Coberto' : 'Pendente'}</span>
						</div>
					)
				})}
			</div>
		</div>
	)
}

function QueryParamsList({ variables }: { variables: Array<Record<string, unknown>> }) {
	if (!variables.length) return <div className="text-sm text-[color:var(--app-muted)]">Selecione uma empresa para carregar os parâmetros disponíveis.</div>
	return (
		<div className="space-y-3">
			{variables.map((item, index) => (
				<div key={`${String(item.nome || item.name || index)}-${index}`} className="rounded-2xl border border-line/50 bg-[color:var(--app-control-muted-bg)] px-4 py-3">
					<div className="font-semibold text-[color:var(--app-text)]">@{String(item.nome || item.name || '-')}</div>
					<div className="mt-1 text-xs text-[color:var(--app-muted)]">{String(item.descricao || item.description || 'Parâmetro disponível para execução.')}</div>
					{item.valor || item.value ? <div className="mt-2 font-mono text-xs text-[color:var(--app-text)]">{String(item.valor || item.value)}</div> : null}
				</div>
			))}
		</div>
	)
}

function PreviewPanel({ id, fallbackForm }: { id: string; fallbackForm: CrudRecord }) {
	const [company, setCompany] = useState<LookupOption | null>(null)
	const [queryString, setQueryString] = useState('page=1&perpage=20')
	const [resolving, setResolving] = useState(false)
	const [running, setRunning] = useState(false)
	const [resolved, setResolved] = useState<Record<string, unknown> | null>(null)
	const [result, setResult] = useState<unknown>(null)
	const [error, setError] = useState<string | null>(null)
	const [view, setView] = useState<PreviewView>('tree')

	async function loadResolved(option: LookupOption | null) {
		setCompany(option)
		setResolved(null)
		setResult(null)
		setError(null)
		if (!option) return
		setResolving(true)
		try {
			const data = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/interfaces-consulta/${id}/resolved?id_empresa_alvo=${encodeURIComponent(option.id)}`)
			setResolved(data)
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a configuração resolvida.')
		} finally {
			setResolving(false)
		}
	}

	async function run() {
		if (!company || !resolved) {
			setError('Selecione uma empresa e carregue a configuração resolvida antes de executar o preview.')
			return
		}
		setRunning(true)
		setError(null)
		try {
			const template = (resolved.template || {}) as Record<string, unknown>
			const data = await httpClient(`/api/erp-cadastros/interfaces-consulta/${id}/preview`, {
				method: 'POST',
				body: JSON.stringify({ id_empresa_alvo: company.id, id_template: template.id, query_string: queryString }),
			})
			setResult(data)
		} catch (runError) {
			setError(runError instanceof Error ? runError.message : 'Falha ao executar o preview.')
		} finally {
			setRunning(false)
		}
	}

	const template = (resolved?.template || {}) as Record<string, unknown>
	const queryPadrao = (resolved?.query_padrao || {}) as Record<string, unknown>
	const queryOverride = (resolved?.query_override || {}) as Record<string, unknown>
	const gatewayPadrao = (resolved?.gateway_padrao || {}) as Record<string, unknown>
	const gatewayOverride = (resolved?.gateway_override || {}) as Record<string, unknown>
	const resolucao = (resolved?.resolucao || {}) as Record<string, unknown>
	const gridRows = result && typeof result === 'object' && Array.isArray((result as Record<string, unknown>).data) ? (result as Record<string, unknown>).data as Record<string, unknown>[] : []

	return (
		<div className="space-y-5">
			<div className="app-control-muted rounded-[1.25rem] border border-line/50 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
				<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
					<div className="flex min-w-0 flex-wrap items-center gap-3">
						<span className={previewPillClassName} style={successPillStyle}>
							<Sparkles className="h-3.5 w-3.5" />
							Preview
						</span>
						<div className="min-w-0">
							<div className="truncate text-base font-black text-[color:var(--app-text)]">{String(fallbackForm.nome || `Interface #${id}`)}</div>
							<div className="text-xs text-[color:var(--app-muted)]">Selecione uma empresa e execute a fonte resolvida.</div>
						</div>
					</div>
					<button type="button" className="app-button-primary inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-60" onClick={() => void run()} disabled={running || !resolved}>
						{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
						{running ? 'Executando...' : 'Executar Preview'}
					</button>
				</div>
			</div>

			{error ? <ErrorPanel message={error} /> : null}

			<div className="grid gap-5 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
				<SectionCard title="Contexto do Preview">
					<div className="space-y-4">
						<FormRow label="Empresa" required><LookupSelect label="Empresa" value={company} onChange={(option) => void loadResolved(option)} loadOptions={loadCompanyOptions} pageSize={20} /></FormRow>
						<FormRow label="Query String"><input className={inputClassName} value={queryString} onChange={(event) => setQueryString(event.target.value)} placeholder="page=1&perpage=20&search=teste" /></FormRow>
						{resolving ? <div className="rounded-2xl border border-line/50 px-4 py-3 text-sm text-[color:var(--app-muted)]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Carregando configuração resolvida...</div> : null}
						<div className="grid gap-3 sm:grid-cols-2">
							<ReadOnlyField label="Template da Empresa" value={String(template.text || '')} />
							<ReadOnlyField label="Fonte Resolvida" value={sourceLabel(resolucao.tipo_fonte)} />
							<ReadOnlyField label="Camada de Resolução" value={String(resolucao.camada_resolucao || '')} />
							<ReadOnlyField label="Observação do Override" value={String(gatewayOverride.observacao || '')} />
						</div>
						<ReadOnlyField label="Query Padrão" value={String(queryPadrao.label || '')} />
						<ReadOnlyField label="Query Override" value={String(queryOverride.label || '')} />
						<ReadOnlyField label="Endpoint Gateway Padrão" value={String(gatewayPadrao.label || '')} />
						<ReadOnlyField label="Endpoint Gateway Override" value={String(gatewayOverride.label || '')} />
					</div>
				</SectionCard>
				<div className="space-y-5">
					<SectionCard title="Configuração Resolvida">
						<div className="grid gap-4 xl:grid-cols-2">
							<JsonCodeEditor id="preview-consulta-maps" value={formatJson(resolucao.consulta_maps || [])} onChange={() => undefined} readOnly height="220px" />
							<JsonCodeEditor id="preview-retorno-maps" value={formatJson(resolucao.retorno_maps || [])} onChange={() => undefined} readOnly height="220px" />
						</div>
						<div className="mt-4"><JsonCodeEditor id="preview-resolved-config" value={formatJson(resolucao)} onChange={() => undefined} readOnly height="260px" /></div>
					</SectionCard>
					<SectionCard title="Retorno do Preview" action={<ViewSwitcher view={view} onChange={setView} />}>
						{view === 'json' ? (
							<JsonCodeEditor id="interfaces-consulta-preview-json" value={formatJson(result)} onChange={() => undefined} readOnly height="420px" />
						) : view === 'grid' ? (
							<DynamicResultGrid rows={gridRows} emptyMessage="Execute o preview para visualizar o grid." maxHeightClassName="max-h-[420px]" />
						) : (
							<pre className="min-h-[420px] overflow-auto rounded-2xl border border-line/40 bg-[color:var(--app-panel-solid)]/70 p-4 font-mono text-sm leading-relaxed text-[color:var(--app-text)]">{formatJson(result)}</pre>
						)}
					</SectionCard>
				</div>
			</div>
		</div>
	)
}

function ViewSwitcher({ view, onChange }: { view: PreviewView; onChange: (view: PreviewView) => void }) {
	return (
		<div className="inline-flex overflow-hidden rounded-xl border border-line/60 bg-[color:var(--app-panel-solid)]/50 p-1">
			{(['tree', 'json', 'grid'] as PreviewView[]).map((option) => (
				<button key={option} type="button" className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === option ? 'app-button-primary' : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]'}`} onClick={() => onChange(option)}>
					{option === 'tree' ? 'Tree' : option === 'json' ? 'JSON' : 'Grid'}
				</button>
			))}
		</div>
	)
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
	return <button type="button" onClick={onClick} className="app-button-primary inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"><Plus className="h-4 w-4" />{label}</button>
}

function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
	return <button type="button" onClick={onClick} disabled={loading} className="app-button-secondary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}Atualizar</button>
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
	return (
		<label className="block">
			<span className="mb-2 block text-sm font-semibold text-[color:var(--app-text)]">{label}</span>
			<input className={`${inputClassName} bg-[color:var(--app-control-muted-bg)]`} value={value || '-'} readOnly />
		</label>
	)
}

function ErrorPanel({ message }: { message: string }) {
	return <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">{message}</div>
}

function TableSkeleton() {
	return (
		<div className="overflow-hidden rounded-[1.25rem] border border-line/50">
			<div className="grid grid-cols-4 gap-3 border-b border-line/50 bg-[color:var(--app-control-muted-bg)] px-4 py-3">
				{Array.from({ length: 4 }).map((_, index) => <div key={`head-${index}`} className="h-4 animate-pulse rounded-full bg-[color:var(--app-muted)]/20" />)}
			</div>
			<div className="divide-y divide-line/40">
				{Array.from({ length: 5 }).map((_, row) => (
					<div key={`row-${row}`} className="grid grid-cols-4 gap-3 px-4 py-4">
						{Array.from({ length: 4 }).map((__, col) => <div key={`cell-${row}-${col}`} className="h-5 animate-pulse rounded-full bg-[color:var(--app-muted)]/15" />)}
					</div>
				))}
			</div>
		</div>
	)
}

function FormSkeleton() {
	return <div className="space-y-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-2xl bg-[color:var(--app-muted)]/15" />)}</div>
}

function PendingSavePanel() {
	return (
		<div className="rounded-3xl border border-dashed border-line/70 p-5 text-sm text-[color:var(--app-muted)]">
			Salve a interface de consulta para habilitar as abas operacionais.
		</div>
	)
}


