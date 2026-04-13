'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import { IntegracaoLogisticaTextFields, setCanhotoFields, type TranslationFn } from '@/src/features/integracoes-logistica/components/integracao-logistica-tab-shared';
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

export function IntegracaoLogisticaSetCanhotoTab(props: Props) {
	const { t } = props;
	return (
		<SectionCard title="Set Canhoto" description={t('integrationsLogistics.sections.setCanhoto.description', 'Configurações de integração com a Set Canhoto.')}>
			<IntegracaoLogisticaTextFields {...props} fields={setCanhotoFields} />
		</SectionCard>
	);
}
