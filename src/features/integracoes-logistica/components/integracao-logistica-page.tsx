'use client';

import { BadgeHelp, Package, Search, ShieldCheck, Truck, TruckElectric, Waypoints } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { TabbedIntegrationFormPage } from '@/src/features/integracoes/components/tabbed-integration-form-page';
import { IntegracaoLogisticaFindcepTab } from '@/src/features/integracoes-logistica/components/integracao-logistica-findcep-tab';
import { IntegracaoLogisticaFreteRapidoTab } from '@/src/features/integracoes-logistica/components/integracao-logistica-frete-rapido-tab';
import { IntegracaoLogisticaFrenetTab } from '@/src/features/integracoes-logistica/components/integracao-logistica-frenet-tab';
import { IntegracaoLogisticaGeneralTab } from '@/src/features/integracoes-logistica/components/integracao-logistica-general-tab';
import { IntegracaoLogisticaIbolttTab } from '@/src/features/integracoes-logistica/components/integracao-logistica-iboltt-tab';
import { IntegracaoLogisticaMandaeTab } from '@/src/features/integracoes-logistica/components/integracao-logistica-mandae-tab';
import { useIntegracaoLogisticaPageState } from '@/src/features/integracoes-logistica/components/integracao-logistica-page-state';
import { IntegracaoLogisticaSetCanhotoTab } from '@/src/features/integracoes-logistica/components/integracao-logistica-set-canhoto-tab';
import { integracaoLogisticaClient } from '@/src/features/integracoes-logistica/services/integracao-logistica-client';
import {
	createEmptyIntegracaoLogisticaRecord,
	type IntegracaoLogisticaBranchValues,
	type IntegracaoLogisticaRecord,
	type IntegracaoLogisticaValues,
} from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';
import { useI18n } from '@/src/i18n/use-i18n';

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';
const formId = 'integracoes-logistica-form';

export function IntegracaoLogisticaPage() {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesLogistica');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [initialRecord, setInitialRecord] = useState<IntegracaoLogisticaRecord>(createEmptyIntegracaoLogisticaRecord());
	const [values, setValues] = useState<IntegracaoLogisticaValues>(createEmptyIntegracaoLogisticaRecord().values);
	const [branchValues, setBranchValues] = useState<IntegracaoLogisticaBranchValues>({});

	const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master);
	const { editableSecrets, resetEditableSecrets, hasChanges, patch, patchBranch, setSecretEditable, setBranchTokenEditable, getIncludedEncryptedKeys } =
		useIntegracaoLogisticaPageState({
			initialRecord,
			values,
			setValues,
			branchValues,
			setBranchValues,
		});

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
				resetEditableSecrets();
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
	}, [resetEditableSecrets, t]);

	async function handleRefresh() {
		setLoading(true);
		setFeedback(null);
		setError(null);

		try {
			const result = await integracaoLogisticaClient.get();
			setInitialRecord(result);
			setValues(result.values);
			setBranchValues(result.branchValues);
			resetEditableSecrets();
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError : new Error(t('integrationsLogistics.feedback.loadError', 'Não foi possível carregar as configurações de logística.')));
		} finally {
			setLoading(false);
		}
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
			resetEditableSecrets();
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

	if (!access.canOpen) {
		return <AccessDeniedState title={t('integrationsLogistics.title', 'Logística')} />;
	}

	const tabs = [
		{
			key: 'general',
			label: t('integrationsLogistics.tabs.general', 'Dados Gerais'),
			icon: <BadgeHelp className="h-4 w-4" />,
			content: (
				<IntegracaoLogisticaGeneralTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={patch}
					onSetSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'frenet',
			label: t('integrationsLogistics.tabs.frenet', 'Frenet'),
			icon: <Truck className="h-4 w-4" />,
			content: (
				<IntegracaoLogisticaFrenetTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={patch}
					onSetSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'mandae',
			label: t('integrationsLogistics.tabs.mandae', 'Mandaê'),
			icon: <Package className="h-4 w-4" />,
			content: (
				<IntegracaoLogisticaMandaeTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={patch}
					onSetSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'freteRapido',
			label: t('integrationsLogistics.tabs.freteRapido', 'Frete Rápido'),
			icon: <TruckElectric className="h-4 w-4" />,
			content: (
				<IntegracaoLogisticaFreteRapidoTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={patch}
					onSetSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'setCanhoto',
			label: t('integrationsLogistics.tabs.setCanhoto', 'Set Canhoto'),
			icon: <ShieldCheck className="h-4 w-4" />,
			content: (
				<IntegracaoLogisticaSetCanhotoTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={patch}
					onSetSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'findcep',
			label: t('integrationsLogistics.tabs.findcep', 'FindCEP'),
			icon: <Search className="h-4 w-4" />,
			content: (
				<IntegracaoLogisticaFindcepTab
					values={values}
					initialRecord={initialRecord}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={patch}
					onSetSecretEditable={setSecretEditable}
				/>
			),
		},
		{
			key: 'iboltt',
			label: t('integrationsLogistics.tabs.iboltt', 'IBoltt'),
			icon: <Waypoints className="h-4 w-4" />,
			content: (
				<IntegracaoLogisticaIbolttTab
					values={values}
					initialRecord={initialRecord}
					branchValues={branchValues}
					editableSecrets={editableSecrets}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={patch}
					onPatchBranch={patchBranch}
					onSetBranchTokenEditable={setBranchTokenEditable}
				/>
			),
		},
	];

	return (
		<TabbedIntegrationFormPage
			title={t('integrationsLogistics.title', 'Logística')}
			description={t('integrationsLogistics.description', 'Configure parâmetros de integração logística para a empresa ativa.')}
			breadcrumbs={breadcrumbs}
			formId={formId}
			loading={loading}
			error={error?.message}
			loadingTitle={t('integrationsLogistics.loading', 'Carregando logística...')}
			errorTitle={t('integrationsLogistics.feedback.loadError', 'Não foi possível carregar as configurações de logística.')}
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
