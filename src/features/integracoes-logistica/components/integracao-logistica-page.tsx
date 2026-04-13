'use client';

import Link from 'next/link';
import { RefreshCcw, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AsyncState } from '@/src/components/ui/async-state';
import { BooleanChoice } from '@/src/components/ui/boolean-choice';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { TabButton } from '@/src/components/ui/tab-button';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { integracaoLogisticaClient } from '@/src/features/integracoes-logistica/services/integracao-logistica-client';
import {
	createEmptyIntegracaoLogisticaRecord,
	isIntegracaoLogisticaEncryptedKey,
	type IntegracaoLogisticaBranchMetadata,
	type IntegracaoLogisticaBranchValues,
	type IntegracaoLogisticaEncryptedKey,
	type IntegracaoLogisticaFieldKey,
	type IntegracaoLogisticaRecord,
	type IntegracaoLogisticaValues,
} from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility';
import { useI18n } from '@/src/i18n/use-i18n';
import { digitsOnly } from '@/src/lib/value-parsers';

type TabKey = 'general' | 'frenet' | 'mandae' | 'freteRapido' | 'setCanhoto' | 'findcep' | 'iboltt';

type TextFieldDefinition = {
	key: IntegracaoLogisticaFieldKey;
	labelKey: string;
	helperKey: string;
	fallback: string;
	placeholder?: string;
	mask?: 'cnpj';
};

type SelectFieldDefinition = TextFieldDefinition & {
	options: Array<{ value: string; labelKey: string; fallback: string }>;
};

type BooleanFieldDefinition = TextFieldDefinition & {
	trueValue?: string;
	falseValue?: string;
};

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';
const formId = 'integracoes-logistica-form';

const tabs: Array<{ key: TabKey; labelKey: string; fallback: string }> = [
	{ key: 'general', labelKey: 'integrationsLogistics.tabs.general', fallback: 'Dados Gerais' },
	{ key: 'frenet', labelKey: 'integrationsLogistics.tabs.frenet', fallback: 'Frenet' },
	{ key: 'mandae', labelKey: 'integrationsLogistics.tabs.mandae', fallback: 'Mandaê' },
	{ key: 'freteRapido', labelKey: 'integrationsLogistics.tabs.freteRapido', fallback: 'Frete Rápido' },
	{ key: 'setCanhoto', labelKey: 'integrationsLogistics.tabs.setCanhoto', fallback: 'Set Canhoto' },
	{ key: 'findcep', labelKey: 'integrationsLogistics.tabs.findcep', fallback: 'FindCEP' },
	{ key: 'iboltt', labelKey: 'integrationsLogistics.tabs.iboltt', fallback: 'IBoltt' },
];

const generalFields: TextFieldDefinition[] = [
	{
		key: 'link_rastreamento',
		labelKey: 'integrationsLogistics.fields.trackingLink',
		helperKey: 'integrationsLogistics.helpers.trackingLink',
		fallback: 'Link para Rastreamento',
		placeholder: 'https://www.linkpararastreamento.com',
	},
];

const frenetFields: TextFieldDefinition[] = [
	{ key: 'frenet_token', labelKey: 'integrationsLogistics.fields.token', helperKey: 'integrationsLogistics.helpers.frenetToken', fallback: 'Token' },
	{
		key: 'frenet_token_parceiro',
		labelKey: 'integrationsLogistics.fields.partnerToken',
		helperKey: 'integrationsLogistics.helpers.frenetPartnerToken',
		fallback: 'Token Parceiro',
	},
];

const frenetBooleans: BooleanFieldDefinition[] = [
	{
		key: 'frenet_nota_fiscal',
		labelKey: 'integrationsLogistics.fields.onlyInvoiceOrders',
		helperKey: 'integrationsLogistics.helpers.onlyInvoiceOrders',
		fallback: 'Enviar apenas pedidos com nota fiscal',
	},
];

