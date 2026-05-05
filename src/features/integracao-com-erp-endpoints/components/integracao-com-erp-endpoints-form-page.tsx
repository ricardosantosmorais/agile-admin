'use client'

import { Database, IdCard, Loader2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { FormRow } from '@/src/components/ui/form-row'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { TabbedIntegrationFormPage, type IntegrationFormTab } from '@/src/features/integracoes/components/tabbed-integration-form-page'
import {
	addEndpointProfile,
	deleteEndpointProfile,
	integracaoComErpEndpointsClient,
	listEndpointProfiles,
	loadEndpointQueryOptions,
	loadEndpointTableOptions,
	type EndpointProfileRecord,
} from '@/src/features/integracao-com-erp-endpoints/services/integracao-com-erp-endpoints-client'
import {
	ENDPOINT_DATA_SOURCE_OPTIONS,
	ENDPOINT_PROFILE_OPTIONS,
	ENDPOINT_RETURN_TYPE_OPTIONS,
	normalizeEndpointRecord,
} from '@/src/features/integracao-com-erp-endpoints/services/integracao-com-erp-endpoints'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

type Props = {
	id?: string
}

type EndpointFormState = {
	id: string
	ativo: boolean
	publico: boolean
	nome: string
	descricao: string
	tipo_retorno: string
	id_query: string
	id_query_lookup: LookupOption | null
	fonte_dados: string
	id_tabela: string
	id_tabela_lookup: LookupOption | null
	implementacao_nome: string
	limite: string
}

const EMPTY_FORM: EndpointFormState = {
	id: '',
	ativo: true,
	publico: true,
	nome: '',
	descricao: '',
	tipo_retorno: '',
	id_query: '',
	id_query_lookup: null,
	fonte_dados: '',
	id_tabela: '',
	id_tabela_lookup: null,
	implementacao_nome: '',
	limite: '',
}

function asString(value: unknown) {
	return String(value ?? '').trim()
}

function buildLookup(id: string, label: string): LookupOption | null {
	return id ? { id, label: label || id } : null
}

function buildForm(record: CrudRecord): EndpointFormState {
	const normalized = normalizeEndpointRecord(record)
	const queryId = asString(normalized.id_query)
	const tableId = asString(normalized.id_tabela)
	return {
		id: asString(normalized.id),
		ativo: normalized.ativo === true,
		publico: normalized.publico === true,
		nome: asString(normalized.nome),
		descricao: asString(normalized.descricao),
		tipo_retorno: asString(normalized.tipo_retorno),
		id_query: queryId,
		id_query_lookup: buildLookup(queryId, asString(normalized.query_nome)),
		fonte_dados: asString(normalized.fonte_dados),
		id_tabela: tableId,
		id_tabela_lookup: buildLookup(tableId, asString(normalized.tabela_nome)),
		implementacao_nome: asString(normalized.implementacao_nome),
		limite: asString(normalized.limite),
	}
}

function ToggleField({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: () => void }) {
	return (
		<div className="flex min-h-12 items-center">
			<button
				type="button"
				disabled={disabled}
				onClick={onChange}
				className={[
					'relative inline-flex h-7 w-12 shrink-0 rounded-full transition',
					checked ? 'bg-emerald-600' : 'bg-[color:var(--app-control-border)]',
					disabled ? 'cursor-not-allowed opacity-60' : '',
				].join(' ')}
				aria-pressed={checked}
			>
				<span
					className={[
						'absolute top-0.5 h-6 w-6 rounded-full bg-[color:var(--app-panel-solid)] shadow-sm transition',
						checked ? 'left-[1.45rem]' : 'left-0.5',
					].join(' ')}
				/>
			</button>
		</div>
	)
}

export function IntegracaoComErpEndpointsFormPage({ id }: Props) {
	const router = useRouter()
	const { session } = useAuth()
	const { t } = useI18n()
	const access = useFeatureAccess('erpCadastrosEndpoints')
	const isEditing = Boolean(id)
	const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
	const readOnly = isEditing ? !access.canEdit && access.canView : false
	const canSave = !readOnly && (isEditing ? access.canEdit : access.canCreate)
	const [activeTab, setActiveTab] = useState('general')
	const [form, setForm] = useState<EndpointFormState>(EMPTY_FORM)
	const [isLoading, setIsLoading] = useState(Boolean(id))
	const [error, setError] = useState<string | null>(null)
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
	const [saving, setSaving] = useState(false)
	const [profiles, setProfiles] = useState<EndpointProfileRecord[]>([])
	const [profilesLoading, setProfilesLoading] = useState(false)
	const [selectedProfile, setSelectedProfile] = useState('')
	const [profileSaving, setProfileSaving] = useState(false)
	const initialFormRef = useRef<EndpointFormState>(EMPTY_FORM)

	const breadcrumbs = [
		{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
		{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
		{ label: t('menuKeys.integracao-erp-cadastros-list', 'Cadastros'), href: '/integracao-com-erp/cadastros' },
		{ label: t('maintenance.erpIntegration.catalogs.items.endpoints.title', 'Endpoints'), href: '/integracao-com-erp/cadastros/endpoints' },
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
				const loaded = buildForm(await integracaoComErpEndpointsClient.getById(id))
				if (!alive) return
				setForm(loaded)
				initialFormRef.current = loaded
			} catch (loadError) {
				if (alive) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o endpoint.')
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
		if (activeTab !== 'profiles' || !id) return
		let alive = true
		setProfilesLoading(true)
		listEndpointProfiles(id)
			.then((items) => {
				if (alive) setProfiles(items)
			})
			.catch((loadError) => setFeedback({ tone: 'error', message: loadError instanceof Error ? loadError.message : 'Não foi possível carregar os perfis do endpoint.' }))
			.finally(() => {
				if (alive) setProfilesLoading(false)
			})
		return () => {
			alive = false
		}
	}, [activeTab, id])

	const hasChanges = JSON.stringify(form) !== JSON.stringify(initialFormRef.current)
	const profileColumns = useMemo<AppDataTableColumn<EndpointProfileRecord>[]>(() => [
		{
			id: 'idPerfil',
			label: 'Id Perfil',
			cell: (profile) => profile.idPerfil || '-',
		},
		{
			id: 'nomePerfil',
			label: 'Nome Perfil',
			cell: (profile) => profile.nomePerfil || '-',
		},
	], [])

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!canSave) return
		if (!form.nome.trim()) {
			setFeedback({ tone: 'error', message: 'Informe o nome do endpoint.' })
			setActiveTab('general')
			return
		}

		setSaving(true)
		setFeedback(null)
		try {
			await integracaoComErpEndpointsClient.save(form)
			router.push('/integracao-com-erp/cadastros/endpoints')
		} catch (saveError) {
			setFeedback({ tone: 'error', message: saveError instanceof Error ? saveError.message : 'Não foi possível salvar o endpoint.' })
		} finally {
			setSaving(false)
		}
	}

	const handleAddProfile = useCallback(async () => {
		if (!id || !selectedProfile) {
			setFeedback({ tone: 'error', message: 'Selecione o perfil antes de incluir.' })
			return
		}
		setProfileSaving(true)
		try {
			await addEndpointProfile(id, selectedProfile)
			setProfiles(await listEndpointProfiles(id))
			setSelectedProfile('')
		} catch (profileError) {
			setFeedback({ tone: 'error', message: profileError instanceof Error ? profileError.message : 'Não foi possível incluir o perfil.' })
		} finally {
			setProfileSaving(false)
		}
	}, [id, selectedProfile])

	const handleDeleteProfile = useCallback(async (profileId: string) => {
		if (!id || !profileId) return
		setProfileSaving(true)
		try {
			await deleteEndpointProfile(id, profileId)
			setProfiles(await listEndpointProfiles(id))
		} catch (profileError) {
			setFeedback({ tone: 'error', message: profileError instanceof Error ? profileError.message : 'Não foi possível excluir o perfil.' })
		} finally {
			setProfileSaving(false)
		}
	}, [id])

	const tabs = useMemo<IntegrationFormTab[]>(() => [
		{
			key: 'general',
			label: 'Dados gerais',
			icon: <Database className="h-4 w-4" />,
			content: (
				<SectionCard title="Dados gerais">
					<div className="space-y-5">
						<FormRow label="Ativo" required>
							<ToggleField checked={form.ativo} disabled={readOnly} onChange={() => setForm((current) => ({ ...current, ativo: !current.ativo }))} />
						</FormRow>
						<FormRow label="Público" required>
							<ToggleField checked={form.publico} disabled={readOnly} onChange={() => setForm((current) => ({ ...current, publico: !current.publico }))} />
						</FormRow>
						<FormRow label="Nome" required>
							<input value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} disabled={readOnly} maxLength={255} className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm" />
						</FormRow>
						<FormRow label="Descrição" required>
							<input value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} disabled={readOnly} maxLength={255} className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm" />
						</FormRow>
						<FormRow label="Tipo de Retorno" required>
							<select value={form.tipo_retorno} onChange={(event) => setForm((current) => ({ ...current, tipo_retorno: event.target.value }))} disabled={readOnly} className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm">
								<option value="">Selecione</option>
								{ENDPOINT_RETURN_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
							</select>
						</FormRow>
						{form.tipo_retorno === 'view' ? (
							<>
								<FormRow label="Query">
									<LookupSelect
										label="Query"
										value={form.id_query_lookup}
										onChange={(option) => setForm((current) => ({ ...current, id_query: option?.id ?? '', id_query_lookup: option }))}
										loadOptions={loadEndpointQueryOptions}
										disabled={readOnly}
									/>
								</FormRow>
								<FormRow label="Fonte de Dados">
									<select value={form.fonte_dados} onChange={(event) => setForm((current) => ({ ...current, fonte_dados: event.target.value }))} disabled={readOnly} className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm">
										<option value="">Selecione</option>
										{ENDPOINT_DATA_SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
									</select>
								</FormRow>
							</>
						) : null}
						{form.tipo_retorno === 'tabela' ? (
							<FormRow label="Tabela">
								<LookupSelect
									label="Tabela"
									value={form.id_tabela_lookup}
									onChange={(option) => setForm((current) => ({ ...current, id_tabela: option?.id ?? '', id_tabela_lookup: option }))}
									loadOptions={loadEndpointTableOptions}
									disabled={readOnly}
								/>
							</FormRow>
						) : null}
						{form.tipo_retorno === 'implementacao' ? (
							<FormRow label="Nome da Implementação">
								<input value={form.implementacao_nome} onChange={(event) => setForm((current) => ({ ...current, implementacao_nome: event.target.value }))} disabled={readOnly} maxLength={255} className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm" />
							</FormRow>
						) : null}
						<FormRow label="Limite de Requisições por segundo">
							<input value={form.limite} onChange={(event) => setForm((current) => ({ ...current, limite: event.target.value.replace(/\D/g, '').slice(0, 6) }))} disabled={readOnly} maxLength={6} inputMode="numeric" className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm" />
						</FormRow>
					</div>
				</SectionCard>
			),
		},
		{
			key: 'profiles',
			label: 'Perfis',
			icon: <IdCard className="h-4 w-4" />,
			hidden: !isEditing,
			content: (
				<SectionCard title="Perfis" description="Associe os perfis que podem acessar este endpoint.">
					<div className="space-y-5">
						<FormRow label="Perfil" required>
							<div className="flex flex-col gap-3 sm:flex-row">
								<select value={selectedProfile} onChange={(event) => setSelectedProfile(event.target.value)} disabled={readOnly || profileSaving} className="app-input min-h-12 flex-1 rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm">
									<option value="">Selecione</option>
									{ENDPOINT_PROFILE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
								</select>
								<button type="button" onClick={() => void handleAddProfile()} disabled={readOnly || profileSaving || !selectedProfile} className="app-button-primary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
									{profileSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
									Incluir
								</button>
							</div>
						</FormRow>
						<AsyncState isLoading={profilesLoading}>
							<AppDataTable<EndpointProfileRecord>
								rows={profiles}
								getRowId={(profile) => `${profile.id}-${profile.idPerfil}`}
								columns={profileColumns}
								emptyMessage="Não existem perfis associados ao endpoint."
								mobileCard={{
									title: (profile) => profile.nomePerfil || '-',
									subtitle: (profile) => `ID #${profile.idPerfil || '-'}`,
								}}
								actionsLabel="Ações"
								rowActions={(profile) => [{
									id: 'delete',
									label: 'Excluir',
									icon: Trash2,
									tone: 'danger',
									disabled: readOnly || profileSaving,
									onClick: () => void handleDeleteProfile(profile.idPerfil),
								}]}
							/>
						</AsyncState>
					</div>
				</SectionCard>
			),
		},
	], [form, handleAddProfile, handleDeleteProfile, isEditing, profileColumns, profileSaving, profiles, profilesLoading, readOnly, selectedProfile])

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.endpoints.formTitle', 'Endpoint')} backHref="/dashboard" />
	}

	if (!canAccess) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.endpoints.formTitle', 'Endpoint')} backHref="/integracao-com-erp/cadastros/endpoints" />
	}

	return (
		<AsyncState isLoading={isLoading} error={error ?? undefined}>
			<TabbedIntegrationFormPage
				title={isEditing ? `Editar Endpoint - ID #${id}` : 'Novo Endpoint'}
				description="Cadastre endpoints de integração e seus vínculos de perfis."
				breadcrumbs={breadcrumbs}
				formId="integracao-com-erp-endpoint-form"
				loading={false}
				feedback={feedback}
				onCloseFeedback={() => setFeedback(null)}
				onRefresh={() => {
					if (id) void integracaoComErpEndpointsClient.getById(id).then((loaded) => {
						const nextForm = buildForm(loaded)
						setForm(nextForm)
						initialFormRef.current = nextForm
					})
				}}
				tabs={tabs}
				activeTabKey={activeTab}
				onTabChange={setActiveTab}
				canSave={canSave}
				hasChanges={hasChanges}
				saving={saving}
				backHref="/integracao-com-erp/cadastros/endpoints"
				onSubmit={handleSubmit}
			/>
		</AsyncState>
	)
}
