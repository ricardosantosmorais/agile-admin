'use client';

import { Copy, Link2, RefreshCcw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TabbedParameterPageShell } from '@/src/components/form-page/tabbed-parameter-page-shell';
import { BooleanChoice } from '@/src/components/ui/boolean-choice';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { integracaoMarketingClient } from '@/src/features/marketing/services/integracao-marketing-client';
import {
	createEmptyIntegracaoMarketingRecord,
	hasIntegracaoMarketingRdEcomEvents,
	integracaoMarketingEncryptedKeys,
	isIntegracaoMarketingEncryptedKey,
	type IntegracaoMarketingFieldKey,
	type IntegracaoMarketingRecord,
	type IntegracaoMarketingValues,
} from '@/src/features/marketing/services/integracao-marketing-mappers';
import { useI18n } from '@/src/i18n/use-i18n';

type TabKey = 'google' | 'facebook' | 'rdEcom' | 'rdLegacy' | 'egoi' | 'hotjar';

type TextFieldDefinition = {
	key: IntegracaoMarketingFieldKey;
	labelKey: string;
	helperKey: string;
	placeholder?: string;
	readOnly?: boolean;
	allowSecretEdit?: boolean;
};

type BooleanFieldDefinition = {
	key: IntegracaoMarketingFieldKey;
	labelKey: string;
};

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';
const formId = 'integracoes-marketing-form';

const tabs: Array<{ key: TabKey; labelKey: string; fallback: string }> = [
	{ key: 'google', labelKey: 'integrationsMarketing.tabs.google', fallback: 'Google' },
	{ key: 'facebook', labelKey: 'integrationsMarketing.tabs.facebook', fallback: 'Facebook' },
	{ key: 'rdEcom', labelKey: 'integrationsMarketing.tabs.rdEcom', fallback: 'RD Station E-Commerce' },
	{ key: 'rdLegacy', labelKey: 'integrationsMarketing.tabs.rdLegacy', fallback: 'RD Station Eventos (legado)' },
	{ key: 'egoi', labelKey: 'integrationsMarketing.tabs.egoi', fallback: 'E-goi' },
	{ key: 'hotjar', labelKey: 'integrationsMarketing.tabs.hotjar', fallback: 'Hotjar' },
];

const googleFields: TextFieldDefinition[] = [
	{ key: 'ga3', labelKey: 'integrationsMarketing.fields.ga3', helperKey: 'integrationsMarketing.helpers.ga3', placeholder: 'UA-XXXXXXX-X' },
	{ key: 'ga4', labelKey: 'integrationsMarketing.fields.ga4', helperKey: 'integrationsMarketing.helpers.ga4', placeholder: 'G-XXXXXXXXXX' },
	{ key: 'ga4_ios', labelKey: 'integrationsMarketing.fields.ga4Ios', helperKey: 'integrationsMarketing.helpers.ga4Mobile', placeholder: 'G-XXXXXXXXXX' },
	{ key: 'ga4_android', labelKey: 'integrationsMarketing.fields.ga4Android', helperKey: 'integrationsMarketing.helpers.ga4Mobile', placeholder: 'G-XXXXXXXXXX' },
	{ key: 'gtm', labelKey: 'integrationsMarketing.fields.gtm', helperKey: 'integrationsMarketing.helpers.gtm', placeholder: 'GTM-XXXXXXX' },
	{
		key: 'ga_conversion',
		labelKey: 'integrationsMarketing.fields.gaConversion',
		helperKey: 'integrationsMarketing.helpers.gaConversion',
		placeholder: 'AW-XXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXX',
	},
	{
		key: 'ga_conversion_cadastro',
		labelKey: 'integrationsMarketing.fields.gaConversionRegister',
		helperKey: 'integrationsMarketing.helpers.gaConversionRegister',
		placeholder: 'AW-XXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXX',
	},
	{ key: 'gverify', labelKey: 'integrationsMarketing.fields.gverify', helperKey: 'integrationsMarketing.helpers.gverify' },
];

