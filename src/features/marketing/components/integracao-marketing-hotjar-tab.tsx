'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import { MarketingTextFieldsGrid } from '@/src/features/marketing/components/integracao-marketing-tab-shared';
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

export function IntegracaoMarketingHotjarTab(props: Props) {
	const { t } = props;

	return (
		<SectionCard
			title={t('integrationsMarketing.sections.hotjar.title', 'Hotjar')}
			description={t('integrationsMarketing.sections.hotjar.description', 'Configure o ID fornecido pelo Hotjar.')}
		>
			<MarketingTextFieldsGrid {...props} fields={[{ key: 'hotjar_id', labelKey: 'integrationsMarketing.fields.hotjarId', helperKey: 'integrationsMarketing.helpers.hotjarId' }]} />
		</SectionCard>
	);
}
