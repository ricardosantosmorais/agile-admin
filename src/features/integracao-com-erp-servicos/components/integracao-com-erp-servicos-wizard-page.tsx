'use client';

import { ArrowLeft, ChevronRight, Loader2, Play, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AsyncState } from '@/src/components/ui/async-state';
import { LookupSelect } from '@/src/components/ui/lookup-select';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { StepIndicator } from '@/src/components/ui/step-indicator';
import { ToggleCard } from '@/src/components/ui/toggle-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { SqlEditorMonaco } from '@/src/features/editor-sql/components/sql-editor-monaco';
import { sqlEditorClient } from '@/src/features/editor-sql/services/sql-editor-client';
import type { SqlEditorExecuteResponse } from '@/src/features/editor-sql/services/sql-editor-types';
import { integracaoComErpServicosClient } from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-client';
import type {
	IntegracaoComErpServicoWizardCatalog,
	IntegracaoComErpServicoWizardContext,
	IntegracaoComErpServicoWizardOption,
	IntegracaoComErpServicoWizardPayload,
	IntegracaoComErpServicoWizardQueryContext,
} from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-types';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';

type StepId = 'scope' | 'service' | 'query' | 'review';
type WizardDraft = IntegracaoComErpServicoWizardPayload;

const STEP_IDS: StepId[] = ['scope', 'service', 'query', 'review'];
const EMPTY_CATALOG: IntegracaoComErpServicoWizardCatalog = { tipoObjeto: 'query', querys: [], tabelas: [] };
const EMPTY_QUERY_CONTEXT: IntegracaoComErpServicoWizardQueryContext = { fields: [], parameters: [] };
const INTERVAL_OPTIONS = ['2', '5', '10', '15', '20', '30', '45', '60', '120', '180', '240', '300', '360', '720', '1440'];

const defaultDraft: WizardDraft = {
	escopo: 'compartilhado',
	idTemplate: '',
	tipoObjeto: 'query',
	nomeServico: '',
	nomeObjeto: '',
	intervaloExecucao: '10',
	obrigatorio: false,
	auxiliar: {
		modo: 'novo',
		id: '',
		nome: '',
		query: '',
	},
};

function renderInputClass(invalid = false) {
	return [
		'app-control w-full rounded-[1rem] px-3.5 py-3 text-sm text-[color:var(--app-text)]',
		invalid ? 'border-rose-300 ring-2 ring-rose-100 dark:border-rose-400/55 dark:ring-rose-500/20' : '',
	].join(' ');
}

type WizardLookupOption = {
	id: string;
	label: string;
	description: string | undefined;
};

function filterStaticOptions(options: IntegracaoComErpServicoWizardOption[], query: string, page: number, perPage: number): WizardLookupOption[] {
	const normalizedQuery = query.trim().toLowerCase();
	const filtered = options.filter((option) => {
		if (!normalizedQuery) return true;
		return option.label.toLowerCase().includes(normalizedQuery) || String(option.description || '').toLowerCase().includes(normalizedQuery);
	});
	const start = Math.max(0, (page - 1) * perPage);
	return filtered.slice(start, start + perPage).map((option) => ({
		id: option.id,
		label: option.label,
		description: option.description,
	}));
}

function findOptionById(options: IntegracaoComErpServicoWizardOption[], id: string): WizardLookupOption | null {
	const found = options.find((option) => option.id === id);
	return found ? { id: found.id, label: found.label, description: found.description } : null;
}

