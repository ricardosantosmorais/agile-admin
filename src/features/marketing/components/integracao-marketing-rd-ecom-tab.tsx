'use client';

import { Copy, Link2 } from 'lucide-react';
import { SectionCard } from '@/src/components/ui/section-card';
import { MarketingBooleanGrid, MarketingTextFieldsGrid, rdEcomEvents, rdEcomFields } from '@/src/features/marketing/components/integracao-marketing-tab-shared';
import type { IntegracaoMarketingFieldKey, IntegracaoMarketingRecord, IntegracaoMarketingValues } from '@/src/features/marketing/services/integracao-marketing-mappers';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type Props = {
	values: IntegracaoMarketingValues;
	initialRecord: IntegracaoMarketingRecord;
	editableSecrets: Record<string, boolean>;
	saving: boolean;
	canSave: boolean;
	locale: string;
	t: TranslationFn;
	patch: (key: IntegracaoMarketingFieldKey, value: string) => void;
	setSecretEditable: (key: IntegracaoMarketingFieldKey, editable: boolean) => void;
	rdEcomCallbackUrl: string;
	connectingRdEcom: boolean;
	rdEcomOauthConnected: boolean;
	onConnect: () => void | Promise<void>;
	onCopyCallback: () => void | Promise<void>;
};

export function IntegracaoMarketingRdEcomTab(props: Props) {
	const { t, rdEcomCallbackUrl, connectingRdEcom, rdEcomOauthConnected, saving, canSave, onConnect, onCopyCallback } = props;

	return (
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
							onClick={() => void onCopyCallback()}
							aria-label={t('integrationsMarketing.actions.copyCallbackUrl', 'Copiar URL de callback')}
						>
							<Copy className="h-4 w-4" />
						</button>
					</div>
					<p className="text-xs text-(--app-text-muted)">
						{t('integrationsMarketing.rdEcomInstructions.callbackHelper', 'Use esta URL exatamente como está no campo URLs de Callback do aplicativo RD.')}
					</p>
				</div>
			</div>
			<MarketingTextFieldsGrid {...props} fields={rdEcomFields} />
			<div className="mt-4 flex flex-wrap items-center gap-3">
				<button
					type="button"
					className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
					onClick={() => void onConnect()}
					disabled={saving || connectingRdEcom || !canSave}
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
				<MarketingBooleanGrid {...props} fields={rdEcomEvents} />
			</div>
		</SectionCard>
	);
}
