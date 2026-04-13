'use client';

import { Banknote, CreditCard, Shield, ShieldAlert, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { TabbedIntegrationFormPage } from '@/src/features/integracoes/components/tabbed-integration-form-page';
import { IntegracaoFinanceiroBoletoTab } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-boleto-tab';
import { IntegracaoFinanceiroCartaoTab } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-cartao-tab';
import { IntegracaoFinanceiroClearsaleTab } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-clearsale-tab';
import { IntegracaoFinanceiroKondutoTab } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-konduto-tab';
import { useIntegracaoFinanceiroPageState } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-page-state';
import { IntegracaoFinanceiroPixTab } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-pix-tab';
import { integracaoFinanceiroClient } from '@/src/features/integracoes-financeiro/services/integracao-financeiro-client';
import type {
	ClearSaleConfig,
	FinanceiroGatewayBranchRow,
	IntegracaoFinanceiroRecord,
	KondutoConfig,
} from '@/src/features/integracoes-financeiro/types/integracao-financeiro.types';
import { useI18n } from '@/src/i18n/use-i18n';

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';
const formId = 'integracao-financeiro-form';

const emptyRecord: IntegracaoFinanceiroRecord = {
	gateways: [],
	branches: [],
	clearSale: {
		ambiente: '',
		login: '',
		senha: '',
		fingerprint: '',
		modoBb2B2c: '',
		customSla: '',
		enviaPix: '',
	},
	clearSaleMetadata: {},
	konduto: {
		ambiente: '',
		chavePublica: '',
		chavePrivada: '',
	},
	kondutoMetadata: {},
};

export function IntegracaoFinanceiroPage() {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesFinanceiro');
	const [record, setRecord] = useState<IntegracaoFinanceiroRecord>(emptyRecord);
	const [initialRecord, setInitialRecord] = useState<IntegracaoFinanceiroRecord>(emptyRecord);
	const [branches, setBranches] = useState<FinanceiroGatewayBranchRow[]>([]);
	const [clearSale, setClearSale] = useState<ClearSaleConfig>(emptyRecord.clearSale);
	const [konduto, setKonduto] = useState<KondutoConfig>(emptyRecord.konduto);
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState(true);

	const canEdit = useMemo(() => {
		if (!session || !user) return false;
		if (session.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user.master) return false;
		return access?.canEdit ?? false;
	}, [session, user, access]);

	const { senhaEditable, setSenhaEditable, chavePrivadaEditable, setChavePrivadaEditable, resetEditableState, hasChanges, updateBranch, patchClearSale, patchKonduto } =
		useIntegracaoFinanceiroPageState({ initialRecord, branches, setBranches, clearSale, setClearSale, konduto, setKonduto });

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Home'), href: '/dashboard' },
			{ label: t('common.integrations', 'Integracoes'), href: '/integracoes' },
			{ label: t('integrationsFinancial.title', 'Financeiro') },
		],
		[t],
	);

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				setLoading(true);
				setError(null);
				const loaded = await integracaoFinanceiroClient.get();
				if (!active) {
					return;
				}

				setRecord(loaded);
				setInitialRecord(loaded);
				setBranches(loaded.branches);
				setClearSale(loaded.clearSale);
				setKonduto(loaded.konduto);
				resetEditableState(loaded);
			} catch (loadError) {
				if (!active) {
					return;
				}
				setError(loadError instanceof Error ? loadError : new Error(t('integrationsFinancial.feedback.loadError', 'Erro ao carregar configuracoes')));
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
	}, [resetEditableState, t]);

	const canSave = canEdit && hasChanges;

	async function handleRefresh() {
		setFeedback(null);
		setError(null);
		setLoading(true);

		try {
			const loaded = await integracaoFinanceiroClient.get();
			setRecord(loaded);
			setInitialRecord(loaded);
			setBranches(loaded.branches);
			setClearSale(loaded.clearSale);
			setKonduto(loaded.konduto);
			resetEditableState(loaded);
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError : new Error(t('integrationsFinancial.feedback.loadError', 'Erro ao carregar configuracoes')));
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
			await integracaoFinanceiroClient.save(branches, clearSale, konduto, {
				includeClearSaleSenha: senhaEditable && clearSale.senha.length > 0,
				includeKondutoChavePrivada: chavePrivadaEditable && konduto.chavePrivada.length > 0,
			});
			const refreshed = await integracaoFinanceiroClient.get();
			setInitialRecord(refreshed);
			setRecord(refreshed);
			setBranches(refreshed.branches);
			setClearSale(refreshed.clearSale);
			setKonduto(refreshed.konduto);
			resetEditableState(refreshed);
			setFeedback({ tone: 'success', message: t('integrationsFinancial.feedback.saveSuccess', 'Configuracoes salvas com sucesso') });
		} catch (saveError) {
			setFeedback({ tone: 'error', message: saveError instanceof Error ? saveError.message : t('integrationsFinancial.feedback.saveError', 'Erro ao salvar') });
		} finally {
			setSaving(false);
		}
	}

	if (!access?.canView) {
		return <AccessDeniedState title={t('integrationsFinancial.title', 'Integracoes > Financeiro')} />;
	}

	const tabs = [
		{
			key: 'boleto',
			label: t('integrationsFinancial.tabs.boleto', 'Boleto'),
			icon: <Banknote className="h-4 w-4" />,
			content: <IntegracaoFinanceiroBoletoTab gateways={record.gateways} branches={branches} saving={saving} canEdit={canEdit} locale={locale} t={t} onChange={updateBranch} />,
		},
		{
			key: 'cartao',
			label: t('integrationsFinancial.tabs.cartao', 'Cartao'),
			icon: <CreditCard className="h-4 w-4" />,
			content: <IntegracaoFinanceiroCartaoTab gateways={record.gateways} branches={branches} saving={saving} canEdit={canEdit} locale={locale} t={t} onChange={updateBranch} />,
		},
		{
			key: 'pix',
			label: t('integrationsFinancial.tabs.pix', 'PIX'),
			icon: <WalletCards className="h-4 w-4" />,
			content: <IntegracaoFinanceiroPixTab gateways={record.gateways} branches={branches} saving={saving} canEdit={canEdit} locale={locale} t={t} onChange={updateBranch} />,
		},
		{
			key: 'clearsale',
			label: t('integrationsFinancial.tabs.clearsale', 'ClearSale'),
			icon: <ShieldAlert className="h-4 w-4" />,
			content: (
				<IntegracaoFinanceiroClearsaleTab
					clearSale={clearSale}
					initialValue={initialRecord.clearSale}
					metadata={record.clearSaleMetadata}
					saving={saving}
					canEdit={canEdit}
					locale={locale}
					t={t}
					senhaEditable={senhaEditable}
					onPatch={patchClearSale}
					onSetSenhaEditable={setSenhaEditable}
				/>
			),
		},
		{
			key: 'konduto',
			label: t('integrationsFinancial.tabs.konduto', 'Konduto'),
			icon: <Shield className="h-4 w-4" />,
			content: (
				<IntegracaoFinanceiroKondutoTab
					konduto={konduto}
					initialValue={initialRecord.konduto}
					metadata={record.kondutoMetadata}
					saving={saving}
					canEdit={canEdit}
					locale={locale}
					t={t}
					chavePrivadaEditable={chavePrivadaEditable}
					onPatch={patchKonduto}
					onSetChavePrivadaEditable={setChavePrivadaEditable}
				/>
			),
		},
	];

	return (
		<TabbedIntegrationFormPage
			title={t('integrationsFinancial.title', 'Financeiro')}
			description={t('integrationsFinancial.description', 'Gerencie gateways de pagamento e provedores de antifraude da empresa ativa.')}
			breadcrumbs={breadcrumbs}
			formId={formId}
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
