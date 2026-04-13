'use client';

import { Braces, LayoutPanelTop } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabbedIntegrationFormPage } from '@/src/features/integracoes/components/tabbed-integration-form-page';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useI18n } from '@/src/i18n/use-i18n';
import { IntegracaoScriptsFooterTab } from '@/src/features/scripts/components/integracao-scripts-footer-tab';
import { IntegracaoScriptsHeadTab } from '@/src/features/scripts/components/integracao-scripts-head-tab';
import { integracaoScriptsClient } from '../services/integracao-scripts-client';
import { createEmptyIntegracaoScriptsRecord, type ScriptsValues, type IntegracaoScriptsRecord } from '../services/integracao-scripts-mappers';

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';

export function IntegracaoScriptsPage() {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesScripts');

	const [record, setRecord] = useState<IntegracaoScriptsRecord>(createEmptyIntegracaoScriptsRecord());
	const [initialRecord, setInitialRecord] = useState<IntegracaoScriptsRecord>(createEmptyIntegracaoScriptsRecord());
	const [values, setValues] = useState<ScriptsValues>(createEmptyIntegracaoScriptsRecord().values);
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState(true);

	const canEdit = useMemo(() => {
		if (!session || !user) return false;
		if (session.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user.master) return false;
		return access?.canEdit ?? false;
	}, [session, user, access]);

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
			{ label: t('menuKeys.integracoes', 'Integrações') },
			{ label: t('integrationsScripts.title', 'Scripts'), href: '/integracoes/scripts' },
		],
		[t],
	);

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const loaded = await integracaoScriptsClient.get();
			setRecord(loaded);
			setInitialRecord(loaded);
			setValues(loaded.values);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(t('integrationsScripts.feedback.loadError', 'Não foi possível carregar as configurações.')));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		void loadData();
	}, [loadData]);

	const patch = useCallback((key: keyof ScriptsValues, value: string) => {
		setValues((prev) => ({ ...prev, [key]: value }));
	}, []);

	const hasChanges = useMemo(() => JSON.stringify(values) !== JSON.stringify(initialRecord.values), [values, initialRecord.values]);

	const canSave = canEdit && hasChanges;

	async function handleRefresh() {
		setLoading(true);
		setFeedback(null);
		setError(null);
		try {
			const loaded = await integracaoScriptsClient.get();
			setRecord(loaded);
			setInitialRecord(loaded);
			setValues(loaded.values);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(t('integrationsScripts.feedback.loadError', 'Não foi possível carregar as configurações.')));
		} finally {
			setLoading(false);
		}
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSave) return;
		try {
			setSaving(true);
			setFeedback(null);
			await integracaoScriptsClient.save(values);
			const refreshed = await integracaoScriptsClient.get();
			setRecord(refreshed);
			setInitialRecord(refreshed);
			setValues(refreshed.values);
			setFeedback({ tone: 'success', message: t('integrationsScripts.feedback.saveSuccess', 'Configurações salvas com sucesso.') });
		} catch (err) {
			setFeedback({
				tone: 'error',
				message: err instanceof Error ? err.message : t('integrationsScripts.feedback.saveError', 'Não foi possível salvar as configurações.'),
			});
		} finally {
			setSaving(false);
		}
	}

	const tabs = useMemo(
		() => [
			{
				key: 'head',
				label: t('integrationsScripts.tabs.head', 'Head'),
				icon: <LayoutPanelTop className="h-4 w-4" />,
				content: (
					<IntegracaoScriptsHeadTab
						value={values.headJs}
						onChange={(value) => patch('headJs', value)}
						readOnly={saving || !canEdit}
						metadata={record.metadata.headJs}
						locale={locale}
						t={t}
					/>
				),
			},
			{
				key: 'footer',
				label: t('integrationsScripts.tabs.footer', 'Footer'),
				icon: <Braces className="h-4 w-4" />,
				content: (
					<IntegracaoScriptsFooterTab
						value={values.footerJs}
						onChange={(value) => patch('footerJs', value)}
						readOnly={saving || !canEdit}
						metadata={record.metadata.footerJs}
						locale={locale}
						t={t}
					/>
				),
			},
		],
		[canEdit, locale, patch, record.metadata.footerJs, record.metadata.headJs, saving, t, values.footerJs, values.headJs],
	);

	if (!access?.canOpen) {
		return <AccessDeniedState title={t('integrationsScripts.title', 'Scripts')} />;
	}

	return (
		<TabbedIntegrationFormPage
			title={t('integrationsScripts.title', 'Scripts')}
			description={t('integrationsScripts.description', 'Gerencie os scripts personalizados injetados no site da empresa ativa.')}
			breadcrumbs={breadcrumbs}
			formId="integracao-scripts-form"
			loading={loading}
			error={error?.message}
			loadingTitle={t('integrationsScripts.loading', 'Carregando scripts...')}
			errorTitle={t('integrationsScripts.feedback.loadError', 'Não foi possível carregar as configurações.')}
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