const facebookFields: TextFieldDefinition[] = [
	{ key: 'fb_pixel', labelKey: 'integrationsMarketing.fields.fbPixel', helperKey: 'integrationsMarketing.helpers.fbPixel' },
	{ key: 'fb_token', labelKey: 'integrationsMarketing.fields.fbToken', helperKey: 'integrationsMarketing.helpers.fbToken' },
	{ key: 'fb_verify', labelKey: 'integrationsMarketing.fields.fbVerify', helperKey: 'integrationsMarketing.helpers.fbVerify' },
];

const rdEcomFields: TextFieldDefinition[] = [
	{ key: 'rd_ecom_client_id', labelKey: 'integrationsMarketing.fields.rdEcomClientId', helperKey: 'integrationsMarketing.helpers.rdEcomClientId' },
	{ key: 'rd_ecom_client_secret', labelKey: 'integrationsMarketing.fields.rdEcomClientSecret', helperKey: 'integrationsMarketing.helpers.rdEcomClientSecret' },
	{
		key: 'rd_ecom_refresh_token',
		labelKey: 'integrationsMarketing.fields.rdEcomRefreshToken',
		helperKey: 'integrationsMarketing.helpers.rdEcomRefreshToken',
		readOnly: true,
		allowSecretEdit: false,
	},
];

const rdLegacyFields: TextFieldDefinition[] = [
	{
		key: 'rd_js',
		labelKey: 'integrationsMarketing.fields.rdJs',
		helperKey: 'integrationsMarketing.helpers.rdJs',
		placeholder: 'https://id.cloudfront.net/js/loader-scripts/id-loader.js',
	},
	{ key: 'rd_client_id', labelKey: 'integrationsMarketing.fields.rdClientId', helperKey: 'integrationsMarketing.helpers.rdClientId' },
	{ key: 'rd_client_secret', labelKey: 'integrationsMarketing.fields.rdClientSecret', helperKey: 'integrationsMarketing.helpers.rdClientSecret' },
	{ key: 'rd_code', labelKey: 'integrationsMarketing.fields.rdCode', helperKey: 'integrationsMarketing.helpers.rdCode' },
	{ key: 'rd_refresh_token', labelKey: 'integrationsMarketing.fields.rdRefreshToken', helperKey: 'integrationsMarketing.helpers.rdRefreshToken' },
];

const egoiFields: TextFieldDefinition[] = [
	{
		key: 'egoi_js',
		labelKey: 'integrationsMarketing.fields.egoiJs',
		helperKey: 'integrationsMarketing.helpers.egoiJs',
		placeholder: 'https://egoi.site/1234567_seusite.com.br.js',
	},
	{ key: 'egoi_id', labelKey: 'integrationsMarketing.fields.egoiId', helperKey: 'integrationsMarketing.helpers.egoiId', placeholder: '1234567' },
	{ key: 'egoi_api_key', labelKey: 'integrationsMarketing.fields.egoiApiKey', helperKey: 'integrationsMarketing.helpers.egoiApiKey' },
	{ key: 'egoi_domain', labelKey: 'integrationsMarketing.fields.egoiDomain', helperKey: 'integrationsMarketing.helpers.egoiDomain' },
	{ key: 'egoi_lista_id', labelKey: 'integrationsMarketing.fields.egoiListId', helperKey: 'integrationsMarketing.helpers.egoiListId' },
];

const rdEcomEvents: BooleanFieldDefinition[] = [
	{ key: 'rd_ecom_checkout_started', labelKey: 'integrationsMarketing.events.checkoutStarted' },
	{ key: 'rd_ecom_cart_abandoned', labelKey: 'integrationsMarketing.events.cartAbandoned' },
	{ key: 'rd_ecom_order_placed', labelKey: 'integrationsMarketing.events.orderPlaced' },
	{ key: 'rd_ecom_order_paid', labelKey: 'integrationsMarketing.events.orderPaid' },
	{ key: 'rd_ecom_order_canceled', labelKey: 'integrationsMarketing.events.orderCanceled' },
	{ key: 'rd_ecom_order_refunded', labelKey: 'integrationsMarketing.events.orderRefunded' },
	{ key: 'rd_ecom_order_fulfilled', labelKey: 'integrationsMarketing.events.orderFulfilled' },
	{ key: 'rd_ecom_shipment_delivered', labelKey: 'integrationsMarketing.events.shipmentDelivered' },
];

