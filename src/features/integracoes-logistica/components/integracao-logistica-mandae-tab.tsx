'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import {
	IntegracaoLogisticaSelectField,
	IntegracaoLogisticaTextFields,
	mandaeFields,
	mandaeSelect,
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

export function IntegracaoLogisticaMandaeTab(props: Props) {
	const { values, initialRecord, saving, canSave, locale, t, onPatch } = props;
	return (
		<SectionCard title="Mandaê" description={t('integrationsLogistics.sections.mandae.description', 'Configurações de integração com a Mandaê.')}>
			<div className="space-y-5">
				<IntegracaoLogisticaSelectField
					values={values}
					initialRecord={initialRecord}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={onPatch}
					field={mandaeSelect}
				/>
				<IntegracaoLogisticaTextFields {...props} fields={mandaeFields} />
			</div>
		</SectionCard>
	);
}
