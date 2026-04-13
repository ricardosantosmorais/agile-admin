'use client';

import { EditableSecretInput } from '@/src/components/form-page/editable-secret-input';
import type { FieldUpdateMetadata } from '@/src/components/form-page/field-update-meta';
import { FormField } from '@/src/components/ui/form-field';
import { SectionCard } from '@/src/components/ui/section-card';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type Props = {
	value: string;
	initialValue: string;
	editable: boolean;
	saving: boolean;
	canEdit: boolean;
	metadata: FieldUpdateMetadata;
	locale: string;
	onChange: (value: string) => void;
	onEnable: () => void;
	onCancel: () => void;
	t: TranslationFn;
};

export function IntegracaoClientesCnpjaTab({ value, initialValue, editable, saving, canEdit, metadata, locale, onChange, onEnable, onCancel, t }: Props) {
	return (
		<SectionCard
			title={t('integrationsClients.sections.cnpja.title', 'Consulta de Dados Cadastrais - CNPJá')}
			description={t('integrationsClients.sections.cnpja.description', 'Configurações de integração com a CNPJá para consulta de dados cadastrais na Receita Federal e Sintegra.')}
		>
			<div className="max-w-lg">
				<FormField label={t('integrationsClients.fields.token', 'Token')} helperText={t('integrationsClients.fields.tokenHelper', 'Token fornecido pelo CNPJá')} asLabel={false}>
					<EditableSecretInput
						value={value}
						initialValue={initialValue}
						editable={editable}
						saving={saving}
						canEdit={canEdit}
						metadata={metadata}
						onChange={onChange}
						locale={locale}
						onEnable={onEnable}
						onCancel={onCancel}
						t={t}
						updateLabelKey="integrationsClients.lastUpdateValue"
						updateFallback="Última alteração: {{date}} por {{user}}"
						changeLabelKey="integrationsClients.actionsLabel.changeField"
						changeFallback="Alterar"
						cancelLabelKey="integrationsClients.actionsLabel.cancelChange"
						cancelFallback="Cancelar alteração"
						metaClassName="mt-1 block text-[11px] leading-4 text-slate-400"
					/>
				</FormField>
			</div>
		</SectionCard>
	);
}
