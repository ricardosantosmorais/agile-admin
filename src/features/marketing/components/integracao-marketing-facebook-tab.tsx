'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import { MarketingTextFieldsGrid, facebookFields } from '@/src/features/marketing/components/integracao-marketing-tab-shared';
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

export function IntegracaoMarketingFacebookTab(props: Props) {
	const { t } = props;

	return (
		<SectionCard
			title={t('integrationsMarketing.sections.facebook.title', 'Facebook')}
			description={t('integrationsMarketing.sections.facebook.description', 'Configure Pixel, token de conversões e verificação de domínio.')}
		>
			<MarketingTextFieldsGrid {...props} fields={facebookFields} />
		</SectionCard>
	);
}
