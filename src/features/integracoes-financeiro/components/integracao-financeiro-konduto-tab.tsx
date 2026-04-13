'use client';

import { EditableSecretInput } from '@/src/components/form-page/editable-secret-input';
import { FieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import type { KondutoConfig, KondutoFieldMeta } from '@/src/features/integracoes-financeiro/types/integracao-financeiro.types';
import type { TranslationFn } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-clearsale-tab';

type Props = {
	konduto: KondutoConfig;
	initialValue: KondutoConfig;
	metadata: KondutoFieldMeta;
	saving: boolean;
	canEdit: boolean;
	locale: string;
	t: TranslationFn;
	chavePrivadaEditable: boolean;
	onPatch: <K extends keyof KondutoConfig>(key: K, value: KondutoConfig[K]) => void;
	onSetChavePrivadaEditable: (editable: boolean) => void;
};

export function IntegracaoFinanceiroKondutoTab({ konduto, initialValue, metadata, saving, canEdit, locale, t, chavePrivadaEditable, onPatch, onSetChavePrivadaEditable }: Props) {
	return (
		<SectionCard
			title={t('integrationsFinancial.sections.konduto.title', 'Konduto')}
			description={t('integrationsFinancial.sections.konduto.description', 'Configure credenciais e parametros de antifraude Konduto.')}
		>
			<div className="grid gap-5 lg:grid-cols-2">
				<FormField label={t('integrationsFinancial.fields.environment', 'Ambiente')}>
					<>
						<select
							className={inputClasses()}
							value={konduto.ambiente}
							onChange={(event) => onPatch('ambiente', event.target.value as KondutoConfig['ambiente'])}
							disabled={saving || !canEdit}
						>
							<option value="">{t('common.select', 'Selecione')}</option>
							<option value="producao">{t('integrationsFinancial.fields.production', 'Producao')}</option>
							<option value="teste">{t('integrationsFinancial.fields.test', 'Teste')}</option>
						</select>
						<FieldUpdateMeta
							as="span"
							metadata={metadata.ambiente}
							t={t}
							locale={locale}
							labelKey="integrationsFinancial.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="mt-1 block text-[11px] leading-4 text-slate-400"
						/>
					</>
				</FormField>
				<FormField
					label={t('integrationsFinancial.fields.publicKey', 'Chave Publica')}
					helperText={t('integrationsFinancial.helpers.publicKeyProvidedByKonduto', 'Chave Publica fornecida pela Konduto')}
				>
					<>
						<input
							type="text"
							className={inputClasses()}
							value={konduto.chavePublica}
							onChange={(event) => onPatch('chavePublica', event.target.value)}
							disabled={saving || !canEdit}
						/>
						<FieldUpdateMeta
							as="span"
							metadata={metadata.chavePublica}
							t={t}
							locale={locale}
							labelKey="integrationsFinancial.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="mt-1 block text-[11px] leading-4 text-slate-400"
						/>
					</>
				</FormField>
				<FormField
					label={t('integrationsFinancial.fields.privateKey', 'Chave Privada')}
					helperText={t('integrationsFinancial.helpers.privateKeyProvidedByKonduto', 'Chave Privada fornecida pela Konduto')}
					asLabel={false}
				>
					<EditableSecretInput
						value={konduto.chavePrivada}
						initialValue={initialValue.chavePrivada}
						editable={chavePrivadaEditable}
						saving={saving}
						canEdit={canEdit}
						metadata={metadata.chavePrivada}
						onChange={(value) => onPatch('chavePrivada', value)}
						onEnable={() => {
							onSetChavePrivadaEditable(true);
							onPatch('chavePrivada', '');
						}}
						onCancel={() => {
							onSetChavePrivadaEditable(false);
							onPatch('chavePrivada', initialValue.chavePrivada);
						}}
						t={t}
						locale={locale}
						updateLabelKey="integrationsFinancial.lastUpdateValue"
						updateFallback="Última alteração: {{date}} por {{user}}"
						changeLabelKey="integrationsFinancial.actionsLabel.changeField"
						changeFallback="Alterar"
						cancelLabelKey="integrationsFinancial.actionsLabel.cancelChange"
						cancelFallback="Cancelar alteração"
						metaClassName="mt-1 block text-[11px] leading-4 text-slate-400"
					/>
				</FormField>
			</div>
		</SectionCard>
	);
}
