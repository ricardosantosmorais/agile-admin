'use client';

import { BarChart3, Globe, Megaphone, MousePointerClick, Radio, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { TabbedIntegrationFormPage } from '@/src/features/integracoes/components/tabbed-integration-form-page';
import { IntegracaoMarketingEgoiTab } from '@/src/features/marketing/components/integracao-marketing-egoi-tab';
import { IntegracaoMarketingFacebookTab } from '@/src/features/marketing/components/integracao-marketing-facebook-tab';
import { IntegracaoMarketingGoogleTab } from '@/src/features/marketing/components/integracao-marketing-google-tab';
import { IntegracaoMarketingHotjarTab } from '@/src/features/marketing/components/integracao-marketing-hotjar-tab';
import { useIntegracaoMarketingPageState } from '@/src/features/marketing/components/integracao-marketing-page-state';
import { IntegracaoMarketingRdEcomTab } from '@/src/features/marketing/components/integracao-marketing-rd-ecom-tab';
import { IntegracaoMarketingRdLegacyTab } from '@/src/features/marketing/components/integracao-marketing-rd-legacy-tab';
import { integracaoMarketingClient } from '@/src/features/marketing/services/integracao-marketing-client';
import {
	createEmptyIntegracaoMarketingRecord,
	type IntegracaoMarketingRecord,
	type IntegracaoMarketingValues,
} from '@/src/features/marketing/services/integracao-marketing-mappers';
import { useI18n } from '@/src/i18n/use-i18n';

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';
const formId = 'integracoes-marketing-form';

export function IntegracaoMarketingPage() {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesMarketing');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [initialRecord, setInitialRecord] = useState<IntegracaoMarketingRecord>(createEmptyIntegracaoMarketingRecord());
	const [values, setValues] = useState<IntegracaoMarketingValues>(createEmptyIntegracaoMarketingRecord().values);

	const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master);
	const {
		editableSecrets,
		connectingRdEcom,
		rdEcomOauthConnected,
		rdEcomCallbackUrl,
		hasChanges,
		patch,
		setSecretEditable,
		getIncludedEncryptedKeys,
		validateBeforeSave,
		handleRdEcomConnect,
		handleCopyRdEcomCallback,
	} = useIntegracaoMarketingPageState({ initialRecord, values, setValues, setFeedback, t });

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Inicio'), href: '/dashboard' },
			{ label: t('menuKeys.integracoes', 'Integracoes') },
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
				setError(null);
			} catch (loadError) {
				if (!active) {
					return;
				}

				setError(loadError instanceof Error ? loadError : new Error(t('integrationsMarketing.feedback.loadError', 'Nao foi possivel carregar as configuracoes de marketing.')));
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

	async function handleRefresh() {
		setLoading(true);
		setFeedback(null);
		setError(null);

		try {
			const result = await integracaoMarketingClient.get();
			setInitialRecord(result);
			setValues(result.values);
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError : new Error(t('integrationsMarketing.feedback.loadError', 'Nao foi possivel carregar as configuracoes de marketing.')));
		} finally {
			setLoading(false);
		}
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
			setFeedback({
				tone: 'success',
				message: t('integrationsMarketing.feedback.saveSuccess', 'Configuracoes de marketing salvas com sucesso.'),
			});
		} catch (saveError) {
			setFeedback({
				tone: 'error',
				message: saveError instanceof Error ? saveError.message : t('integrationsMarketing.feedback.saveError', 'Nao foi possivel salvar as configuracoes de marketing.'),
			});
		} finally {
			setSaving(false);
		}
	}

	const tabs = [
		{
			key: 'google',
			label: t('integrationsMarketing.tabs.google', 'Google'),
			icon: <BarChart3 className="h-4 w-4" />,
			content: (
				<IntegracaoMarketingGoogleTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					patch={patch}
					setSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'facebook',
			label: t('integrationsMarketing.tabs.facebook', 'Facebook'),
			icon: <MousePointerClick className="h-4 w-4" />,
			content: (
				<IntegracaoMarketingFacebookTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					patch={patch}
					setSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'rdEcom',
			label: t('integrationsMarketing.tabs.rdEcom', 'RD Station E-Commerce'),
			icon: <ShoppingBag className="h-4 w-4" />,
			content: (
				<IntegracaoMarketingRdEcomTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					patch={patch}
					setSecretEditable={setSecretEditable}
					rdEcomCallbackUrl={rdEcomCallbackUrl}
					connectingRdEcom={connectingRdEcom}
					rdEcomOauthConnected={rdEcomOauthConnected}
					onConnect={handleRdEcomConnect}
					onCopyCallback={handleCopyRdEcomCallback}
				/>
			),
		},
		{
			key: 'rdLegacy',
			label: t('integrationsMarketing.tabs.rdLegacy', 'RD Station Eventos (legado)'),
			icon: <Radio className="h-4 w-4" />,
			content: (
				<IntegracaoMarketingRdLegacyTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					patch={patch}
					setSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'egoi',
			label: t('integrationsMarketing.tabs.egoi', 'E-goi'),
			icon: <Megaphone className="h-4 w-4" />,
			content: (
				<IntegracaoMarketingEgoiTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					patch={patch}
					setSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'hotjar',
			label: t('integrationsMarketing.tabs.hotjar', 'Hotjar'),
			icon: <Globe className="h-4 w-4" />,
			content: (
				<IntegracaoMarketingHotjarTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					patch={patch}
					setSecretEditable={setSecretEditable}
				/>
			),
		},
	];

	if (!access.canOpen) {
		return <AccessDeniedState title={t('integrationsMarketing.title', 'Marketing')} />;
	}

	return (
		<TabbedIntegrationFormPage
			title={t('integrationsMarketing.title', 'Marketing')}
			description={t('integrationsMarketing.description', 'Gerencie integracoes de marketing, eventos e scripts de rastreamento da empresa ativa.')}
			breadcrumbs={breadcrumbs}
			formId={formId}
			loading={loading}
			error={error?.message}
			loadingTitle={t('integrationsMarketing.loading', 'Carregando integracoes de marketing...')}
			errorTitle={t('integrationsMarketing.feedback.loadError', 'Nao foi possivel carregar as configuracoes de marketing.')}
			feedback={feedback}
			onCloseFeedback={() => setFeedback(null)}
			onRefresh={handleRefresh}
			tabs={tabs}
			canSave={canSave}
			hasChanges={hasChanges}
			saving={saving}
			backHref="/dashboard"
			onSubmit={handleSubmit}
		/>
	);
}
