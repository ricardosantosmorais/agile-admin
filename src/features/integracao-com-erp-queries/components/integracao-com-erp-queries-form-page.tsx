'use client'

import { Database, FileCode2, History, Layers3, Loader2, Play } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { resolveCrudLookupOption } from '@/src/components/crud-base/crud-client'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { DynamicResultGrid } from '@/src/components/ui/dynamic-result-grid'
import { FormRow } from '@/src/components/ui/form-row'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { SqlEditorMonaco } from '@/src/features/editor-sql/components/sql-editor-monaco'
import type { SqlDataSource, SqlEditorExecuteResponse } from '@/src/features/editor-sql/services/sql-editor-types'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { TabbedIntegrationFormPage, type IntegrationFormTab } from '@/src/features/integracoes/components/tabbed-integration-form-page'
import { integracaoComErpQueriesClient, type QueryCompanyOption, type QueryMappingRecord, type QuerySupportItem } from '@/src/features/integracao-com-erp-queries/services/integracao-com-erp-queries-client'
import { loadQueryTemplateOptions, normalizeQueryRecord } from '@/src/features/integracao-com-erp-queries/services/integracao-com-erp-queries'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

type Props = {
	id?: string
}

type QueryFormState = {
	id: string
	ativo: boolean
	nome: string
	id_template: string
	id_template_lookup: LookupOption | null
	query: string
	hash: string
}

const EMPTY_FORM: QueryFormState = {
	id: '',
	ativo: true,
	nome: '',
	id_template: '',
	id_template_lookup: null,
	query: '',
	hash: '',
}

function asString(value: unknown) {
	return String(value ?? '').trim()
}

function buildForm(record: CrudRecord): QueryFormState {
	const normalized = normalizeQueryRecord(record)
	const lookup = normalized.id_template_lookup && typeof normalized.id_template_lookup === 'object'
		? normalized.id_template_lookup as { id?: unknown; label?: unknown }
		: null

	return {
		id: asString(normalized.id),
		ativo: normalized.ativo === true,
		nome: asString(normalized.nome),
		id_template: asString(normalized.id_template),
		id_template_lookup: lookup?.id ? { id: asString(lookup.id), label: asString(lookup.label || lookup.id) } : null,
		query: asString(normalized.query),
		hash: asString(normalized.hash),
	}
}

function SupportPanel({ title, items, sql }: { title: string; items: QuerySupportItem[]; sql: string }) {
	return (
		<div className="app-control-muted rounded-[1.15rem] p-4">
			<div className="border-b border-line/40 pb-3">
				<div className="text-(--app-text) text-base font-semibold">{title}</div>
			</div>
			<div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
				{items.length ? items.map((item) => {
					const token = item.parentId === 'parametro' ? `@${item.label}` : item.label
					const used = item.parentId !== 'parametro' || sql.includes(token)
					return (
						<div key={`${item.parentId}-${item.id}-${item.label}`} className="border-l-2 border-emerald-500/70 pl-3">
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-(--app-text) text-sm font-semibold">{token}</span>
								{item.primaryKey ? <StatusBadge tone="warning">PK</StatusBadge> : null}
								{item.required ? <StatusBadge tone="danger">Obrigatório</StatusBadge> : null}
								{item.parentId === 'parametro' ? <StatusBadge tone={used ? 'success' : 'warning'}>{used ? 'Usado' : 'Pendente'}</StatusBadge> : null}
							</div>
							{item.description ? <div className="mt-1 text-xs text-(--app-muted)">{item.description}</div> : null}
						</div>
					)
				}) : <div className="text-sm text-(--app-muted)">Nenhum item disponível.</div>}
			</div>
		</div>
	)
}

