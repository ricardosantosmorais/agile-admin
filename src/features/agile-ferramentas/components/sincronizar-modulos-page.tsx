'use client'

import { CheckCircle2, Database, FileCode2, Loader2, RefreshCcw, Table2, Unplug } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { sincronizarModulosClient, type SincronizarModulosResponse } from '@/src/features/agile-ferramentas/services/sincronizar-modulos-client'
import { useI18n } from '@/src/i18n/use-i18n'

type ToastState = { tone: 'success' | 'error'; message: string }

function MetricCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof FileCode2 }) {
	return (
		<div className="rounded-2xl border border-line/60 bg-[color:var(--app-panel-solid)]/70 p-4 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{label}</div>
					<div className="mt-2 text-2xl font-black text-[color:var(--app-text)]">{value}</div>
				</div>
				<div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--app-soft)] text-[color:var(--app-text)]">
					<Icon className="h-5 w-5" />
				</div>
			</div>
		</div>
	)
}

export function SincronizarModulosPage() {
	const { t } = useI18n()
	const access = useFeatureAccess('syncModules')
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<SincronizarModulosResponse | null>(null)
	const [toast, setToast] = useState<ToastState | null>(null)

	if (!access.canOpen) {
		return <AccessDeniedState title={t('syncModules.title', 'Sincronizar Módulos')} />
	}

	async function executeSync() {
		setLoading(true)
		setToast(null)
		try {
			const response = await sincronizarModulosClient.executar()
			setResult(response)
			setToast({ tone: 'success', message: response.message || t('syncModules.feedback.success', 'Módulos sincronizados com sucesso.') })
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : t('syncModules.feedback.error', 'Não foi possível sincronizar os módulos.'),
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-5">
			<PageHeader
				title={t('syncModules.title', 'Sincronizar Módulos')}
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.ferramentas-root', 'Ferramentas') },
					{ label: t('syncModules.title', 'Sincronizar Módulos') },
				]}
				actions={
					<button type="button" onClick={executeSync} disabled={loading} className="app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
						{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
						{loading ? t('syncModules.actions.syncing', 'Sincronizando') : t('syncModules.actions.sync', 'Sincronizar agora')}
					</button>
				}
			/>

			{toast ? <PageToast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}

			<SectionCard>
				<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
					<div className="space-y-5">
						<div className="rounded-3xl border border-line/60 bg-[color:var(--app-soft)]/55 p-5">
							<div className="flex flex-wrap items-center gap-2">
								<StatusBadge tone={result ? 'success' : 'info'}>
									{result ? t('syncModules.status.synced', 'Sincronizado') : t('syncModules.status.ready', 'Pronto para executar')}
								</StatusBadge>
							</div>
							<h2 className="mt-4 text-2xl font-black text-[color:var(--app-text)]">{t('syncModules.hero.title', 'Atualize os módulos do dicionário')}</h2>
							<p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--app-muted)]">
								{t('syncModules.hero.description', 'A rotina lê os componentes do admin legado, identifica tabelas e campos usados por cada módulo e atualiza os vínculos técnicos usados pelo Dicionário de Dados.')}
							</p>
						</div>

						<div className="grid gap-3 md:grid-cols-3">
							<MetricCard label={t('syncModules.metrics.files', 'Arquivos')} value={result?.arquivosAnalisados ?? '-'} icon={FileCode2} />
							<MetricCard label={t('syncModules.metrics.tables', 'Tabelas')} value={result?.tabelasDetectadas ?? '-'} icon={Table2} />
							<MetricCard label={t('syncModules.metrics.fields', 'Campos vinculados')} value={result?.vinculosCampos ?? '-'} icon={Database} />
						</div>

						{result ? (
							<div className="grid gap-3 md:grid-cols-3">
								<MetricCard label={t('syncModules.metrics.componentsCreated', 'Componentes criados')} value={result.componentesCriados} icon={CheckCircle2} />
								<MetricCard label={t('syncModules.metrics.tableLinks', 'Vínculos de tabela')} value={result.vinculosTabelas} icon={RefreshCcw} />
								<MetricCard label={t('syncModules.metrics.skipped', 'Ignorados')} value={result.ignoradosSemTabela + result.ignoradosSemDicionario} icon={Unplug} />
							</div>
						) : null}
					</div>

					<aside className="rounded-3xl border border-line/60 bg-[color:var(--app-panel-solid)]/80 p-5">
						<div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{t('syncModules.summary.title', 'Resumo técnico')}</div>
						<div className="mt-4 space-y-3 text-sm">
							<div className="flex justify-between gap-3 border-b border-line/50 pb-3">
								<span className="text-[color:var(--app-muted)]">{t('syncModules.summary.source', 'Origem')}</span>
								<span className="max-w-[210px] truncate text-right font-semibold text-[color:var(--app-text)]" title={result?.componentesPath || ''}>{result?.componentesPath || t('syncModules.summary.waiting', 'Aguardando execução')}</span>
							</div>
							<div className="flex justify-between gap-3 border-b border-line/50 pb-3">
								<span className="text-[color:var(--app-muted)]">{t('syncModules.summary.withoutTable', 'Sem tabela detectada')}</span>
								<span className="font-semibold text-[color:var(--app-text)]">{result?.ignoradosSemTabela ?? '-'}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-[color:var(--app-muted)]">{t('syncModules.summary.withoutDictionary', 'Sem dicionário')}</span>
								<span className="font-semibold text-[color:var(--app-text)]">{result?.ignoradosSemDicionario ?? '-'}</span>
							</div>
						</div>
					</aside>
				</div>
			</SectionCard>
		</div>
	)
}
