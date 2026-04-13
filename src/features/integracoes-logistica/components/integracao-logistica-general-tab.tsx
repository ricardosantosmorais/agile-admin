'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import { generalFields, IntegracaoLogisticaTextFields, type TranslationFn } from '@/src/features/integracoes-logistica/components/integracao-logistica-tab-shared';
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

export function IntegracaoLogisticaGeneralTab(props: Props) {
	const { t } = props;
	return (
		<SectionCard
			title={t('integrationsLogistics.sections.general.title', 'Dados Gerais')}
			description={t('integrationsLogistics.sections.general.description', 'Configurações gerais de integração logística.')}
		>
			<IntegracaoLogisticaTextFields {...props} fields={generalFields} />
		</SectionCard>
	);
}
