'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import {
	freteRapidoBooleans,
	freteRapidoFields,
	IntegracaoLogisticaBooleanFields,
	IntegracaoLogisticaTextFields,
	type TranslationFn,
} from '@/src/features/integracoes-logistica/components/integracao-logistica-tab-shared';
import type {
	IntegracaoLogisticaEncryptedKey,
	IntegracaoLogisticaRecord,
	IntegracaoLogisticaValues,
	IntegracaoLogisticaFieldKey,
} from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';

type Props = {
	values: IntegracaoLogisticaValues;
	initialRecord: IntegracaoLogisticaRecord;
	editableSecrets: Record<string, boolean>;
	saving: boolean;
	canSave: boolean;
	locale: string;
	t: TranslationFn;
	onPatch: (key: IntegracaoLogisticaFieldKey, value: string) => void;
	onSetSecretEditable: (key: IntegracaoLogisticaEncryptedKey, editable: boolean) => void;
};

export function IntegracaoLogisticaFreteRapidoTab(props: Props) {
	const { values, initialRecord, saving, canSave, locale, t, onPatch } = props;
	return (
		<SectionCard
			title={t('integrationsLogistics.sections.freteRapido.title', 'Frete Rápido')}
			description={t('integrationsLogistics.sections.freteRapido.description', 'Configurações de integração com a Frete Rápido.')}
		>
			<div className="space-y-5">
				<IntegracaoLogisticaTextFields {...props} fields={freteRapidoFields} />
				<IntegracaoLogisticaBooleanFields
					values={values}
					initialRecord={initialRecord}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={onPatch}
					fields={freteRapidoBooleans}
				/>
			</div>
		</SectionCard>
	);
}
