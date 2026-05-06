'use client';

import { Building2, Globe2, IdCard } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { TabbedIntegrationFormPage } from '@/src/features/integracoes/components/tabbed-integration-form-page';
import { IntegracaoClientesCnpjaTab } from '@/src/features/integracoes-clientes/components/integracao-clientes-cnpja-tab';
import { IntegracaoClientesCfoTab } from '@/src/features/integracoes-clientes/components/integracao-clientes-cfo-tab';
import { IntegracaoClientesPortalTab } from '@/src/features/integracoes-clientes/components/integracao-clientes-portal-tab';
import { useI18n } from '@/src/i18n/use-i18n';
import { useIntegracaoClientesPageState } from './integracao-clientes-page-state';
import { integracaoClientesClient } from '../services/integracao-clientes-client';
import { createEmptyIntegracaoClientesRecord, type ClientesBranchRow, type ClientesValues, type IntegracaoClientesRecord } from '../services/integracao-clientes-mappers';

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';

// -- Page -------------------------------------------------------------------

export function IntegracaoClientesPage() {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesClientes');

	const [record, setRecord] = useState<IntegracaoClientesRecord>(createEmptyIntegracaoClientesRecord());
	const [initialRecord, setInitialRecord] = useState<IntegracaoClientesRecord>(createEmptyIntegracaoClientesRecord());
	const [values, setValues] = useState<ClientesValues>(createEmptyIntegracaoClientesRecord().values);
	const [branches, setBranches] = useState<ClientesBranchRow[]>([]);
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState(true);

	const { cnpjaTokenEditable, setCnpjaTokenEditable, croApiKeyEditable, setCroApiKeyEditable, unlockedBranchIds, hasChanges, patchValues, updateBranchToken, unlockBranch, lockBranch, resetEditableState } =
		useIntegracaoClientesPageState({
			initialRecord,
			values,
			setValues,
			branches,
			setBranches,
		});

	const canEdit = useMemo(() => {
		if (!session || !user) return false;
		if (session.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user.master) return false;
		return access?.canEdit ?? false;
	}, [session, user, access]);

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const loaded = await integracaoClientesClient.get();
			setRecord(loaded);
			setInitialRecord(loaded);
			setValues(loaded.values);
			setBranches(loaded.branches);
			resetEditableState(loaded);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(t('integrationsClients.feedback.loadError', 'Não foi possível carregar as configurações.')));
		} finally {
			setLoading(false);
		}
	}, [resetEditableState, t]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const canSave = canEdit && hasChanges;

	const handleRefresh = useCallback(() => {
		loadData();
	}, [loadData]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!canSave) return;
			try {
				setSaving(true);
				setFeedback(null);
				await integracaoClientesClient.save(values, branches, {
					includeCnpjaToken: cnpjaTokenEditable,
					includeCroApiKey: croApiKeyEditable,
					unlockedBranchIds,
				});
				const refreshed = await integracaoClientesClient.get();
				setRecord(refreshed);
				setInitialRecord(refreshed);
				setValues(refreshed.values);
				setBranches(refreshed.branches);
				resetEditableState(refreshed);
				setFeedback({ tone: 'success', message: t('integrationsClients.feedback.saveSuccess', 'Configurações salvas com sucesso.') });
			} catch (err) {
				setFeedback({
					tone: 'error',
					message: err instanceof Error ? err.message : t('integrationsClients.feedback.saveError', 'Erro ao salvar.'),
				});
			} finally {
				setSaving(false);
			}
		},
		[branches, canSave, cnpjaTokenEditable, croApiKeyEditable, resetEditableState, t, unlockedBranchIds, values],
	);

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Home'), href: '/dashboard' },
			{ label: t('menuKeys.integracoes', 'Integrações') },
			{ label: t('integrationsClients.title', 'Clientes'), href: '/integracoes/clientes' },
		],
		[t],
	);

	const tabs = useMemo(
		() => [
			{
				key: 'cnpja',
				label: t('integrationsClients.tabs.cnpja', 'CNPJá'),
				icon: <Building2 className="h-4 w-4" />,
				content: (
					<IntegracaoClientesCnpjaTab
						value={values.cnpjaToken}
						initialValue={initialRecord.values.cnpjaToken}
						editable={cnpjaTokenEditable}
						saving={saving}
						canEdit={canEdit}
						metadata={record.metadata.cnpjaToken}
						locale={locale}
						onChange={(value) => patchValues('cnpjaToken', value)}
						onEnable={() => {
							setCnpjaTokenEditable(true);
							patchValues('cnpjaToken', '');
						}}
						onCancel={() => {
							setCnpjaTokenEditable(false);
							patchValues('cnpjaToken', initialRecord.values.cnpjaToken);
						}}
						t={t}
					/>
				),
			},
			{
				key: 'cfo',
				label: t('integrationsClients.tabs.cfo', 'CFO'),
				icon: <IdCard className="h-4 w-4" />,
				content: (
					<IntegracaoClientesCfoTab
						value={values.croApiKey}
						initialValue={initialRecord.values.croApiKey}
						editable={croApiKeyEditable}
						saving={saving}
						canEdit={canEdit}
						metadata={record.metadata.croApiKey}
						locale={locale}
						onChange={(value) => patchValues('croApiKey', value)}
						onEnable={() => {
							setCroApiKeyEditable(true);
							patchValues('croApiKey', '');
						}}
						onCancel={() => {
							setCroApiKeyEditable(false);
							patchValues('croApiKey', initialRecord.values.croApiKey);
						}}
						t={t}
					/>
				),
			},
			{
				key: 'portal',
				label: t('integrationsClients.tabs.portal', 'Portal do Cliente'),
				icon: <Globe2 className="h-4 w-4" />,
				content: (
					<IntegracaoClientesPortalTab
						branches={branches}
						initialBranches={initialRecord.branches}
						values={values}
						metadata={{
							portalPedidos: record.metadata.portalPedidos,
							portalOrcamentos: record.metadata.portalOrcamentos,
							portalTitulos: record.metadata.portalTitulos,
							portalNotasFiscais: record.metadata.portalNotasFiscais,
						}}
						unlockedBranchIds={unlockedBranchIds}
						saving={saving}
						canEdit={canEdit}
						locale={locale}
						onChangeBranchToken={updateBranchToken}
						onUnlockBranch={unlockBranch}
						onLockBranch={lockBranch}
						onPatchValue={patchValues}
						t={t}
					/>
				),
			},
		],
		[
			branches,
			canEdit,
			cnpjaTokenEditable,
			croApiKeyEditable,
			initialRecord.branches,
			initialRecord.values.cnpjaToken,
			initialRecord.values.croApiKey,
			locale,
			record.metadata.cnpjaToken,
			record.metadata.croApiKey,
			record.metadata.portalNotasFiscais,
			record.metadata.portalOrcamentos,
			record.metadata.portalPedidos,
			record.metadata.portalTitulos,
			lockBranch,
			patchValues,
			saving,
			setCnpjaTokenEditable,
			setCroApiKeyEditable,
			t,
			unlockBranch,
			unlockedBranchIds,
			updateBranchToken,
			values,
		],
	);

	if (!access?.canView) {
		return <AccessDeniedState title={t('integrationsClients.title', 'Integrações > Clientes')} />;
	}

	return (
		<TabbedIntegrationFormPage
			breadcrumbs={breadcrumbs}
			title={t('integrationsClients.title', 'Clientes')}
			description={t('integrationsClients.description', 'Gerencie integrações de consulta cadastral e Portal do Cliente da empresa ativa.')}
			formId="integracao-clientes-form"
			loading={loading}
			error={error?.message}
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