const frenetEnvironment: BooleanFieldDefinition = {
	key: 'frenet_ambiente',
	labelKey: 'integrationsLogistics.fields.environment',
	helperKey: 'integrationsLogistics.helpers.environment',
	fallback: 'Ambiente',
	trueValue: 'producao',
	falseValue: 'homologacao',
};

const mandaeSelect: SelectFieldDefinition = {
	key: 'mandae_versao',
	labelKey: 'integrationsLogistics.fields.version',
	helperKey: 'integrationsLogistics.helpers.mandaeVersion',
	fallback: 'Versão',
	options: [
		{ value: '', labelKey: 'common.select', fallback: 'Selecione' },
		{ value: 'v3', labelKey: 'integrationsLogistics.options.v3', fallback: 'V3' },
		{ value: 'v4', labelKey: 'integrationsLogistics.options.v4', fallback: 'V4' },
	],
};

const mandaeFields: TextFieldDefinition[] = [
	{ key: 'mandae_token', labelKey: 'integrationsLogistics.fields.token', helperKey: 'integrationsLogistics.helpers.mandaeToken', fallback: 'Token' },
];

const freteRapidoFields: TextFieldDefinition[] = [
	{ key: 'freterapido_cnpj', labelKey: 'integrationsLogistics.fields.cnpj', helperKey: 'integrationsLogistics.helpers.freteRapidoCnpj', fallback: 'CNPJ', mask: 'cnpj' },
	{ key: 'freterapido_token', labelKey: 'integrationsLogistics.fields.token', helperKey: 'integrationsLogistics.helpers.freteRapidoToken', fallback: 'Token' },
	{ key: 'freterapido_plataforma', labelKey: 'integrationsLogistics.fields.platformCode', helperKey: 'integrationsLogistics.helpers.platformCode', fallback: 'Código Plataforma' },
	{ key: 'freterapido_canal', labelKey: 'integrationsLogistics.fields.channel', helperKey: 'integrationsLogistics.helpers.channel', fallback: 'Canal' },
];

const freteRapidoBooleans: BooleanFieldDefinition[] = [
	{ key: 'freterapido_consolidar', labelKey: 'integrationsLogistics.fields.consolidate', helperKey: 'integrationsLogistics.helpers.consolidate', fallback: 'Consolidar' },
	{ key: 'freterapido_sobrepor', labelKey: 'integrationsLogistics.fields.overlay', helperKey: 'integrationsLogistics.helpers.overlay', fallback: 'Sobrepor' },
	{ key: 'freterapido_tombar', labelKey: 'integrationsLogistics.fields.tumble', helperKey: 'integrationsLogistics.helpers.tumble', fallback: 'Tombar' },
];

const setCanhotoFields: TextFieldDefinition[] = [
	{ key: 'setcanhoto_token', labelKey: 'integrationsLogistics.fields.token', helperKey: 'integrationsLogistics.helpers.setCanhotoToken', fallback: 'Token' },
];

const findCepFields: TextFieldDefinition[] = [
	{
		key: 'findcep_endpoint',
		labelKey: 'integrationsLogistics.fields.clientEndpoint',
		helperKey: 'integrationsLogistics.helpers.clientEndpoint',
		fallback: 'Client Endpoint',
		placeholder: 'agileecommerce.api.findcep.com',
	},
	{
		key: 'findcep_referer',
		labelKey: 'integrationsLogistics.fields.referer',
		helperKey: 'integrationsLogistics.helpers.referer',
		fallback: 'Referer',
		placeholder: '2JD84JNDT85JHT.agileecommerce.com.br',
	},
];

