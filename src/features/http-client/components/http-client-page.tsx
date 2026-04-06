'use client'

import { Copy, FolderOpen, Loader2, Plus, Save, Send, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { httpClientToolClient } from '@/src/features/http-client/services/http-client-client'
import { createDefaultHttpClientRequest } from '@/src/features/http-client/services/http-client-mappers'
import type {
  HttpClientCatalogItem,
  HttpClientContext,
  HttpClientRequestDraft,
  HttpClientResponsePayload,
} from '@/src/features/http-client/services/http-client-types'
import { useI18n } from '@/src/i18n/use-i18n'
import { copyTextToClipboard } from '@/src/lib/clipboard'

type TabState = {
  id: string
  title: string
  request: HttpClientRequestDraft
  response: HttpClientResponsePayload | null
  catalogId: string
  catalogName: string
  catalogDescription: string
  catalogPublic: boolean
  isSending: boolean
}

type ToastState = {
  message: string
  tone: 'success' | 'error'
}

const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
const BODY_TYPE_OPTIONS = ['application/json', 'application/x-www-form-urlencoded', 'text/plain', 'text/xml'] as const

function createTab(baseUrl: string, index: number): TabState {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  return {
    id,
    title: `Requisicao ${index}`,
    request: createDefaultHttpClientRequest(baseUrl),
    response: null,
    catalogId: '',
    catalogName: '',
    catalogDescription: '',
    catalogPublic: true,
    isSending: false,
  }
}

function KeyValueTable({
  rows,
  onChange,
  addLabel,
}: {
  rows: Array<{ key: string; value: string }>
  onChange: (rows: Array<{ key: string; value: string }>) => void
  addLabel: string
}) {
  return (
    <div className="space-y-2 min-w-0">
      <div className="space-y-2 rounded-[1rem] border border-[#e8e2d7] bg-white p-3 overflow-hidden">
        {rows.map((row, index) => (
          <div key={`${index}-${row.key}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
            <input
              value={row.key}
              onChange={(event) => {
                const next = [...rows]
                next[index] = { ...next[index], key: event.target.value }
                onChange(next)
              }}
              className="min-w-0 rounded-[0.8rem] border border-[#e6dfd3] bg-[#fdfbf7] px-3 py-2 text-sm outline-none"
              placeholder="Chave"
            />
            <input
              value={row.value}
              onChange={(event) => {
                const next = [...rows]
                next[index] = { ...next[index], value: event.target.value }
                onChange(next)
              }}
              className="min-w-0 rounded-[0.8rem] border border-[#e6dfd3] bg-[#fdfbf7] px-3 py-2 text-sm outline-none"
              placeholder="Valor"
            />
            <button
              type="button"
              onClick={() => {
                const next = rows.filter((_, currentIndex) => currentIndex !== index)
                onChange(next.length ? next : [{ key: '', value: '' }])
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfd0] text-slate-500 transition hover:border-red-300 hover:text-red-600"
              aria-label="Remover linha"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...rows, { key: '', value: '' }])}
        className="inline-flex items-center gap-2 rounded-full border border-[#dfd6c8] bg-white px-3 py-2 text-xs font-semibold text-slate-700"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  )
}

function getResponseBody(response: HttpClientResponsePayload | null) {
  if (!response) return ''
  const body = response.response.body || ''
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

export function HttpClientPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('httpClient')
  const [contextState, setContextState] = useState<{
    isLoading: boolean
    error: string
    data: HttpClientContext | null
  }>({
    isLoading: true,
    error: '',
    data: null,
  })
  const [tabs, setTabs] = useState<TabState[]>([])
  const [activeTabId, setActiveTabId] = useState('')
  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogRows, setCatalogRows] = useState<HttpClientCatalogItem[]>([])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await httpClientToolClient.getContext()
        const firstTab = createTab(data.baseUrl, 1)
        setTabs([firstTab])
        setActiveTabId(firstTab.id)
        setContextState({ isLoading: false, error: '', data })
      } catch (error) {
        setContextState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Nao foi possivel carregar o contexto do HTTP Client.',
          data: null,
        })
      }
    })()
  }, [])

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0]
  const filteredCatalogRows = useMemo(() => {
    const normalizedSearch = catalogSearch.trim().toLowerCase()
    if (!normalizedSearch) return catalogRows
    return catalogRows.filter((item) => [item.nome, item.descricao, item.usuario].some((value) => String(value || '').toLowerCase().includes(normalizedSearch)))
  }, [catalogRows, catalogSearch])

  if (!access.canOpen) {
    return <AccessDeniedState title="HTTP Client" />
  }

  function patchActiveTab(patch: Partial<TabState>) {
    if (!activeTab) return
    setTabs((current) => current.map((tab) => (tab.id === activeTab.id ? { ...tab, ...patch } : tab)))
  }

  function patchActiveRequest(patch: Partial<HttpClientRequestDraft>) {
    if (!activeTab) return
    patchActiveTab({
      request: {
        ...activeTab.request,
        ...patch,
      },
    })
  }

  function createNewTab() {
    const next = createTab(contextState.data?.baseUrl || '', tabs.length + 1)
    setTabs((current) => [...current, next])
    setActiveTabId(next.id)
  }

  function closeTab(id: string) {
    if (tabs.length <= 1) return
    const nextTabs = tabs.filter((tab) => tab.id !== id)
    setTabs(nextTabs)
    if (activeTabId === id) {
      setActiveTabId(nextTabs[0]?.id || '')
    }
  }

  async function sendRequest() {
    if (!activeTab) return
    patchActiveTab({ isSending: true })
    try {
      const response = await httpClientToolClient.sendRequest(activeTab.request)
      patchActiveTab({ response, isSending: false })
    } catch (error) {
      patchActiveTab({ isSending: false })
      setToast({ message: error instanceof Error ? error.message : 'Nao foi possivel enviar a requisicao.', tone: 'error' })
    }
  }

  async function openCatalogModal() {
    setCatalogModalOpen(true)
    setCatalogLoading(true)
    setCatalogSearch('')
    try {
      const response = await httpClientToolClient.listCatalog()
      setCatalogRows(response.data || [])
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Nao foi possivel carregar o catalogo.', tone: 'error' })
    } finally {
      setCatalogLoading(false)
    }
  }

  async function loadCatalogItem(catalogId: string) {
    try {
      const response = await httpClientToolClient.getCatalogItem(catalogId)
      const loaded = response.data
      const nextTab: TabState = {
        ...createTab(contextState.data?.baseUrl || '', tabs.length + 1),
        title: loaded.nome || `Requisicao ${tabs.length + 1}`,
        request: loaded.request,
        catalogId: loaded.id,
        catalogName: loaded.nome,
        catalogDescription: loaded.descricao,
        catalogPublic: loaded.publico,
      }
      setTabs((current) => [...current, nextTab])
      setActiveTabId(nextTab.id)
      setCatalogModalOpen(false)
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Nao foi possivel carregar a requisicao.', tone: 'error' })
    }
  }

  async function saveActiveTab() {
    if (!activeTab) return
    setSaveLoading(true)
    try {
      const response = await httpClientToolClient.saveCatalogItem({
        id: activeTab.catalogId || undefined,
        nome: activeTab.catalogName || activeTab.title,
        descricao: activeTab.catalogDescription,
        publico: activeTab.catalogPublic,
        request: activeTab.request,
      })
      patchActiveTab({
        catalogId: response.data.id,
        title: activeTab.catalogName || activeTab.title,
      })
      setToast({ message: response.message, tone: 'success' })
      setSaveModalOpen(false)
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Nao foi possivel salvar a requisicao.', tone: 'error' })
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="HTTP Client"
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('menuKeys.ferramentas', 'Ferramentas') },
          { label: 'HTTP Client' },
        ]}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={createNewTab} className="inline-flex items-center gap-2 rounded-full border border-[#e7dece] bg-white px-3.5 py-2 text-sm font-semibold text-slate-700">
              <Plus className="h-4 w-4" />
              {t('common.new', 'Novo')}
            </button>
            <button type="button" onClick={() => void openCatalogModal()} className="inline-flex items-center gap-2 rounded-full border border-[#e7dece] bg-white px-3.5 py-2 text-sm font-semibold text-slate-700">
              <FolderOpen className="h-4 w-4" />
              Catalogo
            </button>
            <button type="button" onClick={() => setSaveModalOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#e7dece] bg-white px-3.5 py-2 text-sm font-semibold text-slate-700">
              <Save className="h-4 w-4" />
              Salvar
            </button>
            <button
              type="button"
              onClick={() => void sendRequest()}
              disabled={!activeTab || activeTab.isSending}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {activeTab?.isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar
            </button>
          </div>
        )}
      />

      <SectionCard className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <div key={tab.id} className={['inline-flex items-center gap-1 rounded-full border px-2 py-1', tab.id === activeTab?.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-[#e2d8c9] bg-[#fcfaf5] text-slate-700'].join(' ')}>
              <button type="button" onClick={() => setActiveTabId(tab.id)} className="px-2 py-0.5 text-sm font-semibold">
                {tab.title}
              </button>
              {tabs.length > 1 ? (
                <button type="button" onClick={() => closeTab(tab.id)} aria-label="Fechar aba" className={tab.id === activeTab?.id ? 'text-white/80' : 'text-slate-500'}>
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <AsyncState isLoading={contextState.isLoading} error={contextState.error}>
          {activeTab ? (
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4 rounded-[1rem] border border-[#ece3d6] bg-[#fdfbf7] p-4">
                <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Origem do endpoint</span>
                    <select
                      value={activeTab.request.endpointMode}
                      onChange={(event) => patchActiveRequest({ endpointMode: event.target.value === 'custom' ? 'custom' : 'agile' })}
                      className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm"
                    >
                      <option value="agile">Agile API (catalogo)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Metodo</span>
                    <select value={activeTab.request.method} onChange={(event) => patchActiveRequest({ method: event.target.value as HttpClientRequestDraft['method'] })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm">
                      {METHOD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                </div>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Base URL</span>
                  <input value={activeTab.request.baseUrl} onChange={(event) => patchActiveRequest({ baseUrl: event.target.value })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm" placeholder="https://api.seucluster.com" />
                </label>
                {activeTab.request.endpointMode === 'agile' ? (
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Endpoint Agile API</span>
                    <select
                      value={activeTab.request.endpointCatalogValue}
                      onChange={(event) => {
                        const value = event.target.value
                        const method = value.includes(' ') ? value.split(' ')[0] : ''
                        patchActiveRequest({
                          endpointCatalogValue: value,
                          method: METHOD_OPTIONS.includes(method as HttpClientRequestDraft['method'])
                            ? (method as HttpClientRequestDraft['method'])
                            : activeTab.request.method,
                        })
                      }}
                      className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Selecione o endpoint</option>
                      {(contextState.data?.endpointCatalog || []).map((item) => (
                        <option key={item.label} value={item.label}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Endpoint custom</span>
                    <input value={activeTab.request.endpointCustom} onChange={(event) => patchActiveRequest({ endpointCustom: event.target.value })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm" placeholder="/clientes ou https://host/path" />
                  </label>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Filtros (querystring)</span>
                    <input value={activeTab.request.filtersQuery} onChange={(event) => patchActiveRequest({ filtersQuery: event.target.value })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm" placeholder="id=123&status=ativo" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Timeout (segundos)</span>
                    <input type="number" min={1} max={300} value={activeTab.request.timeoutSeconds} onChange={(event) => patchActiveRequest({ timeoutSeconds: Number(event.target.value) || 60 })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm" />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Tipo do body</span>
                    <select value={activeTab.request.bodyType} onChange={(event) => patchActiveRequest({ bodyType: event.target.value as HttpClientRequestDraft['bodyType'] })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm">
                      {BODY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Autenticacao</span>
                    <select value={activeTab.request.authType} onChange={(event) => patchActiveRequest({ authType: event.target.value as HttpClientRequestDraft['authType'] })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm">
                      <option value="platform">Plataforma (padrao)</option>
                      <option value="bearer">Bearer token</option>
                      <option value="basic">Basic auth</option>
                      <option value="none">Sem autenticacao</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-[0.9rem] border border-[#e6dfd3] bg-white px-3 py-2">
                    <span className="text-xs font-semibold text-slate-600">Incluir header Empresa automaticamente</span>
                    <BooleanChoice value={activeTab.request.includeEmpresaHeader} onChange={(value) => patchActiveRequest({ includeEmpresaHeader: value })} />
                  </div>
                  <div className="space-y-1 rounded-[0.9rem] border border-[#e6dfd3] bg-white px-3 py-2 text-xs text-slate-600">
                    <p>Empresa: <strong>{contextState.data?.empresaHeader || '-'}</strong></p>
                    <p>Token plataforma: <strong>{contextState.data?.tokenMasked || '-'}</strong></p>
                  </div>
                </div>
                {activeTab.request.authType === 'bearer' ? (
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Bearer token custom</span>
                    <input type="password" value={activeTab.request.bearerToken} onChange={(event) => patchActiveRequest({ bearerToken: event.target.value })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm" placeholder="Informe o token" />
                  </label>
                ) : null}
                {activeTab.request.authType === 'basic' ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-600">Usuario</span>
                      <input value={activeTab.request.basicUser} onChange={(event) => patchActiveRequest({ basicUser: event.target.value })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-600">Senha</span>
                      <input type="password" value={activeTab.request.basicPass} onChange={(event) => patchActiveRequest({ basicPass: event.target.value })} className="w-full rounded-[0.8rem] border border-[#e6dfd3] bg-white px-3 py-2 text-sm" />
                    </label>
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">Query Params adicionais</p>
                    <KeyValueTable rows={activeTab.request.queryRows} onChange={(rows) => patchActiveRequest({ queryRows: rows })} addLabel="Adicionar param" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">Headers customizados</p>
                    <KeyValueTable rows={activeTab.request.headers} onChange={(rows) => patchActiveRequest({ headers: rows })} addLabel="Adicionar header" />
                  </div>
                </div>

                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Body da requisicao</span>
                  <textarea
                    value={activeTab.request.body}
                    onChange={(event) => patchActiveRequest({ body: event.target.value })}
                    rows={12}
                    className="w-full rounded-[1rem] border border-[#e6dfd3] bg-[#0f172a] px-4 py-3 font-mono text-xs text-slate-100 outline-none"
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-[1rem] border border-[#ece3d6] bg-[#fdfbf7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900">Resposta</h2>
                  <button
                    type="button"
                    onClick={() => void copyTextToClipboard(getResponseBody(activeTab.response)).then(() => setToast({ message: 'Resposta copiada para a area de transferencia.', tone: 'success' })).catch(() => setToast({ message: 'Nao foi possivel copiar a resposta.', tone: 'error' }))}
                    className="inline-flex items-center gap-2 rounded-full border border-[#e4dacb] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar resposta
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-[0.9rem] border border-[#e4dacb] bg-white px-3 py-2">
                    <p className="text-slate-500">Status</p>
                    <p className="font-semibold text-slate-900">{activeTab.response?.response.status ?? '-'}</p>
                  </div>
                  <div className="rounded-[0.9rem] border border-[#e4dacb] bg-white px-3 py-2">
                    <p className="text-slate-500">Tempo</p>
                    <p className="font-semibold text-slate-900">{activeTab.response ? `${activeTab.response.response.durationMs} ms` : '-'}</p>
                  </div>
                  <div className="rounded-[0.9rem] border border-[#e4dacb] bg-white px-3 py-2">
                    <p className="text-slate-500">Content-Type</p>
                    <p className="font-semibold text-slate-900 line-clamp-1">{activeTab.response?.response.contentType || '-'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Response Headers</p>
                  <textarea readOnly value={activeTab.response ? Object.entries(activeTab.response.response.headers).map(([key, value]) => `${key}: ${value}`).join('\n') : ''} rows={8} className="w-full rounded-[1rem] border border-[#e6dfd3] bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Body</p>
                  <textarea readOnly value={getResponseBody(activeTab.response)} rows={16} className="w-full rounded-[1rem] border border-[#e6dfd3] bg-[#0f172a] px-4 py-3 font-mono text-xs text-slate-100 outline-none" />
                </div>
              </div>
            </div>
          ) : null}
        </AsyncState>
      </SectionCard>

      <OverlayModal open={catalogModalOpen} onClose={() => setCatalogModalOpen(false)} title="Catalogo de requisicoes" maxWidthClassName="max-w-5xl">
        <div className="space-y-3">
          <input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} className="w-full rounded-[0.85rem] border border-[#e5dccf] bg-white px-3 py-2 text-sm" placeholder="Buscar no catalogo" />
          <AsyncState isLoading={catalogLoading} error="">
            <div className="max-h-[60vh] overflow-auto rounded-[1rem] border border-[#e6ddcf] bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#f8f3ea] text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Descricao</th>
                    <th className="px-3 py-2">Publico</th>
                    <th className="px-3 py-2">Usuario</th>
                    <th className="px-3 py-2 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogRows.length ? filteredCatalogRows.map((item) => (
                    <tr key={item.id} className="border-t border-[#f0eadd]">
                      <td className="px-3 py-2 text-xs text-slate-600">{item.id}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{item.nome}</td>
                      <td className="px-3 py-2 text-slate-600">{item.descricao || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{item.publico ? 'Sim' : 'Nao'}</td>
                      <td className="px-3 py-2 text-slate-600">{item.usuario || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => void loadCatalogItem(item.id)} className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
                          <FolderOpen className="h-3.5 w-3.5" />
                          Carregar
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">Nenhuma requisicao salva.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </AsyncState>
        </div>
      </OverlayModal>

      <OverlayModal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Salvar requisicao" maxWidthClassName="max-w-2xl">
        {activeTab ? (
          <div className="space-y-4">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-700">Nome</span>
              <input value={activeTab.catalogName} onChange={(event) => patchActiveTab({ catalogName: event.target.value })} className="w-full rounded-[0.85rem] border border-[#e5dccf] bg-white px-3 py-2 text-sm" placeholder="Ex.: Buscar clientes ativos" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-700">Descricao</span>
              <textarea value={activeTab.catalogDescription} onChange={(event) => patchActiveTab({ catalogDescription: event.target.value })} rows={4} className="w-full rounded-[0.85rem] border border-[#e5dccf] bg-white px-3 py-2 text-sm" />
            </label>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-slate-700">Publico</span>
              <BooleanChoice value={activeTab.catalogPublic} onChange={(value) => patchActiveTab({ catalogPublic: value })} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSaveModalOpen(false)} className="rounded-full border border-[#e5dccf] bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {t('common.cancel', 'Cancelar')}
              </button>
              <button type="button" onClick={() => void saveActiveTab()} disabled={saveLoading} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common.save', 'Salvar')}
              </button>
            </div>
          </div>
        ) : null}
      </OverlayModal>

      {toast ? <PageToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}
    </div>
  )
}
