'use client'

import { CheckCircle2, Code2, Copy, Database, FlaskConical, Loader2, Play, RefreshCcw, RotateCcw, Search, ShieldCheck, Sparkles, Variable } from 'lucide-react'
import type { DragEvent, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { FormRow } from '@/src/components/ui/form-row'
import { JsonCodeEditor } from '@/src/components/ui/json-code-editor'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { TabbedIntegrationFormPage, type IntegrationFormTab } from '@/src/features/integracoes/components/tabbed-integration-form-page'
import { integracaoComErpGatewayEndpointsClient } from '@/src/features/integracao-com-erp-gateway-endpoints/services/integracao-com-erp-gateway-endpoints-client'
import { GATEWAY_ENDPOINT_PAGINATION_OPTIONS, GATEWAY_ENDPOINT_VERB_OPTIONS, normalizeGatewayEndpointRecord } from '@/src/features/integracao-com-erp-gateway-endpoints/services/integracao-com-erp-gateway-endpoints'
import { loadErpCatalogLookup } from '@/src/lib/erp-catalog-lookups'
import { httpClient } from '@/src/services/http/http-client'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

type DynamicVariable = { token: string; description: string; origin?: string; default_value?: string }
type TokenDropElement = HTMLInputElement | HTMLTextAreaElement

const FIELD_LABELS: Record<string, string> = {
	expiracao_campo: 'Campo de Expiração',
	expiracao_formato: 'Formato de Expiração',
	token_campo: 'Campo do Token',
	expiracao_tempo: 'Tempo de Expiração',
	nome_propriedade_por_pagina: 'Propriedade por Página',
	quantidade_por_pagina: 'Quantidade por Página',
	nome_propriedade_pagina: 'Propriedade Página',
	nome_retorno_pagina_atual: 'Retorno Página Atual',
	nome_retorno_total_paginas: 'Retorno Total Páginas',
}

function fieldLabel(key: string) {
	return FIELD_LABELS[key] ?? key
}

function formatJson(value: unknown) {
	try {
		return JSON.stringify(value ?? {}, null, 2)
	} catch {
		return '{}'
	}
}

function buildEndpointSnapshot(form: Record<string, unknown>) {
	return {
		id_gateway: String(form.id_gateway || '').trim(),
		endpoint: String(form.endpoint || '').trim(),
		parametros: String(form.parametros || ''),
		body: String(form.body || ''),
		url_filtro: String(form.url_filtro || ''),
		tipo: String(form.tipo || ''),
		token_campo: String(form.token_campo || ''),
		expiracao_campo: String(form.expiracao_campo || ''),
		expiracao_formato: String(form.expiracao_formato || ''),
		expiracao_tempo: String(form.expiracao_tempo || ''),
		tipo_paginacao: String(form.tipo_paginacao || ''),
		nome_propriedade_por_pagina: String(form.nome_propriedade_por_pagina || ''),
		quantidade_por_pagina: String(form.quantidade_por_pagina || ''),
		nome_propriedade_pagina: String(form.nome_propriedade_pagina || ''),
		nome_retorno_pagina_atual: String(form.nome_retorno_pagina_atual || ''),
		nome_retorno_total_paginas: String(form.nome_retorno_total_paginas || ''),
		data_array: String(form.data_array || ''),
	}
}

function getResultStatus(result: unknown) {
	const payload = typeof result === 'object' && result !== null ? result as Record<string, unknown> : {}
	const status = String(payload.status || payload.Status || '').trim()
	if (status) return status
	if (result === null || result === undefined) return 'Aguardando execução'
	return 'Retorno recebido'
}

function insertTextAtSelection(value: string, token: string, target?: TokenDropElement | null) {
	const start = typeof target?.selectionStart === 'number' ? target.selectionStart : value.length
	const end = typeof target?.selectionEnd === 'number' ? target.selectionEnd : start
	return `${value.slice(0, start)}${token}${value.slice(end)}`
}

export function IntegracaoComErpGatewayEndpointsFormPage({ id }: { id?: string }) {
	const router = useRouter()
	const { session } = useAuth()
	const { t } = useI18n()
	const access = useFeatureAccess('erpCadastrosGatewayEndpoints')
	const isEditing = Boolean(id)
	const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
	const readOnly = isEditing ? !access.canEdit && access.canView : false
	const canSave = !readOnly && (isEditing ? access.canEdit : access.canCreate)
	const [form, setForm] = useState<Record<string, unknown>>({ ativo: true, verbo: 'get', tipo_paginacao: 'SemPaginacao' })
	const [loading, setLoading] = useState(Boolean(id))
	const [error, setError] = useState<string | null>(null)
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
	const [saving, setSaving] = useState(false)
	const [variables, setVariables] = useState<DynamicVariable[]>([])
	const [variablesQuery, setVariablesQuery] = useState('')
	const [variablesLoading, setVariablesLoading] = useState(false)
	const [testVariables, setTestVariables] = useState<DynamicVariable[]>([])
	const [testVariablesLoading, setTestVariablesLoading] = useState(false)
	const [testValues, setTestValues] = useState<Record<string, string>>({})
	const [testResult, setTestResult] = useState<unknown>(null)
	const [testLoading, setTestLoading] = useState(false)
	const [resultView, setResultView] = useState<'tree' | 'json'>('tree')
	const initialRef = useRef<Record<string, unknown>>({})

	function patch(key: string, value: unknown) {
		setForm((current) => ({ ...current, [key]: value }))
	}

	function copyToken(token: string) {
		void navigator.clipboard?.writeText(token).then(() => {
			setFeedback({ tone: 'success', message: `Token ${token} copiado.` })
		}).catch(() => {
			setFeedback({ tone: 'error', message: 'Não foi possível copiar o token.' })
		})
	}

	function handleTokenDragStart(event: DragEvent<HTMLElement>, token: string) {
		event.dataTransfer.effectAllowed = 'copy'
		event.dataTransfer.setData('text/plain', token)
		event.dataTransfer.setData('application/x-agile-token', token)
	}

	function getDraggedToken(event: DragEvent<HTMLElement>) {
		return event.dataTransfer.getData('application/x-agile-token') || event.dataTransfer.getData('text/plain')
	}

	function dropTokenOnField(key: string, event: DragEvent<TokenDropElement>) {
		if (readOnly) return
		const token = getDraggedToken(event)
		if (!token) return
		event.preventDefault()
		const currentValue = String(form[key] || '')
		patch(key, insertTextAtSelection(currentValue, token, event.currentTarget))
	}

	function dropTokenAtEnd(key: string, event: DragEvent<HTMLElement>) {
		if (readOnly) return
		const token = getDraggedToken(event)
		if (!token) return
		event.preventDefault()
		const currentValue = String(form[key] || '')
		patch(key, `${currentValue}${token}`)
	}

	function tokenDropProps(key: string) {
		return {
			onDragOver: (event: DragEvent<TokenDropElement>) => {
				event.preventDefault()
				event.dataTransfer.dropEffect = 'copy'
			},
			onDrop: (event: DragEvent<TokenDropElement>) => dropTokenOnField(key, event),
		}
	}

	useEffect(() => {
		let alive = true
		async function load() {
			if (!id) return
			setLoading(true)
			try {
				const loaded = normalizeGatewayEndpointRecord(await integracaoComErpGatewayEndpointsClient.getById(id))
				if (!alive) return
				setForm(loaded)
				initialRef.current = loaded
			} catch (loadError) {
				if (alive) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o gateway endpoint.')
			} finally {
				if (alive) setLoading(false)
			}
		}
		void load()
		return () => { alive = false }
	}, [id])

	const hasChanges = JSON.stringify(form) !== JSON.stringify(initialRef.current)

	async function loadVariables(sourceForm: Record<string, unknown> = form) {
		if (!String(sourceForm.id_gateway || '').trim()) {
			setVariables([])
			return
		}
		setVariablesLoading(true)
		setFeedback(null)
		try {
			const result = await httpClient<{ data?: { variaveis?: DynamicVariable[] } }>('/api/erp-cadastros/gateway-endpoints/variables', {
				method: 'POST',
				body: JSON.stringify({ id_gateway: sourceForm.id_gateway }),
			})
			setVariables(result.data?.variaveis || [])
		} catch (loadError) {
			setFeedback({ tone: 'error', message: loadError instanceof Error ? loadError.message : 'Não foi possível carregar os parâmetros dinâmicos.' })
		} finally {
			setVariablesLoading(false)
		}
	}

	async function loadTestVariables(sourceForm: Record<string, unknown> = form) {
		const snapshot = buildEndpointSnapshot(sourceForm)
		if (!snapshot.id_gateway) {
			setTestVariables([])
			setTestValues({})
			return
		}
		setTestVariablesLoading(true)
		setFeedback(null)
		try {
			const result = await httpClient<{ data?: { variaveis?: DynamicVariable[] } }>('/api/erp-cadastros/gateway-endpoints/test-context', {
				method: 'POST',
				body: JSON.stringify(snapshot),
			})
			const nextVariables = result.data?.variaveis || []
			setTestVariables(nextVariables)
			setTestValues((current) => {
				const next: Record<string, string> = {}
				for (const item of nextVariables) {
					next[item.token] = current[item.token] ?? String(item.default_value || '')
				}
				return next
			})
			setTestResult(null)
		} catch (loadError) {
			setFeedback({ tone: 'error', message: loadError instanceof Error ? loadError.message : 'Não foi possível carregar as variáveis do teste.' })
		} finally {
			setTestVariablesLoading(false)
		}
	}

	async function runTest() {
		setTestLoading(true)
		setFeedback(null)
		try {
			const result = await httpClient<unknown>('/api/erp-cadastros/gateway-endpoints/test', {
				method: 'POST',
				body: JSON.stringify({ ...form, variaveis: testValues, pagina: 1 }),
			})
			setTestResult(result)
		} catch (runError) {
			setFeedback({ tone: 'error', message: runError instanceof Error ? runError.message : 'Não foi possível executar o teste.' })
		} finally {
			setTestLoading(false)
		}
	}

	useEffect(() => {
		const idGateway = String(form.id_gateway || '').trim()
		if (!idGateway) {
			setVariables([])
			setTestVariables([])
			setTestValues({})
			return
		}
		void loadVariables(form)
		void loadTestVariables(form)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [form.id_gateway])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!canSave) return
		if (!String(form.id_gateway || '').trim() || !String(form.endpoint || '').trim() || !String(form.verbo || '').trim()) {
			setFeedback({ tone: 'error', message: 'Informe gateway, endpoint e verbo.' })
			return
		}
		setSaving(true)
		try {
			await integracaoComErpGatewayEndpointsClient.save(form as CrudRecord)
			router.push('/integracao-com-erp/cadastros/gateway-endpoints')
		} catch (saveError) {
			setFeedback({ tone: 'error', message: saveError instanceof Error ? saveError.message : 'Não foi possível salvar o gateway endpoint.' })
		} finally {
			setSaving(false)
		}
	}

	const breadcrumbs = [
		{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
		{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
		{ label: t('menuKeys.integracao-erp-cadastros-list', 'Cadastros'), href: '/integracao-com-erp/cadastros' },
		{ label: t('maintenance.erpIntegration.catalogs.items.gatewayEndpoints.title', 'Gateway Endpoints'), href: '/integracao-com-erp/cadastros/gateway-endpoints' },
		{ label: isEditing ? t('routes.editar', 'Editar') : t('routes.novo', 'Novo') },
	]

	const filteredVariables = variables.filter((item) => {
		const query = variablesQuery.trim().toLowerCase()
		if (!query) return true
		return item.token.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
	})
	const methodLabel = String(form.verbo || 'GET').toUpperCase()
	const endpointLabel = String(form.endpoint || '').trim() || 'Endpoint não informado'
	const gatewayLabel = (form.id_gateway_lookup as LookupOption | null)?.label || (form.id_gateway ? `Gateway #${String(form.id_gateway)}` : 'Gateway não selecionado')
	const filledTestVariables = testVariables.filter((item) => String(testValues[item.token] || '').trim()).length
	const isTestReady = Boolean(String(form.id_gateway || '').trim() && String(form.endpoint || '').trim() && String(form.verbo || '').trim())
	const resultStatus = getResultStatus(testResult)
	const textFieldClassName = 'app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3'

	const dynamicVariablesPanel = (
		<SectionCard className="h-fit xl:sticky xl:top-24" title="Parâmetros Dinâmicos">
			<div className="space-y-5">
				<div className="relative overflow-hidden rounded-[1.35rem] border border-line/60 bg-[linear-gradient(135deg,var(--app-control-muted-bg),transparent_60%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_36%)] p-4">
					<div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />
					<div className="relative space-y-3">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
									<Sparkles className="h-3.5 w-3.5" />
									Apoio do formulário
								</div>
								<div className="mt-3 text-xl font-black text-[color:var(--app-text)]">{filteredVariables.length} parâmetro(s)</div>
								<div className="mt-1 text-xs leading-relaxed text-[color:var(--app-muted)]">Tokens disponíveis para endpoint, filtros, body e paginação.</div>
							</div>
							<button type="button" className="app-button-secondary inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold" onClick={() => void loadVariables()} disabled={variablesLoading}>
								{variablesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
								{variablesLoading ? 'Atualizando' : 'Atualizar'}
							</button>
						</div>
						<div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--app-muted)]">
							<span className="inline-flex items-center gap-1.5">
								<ShieldCheck className="h-4 w-4 text-emerald-500" />
								{gatewayLabel}
							</span>
						</div>
					</div>
				</div>
				<div className="app-control-muted flex items-center gap-2 rounded-2xl px-3 py-2.5">
					<Search className="h-4 w-4 shrink-0 text-[color:var(--app-muted)]" />
					<input
						className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--app-text)] outline-none placeholder:text-[color:var(--app-muted)]"
						value={variablesQuery}
						onChange={(event) => setVariablesQuery(event.target.value)}
						placeholder="Buscar por chave ou descrição"
					/>
				</div>
				<div className="app-control-muted rounded-[1.25rem] p-4">
					<div className="mb-4 flex items-center justify-between gap-3 border-b border-line/40 pb-3">
						<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
							<Variable className="h-4 w-4 text-emerald-500" />
							Biblioteca de tokens
						</div>
						<span className="rounded-full border border-line/60 px-3 py-1 text-xs font-black text-[color:var(--app-muted)]">object {'{'}{filteredVariables.length}{'}'}</span>
					</div>
					<div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
						{variablesLoading ? (
							<div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-line/60 text-sm font-semibold text-[color:var(--app-muted)]">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Carregando parâmetros...
							</div>
						) : filteredVariables.length ? filteredVariables.map((item) => (
							<button
								key={`${item.token}-${item.origin || 'contexto'}`}
								type="button"
								draggable
								className="group block w-full rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/70 p-3 text-left transition hover:border-emerald-500/40 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
								onClick={() => copyToken(item.token)}
								onDragStart={(event) => handleTokenDragStart(event, item.token)}
							>
								<span className="flex items-start justify-between gap-3">
									<span className="min-w-0 text-sm font-black text-[color:var(--app-text)] [overflow-wrap:anywhere]">{item.token}</span>
									<Copy className="h-4 w-4 shrink-0 text-[color:var(--app-muted)] transition group-hover:text-emerald-500" />
								</span>
								{item.description ? <span className="mt-2 block text-xs leading-relaxed text-[color:var(--app-muted)]">{item.description}</span> : null}
								{item.origin ? <span className="mt-3 inline-flex rounded-full border border-line/50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{item.origin}</span> : null}
							</button>
						)) : (
							<div className="rounded-2xl border border-dashed border-line/60 px-4 py-8 text-center">
								<Variable className="mx-auto h-8 w-8 text-emerald-500" />
								<div className="mt-3 text-sm font-black text-[color:var(--app-text)]">Nenhum parâmetro encontrado</div>
								<div className="mt-1 text-xs text-[color:var(--app-muted)]">Selecione um gateway ou ajuste a busca para visualizar os tokens.</div>
							</div>
						)}
					</div>
				</div>
				<p className="rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/50 px-4 py-3 text-xs leading-relaxed text-[color:var(--app-muted)]">
					Clique para copiar ou arraste um token para qualquer campo de texto do formulário.
				</p>
			</div>
		</SectionCard>
	)

	const testEndpointTab = (
		<SectionCard title="Testar Endpoint">
			<div className="space-y-6">
				<div className="relative overflow-hidden rounded-[1.6rem] border border-line/60 bg-[linear-gradient(135deg,var(--app-control-muted-bg),transparent_55%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.22),transparent_34%)] p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
					<div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
					<div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
						<div className="min-w-0 space-y-4">
							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
									<Sparkles className="h-3.5 w-3.5" />
									Preview de execução
								</span>
								<span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${isTestReady ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
									{isTestReady ? 'Pronto para testar' : 'Configuração pendente'}
								</span>
							</div>
							<div className="space-y-2">
								<div className="flex flex-wrap items-center gap-3">
									<span className="inline-flex rounded-2xl bg-[color:var(--app-text)] px-3 py-1.5 text-sm font-black text-[color:var(--app-panel-solid)]">{methodLabel}</span>
									<div className="min-w-0 flex-1 text-2xl font-black text-[color:var(--app-text)] [overflow-wrap:anywhere]">{endpointLabel}</div>
								</div>
								<div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--app-muted)]">
									<span className="inline-flex items-center gap-1.5">
										<ShieldCheck className="h-4 w-4 text-emerald-500" />
										{gatewayLabel}
									</span>
									<span className="hidden h-1 w-1 rounded-full bg-[color:var(--app-muted)] sm:inline-flex" />
									<span>{testVariables.length} variável(is) obrigatória(s), {filledTestVariables} preenchida(s)</span>
								</div>
							</div>
						</div>
						<div className="flex shrink-0 flex-wrap gap-2">
							<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" onClick={() => void loadTestVariables()} disabled={testVariablesLoading}>
								{testVariablesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
								{testVariablesLoading ? 'Atualizando...' : 'Atualizar variáveis'}
							</button>
							<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void runTest()} disabled={testLoading || !isTestReady}>
								{testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
								{testLoading ? 'Executando...' : 'Executar página 1'}
							</button>
						</div>
					</div>
				</div>
				<div className="grid gap-5 xl:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]">
					<div className="app-control-muted rounded-[1.25rem] p-4">
						<div className="mb-4 flex items-center justify-between gap-3 border-b border-line/40 pb-3">
							<div>
								<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
									<Variable className="h-4.5 w-4.5 text-emerald-500" />
									Variáveis obrigatórias
								</div>
								<div className="mt-1 text-xs text-[color:var(--app-muted)]">Valores usados somente nesta simulação.</div>
							</div>
							<span className="rounded-full border border-line/60 px-3 py-1 text-xs font-black text-[color:var(--app-muted)]">{filledTestVariables}/{testVariables.length}</span>
						</div>
						<div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
							{testVariablesLoading ? (
								<div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-line/60 text-sm font-semibold text-[color:var(--app-muted)]">
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Carregando variáveis...
								</div>
							) : testVariables.length ? testVariables.map((item) => (
								<label key={`${item.token}-test`} className="block rounded-2xl border border-line/50 bg-[color:var(--app-panel-solid)]/70 p-3 transition hover:border-emerald-500/40">
									<span className="mb-2 flex items-center justify-between gap-2">
										<span className="min-w-0 text-sm font-black text-[color:var(--app-text)] [overflow-wrap:anywhere]">{item.token}</span>
										{String(testValues[item.token] || '').trim() ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : null}
									</span>
									<input className="app-input w-full rounded-xl border border-line/60 bg-transparent px-3 py-2 text-sm" value={testValues[item.token] || ''} onChange={(event) => setTestValues((current) => ({ ...current, [item.token]: event.target.value }))} placeholder="Informe o valor para o teste" />
									<span className="mt-2 block text-xs leading-relaxed text-[color:var(--app-muted)]">{item.description || 'Valor necessário para executar o endpoint.'}</span>
								</label>
							)) : (
								<div className="rounded-2xl border border-dashed border-line/60 px-4 py-8 text-center">
									<CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
									<div className="mt-3 text-sm font-black text-[color:var(--app-text)]">Nenhuma variável obrigatória</div>
									<div className="mt-1 text-xs text-[color:var(--app-muted)]">O endpoint pode ser executado com o contexto atual.</div>
								</div>
							)}
						</div>
					</div>
					<div className="app-control-muted min-w-0 overflow-hidden rounded-[1.25rem]">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/40 px-4 py-3">
							<div>
								<div className="flex items-center gap-2 text-base font-black text-[color:var(--app-text)]">
									<Code2 className="h-4.5 w-4.5 text-emerald-500" />
									Retorno do endpoint
								</div>
								<div className="mt-1 text-xs text-[color:var(--app-muted)]">{resultStatus}</div>
							</div>
							<div className="inline-flex overflow-hidden rounded-xl border border-line/60 bg-[color:var(--app-panel-solid)]/50 p-1">
								<button type="button" className={`rounded-lg px-4 py-2 text-sm font-semibold ${resultView === 'tree' ? 'app-button-primary' : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]'}`} onClick={() => setResultView('tree')}>Tree</button>
								<button type="button" className={`rounded-lg px-4 py-2 text-sm font-semibold ${resultView === 'json' ? 'app-button-primary' : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]'}`} onClick={() => setResultView('json')}>JSON</button>
							</div>
						</div>
						<div className="p-3">
							{resultView === 'json' ? (
								<JsonCodeEditor id="gateway-endpoint-test-result-json" value={formatJson(testResult)} onChange={() => undefined} readOnly height="560px" />
							) : (
								<pre className="min-h-[560px] overflow-auto rounded-2xl border border-line/40 bg-[color:var(--app-panel-solid)]/70 p-4 font-mono text-sm leading-relaxed text-[color:var(--app-text)]">{formatJson(testResult)}</pre>
							)}
						</div>
					</div>
				</div>
			</div>
		</SectionCard>
	)

	const tabs: IntegrationFormTab[] = [
		{
			key: 'dados',
			label: 'Dados gerais',
			icon: <Database className="h-4 w-4" />,
			content: (
				<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
					<SectionCard title="Dados gerais">
						<div className="space-y-5">
							<FormRow label="Ativo">
								<BooleanChoice value={Boolean(form.ativo)} onChange={(next) => patch('ativo', next)} disabled={readOnly} trueLabel="Sim" falseLabel="Não" />
							</FormRow>
							<FormRow label="Gateway" required>
								<LookupSelect label="Gateway" value={(form.id_gateway_lookup as LookupOption | null) || null} loadOptions={(q, p, pp) => loadErpCatalogLookup('gateways', q, p, pp)} disabled={readOnly} onChange={(option) => { patch('id_gateway', option?.id || ''); patch('id_gateway_lookup', option) }} />
							</FormRow>
							<FormRow label="Endpoint" required><input className={textFieldClassName} value={String(form.endpoint || '')} onChange={(event) => patch('endpoint', event.target.value)} disabled={readOnly} {...tokenDropProps('endpoint')} /></FormRow>
							<FormRow label="Verbo" required><select className={textFieldClassName} value={String(form.verbo || '')} onChange={(event) => patch('verbo', event.target.value)} disabled={readOnly}><option value="">Selecione</option>{GATEWAY_ENDPOINT_VERB_OPTIONS.map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></FormRow>
							<FormRow label="Parâmetros"><textarea className={`${textFieldClassName} min-h-24`} value={String(form.parametros || '')} onChange={(event) => patch('parametros', event.target.value)} disabled={readOnly} {...tokenDropProps('parametros')} /></FormRow>
							<FormRow label="Tipo"><input className={textFieldClassName} value={String(form.tipo || '')} onChange={(event) => patch('tipo', event.target.value)} disabled={readOnly} {...tokenDropProps('tipo')} /></FormRow>
							{['expiracao_campo', 'expiracao_formato', 'token_campo', 'expiracao_tempo'].map((key) => (
								<FormRow key={key} label={fieldLabel(key)}><input className={textFieldClassName} value={String(form[key] || '')} onChange={(event) => patch(key, event.target.value)} disabled={readOnly} {...tokenDropProps(key)} /></FormRow>
							))}
							<FormRow label="Url Filtro"><textarea className={`${textFieldClassName} min-h-36`} value={String(form.url_filtro || '')} onChange={(event) => patch('url_filtro', event.target.value)} disabled={readOnly} {...tokenDropProps('url_filtro')} /></FormRow>
							<FormRow label="Body"><div onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' }} onDrop={(event) => dropTokenAtEnd('body', event)}><JsonCodeEditor id="gateway-endpoint-body-form" value={String(form.body || '')} onChange={(value) => patch('body', value)} readOnly={readOnly} height="320px" /></div></FormRow>
							<FormRow label="Data Array"><input className={textFieldClassName} value={String(form.data_array || '')} onChange={(event) => patch('data_array', event.target.value)} disabled={readOnly} {...tokenDropProps('data_array')} /></FormRow>
							<FormRow label="Tipo Paginação"><select className={textFieldClassName} value={String(form.tipo_paginacao || '')} onChange={(event) => patch('tipo_paginacao', event.target.value)} disabled={readOnly}><option value="">Selecione</option>{GATEWAY_ENDPOINT_PAGINATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FormRow>
							{['nome_propriedade_por_pagina', 'quantidade_por_pagina', 'nome_propriedade_pagina', 'nome_retorno_pagina_atual', 'nome_retorno_total_paginas'].map((key) => (
								<FormRow key={key} label={fieldLabel(key)}><input className={textFieldClassName} value={String(form[key] || '')} onChange={(event) => patch(key, event.target.value)} disabled={readOnly} {...tokenDropProps(key)} /></FormRow>
							))}
						</div>
					</SectionCard>
					{dynamicVariablesPanel}
				</div>
			),
		},
		{
			key: 'teste',
			label: 'Testar Endpoint',
			icon: <FlaskConical className="h-4 w-4" />,
			content: testEndpointTab,
		},
	]

	if (!isRootAgileecommerceAdmin(session)) return <AccessDeniedState title="Gateway Endpoint" backHref="/dashboard" />
	if (!canAccess) return <AccessDeniedState title="Gateway Endpoint" backHref="/integracao-com-erp/cadastros/gateway-endpoints" />

	return (
		<AsyncState isLoading={loading} error={error ?? undefined}>
			<TabbedIntegrationFormPage
				title={isEditing ? `Editar Gateway Endpoint - ID #${id}` : 'Novo Gateway Endpoint'}
				description="Configure endpoint, parâmetros, body, paginação e teste do gateway."
				breadcrumbs={breadcrumbs}
				formId="integracao-com-erp-gateway-endpoint-form"
				loading={false}
				feedback={feedback}
				onCloseFeedback={() => setFeedback(null)}
				onRefresh={() => {
					if (!id) return
					void integracaoComErpGatewayEndpointsClient.getById(id).then((loaded) => setForm(normalizeGatewayEndpointRecord(loaded))).catch(() => undefined)
				}}
				tabs={tabs}
				canSave={canSave}
				hasChanges={hasChanges}
				saving={saving}
				backHref="/integracao-com-erp/cadastros/gateway-endpoints"
				onSubmit={handleSubmit}
			/>
		</AsyncState>
	)
}