const rdLegacyEvents: BooleanFieldDefinition[] = [
	{ key: 'rd_ativacao', labelKey: 'integrationsMarketing.events.customerActivation' },
	{ key: 'rd_cliente', labelKey: 'integrationsMarketing.events.customerRegister' },
	{ key: 'rd_contato', labelKey: 'integrationsMarketing.events.contactRegister' },
	{ key: 'rd_newsletter', labelKey: 'integrationsMarketing.events.newsletterRegister' },
	{ key: 'rd_carrinho', labelKey: 'integrationsMarketing.events.cartAbandoned' },
	{ key: 'rd_pedido', labelKey: 'integrationsMarketing.events.orderReceived' },
];

const egoiEvents: BooleanFieldDefinition[] = [
	{ key: 'egoi_ativacao', labelKey: 'integrationsMarketing.events.customerActivation' },
	{ key: 'egoi_cliente', labelKey: 'integrationsMarketing.events.customerRegister' },
	{ key: 'egoi_contato', labelKey: 'integrationsMarketing.events.contactRegister' },
	{ key: 'egoi_newsletter', labelKey: 'integrationsMarketing.events.newsletterRegister' },
	{ key: 'egoi_carrinho', labelKey: 'integrationsMarketing.events.cartOrder' },
	{ key: 'egoi_pedido', labelKey: 'integrationsMarketing.events.orderReceived' },
];

function formatUpdateDate(value: string, locale: ReturnType<typeof useI18n>['locale']) {
	const trimmed = value.trim();
	if (!trimmed) {
		return '';
	}

	const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
	const date = new Date(normalized);
	if (Number.isNaN(date.getTime())) {
		return trimmed;
	}

	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(date);
}

function formatUpdateMeta(updatedAt: string, updatedBy: string, t: ReturnType<typeof useI18n>['t'], locale: ReturnType<typeof useI18n>['locale']) {
	if (!updatedAt || !updatedBy) {
		return null;
	}

	return t('integrationsMarketing.fields.lastUpdateValue', 'Última alteração: {{date}} por {{user}}')
		.replace('{{date}}', formatUpdateDate(updatedAt, locale))
		.replace('{{user}}', updatedBy);
}

function hasSecretValue(record: IntegracaoMarketingRecord, key: IntegracaoMarketingFieldKey) {
	return record.values[key].trim().length > 0;
}

