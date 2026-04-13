'use client';

import { FieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import type { IntegracaoAtendimentoRecord, IntegracaoAtendimentoValues } from '@/src/features/atendimento/services/integracao-atendimento-mappers';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type Props = {
	values: IntegracaoAtendimentoValues;
	initialRecord: IntegracaoAtendimentoRecord;
	saving: boolean;
	canSave: boolean;
	locale: string;
	t: TranslationFn;
	onPatchValues: (patch: Partial<IntegracaoAtendimentoValues>) => void;
};

export function IntegracaoAtendimentoEbitTab({ values, initialRecord, saving, canSave, locale, t, onPatchValues }: Props) {
	return (
		<SectionCard
			title={t('integrationsAttendance.sections.ebit.title', 'Ebit')}
			description={t('integrationsAttendance.sections.ebit.description', 'Informe o código de identificação da loja no Ebit.')}
		>
			<FormField
				label={t('integrationsAttendance.fields.ebitCode', 'Código Ebit')}
				helperText={t('integrationsAttendance.helpers.ebitCode', 'Código da loja fornecido pelo Ebit.')}
			>
				<>
					<input
						id="ebit_codigo"
						type="text"
						className={inputClasses()}
						value={values.ebitCodigo}
						onChange={(event) => onPatchValues({ ebitCodigo: event.target.value })}
						disabled={saving || !canSave}
						placeholder={t('integrationsAttendance.placeholders.ebitCode', 'Código da loja no Ebit')}
					/>
					<FieldUpdateMeta
						as="span"
						metadata={initialRecord.metadata.ebitCodigo}
						t={t}
						locale={locale}
						labelKey="integrationsAttendance.fields.lastUpdateValue"
						fallback="Última alteração: {{date}} por {{user}}"
						className="text-xs text-slate-500"
					/>
				</>
			</FormField>
		</SectionCard>
	);
}
