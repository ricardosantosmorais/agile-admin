'use client'

import { CheckCircle2, FlaskConical, Loader2, Play, RefreshCcw, Sparkles, Variable } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { JsonCodeEditor } from '@/src/components/ui/json-code-editor'
import { ScriptCodeEditor } from '@/src/features/integracao-com-erp-scripts/components/script-code-editor'
import {
	buildSamplePayload,
	buildSampleRowLabel,
	extractSampleRows,
	formatAssistantJson,
} from '@/src/features/integracao-com-erp-cadastro-servicos/services/servico-mapping-assistant'
import { httpClient } from '@/src/services/http/http-client'

type DynamicVariable = {
	token: string
	description?: string
	default_value?: string
	display_value?: string
	resolved_by_context?: boolean
	editable?: boolean
}

type Props = {
	value: string
	form: CrudRecord
	patch: (key: string, value: unknown) => void
	readOnly?: boolean
}

function text(value: unknown) {
	return String(value ?? '').trim()
}

function buildEndpointSnapshot(endpoint: Record<string, unknown>) {
	return {
		id_gateway: text(endpoint.id_gateway),
		endpoint: text(endpoint.endpoint),
		parametros: text(endpoint.parametros),
		body: text(endpoint.body),
		url_filtro: text(endpoint.url_filtro),
		tipo: text(endpoint.tipo),
		token_campo: text(endpoint.token_campo),
		expiracao_campo: text(endpoint.expiracao_campo),
		expiracao_formato: text(endpoint.expiracao_formato),
		expiracao_tempo: text(endpoint.expiracao_tempo),
		tipo_paginacao: text(endpoint.tipo_paginacao),
		nome_propriedade_por_pagina: text(endpoint.nome_propriedade_por_pagina),
		quantidade_por_pagina: text(endpoint.quantidade_por_pagina),
		nome_propriedade_pagina: text(endpoint.nome_propriedade_pagina),
		nome_retorno_pagina_atual: text(endpoint.nome_retorno_pagina_atual),
		nome_retorno_total_paginas: text(endpoint.nome_retorno_total_paginas),
		data_array: text(endpoint.data_array),
	}
}

