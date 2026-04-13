'use client';

import { SectionCard } from '@/src/components/ui/section-card';
import { IntegracaoLogisticaIbolttTable, type TranslationFn } from '@/src/features/integracoes-logistica/components/integracao-logistica-tab-shared';
import type {
	IntegracaoLogisticaBranchValues,
	IntegracaoLogisticaRecord,
	IntegracaoLogisticaValues,
	IntegracaoLogisticaFieldKey,
} from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';

type Props = {
	values: IntegracaoLogisticaValues;
	initialRecord: IntegracaoLogisticaRecord;
	branchValues: IntegracaoLogisticaBranchValues;
	editableSecrets: Record<string, boolean>;
	saving: boolean;
	canSave: boolean;
	locale: string;
	t: TranslationFn;
	onPatch: (key: IntegracaoLogisticaFieldKey, value: string) => void;
	onPatchBranch: (branchId: string, key: 'companyId' | 'token', value: string) => void;
	onSetBranchTokenEditable: (branchId: string, editable: boolean) => void;
};

export function IntegracaoLogisticaIbolttTab(props: Props) {
	const { t } = props;
	return (
		<SectionCard title="IBoltt" description={t('integrationsLogistics.sections.iboltt.description', 'Configurações de integração com o IBoltt.')}>
			<IntegracaoLogisticaIbolttTable {...props} />
		</SectionCard>
	);
}
