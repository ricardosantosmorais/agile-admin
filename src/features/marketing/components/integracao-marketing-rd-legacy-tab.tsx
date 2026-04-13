'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import { MarketingBooleanGrid, MarketingTextFieldsGrid, rdLegacyEvents, rdLegacyFields } from '@/src/features/marketing/components/integracao-marketing-tab-shared';
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
};

export function IntegracaoMarketingRdLegacyTab(props: Props) {
	const { t } = props;

	return (
		<SectionCard
			title={t('integrationsMarketing.sections.rdLegacy.title', 'RD Station Eventos (legado)')}
			description={t('integrationsMarketing.sections.rdLegacy.description', 'Configure scripts, credenciais e eventos do fluxo legado da RD Station.')}
		>
			<MarketingTextFieldsGrid {...props} fields={rdLegacyFields} />
			<div className="mt-6">
				<h3 className="text-sm font-semibold text-(--app-text)">{t('integrationsMarketing.sections.apiIntegrations', 'Integrações por API')}</h3>
				<p className="mb-3 mt-1 text-xs text-slate-500">{t('integrationsMarketing.helpers.servicesApi', 'Serviços integrados com a API')}</p>
				<MarketingBooleanGrid {...props} fields={rdLegacyEvents} />
			</div>
		</SectionCard>
	);
}