export function ServicoGatewayMappingAssistant({ value, form, patch, readOnly = false }: Props) {
	const endpointId = text(form.id_objeto)
	const isEndpointGateway = text(form.tipo_objeto) === 'endpoint_gateway'
	const datasetMode = text(form.modo_transformacao_gateway) === 'dataset_consolidado'
	const [endpoint, setEndpoint] = useState<Record<string, unknown> | null>(null)
	const [variables, setVariables] = useState<DynamicVariable[]>([])
	const [testValues, setTestValues] = useState<Record<string, string>>({})
	const [sampleRows, setSampleRows] = useState<unknown[]>([])
	const [selectedSampleIndex, setSelectedSampleIndex] = useState(0)
	const [scriptResult, setScriptResult] = useState<unknown>(null)
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null)
	const [loadingContext, setLoadingContext] = useState(false)
	const [loadingData, setLoadingData] = useState(false)
	const [testingScript, setTestingScript] = useState(false)

	useEffect(() => {
		setEndpoint(null)
		setVariables([])
		setTestValues({})
		setSampleRows([])
		setSelectedSampleIndex(0)
		setScriptResult(null)
		setFeedback(null)
	}, [endpointId, datasetMode])

	const selectedSample = sampleRows[selectedSampleIndex]
	const selectedPayload = useMemo(() => buildSamplePayload(selectedSample, datasetMode), [datasetMode, selectedSample])
	const endpointLabel = endpoint ? `${String(endpoint.verbo || '').toUpperCase() || 'GET'} ${text(endpoint.endpoint) || `#${endpointId}`}` : 'Endpoint não carregado'

	async function loadContext() {
		if (!endpointId) {
			setFeedback({ tone: 'error', message: 'Selecione um endpoint gateway no campo Objeto para usar o assistente.' })
			return null
		}
		setLoadingContext(true)
		setFeedback(null)
		try {
			const loaded = await httpClient<Record<string, unknown>>(`/api/erp-cadastros/gateway-endpoints/${encodeURIComponent(endpointId)}`)
			setEndpoint(loaded)
			const result = await httpClient<{ data?: { variaveis?: DynamicVariable[] } }>('/api/erp-cadastros/gateway-endpoints/test-context', {
				method: 'POST',
				body: JSON.stringify(buildEndpointSnapshot(loaded)),
			})
			const nextVariables = result.data?.variaveis || []
			setVariables(nextVariables)
			setTestValues((current) => {
				const next: Record<string, string> = {}
				for (const item of nextVariables) {
					next[item.token] = current[item.token] ?? text(item.display_value || item.default_value)
				}
				return next
			})
			setFeedback({ tone: 'success', message: 'Contexto do endpoint carregado.' })
			return loaded
		} catch (error) {
			setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível carregar o contexto do assistente.' })
			return null
		} finally {
			setLoadingContext(false)
		}
	}

	async function loadSampleData() {
		const loadedEndpoint = endpoint || await loadContext()
		if (!loadedEndpoint) return
		setLoadingData(true)
		setScriptResult(null)
		setFeedback(null)
		try {
			const contextTokens = new Set(
				variables
					.filter((item) => item.resolved_by_context || item.editable === false)
					.map((item) => item.token),
			)
			const variaveis = Object.fromEntries(Object.entries(testValues).filter(([token]) => !contextTokens.has(token)))
			const result = await httpClient<unknown>('/api/erp-cadastros/gateway-endpoints/test', {
				method: 'POST',
				body: JSON.stringify({ ...loadedEndpoint, variaveis, pagina: 1 }),
			})
			const rows = extractSampleRows(result)
			setSampleRows(rows)
			setSelectedSampleIndex(0)
			setFeedback(rows.length
				? { tone: 'success', message: rows.length === 1 ? '1 registro disponível para validar o script.' : `${rows.length} registros disponíveis para validar o script.` }
				: { tone: 'info', message: 'Endpoint executado, mas não foi encontrada uma lista normalizada de registros.' })
		} catch (error) {
			setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível carregar a amostra do endpoint.' })
		} finally {
			setLoadingData(false)
		}
	}

	async function testScript() {
		if (!selectedPayload) {
			setFeedback({ tone: 'error', message: 'Carregue e selecione uma amostra antes de testar o script.' })
			return
		}
		if (!text(value)) {
			setFeedback({ tone: 'error', message: 'Informe um script Razor para teste.' })
			return
		}
		setTestingScript(true)
		setFeedback(null)
		try {
			const result = await httpClient<{ data?: { resultado?: unknown } }>('/api/erp-cadastros/servicos/mapping-assistant/test-script', {
				method: 'POST',
				body: JSON.stringify({
					script: value,
					payload_teste: selectedPayload,
					modo_transformacao_gateway: datasetMode ? 'dataset_consolidado' : 'registro',
				}),
			})
			setScriptResult(result.data?.resultado ?? result)
			setFeedback({ tone: 'success', message: datasetMode ? 'Script testado em modo dataset consolidado.' : 'Script testado com a amostra selecionada.' })
		} catch (error) {
			setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível testar o script.' })
		} finally {
			setTestingScript(false)
		}
	}

	if (!isEndpointGateway) {
		return (
			<div className="space-y-3">
				<ScriptCodeEditor editorId="servico-mapeamento" language="razor" value={value} onChange={(next) => patch('mapeamento', next)} readOnly={readOnly} height="420px" />
				<p className="text-xs leading-relaxed text-[color:var(--app-muted)]">O assistente de amostra fica disponível quando o tipo do objeto é Endpoint Gateway.</p>
			</div>
		)
	}

	return (
		<div className="space-y-5">
			<div className="relative overflow-hidden rounded-[1.35rem] border border-line/60 bg-[linear-gradient(135deg,var(--app-control-muted-bg),transparent_58%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.16),transparent_34%)] p-4">
				<div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0">
						<span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
							<Sparkles className="h-3.5 w-3.5" />
							Assistente de mapeamento
						</span>
						<div className="mt-3 text-lg font-black text-[color:var(--app-text)] [overflow-wrap:anywhere]">{endpointLabel}</div>
						<p className="mt-1 text-xs leading-relaxed text-[color:var(--app-muted)]">Carregue uma amostra real do endpoint, selecione o registro e valide o Razor contra o mesmo payload usado pelo legado.</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void loadContext()} disabled={loadingContext}>
							{loadingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
							Contexto
						</button>
						<button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void loadSampleData()} disabled={loadingContext || loadingData}>
							{loadingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Variable className="h-4 w-4" />}
							Carregar dados
						</button>
						<button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void testScript()} disabled={testingScript || !selectedPayload}>
							{testingScript ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
							Testar script
						</button>
					</div>
				</div>
				{feedback ? (
					<div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
						feedback.tone === 'error'
							? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'
							: feedback.tone === 'success'
								? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
								: 'border-line/60 bg-[color:var(--app-panel-solid)]/70 text-[color:var(--app-muted)]'
					}`}>{feedback.message}</div>
				) : null}
			</div>

			{variables.length ? (
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{variables.map((item) => {
						const contextResolved = Boolean(item.resolved_by_context || item.editable === false)
						return (
							<label key={item.token} className="rounded-2xl border border-line/50 bg-[color:var(--app-control-muted-bg)] p-3">
								<span className="mb-2 flex items-center justify-between gap-2">
									<span className="min-w-0 text-sm font-black text-[color:var(--app-text)] [overflow-wrap:anywhere]">{item.token}</span>
									{contextResolved ? <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">Contexto</span> : null}
								</span>
								<input className="app-input w-full rounded-xl border border-line/60 bg-transparent px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70" value={testValues[item.token] || ''} onChange={(event) => setTestValues((current) => ({ ...current, [item.token]: event.target.value }))} disabled={contextResolved || readOnly} readOnly={contextResolved || readOnly} />
								<span className="mt-2 block text-xs leading-relaxed text-[color:var(--app-muted)]">{item.description || 'Valor necessário para carregar a amostra.'}</span>
							</label>
						)
					})}
				</div>
			) : null}

			<div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
				<div className="space-y-3">
					<div className="app-control-muted rounded-[1.25rem] p-3">
						<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
							<div className="text-sm font-black text-[color:var(--app-text)]">Amostra disponível</div>
							{sampleRows.length ? (
								<select className="app-input min-w-[240px] rounded-xl border border-line/60 bg-transparent px-3 py-2 text-sm" value={selectedSampleIndex} onChange={(event) => setSelectedSampleIndex(Number(event.target.value) || 0)}>
									{sampleRows.map((row, index) => <option key={index} value={index}>{buildSampleRowLabel(row, index)}</option>)}
								</select>
							) : null}
						</div>
						<JsonCodeEditor id="servico-gateway-mapping-sample" value={formatAssistantJson(selectedSample ?? {})} onChange={() => undefined} readOnly height="360px" />
					</div>
					<div className="app-control-muted rounded-[1.25rem] p-3">
						<div className="mb-3 flex items-center gap-2 text-sm font-black text-[color:var(--app-text)]">
							<FlaskConical className="h-4 w-4 text-emerald-500" />
							Resultado do teste
						</div>
						<pre className="min-h-36 overflow-auto rounded-2xl border border-line/40 bg-[color:var(--app-panel-solid)]/70 p-4 font-mono text-sm leading-relaxed text-[color:var(--app-text)]">{scriptResult === null ? 'Nenhum teste executado.' : formatAssistantJson(scriptResult)}</pre>
					</div>
				</div>

				<div className="min-w-0">
					<div className="mb-3 flex items-center gap-2 text-sm font-black text-[color:var(--app-text)]">
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
						Script Razor de mapeamento
					</div>
					<ScriptCodeEditor editorId="servico-mapeamento" language="razor" value={value} onChange={(next) => patch('mapeamento', next)} readOnly={readOnly} height="620px" />
				</div>
			</div>
		</div>
	)
}
