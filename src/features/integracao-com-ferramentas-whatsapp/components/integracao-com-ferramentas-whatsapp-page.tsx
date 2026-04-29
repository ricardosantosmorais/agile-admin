'use client'

import {
	AlertCircle,
	CheckCircle2,
	Copy,
	FileText,
	Link2,
	Loader2,
	MessageCircle,
	Play,
	Plus,
	RefreshCcw,
	Save,
	Send,
	ShieldCheck,
	Sparkles,
	Trash2,
	Webhook,
	X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn, AppDataTableRowAction } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { JsonCodeEditor } from '@/src/components/ui/json-code-editor'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { TabButton } from '@/src/components/ui/tab-button'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoComFerramentasWhatsappClient } from '@/src/features/integracao-com-ferramentas-whatsapp/services/integracao-com-ferramentas-whatsapp-client'
import type { WhatsappProviderForm, WhatsappSetup, WhatsappTemplate, WhatsappTemplateDraft, WhatsappTestDraft } from '@/src/features/integracao-com-ferramentas-whatsapp/services/integracao-com-ferramentas-whatsapp-types'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

type TabId = 'connection' | 'signup' | 'templates' | 'webhooks' | 'test'
type ToastState = { tone: 'success' | 'error'; message: string }
type WhatsappWebhookEvent = Record<string, unknown>

type FacebookSdk = {
	init: (options: Record<string, unknown>) => void
	login: (callback: (response: { authResponse?: { code?: string } }) => void, options: Record<string, unknown>) => void
}

declare global {
	interface Window {
		FB?: FacebookSdk
		fbAsyncInit?: () => void
	}
}

const tabStorageKey = 'admin-v2-whatsapp-active-tab'
const fieldClass = 'app-control app-input h-12 w-full rounded-[1rem] px-4 text-sm outline-none transition focus:border-emerald-300'
const textareaClass = 'app-control app-input min-h-28 w-full rounded-[1rem] px-4 py-3 text-sm outline-none transition focus:border-emerald-300'

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
	{ id: 'connection', label: 'Conexão', icon: <Link2 className="h-4 w-4" /> },
	{ id: 'signup', label: 'Embedded Signup', icon: <Sparkles className="h-4 w-4" /> },
	{ id: 'templates', label: 'Templates', icon: <FileText className="h-4 w-4" /> },
	{ id: 'webhooks', label: 'Webhooks', icon: <Webhook className="h-4 w-4" /> },
	{ id: 'test', label: 'Teste de Envio', icon: <Send className="h-4 w-4" /> },
]

const providerStatusOptions = [
	{ value: 'connected', label: 'Conectado' },
	{ value: 'attention', label: 'Requer atenção' },
	{ value: 'disabled', label: 'Desabilitado' },
]

const channelStatusOptions = [
	{ value: 'connected', label: 'Conectado' },
	{ value: 'configured', label: 'Configurado' },
	{ value: 'attention', label: 'Requer atenção' },
]

const consentOptions = [
	{ value: 'granted', label: 'Concedido' },
	{ value: 'pending', label: 'Pendente' },
	{ value: 'revoked', label: 'Revogado' },
]

const templateCategories = [
	{ value: 'UTILITY', label: 'Utility' },
	{ value: 'MARKETING', label: 'Marketing' },
	{ value: 'AUTHENTICATION', label: 'Authentication' },
]

function text(value: unknown, fallback = '') {
	const next = String(value ?? '').trim()
	return next || fallback
}

function bool(value: unknown) {
	return value === true || value === 1 || value === '1' || value === 'true'
}

function prettyJson(value: unknown, fallback = '{}') {
	try {
		return JSON.stringify(value ?? JSON.parse(fallback), null, 2)
	} catch {
		return fallback
	}
}

function statusTone(status: unknown): 'success' | 'warning' | 'danger' | 'neutral' {
	const normalized = text(status).toUpperCase()
	if (['CONNECTED', 'APPROVED', 'GRANTED', 'CONFIGURED'].includes(normalized)) return 'success'
	if (['PENDING', 'AWAITING_CODE_EXCHANGE', 'IN_PROGRESS', 'NOT_STARTED'].includes(normalized)) return 'warning'
	if (['ERROR', 'REJECTED', 'CANCELLED', 'DISABLED', 'REVOKED'].includes(normalized)) return 'danger'
	return 'neutral'
}

