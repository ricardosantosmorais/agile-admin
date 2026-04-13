'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import {
	frenetBooleans,
	frenetEnvironment,
	frenetFields,
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

export function IntegracaoLogisticaFrenetTab(props: Props) {
	const { values, initialRecord, saving, canSave, locale, t, onPatch } = props;
	return (
		<SectionCard title="Frenet" description={t('integrationsLogistics.sections.frenet.description', 'Configurações de integração com a Frenet.')}>
			<div className="space-y-5">
				<IntegracaoLogisticaTextFields {...props} fields={frenetFields} />
				<IntegracaoLogisticaBooleanFields
					values={values}
					initialRecord={initialRecord}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={onPatch}
					fields={[frenetEnvironment]}
				/>
				<IntegracaoLogisticaBooleanFields
					values={values}
					initialRecord={initialRecord}
					saving={saving}
					canSave={canSave}
					locale={locale}
					t={t}
					onPatch={onPatch}
					fields={frenetBooleans}
				/>
			</div>
		</SectionCard>
	);
}
