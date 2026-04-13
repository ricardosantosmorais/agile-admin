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

export function IntegracaoAtendimentoJivoTab({ values, initialRecord, saving, canSave, locale, t, onPatchValues }: Props) {
	return (
		<SectionCard
			title={t('integrationsAttendance.sections.jivo.title', 'Jivo Chat')}
			description={t('integrationsAttendance.sections.jivo.description', 'Defina o código JavaScript de integração do Jivo Chat.')}
		>
			<FormField
				label={t('integrationsAttendance.fields.jivoJs', 'Código JS')}
				helperText={t('integrationsAttendance.helpers.jivoJs', 'Código JavaScript fornecido pelo Jivo Chat.')}
			>
				<>
					<input
						id="jivo_js"
						type="text"
						className={inputClasses()}
						value={values.jivoJs}
						onChange={(event) => onPatchValues({ jivoJs: event.target.value })}
						disabled={saving || !canSave}
						placeholder={t('integrationsAttendance.placeholders.jivoJs', '//code.jivosite.com/widget/xxxxxxxx')}
					/>
					<FieldUpdateMeta
						as="span"
						metadata={initialRecord.metadata.jivoJs}
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