function StatusBadge({ status, children }: { status: unknown; children?: ReactNode }) {
	const tone = statusTone(status)
	const className = {
		success: 'app-badge app-badge-success',
		warning: 'app-badge app-badge-warning',
		danger: 'app-badge app-badge-danger',
		neutral: 'app-badge app-badge-neutral',
	}[tone]
	return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${className}`}>{children ?? text(status, 'Pendente')}</span>
}

function Field({ label, children, helper, required = false }: { label: string; children: ReactNode; helper?: string; required?: boolean }) {
	return (
		<label className="block min-w-0">
			<span className="mb-2 block text-[13px] font-bold text-[color:var(--app-text)]">
				{label}{required ? <span className="text-rose-500"> *</span> : null}
			</span>
			{children}
			{helper ? <span className="mt-1.5 block text-[11px] leading-4 text-[color:var(--app-muted)]">{helper}</span> : null}
		</label>
	)
}

function buildProviderForm(setup: WhatsappSetup): WhatsappProviderForm {
	const provider = setup.provider_account || {}
	const channel = setup.channel_config || {}
	const secrets = setup.secrets || {}
	const metadata = typeof provider.metadata_json === 'object' && provider.metadata_json !== null ? provider.metadata_json as Record<string, unknown> : {}
	return {
		enabled: bool(channel.enabled),
		display_name: text(provider.display_name, 'WhatsApp Official Agile B2B'),
		account_reference: text(provider.account_reference, 'whatsapp-corporativo'),
		business_id: text(metadata.business_id),
		waba_id: text(metadata.waba_id, text(provider.account_identifier)),
		phone_number_id: text(metadata.phone_number_id),
		display_phone_number: text(metadata.display_phone_number),
		graph_api_version: text(metadata.graph_api_version, 'v21.0'),
		provider_status: text(provider.status, 'connected'),
		channel_status: text(channel.status, 'connected'),
		consent_state: text(channel.consent_state, 'granted'),
		webhook_verify_token: text(secrets.webhook_verify_token),
		meta_access_token: '',
	}
}

function countTemplateParameters(value: string) {
	return value.match(/\{\{[^}]+\}\}/g)?.length ?? 0
}

function buildTemplateComponentExample(template?: WhatsappTemplate) {
	if (!Array.isArray(template?.components_json)) return []
	const example: unknown[] = []
	for (const component of template.components_json) {
		const record = typeof component === 'object' && component !== null ? component as Record<string, unknown> : {}
		const type = text(record.type).toUpperCase()
		const parameters: unknown[] = []
		const placeholderCount = countTemplateParameters(text(record.text))
		if (type === 'HEADER' && text(record.format).toUpperCase() === 'TEXT' && placeholderCount > 0) {
			parameters.push({ type: 'text', text: 'valor_exemplo' })
		}
		if (type === 'BODY' && placeholderCount > 0) {
			for (let index = 0; index < placeholderCount; index += 1) {
				parameters.push({ type: 'text', text: `valor_exemplo_${index + 1}` })
			}
		}
		if (Array.isArray(record.buttons)) {
			record.buttons.forEach((button, index) => {
				const buttonRecord = typeof button === 'object' && button !== null ? button as Record<string, unknown> : {}
				if (!text(buttonRecord.url).includes('{{')) return
				example.push({ type: 'button', sub_type: text(buttonRecord.type, 'URL').toLowerCase(), index: String(index), parameters: [{ type: 'text', text: 'valor_exemplo' }] })
			})
		}
		if (parameters.length) example.push({ type: type.toLowerCase(), parameters })
	}
	return example
}

function StatCard({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
	return (
		<div className="app-pane-muted rounded-[1rem] border border-line/50 px-4 py-3">
			<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
				{icon}
				{label}
			</div>
			<div className="mt-2 text-sm font-bold text-[color:var(--app-text)]">{value}</div>
		</div>
	)
}

export function IntegracaoComFerramentasWhatsappPage() {
	const { session } = useAuth()
	const [activeTab, setActiveTab] = useState<TabId>('connection')
	const [setup, setSetup] = useState<WhatsappSetup | null>(null)
	const [providerForm, setProviderForm] = useState<WhatsappProviderForm | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [toast, setToast] = useState<ToastState | null>(null)
	const [savingProvider, setSavingProvider] = useState(false)
	const [signupLoading, setSignupLoading] = useState(false)
	const [syncingTemplates, setSyncingTemplates] = useState(false)
	const [templateModalOpen, setTemplateModalOpen] = useState(false)
	const [savingTemplate, setSavingTemplate] = useState(false)
	const [deletingTemplate, setDeletingTemplate] = useState('')
	const [testing, setTesting] = useState(false)
	const [testResult, setTestResult] = useState<unknown>(null)
	const pendingSessionEventRef = useRef<Record<string, unknown> | null>(null)
	const sdkPromiseRef = useRef<Promise<FacebookSdk> | null>(null)
	const [templateDraft, setTemplateDraft] = useState<WhatsappTemplateDraft>({
		account_reference: 'whatsapp-corporativo',
		template_name: '',
		language_code: 'pt_BR',
		category: 'UTILITY',
		components_json: '[\n  {\n    "type": "BODY",\n    "text": "Seu pedido {{1}} foi aprovado."\n  }\n]',
	})
	const [testDraft, setTestDraft] = useState<WhatsappTestDraft>({
		account_reference: 'whatsapp-corporativo',
		mode: 'text',
		phone_number_e164: '',
		preview_url: false,
		text: 'Mensagem de teste',
		template_name: '',
		language_code: 'pt_BR',
		components_json: '[]',
	})

	const canOpen = isRootAgileecommerceAdmin(session)

	const accountReference = providerForm?.account_reference || 'whatsapp-corporativo'
	const templates = setup?.templates || []
	const signupConfig = setup?.signup_config || {}
	const embeddedSignup = setup?.embedded_signup || {}
	const providerMetadata = typeof setup?.provider_account?.metadata_json === 'object' && setup?.provider_account?.metadata_json !== null ? setup.provider_account.metadata_json as Record<string, unknown> : {}
	const secrets = setup?.secrets || {}
	const summary = setup?.summary || {}
	const hasAccessToken = bool(secrets.has_access_token)
	const selectedTemplate = useMemo(() => templates.find((item) => text(item.template_name) === testDraft.template_name), [templates, testDraft.template_name])

	const loadSetup = useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			const loaded = await integracaoComFerramentasWhatsappClient.getSetup()
			const nextProviderForm = buildProviderForm(loaded)
			setSetup(loaded)
			setProviderForm(nextProviderForm)
			setTemplateDraft((current) => ({ ...current, account_reference: nextProviderForm.account_reference }))
			setTestDraft((current) => ({ ...current, account_reference: nextProviderForm.account_reference }))
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a configuração oficial do WhatsApp.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		const remembered = window.sessionStorage.getItem(tabStorageKey)
		if (remembered && tabs.some((tab) => tab.id === remembered)) setActiveTab(remembered as TabId)
	}, [])

	useEffect(() => {
		if (canOpen) void loadSetup()
	}, [canOpen, loadSetup])

	useEffect(() => {
		if (!canOpen) return
		function onMessage(event: MessageEvent) {
			if (!String(event.origin || '').includes('facebook.com')) return
			const source = typeof event.data === 'string' ? (() => { try { return JSON.parse(event.data) } catch { return null } })() : event.data
			const record = typeof source === 'object' && source !== null ? source as Record<string, unknown> : null
			if (!record || record.type !== 'WA_EMBEDDED_SIGNUP') return
			const payload: Record<string, unknown> = {
				...record,
				...(typeof record.payload === 'object' && record.payload !== null ? record.payload as Record<string, unknown> : {}),
				...(typeof record.data === 'object' && record.data !== null ? record.data as Record<string, unknown> : {}),
				account_reference: accountReference,
			}
			payload.event = payload.event || payload.event_type || ''
			pendingSessionEventRef.current = payload
			void integracaoComFerramentasWhatsappClient.captureSessionEvent({
				account_reference: accountReference,
				event: text(payload.event),
				event_type: text(payload.event_type),
				business_id: text(payload.business_id),
				waba_id: text(payload.waba_id),
				phone_number_id: text(payload.phone_number_id),
				display_phone_number: text(payload.display_phone_number),
				payload,
			}).then(() => {
				const eventName = text(payload.event).toUpperCase()
				if (eventName === 'CANCEL') setToast({ tone: 'error', message: 'Onboarding do WhatsApp cancelado pela Meta.' })
				if (eventName === 'ERROR') setToast({ tone: 'error', message: text(payload.error_message, 'A Meta retornou erro no Embedded Signup.') })
			}).catch(() => undefined)
		}
		window.addEventListener('message', onMessage)
		return () => window.removeEventListener('message', onMessage)
	}, [accountReference, canOpen])

	function switchTab(nextTab: TabId) {
		setActiveTab(nextTab)
		window.sessionStorage.setItem(tabStorageKey, nextTab)
	}

	function patchProvider(key: keyof WhatsappProviderForm, value: string | boolean) {
		setProviderForm((current) => current ? { ...current, [key]: value } : current)
	}

	async function saveProvider() {
		if (!providerForm) return
		if (!providerForm.display_name.trim() || !providerForm.account_reference.trim()) {
			setToast({ tone: 'error', message: 'Informe o nome da conta e o account reference.' })
			return
		}
		setSavingProvider(true)
		try {
			const response = await integracaoComFerramentasWhatsappClient.saveProvider(providerForm)
			setToast({ tone: 'success', message: response.message || 'Configuração oficial do WhatsApp salva com sucesso.' })
			await loadSetup()
		} catch (saveError) {
			setToast({ tone: 'error', message: saveError instanceof Error ? saveError.message : 'Falha ao salvar a configuração oficial do WhatsApp.' })
		} finally {
			setSavingProvider(false)
		}
	}

	function loadFacebookSdk() {
		if (sdkPromiseRef.current) return sdkPromiseRef.current
		sdkPromiseRef.current = new Promise<FacebookSdk>((resolve, reject) => {
			if (!bool(signupConfig.enabled)) {
				reject(new Error('Embedded Signup não configurado na api-v3.'))
				return
			}
			function initialize() {
				if (!window.FB) {
					reject(new Error('SDK do Facebook não carregado.'))
					return
				}
				window.FB.init({
					appId: signupConfig.app_id,
					autoLogAppEvents: true,
					xfbml: false,
					version: signupConfig.graph_api_version,
				})
				resolve(window.FB)
			}
			if (window.FB) {
				initialize()
				return
			}
			const previousAsyncInit = window.fbAsyncInit
			window.fbAsyncInit = () => {
				previousAsyncInit?.()
				initialize()
			}
			if (document.getElementById('facebook-jssdk')) return
			const script = document.createElement('script')
			script.id = 'facebook-jssdk'
			script.async = true
			script.defer = true
			script.src = 'https://connect.facebook.net/en_US/sdk.js'
			script.onerror = () => reject(new Error('Não foi possível carregar o SDK do Facebook.'))
			document.body.appendChild(script)
		})
		return sdkPromiseRef.current
	}

	async function startEmbeddedSignup() {
		setSignupLoading(true)
		try {
			const FB = await loadFacebookSdk()
			FB.login((response) => {
				const code = response.authResponse?.code || ''
				if (!code) {
					setSignupLoading(false)
					setToast({ tone: 'error', message: 'A Meta não retornou o código do Embedded Signup.' })
					return
				}
				const sessionEvent = pendingSessionEventRef.current || {}
				void integracaoComFerramentasWhatsappClient.exchangeCode({
					account_reference: accountReference,
					code,
					session_event: sessionEvent,
					business_id: text(sessionEvent.business_id),
					waba_id: text(sessionEvent.waba_id),
					phone_number_id: text(sessionEvent.phone_number_id),
					display_phone_number: text(sessionEvent.display_phone_number),
				}).then(async (result) => {
					pendingSessionEventRef.current = null
					setToast({ tone: 'success', message: result.message || 'Conta oficial do WhatsApp vinculada com sucesso via Meta.' })
					await loadSetup()
				}).catch((error) => {
					setToast({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível concluir o Embedded Signup.' })
				}).finally(() => setSignupLoading(false))
			}, {
				config_id: signupConfig.config_id,
				response_type: 'code',
				override_default_response_type: true,
				extras: {
					setup: signupConfig.setup || {},
					feature: signupConfig.feature || 'whatsapp_embedded_signup',
					sessionInfoVersion: signupConfig.session_info_version || '3',
				},
			})
		} catch (signupError) {
			setSignupLoading(false)
			setToast({ tone: 'error', message: signupError instanceof Error ? signupError.message : 'Não foi possível inicializar o Embedded Signup.' })
		}
	}

	async function syncTemplates() {
		setSyncingTemplates(true)
		try {
			const response = await integracaoComFerramentasWhatsappClient.syncTemplates(accountReference)
			setToast({ tone: 'success', message: response.message || 'Templates do WhatsApp sincronizados com sucesso.' })
			await loadSetup()
		} catch (syncError) {
			setToast({ tone: 'error', message: syncError instanceof Error ? syncError.message : 'Falha ao sincronizar templates do WhatsApp.' })
		} finally {
			setSyncingTemplates(false)
		}
	}

	async function createTemplate() {
		if (!templateDraft.template_name.trim() || !templateDraft.language_code.trim() || !templateDraft.components_json.trim()) {
			setToast({ tone: 'error', message: 'Informe nome, idioma e Components JSON do template.' })
			return
		}
		setSavingTemplate(true)
		try {
			const response = await integracaoComFerramentasWhatsappClient.createTemplate(templateDraft)
			setToast({ tone: 'success', message: response.message || 'Template oficial do WhatsApp criado com sucesso.' })
			setTemplateModalOpen(false)
			setTemplateDraft((current) => ({ ...current, template_name: '', components_json: '[\n  {\n    "type": "BODY",\n    "text": "Seu pedido {{1}} foi aprovado."\n  }\n]' }))
			await loadSetup()
		} catch (createError) {
			setToast({ tone: 'error', message: createError instanceof Error ? createError.message : 'Falha ao criar template do WhatsApp.' })
		} finally {
			setSavingTemplate(false)
		}
	}

	async function deleteTemplate(template: WhatsappTemplate) {
		const templateName = text(template.template_name)
		if (!templateName || !window.confirm('Remover template? Essa ação tenta excluir o template oficial na Meta e remover o registro local.')) return
		setDeletingTemplate(templateName)
		try {
			const response = await integracaoComFerramentasWhatsappClient.deleteTemplate({
				account_reference: accountReference,
				template_name: templateName,
				meta_template_id: text(template.meta_template_id),
			})
			setToast({ tone: 'success', message: response.message || 'Template oficial do WhatsApp removido com sucesso.' })
			await loadSetup()
		} catch (deleteError) {
			setToast({ tone: 'error', message: deleteError instanceof Error ? deleteError.message : 'Falha ao remover template do WhatsApp.' })
		} finally {
			setDeletingTemplate('')
		}
	}

	function patchTest(patch: Partial<WhatsappTestDraft>) {
		setTestDraft((current) => ({ ...current, ...patch }))
	}

	function selectTestTemplate(templateName: string) {
		const template = templates.find((item) => text(item.template_name) === templateName)
		patchTest({
			template_name: templateName,
			language_code: text(template?.language_code, 'pt_BR'),
			components_json: prettyJson(buildTemplateComponentExample(template), '[]'),
		})
	}

	async function sendTest() {
		if (!testDraft.phone_number_e164.trim()) {
			setToast({ tone: 'error', message: 'Informe o número destino para executar o teste.' })
			return
		}
		setTesting(true)
		setTestResult(null)
		try {
			const response = await integracaoComFerramentasWhatsappClient.sendTest(testDraft)
			setTestResult(response.data || response)
			setToast({ tone: 'success', message: response.message || 'Envio de teste executado com sucesso.' })
		} catch (testError) {
			setToast({ tone: 'error', message: testError instanceof Error ? testError.message : 'Falha ao executar envio de teste no WhatsApp.' })
		} finally {
			setTesting(false)
		}
	}

	function copy(value: string, label: string) {
		void navigator.clipboard?.writeText(value).then(() => setToast({ tone: 'success', message: `${label} copiado.` }))
	}

	const templateColumns: AppDataTableColumn<WhatsappTemplate>[] = [
		{
			id: 'template_name',
			label: 'Template',
			cell: (template) => <span className="font-bold text-[color:var(--app-text)]">{text(template.template_name, '-')}</span>,
		},
		{
			id: 'language_code',
			label: 'Idioma',
			thClassName: 'w-[120px]',
			tdClassName: 'w-[120px]',
			cell: (template) => <span className="text-[color:var(--app-muted)]">{text(template.language_code, '-')}</span>,
		},
		{
			id: 'category',
			label: 'Categoria',
			thClassName: 'w-[160px]',
			tdClassName: 'w-[160px]',
			cell: (template) => <span className="text-[color:var(--app-muted)]">{text(template.category, '-')}</span>,
		},
		{
			id: 'status',
			label: 'Status',
			thClassName: 'w-[150px]',
			tdClassName: 'w-[150px]',
			cell: (template) => <StatusBadge status={template.status} />,
		},
	]
	const webhookEventColumns: AppDataTableColumn<WhatsappWebhookEvent>[] = [
		{
			id: 'event_type',
			label: 'Tipo',
			cell: (event) => <span className="font-bold text-[color:var(--app-text)]">{text(event.event_type, '-')}</span>,
		},
		{
			id: 'external_id',
			label: 'External ID',
			cell: (event) => <span className="text-[color:var(--app-muted)]">{text(event.external_id, '-')}</span>,
		},
		{
			id: 'processed_at',
			label: 'Processado em',
			cell: (event) => <span className="text-[color:var(--app-muted)]">{text(event.processed_at, '-')}</span>,
		},
	]
	const templateRowActions = (template: WhatsappTemplate): AppDataTableRowAction<WhatsappTemplate>[] => {
		const templateName = text(template.template_name)
		return [
			{
				id: 'delete',
				label: 'Excluir template',
				icon: deletingTemplate === templateName ? Loader2 : Trash2,
				tone: 'danger',
				disabled: Boolean(deletingTemplate),
				onClick: () => void deleteTemplate(template),
			},
		]
	}

	if (!session) {
		return <AsyncState isLoading loadingTitle="Carregando sessão" loadingDescription="Validando acesso à configuração oficial do WhatsApp." />
	}

	if (!canOpen) {
		return <AccessDeniedState title="Integração com Ferramentas - WhatsApp" />
	}

	return (
		<div className="space-y-5">
			<PageToast message={toast?.message || null} tone={toast?.tone} onClose={() => setToast(null)} />
			<PageHeader
				breadcrumbs={[
					{ label: 'Início', href: '/dashboard' },
					{ label: 'Integração com Ferramentas' },
					{ label: 'WhatsApp' },
				]}
				actions={
					<button type="button" onClick={() => void startEmbeddedSignup()} disabled={!bool(signupConfig.enabled) || signupLoading} className="app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold">
						{signupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
						Conectar com Meta
					</button>
				}
			/>
			<AsyncState isLoading={loading} error={error} loadingTitle="Carregando WhatsApp" loadingDescription="Buscando conta, templates, webhooks e configuração da Meta." errorAction={<button type="button" onClick={() => void loadSetup()} className="app-button-secondary rounded-full px-4 py-2 text-sm font-bold">Tentar novamente</button>}>
				{setup && providerForm ? (
					<>
						<SectionCard className="pb-4">
							<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
								<div className="min-w-0">
									<div className="mb-3 flex flex-wrap items-center gap-2">
										<span className="app-badge app-badge-success inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]">
											<MessageCircle className="h-3.5 w-3.5" />
											WhatsApp Official
										</span>
										<StatusBadge status={providerForm.provider_status} />
									</div>
									<h1 className="truncate text-2xl font-black tracking-tight text-[color:var(--app-text)]">{providerForm.display_name}</h1>
									<p className="mt-1 text-sm text-[color:var(--app-muted)]">{accountReference} · {text(providerMetadata.display_phone_number, 'Número ainda não vinculado')}</p>
								</div>
								<div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:w-[560px]">
									<StatCard label="Signup" value={<StatusBadge status={text(embeddedSignup.state, 'not_started')} />} icon={<Sparkles className="h-3.5 w-3.5" />} />
									<StatCard label="Token" value={hasAccessToken ? 'Configurado' : 'Pendente'} icon={<ShieldCheck className="h-3.5 w-3.5" />} />
									<StatCard label="Aprovados" value={String(summary.approved_templates ?? 0)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
									<StatCard label="Pendentes" value={String(summary.pending_templates ?? 0)} icon={<AlertCircle className="h-3.5 w-3.5" />} />
								</div>
							</div>
						</SectionCard>

						<div className="app-shell-card-modern rounded-[1.45rem] p-2">
							<div className="flex flex-wrap gap-2">
								{tabs.map((tab) => <TabButton key={tab.id} active={activeTab === tab.id} label={tab.label} icon={tab.icon} onClick={() => switchTab(tab.id)} />)}
							</div>
						</div>

						{activeTab === 'connection' ? (
							<div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.75fr)]">
								<SectionCard title="Conexão" description="Configure a conta oficial, credenciais operacionais e status do canal." action={<button type="button" onClick={() => void saveProvider()} disabled={savingProvider} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold">{savingProvider ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar configuração</button>}>
									<div className="grid gap-4 md:grid-cols-2">
										<Field label="Canal habilitado"><BooleanChoice value={providerForm.enabled} onChange={(value) => patchProvider('enabled', value)} trueLabel="Ativo" falseLabel="Inativo" /></Field>
										<Field label="Nome da conta" required><input className={fieldClass} value={providerForm.display_name} onChange={(event) => patchProvider('display_name', event.target.value)} /></Field>
										<Field label="Account reference" required><input className={fieldClass} value={providerForm.account_reference} onChange={(event) => patchProvider('account_reference', event.target.value)} /></Field>
										<Field label="Graph API Version"><input className={fieldClass} value={providerForm.graph_api_version} onChange={(event) => patchProvider('graph_api_version', event.target.value)} /></Field>
										<Field label="Business ID"><input className={fieldClass} value={providerForm.business_id} onChange={(event) => patchProvider('business_id', event.target.value)} placeholder="Informe o Business ID da Meta" /></Field>
										<Field label="WABA ID"><input className={fieldClass} value={providerForm.waba_id} onChange={(event) => patchProvider('waba_id', event.target.value)} placeholder="Informe o WhatsApp Business Account ID" /></Field>
										<Field label="Phone Number ID"><input className={fieldClass} value={providerForm.phone_number_id} onChange={(event) => patchProvider('phone_number_id', event.target.value)} placeholder="Informe o Phone Number ID" /></Field>
										<Field label="Número exibido"><input className={fieldClass} value={providerForm.display_phone_number} onChange={(event) => patchProvider('display_phone_number', event.target.value)} placeholder="+55 11 99999-9999" /></Field>
										<Field label="Status do provider"><select className={fieldClass} value={providerForm.provider_status} onChange={(event) => patchProvider('provider_status', event.target.value)}>{providerStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
										<Field label="Status do canal"><select className={fieldClass} value={providerForm.channel_status} onChange={(event) => patchProvider('channel_status', event.target.value)}>{channelStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
										<Field label="Consentimento"><select className={fieldClass} value={providerForm.consent_state} onChange={(event) => patchProvider('consent_state', event.target.value)}>{consentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
										<Field label="Webhook verify token" helper="Use o mesmo token no webhook configurado na Meta."><input className={fieldClass} value={providerForm.webhook_verify_token} onChange={(event) => patchProvider('webhook_verify_token', event.target.value)} /></Field>
										<div className="md:col-span-2">
											<Field label="Access token da Meta" helper="Deixe em branco se não quiser substituir o token já salvo."><textarea className={textareaClass} value={providerForm.meta_access_token} onChange={(event) => patchProvider('meta_access_token', event.target.value)} placeholder="Cole aqui o token de acesso da Meta" /></Field>
										</div>
									</div>
								</SectionCard>
								<SectionCard title="Ativos vinculados" description="Leitura rápida dos ativos que vieram da Meta e da api-v3.">
									<div className="space-y-3">
										{[
											['Estado do signup', <StatusBadge key="signup" status={text(embeddedSignup.state, 'not_started')} />],
											['Token operacional', hasAccessToken ? text(secrets.access_token_preview, 'Configurado') : 'Pendente'],
											['Business ID', providerForm.business_id || 'Não informado'],
											['WABA ID', providerForm.waba_id || 'Não informado'],
											['Phone Number ID', providerForm.phone_number_id || 'Não informado'],
											['Número exibido', providerForm.display_phone_number || 'Não vinculado'],
										].map(([label, value]) => (
											<div key={String(label)} className="flex min-w-0 items-center justify-between gap-3 rounded-[0.9rem] border border-line/50 px-3 py-2.5">
												<span className="text-xs font-bold text-[color:var(--app-muted)]">{label}</span>
												<span className="min-w-0 truncate text-sm font-bold text-[color:var(--app-text)]">{value}</span>
											</div>
										))}
									</div>
									<button type="button" onClick={() => void startEmbeddedSignup()} disabled={!bool(signupConfig.enabled) || signupLoading} className="app-button-secondary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold">
										{signupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
										Conectar com Meta
									</button>
								</SectionCard>
							</div>
						) : null}

						{activeTab === 'signup' ? (
							<div className="space-y-5">
								<div className="grid gap-5 lg:grid-cols-2">
									<SectionCard title="Configuração do Embedded Signup" description="Configuração hospedada na api-v3 para abrir o onboarding oficial da Meta." action={<button type="button" onClick={() => void startEmbeddedSignup()} disabled={!bool(signupConfig.enabled) || signupLoading} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold">{signupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Iniciar onboarding</button>}>
										{!bool(signupConfig.enabled) ? (
											<div className="app-warning-panel rounded-[1rem] px-4 py-3 text-sm font-medium">Configure na api-v3 as variáveis do app Meta e o config_id do Embedded Signup para liberar o onboarding hospedado.</div>
										) : (
											<div className="grid gap-3 sm:grid-cols-2">
												<StatCard label="App ID" value={text(signupConfig.app_id, 'Não informado')} icon={<ShieldCheck className="h-3.5 w-3.5" />} />
												<StatCard label="Configuration ID" value={text(signupConfig.config_id, 'Não informado')} icon={<Sparkles className="h-3.5 w-3.5" />} />
												<StatCard label="Graph API" value={text(signupConfig.graph_api_version, 'v21.0')} icon={<Link2 className="h-3.5 w-3.5" />} />
												<StatCard label="Session Info" value={text(signupConfig.session_info_version, '3')} icon={<FileText className="h-3.5 w-3.5" />} />
											</div>
										)}
									</SectionCard>
									<SectionCard title="Estado do onboarding" description="Últimos sinais recebidos do Embedded Signup.">
										<div className="space-y-3 text-sm">
											<div className="flex justify-between gap-3"><span className="font-bold text-[color:var(--app-muted)]">Estado atual</span><StatusBadge status={text(embeddedSignup.state, 'not_started')} /></div>
											<div className="flex justify-between gap-3"><span className="font-bold text-[color:var(--app-muted)]">Último evento</span><span className="text-right font-bold">{text(embeddedSignup.last_event, 'Nenhum')}</span></div>
											<div className="flex justify-between gap-3"><span className="font-bold text-[color:var(--app-muted)]">Última atualização</span><span className="text-right font-bold">{text(embeddedSignup.last_event_at, 'Nenhuma')}</span></div>
											<div className="flex justify-between gap-3"><span className="font-bold text-[color:var(--app-muted)]">App subscription</span><span className="text-right font-bold">{text(embeddedSignup.app_subscription_status, 'pending')}</span></div>
											<div className="flex justify-between gap-3"><span className="font-bold text-[color:var(--app-muted)]">Último erro</span><span className="text-right font-bold">{text(embeddedSignup.last_error, 'Nenhum')}</span></div>
										</div>
									</SectionCard>
								</div>
								<SectionCard title="Payload mais recente da sessão">
									<JsonCodeEditor id="whatsapp-session-payload" value={prettyJson(embeddedSignup.session_payload, '{}')} onChange={() => undefined} readOnly height="320px" />
								</SectionCard>
							</div>
						) : null}

						{activeTab === 'templates' ? (
							<SectionCard title="Templates oficiais" description="Sincronize, crie e remova templates oficiais do WhatsApp." action={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => void syncTemplates()} disabled={syncingTemplates} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold">{syncingTemplates ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Sincronizar</button><button type="button" onClick={() => setTemplateModalOpen(true)} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold"><Plus className="h-4 w-4" /> Novo template</button></div>}>
								<div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
									<StatCard label="Aprovados" value={String(summary.approved_templates ?? 0)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
									<StatCard label="Pendentes" value={String(summary.pending_templates ?? 0)} icon={<AlertCircle className="h-3.5 w-3.5" />} />
									<StatCard label="Conta" value={accountReference} icon={<MessageCircle className="h-3.5 w-3.5" />} />
									<StatCard label="Total local" value={String(templates.length)} icon={<FileText className="h-3.5 w-3.5" />} />
								</div>
								<AppDataTable<WhatsappTemplate>
									rows={templates}
									getRowId={(template) => `${text(template.template_name)}-${text(template.meta_template_id)}`}
									columns={templateColumns}
									emptyMessage="Nenhum template oficial sincronizado."
									mobileCard={{
										title: (template) => text(template.template_name, '-'),
										subtitle: (template) => `${text(template.language_code, '-')} - ${text(template.category, '-')}`,
										badges: (template) => <StatusBadge status={template.status} />,
									}}
									rowActions={templateRowActions}
									actionsLabel="Ações"
									actionsColumnClassName="w-[96px] min-w-[96px] whitespace-nowrap"
								/>
							</SectionCard>
						) : null}

						{activeTab === 'webhooks' ? (
							<div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
								<SectionCard title="Configuração de webhook" description="Dados que devem estar alinhados no painel da Meta.">
									<div className="space-y-4">
										<Field label="Webhook callback URL"><div className="flex gap-2"><input className={fieldClass} value={setup.webhook_url} readOnly /><button type="button" onClick={() => copy(setup.webhook_url, 'Webhook callback URL')} className="app-button-secondary inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full"><Copy className="h-4 w-4" /></button></div></Field>
										<Field label="Webhook verify token"><div className="flex gap-2"><input className={fieldClass} value={text(secrets.webhook_verify_token)} readOnly /><button type="button" onClick={() => copy(text(secrets.webhook_verify_token), 'Webhook verify token')} className="app-button-secondary inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full"><Copy className="h-4 w-4" /></button></div></Field>
										<Field label="Status do webhook"><input className={fieldClass} value={text(providerMetadata.webhook_status, 'pending')} readOnly /></Field>
									</div>
								</SectionCard>
								<SectionCard title="Eventos recentes" description="Últimos eventos de webhook processados pela integração.">
									<AppDataTable<WhatsappWebhookEvent>
										rows={setup.webhook_events || []}
										getRowId={(event) => `${text(event.external_id)}-${text(event.processed_at)}-${text(event.event_type)}`}
										columns={webhookEventColumns}
										emptyMessage="Nenhum evento registrado."
										mobileCard={{
											title: (event) => text(event.event_type, '-'),
											subtitle: (event) => text(event.external_id, '-'),
											meta: (event) => text(event.processed_at, '-'),
										}}
									/>
								</SectionCard>
							</div>
						) : null}

						{activeTab === 'test' ? (
							<div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
								<SectionCard title="Teste de Envio" description="Execute um envio real usando mensagem livre ou template oficial." action={<button type="button" onClick={() => void sendTest()} disabled={testing} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Executar teste</button>}>
									<div className="space-y-4">
										<Field label="Modo"><select className={fieldClass} value={testDraft.mode} onChange={(event) => patchTest({ mode: event.target.value as WhatsappTestDraft['mode'] })}><option value="text">Texto</option><option value="template">Template</option></select></Field>
										<Field label="N?mero destino" required><input className={fieldClass} value={testDraft.phone_number_e164} onChange={(event) => patchTest({ phone_number_e164: event.target.value })} placeholder="5511999999999" /></Field>
										{testDraft.mode === 'text' ? <Field label="Mensagem"><textarea className={textareaClass} value={testDraft.text} onChange={(event) => patchTest({ text: event.target.value })} placeholder="Mensagem de teste" /></Field> : (
											<>
												<Field label="Template"><select className={fieldClass} value={testDraft.template_name} onChange={(event) => selectTestTemplate(event.target.value)}><option value="">Selecione</option>{templates.map((template) => <option key={`${template.template_name}-${template.meta_template_id}`} value={text(template.template_name)}>{text(template.template_name)} ({text(template.status).toUpperCase() || 'SEM STATUS'})</option>)}</select></Field>
												<Field label="Idioma"><input className={fieldClass} value={testDraft.language_code} onChange={(event) => patchTest({ language_code: event.target.value })} /></Field>
												<Field label="Components JSON" helper={selectedTemplate ? 'O exemplo foi preenchido automaticamente com base no template selecionado.' : 'Selecione um template para gerar um exemplo.'}><JsonCodeEditor id="whatsapp-test-components" value={testDraft.components_json} onChange={(value) => patchTest({ components_json: value })} height="260px" /></Field>
											</>
										)}
									</div>
								</SectionCard>
								<SectionCard title="Resultado" description="Retorno da api-v3 ap?s executar o envio de teste.">
									{testResult ? <JsonCodeEditor id="whatsapp-test-result" value={prettyJson(testResult, '{}')} onChange={() => undefined} readOnly height="420px" /> : <div className="app-pane-muted flex min-h-[280px] items-center justify-center rounded-[1rem] text-sm font-medium text-[color:var(--app-muted)]">Execute um teste para visualizar o JSON de retorno.</div>}
								</SectionCard>
							</div>
						) : null}

						<OverlayModal
							open={templateModalOpen}
							title="Novo template"
							onClose={() => setTemplateModalOpen(false)}
							maxWidthClassName="max-w-5xl"
							headerActions={<button type="button" onClick={() => void createTemplate()} disabled={savingTemplate} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold">{savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Criar template</button>}
						>
							<div className="grid gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
								<div className="space-y-4">
									<Field label="Nome" required><input className={fieldClass} value={templateDraft.template_name} onChange={(event) => setTemplateDraft((current) => ({ ...current, template_name: event.target.value }))} placeholder="pedido_entregue" /></Field>
									<Field label="Idioma" required><input className={fieldClass} value={templateDraft.language_code} onChange={(event) => setTemplateDraft((current) => ({ ...current, language_code: event.target.value }))} /></Field>
									<Field label="Categoria" required><select className={fieldClass} value={templateDraft.category} onChange={(event) => setTemplateDraft((current) => ({ ...current, category: event.target.value }))}>{templateCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
									<div className="app-pane-muted rounded-[1rem] px-4 py-3 text-xs leading-5 text-[color:var(--app-muted)]">Informe o payload no formato aceito pela Meta. O v2 valida o JSON antes de enviar para a api-v3.</div>
								</div>
								<Field label="Components JSON" required><JsonCodeEditor id="whatsapp-template-components" value={templateDraft.components_json} onChange={(value) => setTemplateDraft((current) => ({ ...current, components_json: value }))} height="460px" /></Field>
							</div>
						</OverlayModal>
					</>
				) : null}
			</AsyncState>
		</div>
	)
}
