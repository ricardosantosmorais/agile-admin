'use client';

import { Gem, MessageCircle, MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { IntegracaoAtendimentoEbitTab } from '@/src/features/atendimento/components/integracao-atendimento-ebit-tab';
import { IntegracaoAtendimentoJivoTab } from '@/src/features/atendimento/components/integracao-atendimento-jivo-tab';
import { useIntegracaoAtendimentoPageState } from '@/src/features/atendimento/components/integracao-atendimento-page-state';
import { IntegracaoAtendimentoWhatsappTab } from '@/src/features/atendimento/components/integracao-atendimento-whatsapp-tab';
import { integracaoAtendimentoClient } from '@/src/features/atendimento/services/integracao-atendimento-client';
import {
	createEmptyIntegracaoAtendimentoRecord,
	type IntegracaoAtendimentoBranchRow,
	type IntegracaoAtendimentoRecord,
	type IntegracaoAtendimentoValues,
} from '@/src/features/atendimento/services/integracao-atendimento-mappers';
import { TabbedIntegrationFormPage } from '@/src/features/integracoes/components/tabbed-integration-form-page';
import { useI18n } from '@/src/i18n/use-i18n';

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';
const formId = 'integracoes-atendimento-form';

export function IntegracaoAtendimentoPage() {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesAtendimento');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [initialRecord, setInitialRecord] = useState<IntegracaoAtendimentoRecord>(createEmptyIntegracaoAtendimentoRecord());
	const [values, setValues] = useState<IntegracaoAtendimentoValues>(createEmptyIntegracaoAtendimentoRecord().values);
	const [branches, setBranches] = useState<IntegracaoAtendimentoBranchRow[]>([]);

	const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master);
	const { tokenEditable, setTokenEditable, resetTokenEditable, hasToken, shouldIncludeTokenOnSave, hasChanges, updateBranch, patchValues } = useIntegracaoAtendimentoPageState({
		initialRecord,
		values,
		setValues,
		branches,
		setBranches,
	});

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
			{ label: t('menuKeys.integracoes', 'Integrações') },
			{ label: t('integrationsAttendance.title', 'Atendimento'), href: '/integracoes/atendimento' },
		],
		[t],
	);

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const result = await integracaoAtendimentoClient.get();
				if (!active) {
					return;
				}

				setInitialRecord(result);
				setValues(result.values);
				setBranches(result.branches);
				resetTokenEditable(result);
				setError(null);
			} catch (loadError) {
				if (!active) {
					return;
				}

				setError(loadError instanceof Error ? loadError : new Error(t('integrationsAttendance.feedback.loadError', 'Não foi possível carregar as configurações de atendimento.')));
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
	}, [resetTokenEditable, t]);

	async function handleRefresh() {
		setLoading(true);
		setFeedback(null);
		setError(null);

		try {
			const result = await integracaoAtendimentoClient.get();
			setInitialRecord(result);
			setValues(result.values);
			setBranches(result.branches);
			resetTokenEditable(result);
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError : new Error(t('integrationsAttendance.feedback.loadError', 'Não foi possível carregar as configurações de atendimento.')));
		} finally {
			setLoading(false);
		}
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSave || !hasChanges) {
			return;
		}

		try {
			setSaving(true);
			await integracaoAtendimentoClient.save(values, branches, { includeWhatsappToken: shouldIncludeTokenOnSave });
			const refreshed = await integracaoAtendimentoClient.get();
			setInitialRecord(refreshed);
			setValues(refreshed.values);
			setBranches(refreshed.branches);
			resetTokenEditable(refreshed);
			setFeedback({ tone: 'success', message: t('integrationsAttendance.feedback.saveSuccess', 'Configurações de atendimento salvas com sucesso.') });
		} catch (saveError) {
			setFeedback({
				tone: 'error',
				message: saveError instanceof Error ? saveError.message : t('integrationsAttendance.feedback.saveError', 'Não foi possível salvar as configurações de atendimento.'),
			});
		} finally {
			setSaving(false);
		}
	}

	if (!access.canOpen) {
		return <AccessDeniedState title={t('integrationsAttendance.title', 'Atendimento')} />;
	}

	const tabs = [
		{
			key: 'whatsapp',
			label: t('integrationsAttendance.tabs.whatsapp', 'WhatsApp'),
			icon: <MessageCircle className="h-4 w-4" />,
			content: (
				<IntegracaoAtendimentoWhatsappTab
					values={values}
					initialRecord={initialRecord}
					branches={branches}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					tokenEditable={tokenEditable}
					hasToken={hasToken}
					onPatchValues={patchValues}
					onUpdateBranch={updateBranch}
					onSetTokenEditable={setTokenEditable}
				/>
			),
		},
		{
			key: 'jivo',
			label: t('integrationsAttendance.tabs.jivo', 'Jivo Chat'),
			icon: <MessageSquare className="h-4 w-4" />,
			content: <IntegracaoAtendimentoJivoTab values={values} initialRecord={initialRecord} saving={saving} canSave={canSave} locale={locale} t={t} onPatchValues={patchValues} />,
		},
		{
			key: 'ebit',
			label: t('integrationsAttendance.tabs.ebit', 'Ebit'),
			icon: <Gem className="h-4 w-4" />,
			content: <IntegracaoAtendimentoEbitTab values={values} initialRecord={initialRecord} saving={saving} canSave={canSave} locale={locale} t={t} onPatchValues={patchValues} />,
		},
	];

	return (
		<TabbedIntegrationFormPage
			title={t('integrationsAttendance.title', 'Atendimento')}
			description={t('integrationsAttendance.description', 'Gerencie WhatsApp, Jivo Chat e Ebit da empresa ativa.')}
			breadcrumbs={breadcrumbs}
			formId={formId}
			loading={loading}
			error={error?.message}
			loadingTitle={t('integrationsAttendance.loading', 'Carregando integrações de atendimento...')}
			errorTitle={t('integrationsAttendance.feedback.loadError', 'Não foi possível carregar as configurações de atendimento.')}
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
