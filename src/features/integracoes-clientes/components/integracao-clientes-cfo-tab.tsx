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

export function IntegracaoClientesCfoTab({ value, initialValue, editable, saving, canEdit, metadata, locale, onChange, onEnable, onCancel, t }: Props) {
	return (
		<SectionCard
			title={t('integrationsClients.sections.cfo.title', 'CFO (Conselho Federal de Odontologia)')}
			description={t('integrationsClients.sections.cfo.description', 'Configurações da API do CFO para consulta de profissionais odontológicos.')}
		>
			<div className="mb-5 max-w-3xl rounded-[1.1rem] border border-line bg-(--app-surface-muted) p-4 text-sm leading-6 text-(--app-text-muted)">
				<p className="font-semibold text-(--app-text)">{t('integrationsClients.sections.cfo.instructionsTitle', 'Instruções de uso da integração CFO')}</p>
				<p className="mt-2">
					{t(
						'integrationsClients.sections.cfo.instructions',
						'Requer a criação de dois campos obrigatórios nos formulários de cadastro: numero_cro (título Número de Registro CRO, tipo inteiro com tamanho 5) e uf_cro (título UF Registro CRO, campo seletor de UF).',
					)}
				</p>
			</div>
			<div className="max-w-lg">
				<FormField label={t('integrationsClients.fields.cfoApiKey', 'API Key')} helperText={t('integrationsClients.fields.cfoApiKeyHelper', 'Chave de acesso da API do CFO')} asLabel={false}>
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
