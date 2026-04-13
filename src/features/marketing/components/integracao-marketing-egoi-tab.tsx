'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import { MarketingBooleanGrid, MarketingTextFieldsGrid, egoiEvents, egoiFields } from '@/src/features/marketing/components/integracao-marketing-tab-shared';
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

export function IntegracaoMarketingEgoiTab(props: Props) {
	const { t } = props;

	return (
		<SectionCard
			title={t('integrationsMarketing.sections.egoi.title', 'E-goi')}
			description={t('integrationsMarketing.sections.egoi.description', 'Configure script, API Key, domínio, lista e eventos do E-goi.')}
		>
			<MarketingTextFieldsGrid {...props} fields={egoiFields} />
			<div className="mt-6">
				<h3 className="text-sm font-semibold text-(--app-text)">{t('integrationsMarketing.sections.apiIntegrations', 'Integrações por API')}</h3>
				<p className="mb-3 mt-1 text-xs text-slate-500">{t('integrationsMarketing.helpers.servicesWithApi', 'Serviços integrados com API')}</p>
				<MarketingBooleanGrid {...props} fields={egoiEvents} />
			</div>
		</SectionCard>
	);
}