export function IntegracaoComErpQueriesFormPage({ id }: Props) {
	const router = useRouter()
	const { session } = useAuth()
	const { t } = useI18n()
	const access = useFeatureAccess('erpCadastrosQueries')
	const isEditing = Boolean(id)
	const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
	const readOnly = isEditing ? !access.canEdit && access.canView : false
	const canSave = !readOnly && (isEditing ? access.canEdit : access.canCreate)
	const [activeTab, setActiveTab] = useState('general')
	const [form, setForm] = useState<QueryFormState>(EMPTY_FORM)
	const [isLoading, setIsLoading] = useState(Boolean(id))
	const [error, setError] = useState<string | null>(null)
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
	const [saving, setSaving] = useState(false)
	const [companies, setCompanies] = useState<QueryCompanyOption[]>([])
	const [companiesLoading, setCompaniesLoading] = useState(false)
	const [selectedCompanyId, setSelectedCompanyId] = useState('1')
	const [supportItems, setSupportItems] = useState<QuerySupportItem[]>([])
	const [supportLoading, setSupportLoading] = useState(false)
	const [queryRunning, setQueryRunning] = useState(false)
	const [queryResult, setQueryResult] = useState<SqlEditorExecuteResponse | null>(null)
	const [queryResultOpen, setQueryResultOpen] = useState(false)
	const [queryResultMode, setQueryResultMode] = useState<'json' | 'grid'>('json')
	const [mappingRows, setMappingRows] = useState<QueryMappingRecord[]>([])
	const [mappingLoading, setMappingLoading] = useState(false)
	const [fonteDados, setFonteDados] = useState<SqlDataSource>('erp')
	const initialFormRef = useRef<QueryFormState>(EMPTY_FORM)

	const breadcrumbs = [
		{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
		{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
		{ label: t('menuKeys.integracao-erp-cadastros-list', 'Cadastros'), href: '/integracao-com-erp/cadastros' },
		{ label: t('maintenance.erpIntegration.catalogs.items.queries.title', 'Queries'), href: '/integracao-com-erp/cadastros/queries' },
		{ label: isEditing ? t('routes.editar', 'Editar') : t('routes.novo', 'Novo') },
	]

	useEffect(() => {
		let alive = true
		async function bootstrap() {
			if (!id) {
				initialFormRef.current = EMPTY_FORM
				return
			}

			setIsLoading(true)
			setError(null)
			try {
				const loaded = buildForm(await integracaoComErpQueriesClient.getById(id))
				if (!loaded.id_template_lookup && loaded.id_template) {
					try {
						const option = await resolveCrudLookupOption('templates', loaded.id_template)
						loaded.id_template_lookup = option ? { id: option.value, label: option.label } : { id: loaded.id_template, label: loaded.id_template }
					} catch {
						loaded.id_template_lookup = { id: loaded.id_template, label: loaded.id_template }
					}
				}
				if (!alive) return
				setForm(loaded)
				initialFormRef.current = loaded
			} catch (loadError) {
				if (alive) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a query.')
			} finally {
				if (alive) setIsLoading(false)
			}
		}
		void bootstrap()
		return () => {
			alive = false
		}
	}, [id])

	useEffect(() => {
		if (activeTab !== 'query' || companies.length) return
		let alive = true
		setCompaniesLoading(true)
		integracaoComErpQueriesClient.listCompanies()
			.then((items) => {
				if (!alive) return
				setCompanies(items)
				setSelectedCompanyId((current) => current && current !== '1' ? current : items[0]?.id || '1')
			})
			.catch((loadError) => setFeedback({ tone: 'error', message: loadError instanceof Error ? loadError.message : 'Não foi possível carregar os integradores ativos.' }))
			.finally(() => {
				if (alive) setCompaniesLoading(false)
			})
		return () => {
			alive = false
		}
	}, [activeTab, companies.length])

	useEffect(() => {
		if (activeTab !== 'query') return
		let alive = true
		setSupportLoading(true)
		integracaoComErpQueriesClient.listSupport(selectedCompanyId)
			.then((items) => {
				if (alive) setSupportItems(items)
			})
			.catch((loadError) => setFeedback({ tone: 'error', message: loadError instanceof Error ? loadError.message : 'Não foi possível carregar os apoios da query.' }))
			.finally(() => {
				if (alive) setSupportLoading(false)
			})
		return () => {
			alive = false
		}
	}, [activeTab, selectedCompanyId])

	useEffect(() => {
		if (activeTab !== 'mapping' || !id) return
		let alive = true
		setMappingLoading(true)
		integracaoComErpQueriesClient.listMapping(id)
			.then((items) => {
				if (alive) setMappingRows(items)
			})
			.catch((loadError) => setFeedback({ tone: 'error', message: loadError instanceof Error ? loadError.message : 'Não foi possível carregar o mapeamento da query.' }))
			.finally(() => {
				if (alive) setMappingLoading(false)
			})
		return () => {
			alive = false
		}
	}, [activeTab, id])

	const hasChanges = JSON.stringify(form) !== JSON.stringify(initialFormRef.current)
	const parameters = supportItems.filter((item) => item.parentId === 'parametro')

	const handleRunQuery = useCallback(async () => {
		if (!form.query.trim()) {
			setFeedback({ tone: 'error', message: 'Informe uma query antes de executar.' })
			return
		}

		setQueryRunning(true)
		setFeedback(null)
		try {
			const result = await integracaoComErpQueriesClient.execute({
				fonteDados,
				sql: form.query,
				idEmpresa: selectedCompanyId || '1',
				page: 1,
				perPage: 100,
			})
			setQueryResult(result)
			setQueryResultMode('json')
			setQueryResultOpen(true)
		} catch (runError) {
			setFeedback({ tone: 'error', message: runError instanceof Error ? runError.message : 'Não foi possível executar a query.' })
		} finally {
			setQueryRunning(false)
		}
	}, [fonteDados, form.query, selectedCompanyId])

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!canSave) return
		if (!form.nome.trim()) {
			setFeedback({ tone: 'error', message: 'Informe o nome da query.' })
			setActiveTab('general')
			return
		}
		if (!form.id_template.trim()) {
			setFeedback({ tone: 'error', message: 'Informe o template da query.' })
			setActiveTab('general')
			return
		}
		if (!form.query.trim()) {
			setFeedback({ tone: 'error', message: 'A consulta não pode estar vazia.' })
			setActiveTab('query')
			return
		}

		setSaving(true)
		setFeedback(null)
		try {
			await integracaoComErpQueriesClient.save({
				id: form.id,
				ativo: form.ativo,
				nome: form.nome,
				id_template: form.id_template,
				query: form.query,
				hash: form.hash,
			})
			router.push('/integracao-com-erp/cadastros/queries')
		} catch (saveError) {
			setFeedback({ tone: 'error', message: saveError instanceof Error ? saveError.message : 'Não foi possível salvar a query.' })
		} finally {
			setSaving(false)
		}
	}

	const mappingColumns = useMemo(
		() => [
			{ id: 'id', label: 'ID', thClassName: 'w-[80px]', cell: (row: QueryMappingRecord) => row.id },
			{ id: 'nomeAlias', label: 'Alias', thClassName: 'w-[160px]', cell: (row: QueryMappingRecord) => <span className="whitespace-normal [overflow-wrap:anywhere]">{row.nomeAlias || '-'}</span> },
			{ id: 'campo', label: 'Campo', thClassName: 'min-w-0', cell: (row: QueryMappingRecord) => <span className="whitespace-normal [overflow-wrap:anywhere]">{row.campo || '-'}</span> },
			{ id: 'titulo', label: 'Título', thClassName: 'min-w-0', cell: (row: QueryMappingRecord) => <span className="whitespace-normal [overflow-wrap:anywhere]">{row.titulo || '-'}</span> },
			{ id: 'tipo', label: 'Tipo', thClassName: 'w-[120px]', cell: (row: QueryMappingRecord) => <StatusBadge tone="neutral">{row.tipo || '-'}</StatusBadge> },
			{ id: 'ordenacao', label: 'Ordenação', thClassName: 'w-[120px]', cell: (row: QueryMappingRecord) => row.ordenacao || '-' },
		] satisfies AppDataTableColumn<QueryMappingRecord, never>[],
		[],
	)

	const tabs = useMemo<IntegrationFormTab[]>(() => [
		{
			key: 'general',
			label: 'Dados gerais',
			icon: <Database className="h-4 w-4" />,
			content: (
				<SectionCard title="Dados gerais">
					<div className="space-y-5">
						<FormRow label="Ativo">
							<div className="flex min-h-12 items-center">
								<button
									type="button"
									disabled={readOnly}
									onClick={() => setForm((current) => ({ ...current, ativo: !current.ativo }))}
									className={[
										'relative inline-flex h-7 w-12 shrink-0 rounded-full transition',
										form.ativo ? 'bg-emerald-600' : 'bg-[color:var(--app-control-border)]',
										readOnly ? 'cursor-not-allowed opacity-60' : '',
									].join(' ')}
									aria-pressed={form.ativo}
								>
									<span
										className={[
											'absolute top-0.5 h-6 w-6 rounded-full bg-[color:var(--app-panel-solid)] shadow-sm transition',
											form.ativo ? 'left-[1.45rem]' : 'left-0.5',
										].join(' ')}
									/>
								</button>
							</div>
						</FormRow>
						<FormRow label="Nome" required>
							<input
								value={form.nome}
								onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
								disabled={readOnly}
								maxLength={255}
								className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm"
							/>
						</FormRow>
						<FormRow label="Template" required>
							<LookupSelect
								label="Template"
								value={form.id_template_lookup}
								loadOptions={loadQueryTemplateOptions}
								disabled={readOnly}
								pageSize={30}
								onChange={(option) => setForm((current) => ({
									...current,
									id_template: option?.id ?? '',
									id_template_lookup: option,
								}))}
							/>
						</FormRow>
					</div>
				</SectionCard>
			),
		},
		{
			key: 'query',
			label: 'Query',
			icon: <FileCode2 className="h-4 w-4" />,
			content: (
				<SectionCard>
					<div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
						<div className="space-y-4">
							<div className="app-control-muted rounded-[1.15rem] p-4">
								<label className="text-(--app-text) text-sm font-semibold">Fonte de dados</label>
								<select
									value={fonteDados}
									onChange={(event) => setFonteDados(event.target.value as SqlDataSource)}
									className="app-input mt-2 w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm"
								>
									<option value="erp">ERP</option>
									<option value="agilesync">AgileSync</option>
									<option value="agileecommerce">AgileEcommerce</option>
								</select>
								<label className="mt-4 block text-(--app-text) text-sm font-semibold">Integradores ativos</label>
								<select
									value={selectedCompanyId}
									onChange={(event) => setSelectedCompanyId(event.target.value)}
									className="app-input mt-2 w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm"
								>
									{companies.length ? companies.map((company) => <option key={company.id} value={company.id}>{company.nome}</option>) : <option value="1">{companiesLoading ? 'Carregando...' : 'Empresa #1'}</option>}
								</select>
							</div>
							<AsyncState isLoading={supportLoading}>
								<SupportPanel title="Parâmetros" items={parameters} sql={form.query} />
							</AsyncState>
						</div>
						<div className="relative min-w-0">
							{queryRunning ? (
								<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-800">
									<Loader2 className="h-4 w-4 animate-spin" />
									Executando query...
								</div>
							) : null}
							<div className="pr-16">
								<div className="h-105">
									<SqlEditorMonaco
										tabId={`erp-query-${id || 'novo'}`}
										value={form.query}
										onChange={(value) => setForm((current) => ({ ...current, query: value }))}
										onRunShortcut={() => void handleRunQuery()}
										height="420px"
									/>
								</div>
							</div>
							<div className="absolute right-0 top-0 flex flex-col gap-3">
								<button
									type="button"
									onClick={() => void handleRunQuery()}
									disabled={queryRunning}
									className="app-button-secondary inline-flex h-12 w-12 items-center justify-center rounded-xl"
									aria-label="Executar"
								>
									{queryRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
								</button>
								<button
									type="button"
									className="app-button-secondary inline-flex h-12 w-12 items-center justify-center rounded-xl disabled:opacity-50"
									disabled
									aria-label="Histórico"
									title="O legado exibe o botão, mas não possui histórico específico para o cadastro de queries."
								>
									<History className="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>
				</SectionCard>
			),
		},
		{
			key: 'mapping',
			label: 'Mapeamento',
			icon: <Layers3 className="h-4 w-4" />,
			hidden: !isEditing,
			content: (
				<SectionCard title="Mapeamento">
					<AsyncState isLoading={mappingLoading}>
						<AppDataTable<QueryMappingRecord, never, never>
							rows={mappingRows}
							getRowId={(row) => row.id}
							emptyMessage="Nenhum campo de mapeamento encontrado para esta query."
							columns={mappingColumns}
							mobileCard={{
								title: (row) => row.campo || `#${row.id}`,
								subtitle: (row) => row.titulo,
								meta: (row) => row.nomeAlias,
								badges: (row) => <StatusBadge tone="neutral">{row.tipo || '-'}</StatusBadge>,
							}}
						/>
					</AsyncState>
				</SectionCard>
			),
		},
	], [companies, companiesLoading, fonteDados, form, handleRunQuery, id, isEditing, mappingColumns, mappingLoading, mappingRows, parameters, queryRunning, readOnly, selectedCompanyId, supportLoading])

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.queries.formTitle', 'Query')} backHref="/dashboard" />
	}

	if (!canAccess) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.queries.formTitle', 'Query')} backHref="/integracao-com-erp/cadastros/queries" />
	}

	return (
		<AsyncState isLoading={isLoading} error={error ?? undefined}>
			<TabbedIntegrationFormPage
				title={isEditing ? `Alterar Query - ID #${id}` : 'Nova Query'}
				description="Cadastre e valide a consulta SQL usada pelos fluxos de integração com ERP."
				breadcrumbs={breadcrumbs}
				formId="integracao-com-erp-query-form"
				loading={false}
				feedback={feedback}
				onCloseFeedback={() => setFeedback(null)}
				onRefresh={() => {
					if (id) void integracaoComErpQueriesClient.getById(id).then((loaded) => setForm(buildForm(loaded)))
				}}
				tabs={tabs}
				activeTabKey={activeTab}
				onTabChange={setActiveTab}
				canSave={canSave}
				hasChanges={hasChanges}
				saving={saving}
				backHref="/integracao-com-erp/cadastros/queries"
				onSubmit={handleSubmit}
			/>
			<OverlayModal
				open={queryResultOpen}
				title="Resultado da Consulta"
				maxWidthClassName="max-w-6xl"
				bodyScrollable={false}
				onClose={() => setQueryResultOpen(false)}
			>
				<div className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<button type="button" className={queryResultMode === 'json' ? 'app-button-primary rounded-full px-4 py-2 text-sm font-semibold' : 'app-button-secondary rounded-full px-4 py-2 text-sm font-semibold'} onClick={() => setQueryResultMode('json')}>
							Json
						</button>
						<button type="button" className={queryResultMode === 'grid' ? 'app-button-primary rounded-full px-4 py-2 text-sm font-semibold' : 'app-button-secondary rounded-full px-4 py-2 text-sm font-semibold'} onClick={() => setQueryResultMode('grid')}>
							Grid
						</button>
					</div>
					{queryResult ? (
						queryResultMode === 'json'
							? <pre className="app-control-muted h-[min(70vh,640px)] overflow-auto rounded-2xl p-4 text-sm">{JSON.stringify(queryResult.raw, null, 2)}</pre>
							: (
								<DynamicResultGrid
									rows={queryResult.rows}
									emptyMessage="Nenhum registro retornado pela query."
									maxColumns={60}
									maxHeightClassName="h-[min(70vh,640px)]"
								/>
							)
					) : null}
				</div>
			</OverlayModal>
		</AsyncState>
	)
}