const ibolttStatus: SelectFieldDefinition = {
	key: 'iboltt_status',
	labelKey: 'integrationsLogistics.fields.callStatus',
	helperKey: 'integrationsLogistics.helpers.callStatus',
	fallback: 'Status para Chamada',
	options: [
		{ value: 'faturado', labelKey: 'integrationsLogistics.options.invoicedOrder', fallback: 'Pedido Faturado' },
		{ value: 'pagamento_aprovado', labelKey: 'integrationsLogistics.options.paymentApproved', fallback: 'Pagamento Aprovado' },
		{ value: 'recebido', labelKey: 'integrationsLogistics.options.receivedOrder', fallback: 'Pedido Recebido' },
	],
};

function formatCnpj(value: string) {
	const digits = digitsOnly(value).slice(0, 14);
	return digits
		.replace(/^(\d{2})(\d)/, '$1.$2')
		.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
		.replace(/\.(\d{3})(\d)/, '.$1/$2')
		.replace(/(\d{4})(\d)/, '$1-$2');
}

function formatUpdateDate(value: string, locale: ReturnType<typeof useI18n>['locale']) {
	const trimmed = value.trim();
	if (!trimmed) return '';
	const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
	const date = new Date(normalized);
	if (Number.isNaN(date.getTime())) return trimmed;
	return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function formatUpdateMeta(updatedAt: string, updatedBy: string, t: ReturnType<typeof useI18n>['t'], locale: ReturnType<typeof useI18n>['locale']) {
	if (!updatedAt || !updatedBy) return null;
	return t('integrationsLogistics.fields.lastUpdateValue', 'Última alteração: {{date}} por {{user}}')
		.replace('{{date}}', formatUpdateDate(updatedAt, locale))
		.replace('{{user}}', updatedBy);
}

function hasSecretValue(record: IntegracaoLogisticaRecord, key: IntegracaoLogisticaFieldKey) {
	return record.values[key].trim().length > 0;
}

function branchTokenKey(branchId: string) {
	return `iboltt_token__${branchId}`;
}

export function IntegracaoLogisticaPage() {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesLogistica');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [activeTab, setActiveTab] = useState<TabKey>('general');
	const [initialRecord, setInitialRecord] = useState<IntegracaoLogisticaRecord>(createEmptyIntegracaoLogisticaRecord());
	const [values, setValues] = useState<IntegracaoLogisticaValues>(createEmptyIntegracaoLogisticaRecord().values);
	const [branchValues, setBranchValues] = useState<IntegracaoLogisticaBranchValues>({});
	const [editableSecrets, setEditableSecrets] = useState<Record<string, boolean>>({});
	const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>();

	const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master);
	const hasChanges = useMemo(
		() => JSON.stringify(values) !== JSON.stringify(initialRecord.values) || JSON.stringify(branchValues) !== JSON.stringify(initialRecord.branchValues),
		[branchValues, initialRecord.branchValues, initialRecord.values, values],
	);

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
			{ label: t('menuKeys.integracoes', 'Integrações') },
			{ label: t('integrationsLogistics.title', 'Logística'), href: '/integracoes/logistica' },
		],
		[t],
	);

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const result = await integracaoLogisticaClient.get();
				if (!active) return;
				setInitialRecord(result);
				setValues(result.values);
				setBranchValues(result.branchValues);
				setEditableSecrets({});
				setError(null);
			} catch (loadError) {
				if (!active) return;
				setError(loadError instanceof Error ? loadError : new Error(t('integrationsLogistics.feedback.loadError', 'Não foi possível carregar as configurações de logística.')));
			} finally {
				if (active) setLoading(false);
			}
		}

		void load();
		return () => {
			active = false;
		};
	}, [t]);

	async function handleRefresh() {
		setLoading(true);
		setFeedback(null);
		setError(null);

		try {
			const result = await integracaoLogisticaClient.get();
			setInitialRecord(result);
			setValues(result.values);
			setBranchValues(result.branchValues);
			setEditableSecrets({});
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError : new Error(t('integrationsLogistics.feedback.loadError', 'Não foi possível carregar as configurações de logística.')));
		} finally {
			setLoading(false);
		}
	}

	function patch(key: IntegracaoLogisticaFieldKey, value: string) {
		setValues((current) => ({ ...current, [key]: value }));
	}

	function patchField(field: TextFieldDefinition, value: string) {
		patch(field.key, field.mask === 'cnpj' ? formatCnpj(value) : value);
	}

	function patchBoolean(field: BooleanFieldDefinition, value: boolean) {
		patch(field.key, value ? (field.trueValue ?? '1') : (field.falseValue ?? '0'));
	}

	function patchBranch(branchId: string, key: 'companyId' | 'token', value: string) {
		setBranchValues((current) => ({
			...current,
			[branchId]: {
				companyId: current[branchId]?.companyId ?? '',
				token: current[branchId]?.token ?? '',
				[key]: value,
			},
		}));
	}

	function setSecretEditable(key: IntegracaoLogisticaEncryptedKey, editable: boolean) {
		setEditableSecrets((current) => ({ ...current, [key]: editable }));
		patch(key, editable ? '' : initialRecord.values[key]);
	}

	function setBranchTokenEditable(branchId: string, editable: boolean) {
		const key = branchTokenKey(branchId);
		setEditableSecrets((current) => ({ ...current, [key]: editable }));
		patchBranch(branchId, 'token', editable ? '' : (initialRecord.branchValues[branchId]?.token ?? ''));
	}

	function getIncludedEncryptedKeys() {
		const keys: string[] = (['frenet_token', 'frenet_token_parceiro', 'mandae_token', 'freterapido_token', 'setcanhoto_token'] as IntegracaoLogisticaEncryptedKey[]).filter(
			(key) => editableSecrets[key] || !hasSecretValue(initialRecord, key),
		);

		for (const branch of initialRecord.branches) {
			const key = branchTokenKey(branch.id);
			const hasToken = (initialRecord.branchValues[branch.id]?.token ?? '').trim().length > 0;
			if (editableSecrets[key] || !hasToken) {
				keys.push(key);
			}
		}

		return keys;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSave || !hasChanges) return;

		try {
			setSaving(true);
			await integracaoLogisticaClient.save(values, branchValues, { includeEncryptedKeys: getIncludedEncryptedKeys() });
			const refreshed = await integracaoLogisticaClient.get();
			setInitialRecord(refreshed);
			setValues(refreshed.values);
			setBranchValues(refreshed.branchValues);
			setEditableSecrets({});
			setFeedback({ tone: 'success', message: t('integrationsLogistics.feedback.saveSuccess', 'Configurações de logística salvas com sucesso.') });
		} catch (saveError) {
			setFeedback({
				tone: 'error',
				message: saveError instanceof Error ? saveError.message : t('integrationsLogistics.feedback.saveError', 'Não foi possível salvar as configurações de logística.'),
			});
		} finally {
			setSaving(false);
		}
	}

	function renderTextFields(fields: TextFieldDefinition[]) {
		return (
			<div className="grid gap-4 lg:grid-cols-2">
				{fields.map((field) => {
					const encrypted = isIntegracaoLogisticaEncryptedKey(field.key);
					const hasSecret = encrypted && hasSecretValue(initialRecord, field.key);
					const secretEditable = Boolean(editableSecrets[field.key]) || !hasSecret;
					const updateMeta = formatUpdateMeta(initialRecord.metadata[field.key].updatedAt, initialRecord.metadata[field.key].updatedBy, t, locale);

					return (
						<FormField key={field.key} label={t(field.labelKey, field.fallback)} helperText={t(field.helperKey, '') || null}>
							<div className="space-y-2">
								<input
									type="text"
									className={inputClasses()}
									value={values[field.key]}
									placeholder={field.placeholder}
									onChange={(event) => patchField(field, event.target.value)}
									disabled={saving || (encrypted && hasSecret && !secretEditable)}
								/>
								{updateMeta ? <span className="block text-xs text-slate-500">{updateMeta}</span> : null}
								{encrypted && hasSecret ? (
									<div className="flex flex-wrap gap-2">
										{!secretEditable ? (
											<button
												type="button"
												className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
												onClick={() => setSecretEditable(field.key as IntegracaoLogisticaEncryptedKey, true)}
												disabled={saving}
											>
												<RefreshCcw className="h-3.5 w-3.5" />
												{t('integrationsLogistics.actions.changeSecret', 'Alterar')}
											</button>
										) : (
											<button
												type="button"
												className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
												onClick={() => setSecretEditable(field.key as IntegracaoLogisticaEncryptedKey, false)}
												disabled={saving}
											>
												<X className="h-3.5 w-3.5" />
												{t('integrationsLogistics.actions.cancelSecretChange', 'Cancelar alteração')}
											</button>
										)}
									</div>
								) : null}
							</div>
						</FormField>
					);
				})}
			</div>
		);
	}

	function renderSelect(field: SelectFieldDefinition) {
		const updateMeta = formatUpdateMeta(initialRecord.metadata[field.key].updatedAt, initialRecord.metadata[field.key].updatedBy, t, locale);
		return (
			<FormField label={t(field.labelKey, field.fallback)} helperText={t(field.helperKey, '') || null}>
				<div className="space-y-2">
					<select className={inputClasses()} value={values[field.key]} onChange={(event) => patch(field.key, event.target.value)} disabled={saving}>
						{field.options.map((option) => (
							<option key={option.value} value={option.value}>
								{t(option.labelKey, option.fallback)}
							</option>
						))}
					</select>
					{updateMeta ? <span className="block text-xs text-slate-500">{updateMeta}</span> : null}
				</div>
			</FormField>
		);
	}

	function renderBooleanFields(fields: BooleanFieldDefinition[]) {
		return (
			<div className="grid gap-4 lg:grid-cols-2">
				{fields.map((field) => {
					const trueValue = field.trueValue ?? '1';
					const updateMeta = formatUpdateMeta(initialRecord.metadata[field.key].updatedAt, initialRecord.metadata[field.key].updatedBy, t, locale);
					return (
						<FormField key={field.key} label={t(field.labelKey, field.fallback)} helperText={t(field.helperKey, '') || null}>
							<div className="space-y-2">
								<BooleanChoice
									value={values[field.key] === trueValue}
									onChange={(value) => patchBoolean(field, value)}
									disabled={saving}
									trueLabel={field.key === 'frenet_ambiente' ? t('integrationsLogistics.options.production', 'Produção') : t('common.yes', 'Sim')}
									falseLabel={field.key === 'frenet_ambiente' ? t('integrationsLogistics.options.sandbox', 'Homologação') : t('common.no', 'Não')}
								/>
								{updateMeta ? <span className="block text-xs text-slate-500">{updateMeta}</span> : null}
							</div>
						</FormField>
					);
				})}
			</div>
		);
	}

	function renderIbolttTable() {
		return (
			<div className="space-y-5">
				<div className="app-table-shell overflow-x-auto rounded-[1.1rem]">
					<table className="min-w-full border-separate border-spacing-0 text-sm">
						<thead className="app-table-muted text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--app-text-muted)]">
							<tr className="bg-transparent">
								<th className="px-4 py-3">{t('integrationsLogistics.iboltt.branch', 'Filial')}</th>
								<th className="px-4 py-3">{t('integrationsLogistics.iboltt.companyId', 'ID da Empresa')}</th>
								<th className="px-4 py-3">{t('integrationsLogistics.iboltt.token', 'Token')}</th>
								<th className="px-4 py-3">{t('integrationsLogistics.iboltt.lastUpdate', 'Última alteração')}</th>
							</tr>
						</thead>
						<tbody className="bg-[color:var(--app-panel-solid)]">
							{initialRecord.branches.length ? (
								initialRecord.branches.map((branch) => {
									const tokenKey = branchTokenKey(branch.id);
									const branchValue = branchValues[branch.id] ?? { companyId: '', token: '' };
									const branchMeta: IntegracaoLogisticaBranchMetadata[string] = initialRecord.branchMetadata[branch.id] ?? {
										companyId: { updatedAt: '', updatedBy: '' },
										token: { updatedAt: '', updatedBy: '' },
									};
									const hasToken = (initialRecord.branchValues[branch.id]?.token ?? '').trim().length > 0;
									const tokenEditable = Boolean(editableSecrets[tokenKey]) || !hasToken;
									const updateMeta = formatUpdateMeta(branchMeta.companyId.updatedAt, branchMeta.companyId.updatedBy, t, locale);

									return (
										<tr key={branch.id} className="app-table-row-hover align-top">
											<td className="border-t border-line bg-transparent px-4 py-3 font-medium text-[color:var(--app-text)]">
												{branch.name} - {branch.id}
											</td>
											<td className="border-t border-line bg-transparent px-4 py-3">
												<input
													className={inputClasses()}
													value={branchValue.companyId}
													onChange={(event) => patchBranch(branch.id, 'companyId', event.target.value)}
													disabled={saving}
												/>
											</td>
											<td className="border-t border-line bg-transparent px-4 py-3">
												<div className="space-y-2">
													<input
														className={inputClasses()}
														value={branchValue.token}
														onChange={(event) => patchBranch(branch.id, 'token', event.target.value)}
														disabled={saving || (hasToken && !tokenEditable)}
													/>
													{hasToken ? (
														!tokenEditable ? (
															<button
																type="button"
																className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
																onClick={() => setBranchTokenEditable(branch.id, true)}
																disabled={saving}
															>
																<RefreshCcw className="h-3.5 w-3.5" />
																{t('integrationsLogistics.actions.changeSecret', 'Alterar')}
															</button>
														) : (
															<button
																type="button"
																className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
																onClick={() => setBranchTokenEditable(branch.id, false)}
																disabled={saving}
															>
																<X className="h-3.5 w-3.5" />
																{t('integrationsLogistics.actions.cancelSecretChange', 'Cancelar alteração')}
															</button>
														)
													) : null}
												</div>
											</td>
											<td className="border-t border-line bg-transparent px-4 py-3 text-xs text-[color:var(--app-text-muted)]">{updateMeta}</td>
										</tr>
									);
								})
							) : (
								<tr className="bg-transparent">
									<td colSpan={4} className="border-t border-line bg-transparent px-4 py-6 text-center text-sm text-[color:var(--app-text-muted)]">
										{t('integrationsLogistics.iboltt.empty', 'Nenhuma filial encontrada.')}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<p className="text-xs text-[color:var(--app-text-muted)]">
					{t('integrationsLogistics.helpers.ibolttBranchCredentials', 'ID da empresa e token de integração fornecidos pelo IBoltt.')}
				</p>
				{renderSelect(ibolttStatus)}
			</div>
		);
	}

	if (!access.canOpen) {
		return <AccessDeniedState title={t('integrationsLogistics.title', 'Logística')} />;
	}

	return (
		<div className="space-y-6">
			{feedback ? <PageToast tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} /> : null}

			<PageHeader
				title={t('integrationsLogistics.title', 'Logística')}
				description={t('integrationsLogistics.description', 'Configure parâmetros de integração logística para a empresa ativa.')}
				breadcrumbs={breadcrumbs}
				actions={
					<>
						<button
							type="button"
							className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
							onClick={() => void handleRefresh()}
							disabled={loading || saving}
						>
							<RefreshCcw className="h-4 w-4" />
							{t('common.refresh', 'Atualizar')}
						</button>
						{!isFooterVisible && canSave ? (
							<button
								type="button"
								className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
								onClick={() => {
									const form = document.getElementById(formId);
									if (form instanceof HTMLFormElement) form.requestSubmit();
								}}
								disabled={loading || saving || !hasChanges}
							>
								<Save className="h-4 w-4" />
								{saving ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
							</button>
						) : null}
					</>
				}
			/>

			<AsyncState
				isLoading={loading}
				error={error?.message}
				loadingTitle={t('integrationsLogistics.loading', 'Carregando logística...')}
				errorTitle={t('integrationsLogistics.feedback.loadError', 'Não foi possível carregar as configurações de logística.')}
			>
				<form id={formId} onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
					<SectionCard className="px-4 py-4 md:px-5 md:py-5">
						<div className="overflow-x-auto">
							<div className="flex min-w-max items-center gap-2">
								{tabs.map((tab) => (
									<TabButton key={tab.key} active={activeTab === tab.key} label={t(tab.labelKey, tab.fallback)} onClick={() => setActiveTab(tab.key)} />
								))}
							</div>
						</div>
					</SectionCard>

					{activeTab === 'general' ? (
						<SectionCard
							title={t('integrationsLogistics.sections.general.title', 'Dados Gerais')}
							description={t('integrationsLogistics.sections.general.description', 'Configurações gerais de integração logística.')}
						>
							{renderTextFields(generalFields)}
						</SectionCard>
					) : null}
					{activeTab === 'frenet' ? (
						<SectionCard title="Frenet" description={t('integrationsLogistics.sections.frenet.description', 'Configurações de integração com a Frenet.')}>
							<div className="space-y-5">
								{renderTextFields(frenetFields)}
								{renderBooleanFields([frenetEnvironment])}
								{renderBooleanFields(frenetBooleans)}
							</div>
						</SectionCard>
					) : null}
					{activeTab === 'mandae' ? (
						<SectionCard title="Mandaê" description={t('integrationsLogistics.sections.mandae.description', 'Configurações de integração com a Mandaê.')}>
							<div className="space-y-5">
								{renderSelect(mandaeSelect)}
								{renderTextFields(mandaeFields)}
							</div>
						</SectionCard>
					) : null}
					{activeTab === 'freteRapido' ? (
						<SectionCard
							title={t('integrationsLogistics.sections.freteRapido.title', 'Frete Rápido')}
							description={t('integrationsLogistics.sections.freteRapido.description', 'Configurações de integração com a Frete Rápido.')}
						>
							<div className="space-y-5">
								{renderTextFields(freteRapidoFields)}
								{renderBooleanFields(freteRapidoBooleans)}
							</div>
						</SectionCard>
					) : null}
					{activeTab === 'setCanhoto' ? (
						<SectionCard title="Set Canhoto" description={t('integrationsLogistics.sections.setCanhoto.description', 'Configurações de integração com a Set Canhoto.')}>
							{renderTextFields(setCanhotoFields)}
						</SectionCard>
					) : null}
					{activeTab === 'findcep' ? (
						<SectionCard title="FindCEP" description={t('integrationsLogistics.sections.findcep.description', 'Configurações de integração com o FindCEP.')}>
							{renderTextFields(findCepFields)}
						</SectionCard>
					) : null}
					{activeTab === 'iboltt' ? (
						<SectionCard title="IBoltt" description={t('integrationsLogistics.sections.iboltt.description', 'Configurações de integração com o IBoltt.')}>
							{renderIbolttTable()}
						</SectionCard>
					) : null}

					<div ref={footerRef} className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-5">
						<Link href="/dashboard" className="app-button-secondary inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold">
							{t('common.back', 'Voltar')}
						</Link>
						<button
							type="submit"
							className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
							disabled={!canSave || saving || !hasChanges}
						>
							<Save className="h-4 w-4" />
							{saving ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
						</button>
					</div>
				</form>
			</AsyncState>
		</div>
	);
}