function escapeRegex(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isIdentifierUsed(sql: string, identifier: string) {
	const normalizedIdentifier = identifier.trim().toLowerCase();
	if (!normalizedIdentifier) return false;
	const re = new RegExp(`(^|[^a-zA-Z0-9_])${escapeRegex(normalizedIdentifier)}([^a-zA-Z0-9_]|$)`);
	return re.test(sql.toLowerCase());
}

function renderContextBadgeClass(active: boolean) {
	return active
		? 'border-emerald-500/20 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
		: 'border-[color:var(--app-control-border)] bg-[color:var(--app-panel-solid)] text-[color:var(--app-text)]';
}

function renderParameterBadgeClass(active: boolean) {
	return active
		? 'border-amber-400/40 bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/20'
		: 'border-amber-300/40 bg-amber-400/85 text-slate-950';
}

function QueryResultPreview({ result }: { result: SqlEditorExecuteResponse }) {
	const { t } = useI18n();

	return (
		<div className="space-y-3">
			<div className="grid gap-3 md:grid-cols-3">
				<div className="app-control-muted rounded-[1rem] px-4 py-3">
					<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
						{t('maintenance.erpIntegration.modules.servicesWizard.metrics.rows', 'Linhas')}
					</p>
					<p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">{result.rows.length}</p>
				</div>
				<div className="app-control-muted rounded-[1rem] px-4 py-3">
					<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
						{t('maintenance.erpIntegration.modules.servicesWizard.metrics.total', 'Total')}
					</p>
					<p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">{result.pagination.total ?? '-'}</p>
				</div>
				<div className="app-control-muted rounded-[1rem] px-4 py-3">
					<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
						{t('maintenance.erpIntegration.modules.servicesWizard.metrics.pagination', 'Paginação')}
					</p>
					<p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">
						{result.pagination.page} / {result.pagination.totalPages ?? '-'}
					</p>
				</div>
			</div>
			<div className="app-control-muted overflow-auto rounded-[1rem] p-4">
				<pre className="max-h-72 whitespace-pre-wrap text-xs text-[color:var(--app-text)]">
					{JSON.stringify(result.rows.slice(0, 3), null, 2)}
				</pre>
			</div>
		</div>
	);
}

export function IntegracaoComErpServicosWizardPage() {
	const { t } = useI18n();
	const router = useRouter();
	const access = useFeatureAccess('erpServicos');
	const canAccess = access.canCreate;
	const [activeStep, setActiveStep] = useState<StepId>('scope');
	const [draft, setDraft] = useState<WizardDraft>(defaultDraft);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [saving, setSaving] = useState(false);
	const [queryRunning, setQueryRunning] = useState(false);
	const [queryResult, setQueryResult] = useState<SqlEditorExecuteResponse | null>(null);

	const contextState = useAsyncData<IntegracaoComErpServicoWizardContext>(() => integracaoComErpServicosClient.getWizardContext(), []);

	useEffect(() => {
		const context = contextState.data;
		if (!context) return;
		setDraft((current) => ({
			...current,
			idTemplate: current.idTemplate || context.idTemplateFixo,
		}));
	}, [contextState.data]);

	const selectedTemplateId = draft.idTemplate || contextState.data?.idTemplateFixo || '';
	const catalogState = useAsyncData(
		() => (selectedTemplateId ? integracaoComErpServicosClient.getWizardCatalog(selectedTemplateId) : Promise.resolve(EMPTY_CATALOG)),
		[selectedTemplateId],
	);
	const queryContextState = useAsyncData(
		() => integracaoComErpServicosClient.getWizardQueryContext(draft.nomeObjeto),
		[draft.nomeObjeto],
	);

	useEffect(() => {
		const catalog = catalogState.data;
		if (!catalog) return;

		setDraft((current) => {
			const next = { ...current };
			if (current.auxiliar.id && !catalog.querys.some((entry) => entry.id === current.auxiliar.id)) {
				next.auxiliar = { ...next.auxiliar, id: '' };
			}
			if (current.nomeObjeto && !catalog.tabelas.some((entry) => entry.id === current.nomeObjeto)) {
				next.nomeObjeto = '';
			}
			return next;
		});
	}, [catalogState.data]);

	const stepItems = [
		{ id: 'scope', label: t('maintenance.erpIntegration.modules.servicesWizard.steps.scope', 'Escopo') },
		{ id: 'service', label: t('maintenance.erpIntegration.modules.servicesWizard.steps.service', 'Serviço') },
		{ id: 'query', label: t('maintenance.erpIntegration.modules.servicesWizard.steps.query', 'Query') },
		{ id: 'review', label: t('maintenance.erpIntegration.modules.servicesWizard.steps.review', 'Revisão') },
	];

	const existingQueryOption = useMemo(
		() => findOptionById(catalogState.data?.querys ?? [], draft.auxiliar.id || ''),
		[catalogState.data?.querys, draft.auxiliar.id],
	);
	const selectedTableOption = useMemo(
		() => findOptionById(catalogState.data?.tabelas ?? [], draft.nomeObjeto),
		[catalogState.data?.tabelas, draft.nomeObjeto],
	);
	const selectedTemplateLabel = useMemo(() => {
		const context = contextState.data;
		if (!context) return '-';
		if (!draft.idTemplate || draft.idTemplate === context.idTemplateFixo) {
			return context.nomeTemplateFixo || '-';
		}
		return context.templates.find((entry) => entry.id === draft.idTemplate)?.nome || '-';
	}, [contextState.data, draft.idTemplate]);
	const queryContext = queryContextState.data ?? EMPTY_QUERY_CONTEXT;
	const usedFieldMap = useMemo(() => {
		const sql = draft.auxiliar.query || '';
		return new Map(queryContext.fields.map((field) => [field.id, isIdentifierUsed(sql, field.label || field.id)]));
	}, [draft.auxiliar.query, queryContext.fields]);
	const usedParameterMap = useMemo(() => {
		const sql = draft.auxiliar.query || '';
		return new Map(queryContext.parameters.map((parameter) => [parameter.id, isIdentifierUsed(sql, parameter.label || parameter.id)]));
	}, [draft.auxiliar.query, queryContext.parameters]);

	function patchDraft<K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	function patchAuxiliar(next: Partial<WizardDraft['auxiliar']>) {
		setDraft((current) => ({
			...current,
			auxiliar: {
				...current.auxiliar,
				...next,
			},
		}));
	}

	function getStepError(step: StepId) {
		if (step === 'scope') {
			if (!selectedTemplateId) return t('maintenance.erpIntegration.modules.servicesWizard.validation.template', 'Selecione um template válido.');
			return '';
		}

		if (step === 'service') {
			if (!draft.nomeServico.trim()) return t('maintenance.erpIntegration.modules.servicesWizard.validation.serviceName', 'Informe o nome do serviço.');
			if (!draft.nomeObjeto.trim()) return t('maintenance.erpIntegration.modules.servicesWizard.validation.destinationTable', 'Selecione a tabela de destino.');
			return '';
		}

		if (step === 'query') {
			if (draft.auxiliar.modo === 'existente' && !draft.auxiliar.id?.trim()) {
				return t('maintenance.erpIntegration.modules.servicesWizard.validation.existingQuery', 'Selecione uma query existente.');
			}
			if (draft.auxiliar.modo === 'novo') {
				if (!draft.auxiliar.nome?.trim()) return t('maintenance.erpIntegration.modules.servicesWizard.validation.queryName', 'Informe o nome da nova query.');
				if (!draft.auxiliar.query?.trim()) return t('maintenance.erpIntegration.modules.servicesWizard.validation.querySql', 'Informe o SQL da query.');
			}
		}

		return '';
	}

	function goToStep(step: StepId) {
		const currentIndex = STEP_IDS.indexOf(activeStep);
		const nextIndex = STEP_IDS.indexOf(step);
		if (nextIndex > currentIndex) {
			for (let index = 0; index <= nextIndex - 1; index += 1) {
				const error = getStepError(STEP_IDS[index]);
				if (error) {
					setFeedback({ tone: 'error', message: error });
					setActiveStep(STEP_IDS[index]);
					return;
				}
			}
		}
		setActiveStep(step);
	}

	function goNext() {
		const error = getStepError(activeStep);
		if (error) {
			setFeedback({ tone: 'error', message: error });
			return;
		}
		const currentIndex = STEP_IDS.indexOf(activeStep);
		setActiveStep(STEP_IDS[Math.min(STEP_IDS.length - 1, currentIndex + 1)]);
	}

	function goPrevious() {
		const currentIndex = STEP_IDS.indexOf(activeStep);
		setActiveStep(STEP_IDS[Math.max(0, currentIndex - 1)]);
	}

	async function handleRunQueryTest() {
		if (draft.auxiliar.modo !== 'novo' || !draft.auxiliar.query?.trim()) {
			setFeedback({
				tone: 'error',
				message: t('maintenance.erpIntegration.modules.servicesWizard.validation.querySql', 'Informe o SQL da query.'),
			});
			return;
		}

		setQueryRunning(true);
		try {
			const result = await sqlEditorClient.execute({
				fonteDados: 'agileecommerce',
				sql: draft.auxiliar.query,
				page: 1,
				perPage: 20,
			});
			setQueryResult(result);
			setFeedback({
				tone: 'success',
				message: t('maintenance.erpIntegration.modules.servicesWizard.feedback.testSuccess', 'Query validada com sucesso.'),
			});
		} catch (error) {
			setFeedback({
				tone: 'error',
				message: error instanceof Error
					? error.message
					: t('maintenance.erpIntegration.modules.servicesWizard.feedback.testError', 'Não foi possível testar a query.'),
			});
		} finally {
			setQueryRunning(false);
		}
	}

	async function handleSave() {
		for (const step of STEP_IDS.slice(0, 3)) {
			const error = getStepError(step);
			if (error) {
				setFeedback({ tone: 'error', message: error });
				setActiveStep(step);
				return;
			}
		}

		setSaving(true);
		try {
			const result = await integracaoComErpServicosClient.createWizard(draft);
			setFeedback({
				tone: 'success',
				message: result.message || t('maintenance.erpIntegration.modules.servicesWizard.feedback.saveSuccess', 'Serviço criado com sucesso.'),
			});
			router.push(`/integracao-com-erp/servicos/${result.idServico}/editar`);
		} catch (error) {
			setFeedback({
				tone: 'error',
				message: error instanceof Error
					? error.message
					: t('maintenance.erpIntegration.modules.servicesWizard.feedback.saveError', 'Não foi possível criar o serviço.'),
			});
		} finally {
			setSaving(false);
		}
	}

	if (!canAccess) {
		return <AccessDeniedState title={access.featureLabel} />;
	}

	return (
		<div className="space-y-6">
			<PageToast message={feedback?.message ?? null} tone={feedback?.tone} onClose={() => setFeedback(null)} />

			<PageHeader
				title={t('maintenance.erpIntegration.modules.servicesWizard.title', 'Criar Serviço')}
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
					{ label: t('maintenance.erpIntegration.modules.services.title', 'Serviços'), href: '/integracao-com-erp/servicos' },
					{ label: t('maintenance.erpIntegration.modules.servicesWizard.title', 'Criar Serviço') },
				]}
				actions={(
					<>
						<button
							type="button"
							onClick={() => router.push('/integracao-com-erp/servicos')}
							className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
						>
							<ArrowLeft className="h-4 w-4" />
							{t('common.back', 'Voltar')}
						</button>
						<button
							type="button"
							onClick={handleSave}
							disabled={saving}
							className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-70"
						>
							{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
							{t('common.save', 'Salvar')}
						</button>
					</>
				)}
			/>

			<AsyncState
				isLoading={contextState.isLoading || (selectedTemplateId ? catalogState.isLoading : false)}
				error={contextState.error || catalogState.error}
				loadingTitle={t('maintenance.erpIntegration.modules.servicesWizard.loadingTitle', 'Preparando wizard')}
				loadingDescription={t('maintenance.erpIntegration.modules.servicesWizard.loadingDescription', 'Carregando contexto, template e catálogos auxiliares.')}
				errorTitle={t('maintenance.erpIntegration.modules.servicesWizard.loadError', 'Não foi possível carregar o wizard de serviço.')}
			>
				<div className="space-y-6">
					<SectionCard>
						<div className="space-y-4">
							<div>
								<h2 className="text-xl font-semibold text-[color:var(--app-text)]">
									{t('maintenance.erpIntegration.modules.servicesWizard.heroTitle', 'Assistente de criação de serviço')}
								</h2>
								<p className="mt-2 text-sm text-[color:var(--app-muted)]">
									{t(
										'maintenance.erpIntegration.modules.servicesWizard.heroDescription',
										'Monte a configuração inicial do serviço ERP em etapas, reaproveitando query existente ou criando uma nova base SQL.',
									)}
								</p>
							</div>
							<StepIndicator items={stepItems} activeStep={activeStep} onStepClick={(id) => goToStep(id as StepId)} />
						</div>
					</SectionCard>

					{activeStep === 'scope' ? (
						<SectionCard
							title={t('maintenance.erpIntegration.modules.servicesWizard.sections.scope.title', 'Escopo e template')}
							description={t(
								'maintenance.erpIntegration.modules.servicesWizard.sections.scope.description',
								'Defina se o serviço ficará no template fixo da empresa ou em um template específico.',
							)}
						>
							<div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
								<div className="space-y-4">
									<div className="space-y-2">
										<label className="text-sm font-semibold text-[color:var(--app-text)]">
											{t('maintenance.erpIntegration.modules.servicesWizard.fields.scope', 'Escopo de publicação')}
										</label>
										<select
											value={draft.escopo}
											onChange={(event) => patchDraft('escopo', event.target.value === 'especifico' ? 'especifico' : 'compartilhado')}
											className={renderInputClass(false)}
										>
											<option value="compartilhado">{t('maintenance.erpIntegration.modules.servicesWizard.scope.shared', 'Template da empresa')}</option>
											<option value="especifico">{t('maintenance.erpIntegration.modules.servicesWizard.scope.specific', 'Template específico')}</option>
										</select>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-semibold text-[color:var(--app-text)]">
											{t('maintenance.erpIntegration.modules.servicesWizard.fields.template', 'Template')}
										</label>
										<select
											value={draft.idTemplate}
											onChange={(event) => patchDraft('idTemplate', event.target.value)}
											className={renderInputClass(false)}
											disabled={!contextState.data?.isMaster}
										>
										{contextState.data?.isMaster
												? contextState.data.templates.map((template) => (
													<option key={template.id} value={template.id}>
														{template.nome}
													</option>
												))
												: (
													<option value={contextState.data?.idTemplateFixo || ''}>
														{contextState.data?.nomeTemplateFixo || t('maintenance.erpIntegration.modules.servicesWizard.scope.fixedTemplate', 'Template fixo da empresa')}
													</option>
												)}
										</select>
										<p className="text-xs text-[color:var(--app-muted)]">
											{contextState.data?.isMaster
												? t('maintenance.erpIntegration.modules.servicesWizard.helpers.masterTemplate', 'Usuários master podem publicar em outro template quando necessário.')
												: t('maintenance.erpIntegration.modules.servicesWizard.helpers.fixedTemplate', 'Neste perfil, o wizard usa sempre o template vinculado à empresa ativa.')}
										</p>
									</div>
								</div>

								<div className="app-pane-muted rounded-[1.25rem] p-5">
									<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.summary.context', 'Resumo do contexto')}
									</p>
									<div className="mt-4 space-y-3 text-sm">
										<div>
											<div className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.companyCode', 'Empresa')}</div>
											<div className="text-[color:var(--app-muted)]">{contextState.data?.idEmpresa || '-'}</div>
										</div>
										<div>
											<div className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.template', 'Template')}</div>
											<div className="text-[color:var(--app-muted)]">{selectedTemplateLabel}</div>
										</div>
										<div>
											<div className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.type', 'Tipo técnico')}</div>
											<div className="text-[color:var(--app-muted)]">Query</div>
										</div>
									</div>
								</div>
							</div>
						</SectionCard>
					) : null}

					{activeStep === 'service' ? (
						<SectionCard
							title={t('maintenance.erpIntegration.modules.servicesWizard.sections.service.title', 'Tipo e dados do serviço')}
							description={t(
								'maintenance.erpIntegration.modules.servicesWizard.sections.service.description',
								'Alinhe o tipo do serviço com o legado e configure os dados operacionais principais antes de montar a query.',
							)}
						>
							<div className="grid gap-4 xl:grid-cols-2">
								<div className="space-y-2">
									<label className="text-sm font-semibold text-[color:var(--app-text)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.fields.serviceType', 'Tipo do serviço')}
									</label>
									<select value="query" className={renderInputClass(false)} disabled>
										<option value="query">{t('maintenance.erpIntegration.modules.servicesWizard.serviceType.query', 'Query')}</option>
									</select>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-semibold text-[color:var(--app-text)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.fields.serviceName', 'Nome do serviço')}
									</label>
									<input
										value={draft.nomeServico}
										onChange={(event) => patchDraft('nomeServico', event.target.value)}
										className={renderInputClass(Boolean(getStepError('service') && !draft.nomeServico.trim()))}
										placeholder={t('maintenance.erpIntegration.modules.servicesWizard.placeholders.serviceName', 'Ex.: Sincronização de clientes')}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-semibold text-[color:var(--app-text)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.fields.interval', 'Intervalo de execução')}
									</label>
									<select
										value={draft.intervaloExecucao}
										onChange={(event) => patchDraft('intervaloExecucao', event.target.value)}
										className={renderInputClass(false)}
									>
										{INTERVAL_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{option} min
											</option>
										))}
									</select>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-semibold text-[color:var(--app-text)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.fields.executionType', 'Tipo de execução')}
									</label>
									<select value="comparacao" className={renderInputClass(false)} disabled>
										<option value="comparacao">{t('maintenance.erpIntegration.modules.servicesWizard.executionType.comparison', 'Comparação')}</option>
									</select>
									<p className="text-xs text-[color:var(--app-muted)]">
										{t(
											'maintenance.erpIntegration.modules.servicesWizard.helpers.executionTypeQuery',
											'Para serviços do tipo query, o tipo de execução é sempre Comparação.',
										)}
									</p>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-semibold text-[color:var(--app-text)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.fields.executionChannel', 'Canal de execução')}
									</label>
									<select value="AgileSyncService" className={renderInputClass(false)} disabled>
										<option value="AgileSyncService">AgileSyncService</option>
									</select>
									<p className="text-xs text-[color:var(--app-muted)]">
										{t(
											'maintenance.erpIntegration.modules.servicesWizard.helpers.executionChannelQuery',
											'Para serviços do tipo query, o canal é sempre AgileSyncService.',
										)}
									</p>
								</div>

								<div className="space-y-2 xl:col-span-2">
									<label className="text-sm font-semibold text-[color:var(--app-text)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.fields.destinationTable', 'Nome Objeto (Tabela destino)')}
									</label>
									<LookupSelect
										label={t('maintenance.erpIntegration.modules.servicesWizard.fields.destinationTable', 'Nome Objeto (Tabela destino)')}
										value={selectedTableOption}
										onChange={(value) => patchDraft('nomeObjeto', value?.id || '')}
										loadOptions={(query, page, perPage) => Promise.resolve(filterStaticOptions(catalogState.data?.tabelas ?? [], query, page, perPage))}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-semibold text-[color:var(--app-text)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.fields.dataSource', 'Fonte de dados')}
									</label>
									<input value={t('sqlEditor.sources.agileecommerce', 'Agile e-Commerce')} className={renderInputClass(false)} disabled />
								</div>

								<div className="xl:col-span-2">
									<ToggleCard
										label={t('maintenance.erpIntegration.modules.servicesWizard.fields.required', 'Serviço obrigatório')}
										hint={t('maintenance.erpIntegration.modules.servicesWizard.helpers.required', 'Mantém o serviço marcado como obrigatório na configuração inicial.')}
										checked={draft.obrigatorio}
										onChange={(value) => patchDraft('obrigatorio', value)}
									/>
								</div>
							</div>
						</SectionCard>
					) : null}

					{activeStep === 'query' ? (
						<div className="space-y-6">
							<SectionCard
								title={t('maintenance.erpIntegration.modules.servicesWizard.sections.query.title', 'Cadastros auxiliares')}
								description={t(
									'maintenance.erpIntegration.modules.servicesWizard.sections.query.description',
									'Escolha entre usar registro existente ou criar novo. O filtro de existentes respeita o template escolhido no passo 1.',
								)}
							>
								<div className="space-y-5">
									<div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_auto] xl:items-end">
										<div className="space-y-2">
											<label className="text-sm font-semibold text-[color:var(--app-text)]">
												{t('maintenance.erpIntegration.modules.servicesWizard.fields.queryMode', 'Modo da query')}
											</label>
											<select
												value={draft.auxiliar.modo}
												onChange={(event) => {
													const mode = event.target.value === 'existente' ? 'existente' : 'novo';
													patchAuxiliar({
														modo: mode,
														id: mode === 'existente' ? draft.auxiliar.id || '' : '',
														nome: mode === 'novo' ? draft.auxiliar.nome || '' : '',
														query: mode === 'novo' ? draft.auxiliar.query || '' : '',
													});
												}}
												className={renderInputClass(false)}
											>
												<option value="novo">{t('maintenance.erpIntegration.modules.servicesWizard.queryMode.new', 'Criar novo')}</option>
												<option value="existente">{t('maintenance.erpIntegration.modules.servicesWizard.queryMode.existing', 'Usar existente')}</option>
											</select>
										</div>

										<div className="space-y-2">
											<label className="text-sm font-semibold text-[color:var(--app-text)]">
												{draft.auxiliar.modo === 'existente'
													? t('maintenance.erpIntegration.modules.servicesWizard.fields.existingQuery', 'Query existente')
													: t('maintenance.erpIntegration.modules.servicesWizard.fields.queryName', 'Nome da query')}
											</label>
											{draft.auxiliar.modo === 'existente' ? (
												<LookupSelect
													label={t('maintenance.erpIntegration.modules.servicesWizard.fields.existingQuery', 'Query existente')}
													value={existingQueryOption}
													onChange={(value) => patchAuxiliar({ id: value?.id || '' })}
													loadOptions={(query, page, perPage) => Promise.resolve(filterStaticOptions(catalogState.data?.querys ?? [], query, page, perPage))}
												/>
											) : (
												<input
													value={draft.auxiliar.nome || ''}
													onChange={(event) => patchAuxiliar({ nome: event.target.value })}
													className={renderInputClass(Boolean(getStepError('query') && !draft.auxiliar.nome?.trim()))}
													placeholder={t('maintenance.erpIntegration.modules.servicesWizard.placeholders.queryName', 'Ex.: Clientes para ERP')}
												/>
											)}
										</div>

										{draft.auxiliar.modo === 'novo' ? (
											<button
												type="button"
												onClick={handleRunQueryTest}
												disabled={queryRunning}
												className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-70 xl:min-w-[170px]"
											>
												{queryRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
												{t('maintenance.erpIntegration.modules.servicesWizard.actions.testQuery', 'Testar query')}
											</button>
										) : null}
									</div>

									<div className="space-y-4">
										{draft.auxiliar.modo === 'novo' ? (
											<div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_360px] xl:grid-rows-[auto_auto]">
												<div className="app-pane rounded-[1.25rem] border border-[color:var(--app-control-border)] p-4 xl:col-start-2 xl:row-start-1">
													<div className="space-y-1">
														<h3 className="text-base font-semibold text-[color:var(--app-text)]">
															{t('maintenance.erpIntegration.modules.servicesWizard.sections.queryContext.title', 'Contexto para autocomplete')}
														</h3>
														<p className="text-sm text-[color:var(--app-muted)]">
															{t('maintenance.erpIntegration.modules.servicesWizard.sections.queryContext.description', 'Campos e aliases da tabela')}
														</p>
													</div>
													<div className="mt-4 max-h-[248px] space-y-2 overflow-y-auto pr-1">
														{queryContextState.isLoading ? (
															<div className="flex items-center gap-2 text-sm text-[color:var(--app-muted)]">
																<Loader2 className="h-4 w-4 animate-spin" />
																<span>{t('maintenance.erpIntegration.modules.servicesWizard.loadingQueryContext', 'Carregando contexto da query...')}</span>
															</div>
														) : queryContextState.error ? (
															<p className="text-sm text-rose-600 dark:text-rose-300">
																{t('maintenance.erpIntegration.modules.servicesWizard.queryContextError', 'Não foi possível carregar o contexto da query.')}
															</p>
														) : queryContext.fields.length ? (
															queryContext.fields.map((field) => {
																const active = usedFieldMap.get(field.id) === true;
																return (
																	<div key={field.id} className="space-y-1">
																		<span
																			className={[
																				'inline-flex max-w-full items-center rounded-md border px-2.5 py-1 text-sm font-medium transition-colors',
																				renderContextBadgeClass(active),
																			].join(' ')}
																		>
																			{field.label}
																		</span>
																		{field.description ? (
																			<p className="text-xs text-[color:var(--app-muted)]">{field.description}</p>
																		) : null}
																	</div>
																);
															})
														) : (
															<p className="text-sm text-[color:var(--app-muted)]">
																{t('maintenance.erpIntegration.modules.servicesWizard.empty.queryContext', 'Selecione uma tabela de destino para carregar os aliases e campos disponíveis.')}
															</p>
														)}
													</div>
												</div>

												<div className="space-y-4 xl:col-start-1 xl:row-span-2 xl:row-start-1">
													<div className="app-pane rounded-[1.25rem] border border-[color:var(--app-control-border)] p-4">
														<div className="mb-4 flex items-center justify-between gap-3">
															<div>
																<h3 className="text-base font-semibold text-[color:var(--app-text)]">
																	{t('maintenance.erpIntegration.modules.servicesWizard.steps.query', 'Query')}
																</h3>
																<p className="text-sm text-[color:var(--app-muted)]">
																	{t('maintenance.erpIntegration.modules.servicesWizard.sections.queryContext.description', 'Campos e aliases da tabela')}
																</p>
															</div>
															<div className="hidden rounded-full bg-[color:var(--app-panel-solid)] px-3 py-1.5 text-xs font-semibold text-[color:var(--app-muted)] xl:inline-flex">
																{queryContext.fields.length}
															</div>
														</div>
														<div className="overflow-hidden rounded-[1rem] border border-[color:var(--app-control-border)]">
														<SqlEditorMonaco
															tabId="erp-service-wizard-query"
															value={draft.auxiliar.query || ''}
															onChange={(value) => patchAuxiliar({ query: value })}
															height="560px"
														/>
														</div>
													</div>

													{queryResult ? (
														<SectionCard
															title={t('maintenance.erpIntegration.modules.servicesWizard.sections.queryResult.title', 'Resultado do teste')}
															description={t(
																'maintenance.erpIntegration.modules.servicesWizard.sections.queryResult.description',
																'Prévia do retorno da query na fonte de dados configurada.',
															)}
														>
															<QueryResultPreview result={queryResult} />
														</SectionCard>
													) : null}
												</div>

												<div className="app-pane rounded-[1.25rem] border border-[color:var(--app-control-border)] p-4 xl:col-start-2 xl:row-start-2">
													<div className="space-y-1">
														<h3 className="text-base font-semibold text-[color:var(--app-text)]">
															{t('maintenance.erpIntegration.modules.servicesWizard.sections.queryParameters.title', 'Parâmetros disponíveis')}
														</h3>
														<p className="text-sm text-[color:var(--app-muted)]">
															{t('maintenance.erpIntegration.modules.servicesWizard.sections.queryParameters.description', 'Use estes marcadores no SQL para aproveitar parâmetros já disponíveis no integrador.')}
														</p>
													</div>
													<div className="mt-4 max-h-[248px] space-y-2 overflow-y-auto pr-1">
														{queryContextState.isLoading ? (
															<div className="flex items-center gap-2 text-sm text-[color:var(--app-muted)]">
																<Loader2 className="h-4 w-4 animate-spin" />
																<span>{t('maintenance.erpIntegration.modules.servicesWizard.loadingQueryParameters', 'Carregando parâmetros...')}</span>
															</div>
														) : queryContext.parameters.length ? (
															queryContext.parameters.map((parameter) => {
																const active = usedParameterMap.get(parameter.id) === true;
																return (
																	<div key={parameter.id} className="space-y-1">
																		<span
																			className={[
																				'inline-flex max-w-full items-center rounded-md border px-2.5 py-1 text-sm font-medium transition-colors',
																				renderParameterBadgeClass(active),
																			].join(' ')}
																		>
																			{parameter.label}
																		</span>
																		{parameter.description ? (
																			<p className="text-xs text-[color:var(--app-muted)]">{parameter.description}</p>
																		) : null}
																	</div>
																);
															})
														) : (
															<p className="text-sm text-[color:var(--app-muted)]">
																{t('maintenance.erpIntegration.modules.servicesWizard.empty.queryParameters', 'Nenhum parâmetro disponível para a empresa ativa.')}
															</p>
														)}
													</div>
												</div>
											</div>
										) : (
											<div className="app-pane-muted rounded-[1.25rem] p-5">
												<p className="text-sm font-semibold text-[color:var(--app-text)]">
													{existingQueryOption?.label || t('maintenance.erpIntegration.modules.servicesWizard.empty.existingQuery', 'Nenhuma query selecionada.')}
												</p>
												<p className="mt-2 text-sm text-[color:var(--app-muted)]">
													{t(
														'maintenance.erpIntegration.modules.servicesWizard.helpers.existingQuery',
														'Quando você usa uma query existente, o wizard reaproveita o objeto já cadastrado no template selecionado.',
													)}
												</p>
											</div>
										)}
									</div>
								</div>
							</SectionCard>
						</div>
					) : null}

					{activeStep === 'review' ? (
						<SectionCard
							title={t('maintenance.erpIntegration.modules.servicesWizard.sections.review.title', 'Revisão final')}
							description={t(
								'maintenance.erpIntegration.modules.servicesWizard.sections.review.description',
								'Confira os dados principais antes de criar o serviço e abrir a tela detalhada de edição.',
							)}
						>
							<div className="grid gap-4 xl:grid-cols-2">
								<div className="app-control-muted rounded-[1.15rem] p-4">
									<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.steps.scope', 'Escopo')}
									</p>
									<dl className="mt-4 space-y-3 text-sm">
										<div>
											<dt className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.scope', 'Escopo de publicação')}</dt>
											<dd className="text-[color:var(--app-muted)]">
												{draft.escopo === 'especifico'
													? t('maintenance.erpIntegration.modules.servicesWizard.scope.specific', 'Template específico')
													: t('maintenance.erpIntegration.modules.servicesWizard.scope.shared', 'Template da empresa')}
											</dd>
										</div>
										<div>
											<dt className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.template', 'Template')}</dt>
											<dd className="text-[color:var(--app-muted)]">{selectedTemplateLabel}</dd>
										</div>
									</dl>
								</div>

								<div className="app-control-muted rounded-[1.15rem] p-4">
									<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.steps.service', 'Serviço')}
									</p>
									<dl className="mt-4 space-y-3 text-sm">
										<div>
											<dt className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.serviceName', 'Nome do serviço')}</dt>
											<dd className="text-[color:var(--app-muted)]">{draft.nomeServico || '-'}</dd>
										</div>
										<div>
											<dt className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.destinationTable', 'Nome Objeto (Tabela destino)')}</dt>
											<dd className="text-[color:var(--app-muted)]">{selectedTableOption?.label || '-'}</dd>
										</div>
										<div>
											<dt className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.interval', 'Intervalo de execução')}</dt>
											<dd className="text-[color:var(--app-muted)]">{draft.intervaloExecucao} min</dd>
										</div>
									</dl>
								</div>

								<div className="app-control-muted rounded-[1.15rem] p-4 xl:col-span-2">
									<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
										{t('maintenance.erpIntegration.modules.servicesWizard.steps.query', 'Query')}
									</p>
									<dl className="mt-4 space-y-3 text-sm">
										<div>
											<dt className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.queryMode', 'Modo da query')}</dt>
											<dd className="text-[color:var(--app-muted)]">
												{draft.auxiliar.modo === 'existente'
													? t('maintenance.erpIntegration.modules.servicesWizard.queryMode.existing', 'Usar existente')
													: t('maintenance.erpIntegration.modules.servicesWizard.queryMode.new', 'Criar novo')}
											</dd>
										</div>
										<div>
											<dt className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.queryReference', 'Referência')}</dt>
											<dd className="text-[color:var(--app-muted)]">
												{draft.auxiliar.modo === 'existente'
													? existingQueryOption?.label || '-'
													: draft.auxiliar.nome || '-'}
											</dd>
										</div>
										{draft.auxiliar.modo === 'novo' ? (
											<div>
												<dt className="font-semibold text-[color:var(--app-text)]">{t('maintenance.erpIntegration.modules.servicesWizard.fields.queryPreview', 'Prévia SQL')}</dt>
												<dd className="mt-2 overflow-auto rounded-[1rem] bg-[color:var(--app-panel-solid)] p-4 text-xs text-[color:var(--app-text)]">
													<pre className="whitespace-pre-wrap">{draft.auxiliar.query || '-'}</pre>
												</dd>
											</div>
										) : null}
									</dl>
								</div>
							</div>
						</SectionCard>
					) : null}

					<div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
						<button
							type="button"
							onClick={goPrevious}
							disabled={activeStep === 'scope'}
							className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-60"
						>
							<ArrowLeft className="h-4 w-4" />
							{t('common.previous', 'Anterior')}
						</button>

						{activeStep === 'review' ? (
							<button
								type="button"
								onClick={handleSave}
								disabled={saving}
								className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-70"
							>
								{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
								{t('common.save', 'Salvar')}
							</button>
						) : (
							<button
								type="button"
								onClick={goNext}
								className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
							>
								{t('common.next', 'Próximo')}
								<ChevronRight className="h-4 w-4" />
							</button>
						)}
					</div>
				</div>
			</AsyncState>
		</div>
	);
}
