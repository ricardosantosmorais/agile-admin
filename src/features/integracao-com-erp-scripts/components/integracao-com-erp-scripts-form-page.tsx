'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { FormRow } from '@/src/components/ui/form-row'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { TabbedIntegrationFormPage } from '@/src/features/integracoes/components/tabbed-integration-form-page'
import { ScriptCodeEditor } from '@/src/features/integracao-com-erp-scripts/components/script-code-editor'
import { integracaoComErpScriptsClient } from '@/src/features/integracao-com-erp-scripts/services/integracao-com-erp-scripts-client'
import {
	normalizeScriptRecord,
	SCRIPT_LANGUAGE_OPTIONS,
	type ScriptLanguage,
} from '@/src/features/integracao-com-erp-scripts/services/integracao-com-erp-scripts'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

type Props = {
	id?: string
}

type ScriptFormState = {
	id: string
	nome: string
	linguagem: ScriptLanguage
	script: string
	SourceExpressionKey: string
}

const EMPTY_FORM: ScriptFormState = {
	id: '',
	nome: '',
	linguagem: 'javascript',
	script: '',
	SourceExpressionKey: '',
}

function asString(value: unknown) {
	return String(value ?? '').trim()
}

function buildForm(record: CrudRecord): ScriptFormState {
	const normalized = normalizeScriptRecord(record)
	return {
		id: asString(normalized.id),
		nome: asString(normalized.nome),
		linguagem: normalized.linguagem as ScriptLanguage,
		script: asString(normalized.script),
		SourceExpressionKey: asString(normalized.SourceExpressionKey),
	}
}

export function IntegracaoComErpScriptsFormPage({ id }: Props) {
	const router = useRouter()
	const { session } = useAuth()
	const { t } = useI18n()
	const access = useFeatureAccess('erpCadastrosScripts')
	const isEditing = Boolean(id)
	const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
	const readOnly = isEditing ? !access.canEdit && access.canView : false
	const canSave = !readOnly && (isEditing ? access.canEdit : access.canCreate)
	const [form, setForm] = useState<ScriptFormState>(EMPTY_FORM)
	const [isLoading, setIsLoading] = useState(Boolean(id))
	const [error, setError] = useState<string | null>(null)
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
	const [saving, setSaving] = useState(false)
	const initialFormRef = useRef<ScriptFormState>(EMPTY_FORM)

	const breadcrumbs = [
		{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
		{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
		{ label: t('menuKeys.integracao-erp-cadastros-list', 'Cadastros'), href: '/integracao-com-erp/cadastros' },
		{ label: t('maintenance.erpIntegration.catalogs.items.scripts.title', 'Scripts'), href: '/integracao-com-erp/cadastros/scripts' },
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
				const loaded = buildForm(await integracaoComErpScriptsClient.getById(id))
				if (!alive) return
				setForm(loaded)
				initialFormRef.current = loaded
			} catch (loadError) {
				if (alive) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o script.')
			} finally {
				if (alive) setIsLoading(false)
			}
		}
		void bootstrap()
		return () => {
			alive = false
		}
	}, [id])

	const hasChanges = JSON.stringify(form) !== JSON.stringify(initialFormRef.current)

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!canSave) return
		if (!form.nome.trim()) {
			setFeedback({ tone: 'error', message: 'Informe o nome do script.' })
			return
		}
		if (!form.linguagem.trim()) {
			setFeedback({ tone: 'error', message: 'Informe a linguagem do script.' })
			return
		}
		if (!form.script.trim()) {
			setFeedback({ tone: 'error', message: 'O script não pode estar vazio.' })
			return
		}

		setSaving(true)
		setFeedback(null)
		try {
			await integracaoComErpScriptsClient.save(form)
			router.push('/integracao-com-erp/cadastros/scripts')
		} catch (saveError) {
			setFeedback({ tone: 'error', message: saveError instanceof Error ? saveError.message : 'Não foi possível salvar o script.' })
		} finally {
			setSaving(false)
		}
	}

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.scripts.formTitle', 'Script')} backHref="/dashboard" />
	}

	if (!canAccess) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.scripts.formTitle', 'Script')} backHref="/integracao-com-erp/cadastros/scripts" />
	}

	return (
		<AsyncState isLoading={isLoading} error={error ?? undefined}>
			<TabbedIntegrationFormPage
				title={isEditing ? `Editar Script - ID #${id}` : 'Novo Script'}
				description="Cadastre e edite scripts usados pelas rotinas e serviços de integração com ERP."
				breadcrumbs={breadcrumbs}
				formId="integracao-com-erp-script-form"
				loading={false}
				feedback={feedback}
				onCloseFeedback={() => setFeedback(null)}
				onRefresh={() => {
					if (id) void integracaoComErpScriptsClient.getById(id).then((loaded) => setForm(buildForm(loaded)))
				}}
				tabs={[
					{
						key: 'script',
						label: 'Script',
						content: (
							<SectionCard title="Dados do script" description={`Editor configurado para ${form.linguagem}. Ao trocar a linguagem, o realce de sintaxe acompanha o select.`}>
								<div className="space-y-5">
									<FormRow label="Nome" required>
										<input
											value={form.nome}
											onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
											disabled={readOnly}
											maxLength={255}
											className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm"
										/>
									</FormRow>
									<FormRow label="Linguagem" required>
										<select
											value={form.linguagem}
											onChange={(event) => setForm((current) => ({ ...current, linguagem: event.target.value as ScriptLanguage }))}
											disabled={readOnly}
											className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm"
										>
											{SCRIPT_LANGUAGE_OPTIONS.map((language) => (
												<option key={language} value={language}>{language}</option>
											))}
										</select>
									</FormRow>
									<FormRow label="Script" required>
										<ScriptCodeEditor
											editorId={`erp-script-${id || 'novo'}`}
											language={form.linguagem}
											value={form.script}
											onChange={(value) => setForm((current) => ({ ...current, script: value }))}
											readOnly={readOnly}
											height="520px"
										/>
									</FormRow>
								</div>
							</SectionCard>
						),
					},
				]}
				canSave={canSave}
				hasChanges={hasChanges}
				saving={saving}
				backHref="/integracao-com-erp/cadastros/scripts"
				onSubmit={handleSubmit}
			/>
		</AsyncState>
	)
}
