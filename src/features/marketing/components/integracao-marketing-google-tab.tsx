'use client';

import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import { MarketingTextFieldsGrid, googleFields, type MarketingTextFieldDefinition } from '@/src/features/marketing/components/integracao-marketing-tab-shared';
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

export function IntegracaoMarketingGoogleTab(props: Props) {
	const { values, saving, canSave, t, patch } = props;

	return (
		<SectionCard
			title={t('integrationsMarketing.sections.google.title', 'Google')}
			description={t('integrationsMarketing.sections.google.description', 'Configure GA3, GA4, Tag Manager, conversões e verificação de domínio.')}
		>
			<MarketingTextFieldsGrid {...props} fields={googleFields as MarketingTextFieldDefinition[]} />
			<div className="mt-4 max-w-sm">
				<FormField
					label={t('integrationsMarketing.fields.dataLayerVersion', 'Versão do Data Layer')}
					helperText={t('integrationsMarketing.helpers.dataLayerVersion', 'Versão usada para eventos do Data Layer no site.')}
				>
					<select className={inputClasses()} value={values.versao_datalayer} onChange={(event) => patch('versao_datalayer', event.target.value)} disabled={saving || !canSave}>
						<option value="GA4">GA4</option>
						<option value="GA3">GA3</option>
					</select>
				</FormField>
			</div>
		</SectionCard>
	);
}