export function IntegracaoMarketingPage() {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesMarketing');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [connectingRdEcom, setConnectingRdEcom] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [activeTab, setActiveTab] = useState<TabKey>('google');
	const [initialRecord, setInitialRecord] = useState<IntegracaoMarketingRecord>(createEmptyIntegracaoMarketingRecord());
	const [values, setValues] = useState<IntegracaoMarketingValues>(createEmptyIntegracaoMarketingRecord().values);
	const [editableSecrets, setEditableSecrets] = useState<Record<string, boolean>>({});
	const [rdEcomOauthConnected, setRdEcomOauthConnected] = useState(false);
	const [rdEcomCallbackUrl, setRdEcomCallbackUrl] = useState('');
	const shellTabs = useMemo(() => tabs.map((tab) => ({ key: tab.key, label: t(tab.labelKey, tab.fallback) })), [t]);

	const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master);
	const hasChanges = useMemo(
		() => Object.keys(values).some((key) => values[key as IntegracaoMarketingFieldKey] !== initialRecord.values[key as IntegracaoMarketingFieldKey]),
		[initialRecord.values, values],
	);

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
			{ label: t('menuKeys.integracoes', 'Integrações') },
			{ label: t('integrationsMarketing.title', 'Marketing'), href: '/integracoes/marketing' },
		],
		[t],
	);

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const result = await integracaoMarketingClient.get();
				if (!active) {
					return;
				}

				setInitialRecord(result);
				setValues(result.values);
				setEditableSecrets({});
				setRdEcomOauthConnected(result.values.rd_ecom_refresh_token.trim().length > 0);
				setError(null);
			} catch (loadError) {
				if (!active) {
					return;
				}

				setError(loadError instanceof Error ? loadError : new Error(t('integrationsMarketing.feedback.loadError', 'Não foi possível carregar as configurações de marketing.')));
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		void load();
		return () => {
			active = false;
		};
	}, [t]);

	useEffect(() => {
		setRdEcomCallbackUrl(`${window.location.origin}/api/integracoes/marketing/rd-ecom-oauth/callback`);
	}, []);

	async function handleRefresh() {
		setLoading(true);
		setFeedback(null);
		setError(null);

		try {
			const result = await integracaoMarketingClient.get();
			setInitialRecord(result);
			setValues(result.values);
			setEditableSecrets({});
			setRdEcomOauthConnected(result.values.rd_ecom_refresh_token.trim().length > 0);
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError : new Error(t('integrationsMarketing.feedback.loadError', 'Não foi possível carregar as configurações de marketing.')));
		} finally {
			setLoading(false);
		}
	}

	function patch(key: IntegracaoMarketingFieldKey, value: string) {
		setValues((current) => ({ ...current, [key]: value }));
		if (key === 'rd_ecom_client_id') {
			const sameClientId = value.trim() === initialRecord.values.rd_ecom_client_id.trim();
			const hasInitialToken = initialRecord.values.rd_ecom_refresh_token.trim().length > 0;
			if (sameClientId && hasInitialToken && !editableSecrets.rd_ecom_client_secret) {
				setRdEcomOauthConnected(true);
				setValues((current) => ({ ...current, rd_ecom_refresh_token: initialRecord.values.rd_ecom_refresh_token }));
				setEditableSecrets((current) => ({ ...current, rd_ecom_refresh_token: false }));
			} else {
				setRdEcomOauthConnected(false);
				setValues((current) => ({ ...current, rd_ecom_refresh_token: '' }));
				setEditableSecrets((current) => ({ ...current, rd_ecom_refresh_token: true }));
			}
		}

		if (key === 'rd_ecom_client_secret') {
			setRdEcomOauthConnected(false);
			setValues((current) => ({ ...current, rd_ecom_refresh_token: '' }));
			setEditableSecrets((current) => ({ ...current, rd_ecom_refresh_token: true }));
		}
	}

	function setSecretEditable(key: IntegracaoMarketingFieldKey, editable: boolean) {
		setEditableSecrets((current) => ({ ...current, [key]: editable }));
		if (editable) {
			patch(key, '');
			if (key === 'rd_ecom_client_secret') {
				setRdEcomOauthConnected(false);
				patch('rd_ecom_refresh_token', '');
				setEditableSecrets((current) => ({ ...current, rd_ecom_client_secret: true, rd_ecom_refresh_token: true }));
			}
		} else {
			patch(key, initialRecord.values[key]);
			if (key === 'rd_ecom_client_secret' && initialRecord.values.rd_ecom_refresh_token) {
				patch('rd_ecom_refresh_token', initialRecord.values.rd_ecom_refresh_token);
				setRdEcomOauthConnected(true);
			}
		}
	}

	function getIncludedEncryptedKeys() {
		return integracaoMarketingEncryptedKeys.filter((key) => editableSecrets[key] || !hasSecretValue(initialRecord, key));
	}

	function validateBeforeSave() {
		if (!hasIntegracaoMarketingRdEcomEvents(values)) {
			return true;
		}

		const hasClientSecret = editableSecrets.rd_ecom_client_secret ? values.rd_ecom_client_secret.trim().length > 0 : hasSecretValue(initialRecord, 'rd_ecom_client_secret');
		const hasRefreshToken = editableSecrets.rd_ecom_refresh_token ? values.rd_ecom_refresh_token.trim().length > 0 : hasSecretValue(initialRecord, 'rd_ecom_refresh_token');

		if (!values.rd_ecom_client_id.trim()) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomClientIdRequired', 'Para ativar o RD Station E-Commerce, informe o ID do aplicativo.') });
			return false;
		}

		if (!hasClientSecret) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomSecretRequired', 'Para ativar o RD Station E-Commerce, informe a senha do aplicativo.') });
			return false;
		}

		if (!hasRefreshToken || (!rdEcomOauthConnected && (editableSecrets.rd_ecom_client_secret || editableSecrets.rd_ecom_refresh_token))) {
			setFeedback({
				tone: 'error',
				message: t('integrationsMarketing.feedback.rdEcomConnectRequired', 'Conecte com a RD Station antes de salvar as configurações do RD Station E-Commerce.'),
			});
			return false;
		}

		return true;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSave || !hasChanges || !validateBeforeSave()) {
			return;
		}

		try {
			setSaving(true);
			await integracaoMarketingClient.save(values, { includeEncryptedKeys: getIncludedEncryptedKeys() });
			const refreshed = await integracaoMarketingClient.get();
			setInitialRecord(refreshed);
			setValues(refreshed.values);
			setEditableSecrets({});
			setRdEcomOauthConnected(refreshed.values.rd_ecom_refresh_token.trim().length > 0);
			setFeedback({
				tone: 'success',
				message: t('integrationsMarketing.feedback.saveSuccess', 'Configurações de marketing salvas com sucesso.'),
			});
		} catch (saveError) {
			setFeedback({
				tone: 'error',
				message: saveError instanceof Error ? saveError.message : t('integrationsMarketing.feedback.saveError', 'Não foi possível salvar as configurações de marketing.'),
			});
		} finally {
			setSaving(false);
		}
	}

	async function handleRdEcomConnect() {
		const useCurrentSecret = !editableSecrets.rd_ecom_client_secret && hasSecretValue(initialRecord, 'rd_ecom_client_secret');
		const clientSecret = useCurrentSecret ? '' : values.rd_ecom_client_secret.trim();

		if (!values.rd_ecom_client_id.trim()) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomClientIdRequired', 'Para ativar o RD Station E-Commerce, informe o ID do aplicativo.') });
			return;
		}

		if (!useCurrentSecret && !clientSecret) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomSecretRequired', 'Para ativar o RD Station E-Commerce, informe a senha do aplicativo.') });
			return;
		}

		try {
			setConnectingRdEcom(true);
			const result = await integracaoMarketingClient.startRdEcomOauth({
				clientId: values.rd_ecom_client_id,
				clientSecret,
				useCurrentSecret,
			});
			const oauthUrl = result.data?.oauth_url ?? '';
			if (!oauthUrl) {
				throw new Error(t('integrationsMarketing.feedback.rdEcomOauthUrlError', 'Não foi possível gerar a URL de conexão com a RD Station.'));
			}

			const popup = window.open(oauthUrl, 'rd_ecom_oauth', 'width=700,height=760,scrollbars=yes,resizable=yes');
			if (!popup) {
				throw new Error(t('integrationsMarketing.feedback.rdEcomPopupBlocked', 'Desbloqueie pop-ups para concluir a conexão com a RD Station.'));
			}
			popup.focus();
			setFeedback({ tone: 'success', message: t('integrationsMarketing.feedback.rdEcomWaiting', 'Aguardando autorização da RD Station...') });
		} catch (connectError) {
			setFeedback({
				tone: 'error',
				message:
					connectError instanceof Error ? connectError.message : t('integrationsMarketing.feedback.rdEcomStartError', 'Não foi possível iniciar a conexão com a RD Station.'),
			});
		} finally {
			setConnectingRdEcom(false);
		}
	}

	async function handleCopyRdEcomCallback() {
		if (!rdEcomCallbackUrl) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomCallbackMissing', 'URL de callback não informada para cópia.') });
			return;
		}

		try {
			await navigator.clipboard.writeText(rdEcomCallbackUrl);
			setFeedback({ tone: 'success', message: t('integrationsMarketing.feedback.rdEcomCallbackCopied', 'URL de callback copiada.') });
		} catch {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomCallbackCopyError', 'Não foi possível copiar a URL de callback.') });
		}
	}

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== window.location.origin) {
				return;
			}

			const data = event.data as { type?: string; success?: boolean; refresh_token?: string; message?: string };
			if (data?.type !== 'rd_ecom_oauth_result') {
				return;
			}

			if (data.success && data.refresh_token) {
				setValues((current) => ({ ...current, rd_ecom_refresh_token: data.refresh_token ?? '' }));
				setEditableSecrets((current) => ({ ...current, rd_ecom_refresh_token: true }));
				setRdEcomOauthConnected(true);
				setFeedback({ tone: 'success', message: data.message || t('integrationsMarketing.feedback.rdEcomConnected', 'Conexão com a RD Station realizada com sucesso.') });
				return;
			}

			setRdEcomOauthConnected(false);
			setFeedback({ tone: 'error', message: data.message || t('integrationsMarketing.feedback.rdEcomCompleteError', 'Não foi possível concluir a conexão com a RD Station.') });
		}

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [t]);

	function renderTextFields(fields: TextFieldDefinition[]) {
		return (
			<div className="grid gap-4 lg:grid-cols-2">
				{fields.map((field) => {
					const encrypted = isIntegracaoMarketingEncryptedKey(field.key);
					const hasSecret = encrypted && hasSecretValue(initialRecord, field.key);
					const secretEditable = Boolean(editableSecrets[field.key]) || !hasSecret;
					const canManuallyEditSecret = field.allowSecretEdit ?? true;
					const updateMeta = formatUpdateMeta(initialRecord.metadata[field.key].updatedAt, initialRecord.metadata[field.key].updatedBy, t, locale);
					const helperText = t(field.helperKey, '');
					return (
						<FormField key={field.key} label={t(field.labelKey, field.key)} helperText={null}>
							<div className="space-y-2">
								<input
									type="text"
									className={inputClasses()}
									value={values[field.key]}
									onChange={(event) => patch(field.key, event.target.value)}
									disabled={saving || (encrypted && hasSecret && !secretEditable)}
									readOnly={field.readOnly}
									placeholder={field.placeholder}
								/>
								{helperText ? <span className="block whitespace-pre-line text-xs text-slate-500">{helperText}</span> : null}
								{updateMeta ? <span className="block text-xs text-slate-500">{updateMeta}</span> : null}
								{encrypted && hasSecret && canManuallyEditSecret ? (
									<div className="flex flex-wrap gap-2">
										{!secretEditable ? (
											<button
												type="button"
												className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
												onClick={() => setSecretEditable(field.key, true)}
												disabled={saving}
											>
												<RefreshCcw className="h-3.5 w-3.5" />
												{t('integrationsMarketing.actions.changeSecret', 'Alterar')}
											</button>
										) : (
											<button
												type="button"
												className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
												onClick={() => setSecretEditable(field.key, false)}
												disabled={saving}
											>
												<X className="h-3.5 w-3.5" />
												{t('integrationsMarketing.actions.cancelSecretChange', 'Cancelar alteração')}
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

	function renderBooleanGrid(fields: BooleanFieldDefinition[]) {
		return (
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{fields.map((field) => (
					<div key={field.key} className="app-pane-muted rounded-2xl p-4">
						<p className="mb-3 text-sm font-semibold text-(--app-text)">{t(field.labelKey, field.key)}</p>
						<BooleanChoice
							value={values[field.key] === 'true'}
							onChange={(nextValue) => patch(field.key, nextValue ? 'true' : 'false')}
							disabled={saving}
							trueLabel={t('common.yes', 'Sim')}
							falseLabel={t('common.no', 'Não')}
						/>
						{formatUpdateMeta(initialRecord.metadata[field.key].updatedAt, initialRecord.metadata[field.key].updatedBy, t, locale) ? (
							<span className="mt-3 block text-xs text-slate-500">
								{formatUpdateMeta(initialRecord.metadata[field.key].updatedAt, initialRecord.metadata[field.key].updatedBy, t, locale)}
							</span>
						) : null}
					</div>
				))}
			</div>
		);
	}

	if (!access.canOpen) {
		return <AccessDeniedState title={t('integrationsMarketing.title', 'Marketing')} />;
	}

	return (
		<TabbedParameterPageShell
			title={t('integrationsMarketing.title', 'Marketing')}
			description={t('integrationsMarketing.description', 'Gerencie integrações de marketing, eventos e scripts de rastreamento da empresa ativa.')}
			breadcrumbs={breadcrumbs}
			formId={formId}
			loading={loading}
			error={error?.message}
			loadingTitle={t('integrationsMarketing.loading', 'Carregando integrações de marketing...')}
			errorTitle={t('integrationsMarketing.feedback.loadError', 'Não foi possível carregar as configurações de marketing.')}
			feedback={feedback}
			onCloseFeedback={() => setFeedback(null)}
			onRefresh={handleRefresh}
			tabs={shellTabs}
			activeTab={activeTab}
			onTabChange={setActiveTab}
			canSave={canSave}
			hasChanges={hasChanges}
			saving={saving}
			backHref="/dashboard"
			onSubmit={handleSubmit}
		>
			{activeTab === 'google' ? (
				<SectionCard
					title={t('integrationsMarketing.sections.google.title', 'Google')}
					description={t('integrationsMarketing.sections.google.description', 'Configure GA3, GA4, Tag Manager, conversões e verificação de domínio.')}
				>
					{renderTextFields(googleFields)}
					<div className="mt-4 max-w-sm">
						<FormField
							label={t('integrationsMarketing.fields.dataLayerVersion', 'Versão do Data Layer')}
							helperText={t('integrationsMarketing.helpers.dataLayerVersion', 'Versão usada para eventos do Data Layer no site.')}
						>
							<select className={inputClasses()} value={values.versao_datalayer} onChange={(event) => patch('versao_datalayer', event.target.value)} disabled={saving}>
								<option value="GA4">GA4</option>
								<option value="GA3">GA3</option>
							</select>
						</FormField>
					</div>
				</SectionCard>
			) : null}

			{activeTab === 'facebook' ? (
				<SectionCard
					title={t('integrationsMarketing.sections.facebook.title', 'Facebook')}
					description={t('integrationsMarketing.sections.facebook.description', 'Configure Pixel, token de conversões e verificação de domínio.')}
				>
					{renderTextFields(facebookFields)}
				</SectionCard>
			) : null}

			{activeTab === 'rdEcom' ? (
				<SectionCard
					title={t('integrationsMarketing.sections.rdEcom.title', 'RD Station E-Commerce')}
					description={t('integrationsMarketing.sections.rdEcom.description', 'Configure credenciais OAuth e eventos do RD Station E-Commerce.')}
				>
					<div className="app-pane-muted mb-5 rounded-[1.1rem] p-5 text-sm leading-6 text-(--app-text-muted)">
						<p className="font-semibold text-(--app-text)">{t('integrationsMarketing.rdEcomInstructions.title', 'Como criar o aplicativo no RD Station')}</p>
						<ol className="mt-2 list-decimal space-y-1 pl-5">
							<li>{t('integrationsMarketing.rdEcomInstructions.step1', 'Acesse o App Publisher da RD Station e crie um novo aplicativo.')}</li>
							<li>{t('integrationsMarketing.rdEcomInstructions.step2', 'Preencha as informações do app e salve a URL de callback no aplicativo.')}</li>
							<li>{t('integrationsMarketing.rdEcomInstructions.step3', 'Informe ID e senha do aplicativo, clique em conectar e autorize na RD Station.')}</li>
							<li>{t('integrationsMarketing.rdEcomInstructions.step4', 'Na etapa de credenciais, copie o Client ID e o Client Secret para os campos deste formulário.')}</li>
						</ol>
						<div className="mt-4 space-y-2">
							<label className="block text-xs font-semibold uppercase tracking-[0.14em] text-(--app-text)" htmlFor="rd_ecom_callback_url">
								{t('integrationsMarketing.rdEcomInstructions.callbackLabel', 'URL de Callback para cadastrar no app')}
							</label>
							<div className="flex overflow-hidden rounded-[0.95rem] border border-line bg-(--app-surface)">
								<input
									id="rd_ecom_callback_url"
									type="text"
									className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-(--app-text) outline-none"
									value={rdEcomCallbackUrl}
									readOnly
								/>
								<button
									type="button"
									className="inline-flex items-center justify-center border-l border-line px-3 text-(--app-text-muted) transition hover:bg-(--app-surface-muted) hover:text-(--app-text)"
									onClick={() => void handleCopyRdEcomCallback()}
									aria-label={t('integrationsMarketing.actions.copyCallbackUrl', 'Copiar URL de callback')}
								>
									<Copy className="h-4 w-4" />
								</button>
							</div>
							<p className="text-xs text-slate-500">
								{t('integrationsMarketing.rdEcomInstructions.callbackHelper', 'Use esta URL exatamente como está no campo URLs de Callback do aplicativo RD.')}
							</p>
						</div>
					</div>
					{renderTextFields(rdEcomFields)}
					<div className="mt-4 flex flex-wrap items-center gap-3">
						<button
							type="button"
							className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
							onClick={() => void handleRdEcomConnect()}
							disabled={saving || connectingRdEcom}
						>
							<Link2 className="h-4 w-4" />
							{connectingRdEcom
								? t('integrationsMarketing.actions.connectingRdStation', 'Conectando...')
								: t('integrationsMarketing.actions.connectRdStation', 'Conectar com RD Station')}
						</button>
						<span className={rdEcomOauthConnected ? 'text-sm font-semibold text-emerald-700 dark:text-emerald-300' : 'text-sm font-semibold text-amber-700 dark:text-amber-300'}>
							{rdEcomOauthConnected
								? t('integrationsMarketing.feedback.rdEcomConnectedShort', 'Token de atualização configurado.')
								: t('integrationsMarketing.feedback.rdEcomPendingShort', 'Conexão pendente.')}
						</span>
					</div>
					<div className="mt-6">
						<h3 className="text-sm font-semibold text-(--app-text)">{t('integrationsMarketing.sections.apiIntegrations', 'Integrações por API')}</h3>
						<p className="mb-3 mt-1 text-xs text-slate-500">{t('integrationsMarketing.helpers.rdEcomApiEvents', 'Eventos de E-Commerce habilitados para envio')}</p>
						{renderBooleanGrid(rdEcomEvents)}
					</div>
				</SectionCard>
			) : null}

			{activeTab === 'rdLegacy' ? (
				<SectionCard
					title={t('integrationsMarketing.sections.rdLegacy.title', 'RD Station Eventos (legado)')}
					description={t('integrationsMarketing.sections.rdLegacy.description', 'Configure scripts, credenciais e eventos do fluxo legado da RD Station.')}
				>
					{renderTextFields(rdLegacyFields)}
					<div className="mt-6">
						<h3 className="text-sm font-semibold text-(--app-text)">{t('integrationsMarketing.sections.apiIntegrations', 'Integrações por API')}</h3>
						<p className="mb-3 mt-1 text-xs text-slate-500">{t('integrationsMarketing.helpers.servicesApi', 'Serviços integrados com a API')}</p>
						{renderBooleanGrid(rdLegacyEvents)}
					</div>
				</SectionCard>
			) : null}

			{activeTab === 'egoi' ? (
				<SectionCard
					title={t('integrationsMarketing.sections.egoi.title', 'E-goi')}
					description={t('integrationsMarketing.sections.egoi.description', 'Configure script, API Key, domínio, lista e eventos do E-goi.')}
				>
					{renderTextFields(egoiFields)}
					<div className="mt-6">
						<h3 className="text-sm font-semibold text-(--app-text)">{t('integrationsMarketing.sections.apiIntegrations', 'Integrações por API')}</h3>
						<p className="mb-3 mt-1 text-xs text-slate-500">{t('integrationsMarketing.helpers.servicesWithApi', 'Serviços integrados com API')}</p>
						{renderBooleanGrid(egoiEvents)}
					</div>
				</SectionCard>
			) : null}

			{activeTab === 'hotjar' ? (
				<SectionCard
					title={t('integrationsMarketing.sections.hotjar.title', 'Hotjar')}
					description={t('integrationsMarketing.sections.hotjar.description', 'Configure o ID fornecido pelo Hotjar.')}
				>
					{renderTextFields([{ key: 'hotjar_id', labelKey: 'integrationsMarketing.fields.hotjarId', helperKey: 'integrationsMarketing.helpers.hotjarId' }])}
				</SectionCard>
			) : null}
		</TabbedParameterPageShell>
	);
}
