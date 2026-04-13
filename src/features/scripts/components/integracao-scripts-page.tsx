'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabbedParameterPageShell } from '@/src/components/form-page/tabbed-parameter-page-shell';
import { CodeEditor } from '@/src/components/ui/code-editor';
import { SectionCard } from '@/src/components/ui/section-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useI18n } from '@/src/i18n/use-i18n';
import { integracaoScriptsClient } from '../services/integracao-scripts-client';
import { createEmptyIntegracaoScriptsRecord, type ScriptsFieldMeta, type ScriptsValues, type IntegracaoScriptsRecord } from '../services/integracao-scripts-mappers';

type TabKey = 'head' | 'footer';
type TFn = ReturnType<typeof useI18n>['t'];

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';

function formatUpdateMeta(meta: ScriptsFieldMeta | undefined, t: TFn) {
	if (!meta?.updatedAt || !meta.updatedBy) return null;
	return (
		<span className="mt-1 block text-xs text-slate-500">
			{t('integrationsScripts.lastUpdateValue', 'Última alteração: {{date}} por {{user}}').replace('{{date}}', meta.updatedAt).replace('{{user}}', meta.updatedBy)}
		</span>
	);
}

export function IntegracaoScriptsPage() {
	const { t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesScripts');

	const [record, setRecord] = useState<IntegracaoScriptsRecord>(createEmptyIntegracaoScriptsRecord());
	const [initialRecord, setInitialRecord] = useState<IntegracaoScriptsRecord>(createEmptyIntegracaoScriptsRecord());
	const [values, setValues] = useState<ScriptsValues>(createEmptyIntegracaoScriptsRecord().values);
	const [activeTab, setActiveTab] = useState<TabKey>('head');
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

	const tabs = useMemo(
		() => [
			{ key: 'head' as const, label: t('integrationsScripts.tabs.head', 'Head') },
			{ key: 'footer' as const, label: t('integrationsScripts.tabs.footer', 'Footer') },
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

	if (!access?.canOpen) {
		return <AccessDeniedState title={t('integrationsScripts.title', 'Scripts')} />;
	}

	return (
		<TabbedParameterPageShell
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
			activeTab={activeTab}
			onTabChange={setActiveTab}
			canSave={canSave}
			hasChanges={hasChanges}
			saving={saving}
			backHref="/dashboard"
			onSubmit={handleSubmit}
		>
			{activeTab === 'head' ? (
				<SectionCard
					title={t('integrationsScripts.sections.head.title', 'Head')}
					description={t('integrationsScripts.sections.head.description', 'Scripts que ficarão no topo do site, antes do fechamento da tag head')}
				>
					<CodeEditor editorId="scripts-head" language="html" value={values.headJs} onChange={(v) => patch('headJs', v)} readOnly={saving || !canEdit} height="420px" />
					{formatUpdateMeta(record.metadata.headJs, t)}
				</SectionCard>
			) : null}

			{activeTab === 'footer' ? (
				<SectionCard
					title={t('integrationsScripts.sections.footer.title', 'Footer')}
					description={t('integrationsScripts.sections.footer.description', 'Scripts que ficarão no rodapé do site, antes do fechamento da tag body')}
				>
					<CodeEditor editorId="scripts-footer" language="html" value={values.footerJs} onChange={(v) => patch('footerJs', v)} readOnly={saving || !canEdit} height="420px" />
					{formatUpdateMeta(record.metadata.footerJs, t)}
				</SectionCard>
			) : null}
		</TabbedParameterPageShell>
	);
}
