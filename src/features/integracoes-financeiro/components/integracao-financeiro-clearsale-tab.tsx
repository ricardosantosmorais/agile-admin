'use client';

import { EditableSecretInput } from '@/src/components/form-page/editable-secret-input';
import { FieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import type { ClearSaleConfig, ClearSaleFieldMeta } from '@/src/features/integracoes-financeiro/types/integracao-financeiro.types';

export type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type Props = {
	clearSale: ClearSaleConfig;
	initialValue: ClearSaleConfig;
	metadata: ClearSaleFieldMeta;
	saving: boolean;
	canEdit: boolean;
	locale: string;
	t: TranslationFn;
	senhaEditable: boolean;
	onPatch: <K extends keyof ClearSaleConfig>(key: K, value: ClearSaleConfig[K]) => void;
	onSetSenhaEditable: (editable: boolean) => void;
};

export function IntegracaoFinanceiroClearsaleTab({ clearSale, initialValue, metadata, saving, canEdit, locale, t, senhaEditable, onPatch, onSetSenhaEditable }: Props) {
	return (
		<SectionCard
			title={t('integrationsFinancial.sections.clearsale.title', 'ClearSale')}
			description={t('integrationsFinancial.sections.clearsale.description', 'Configure credenciais e parametros de antifraude ClearSale.')}
		>
			<div className="grid gap-5 lg:grid-cols-2">
				<FormField label={t('integrationsFinancial.fields.environment', 'Ambiente')}>
					<>
						<select
							className={inputClasses()}
							value={clearSale.ambiente}
							onChange={(event) => onPatch('ambiente', event.target.value as ClearSaleConfig['ambiente'])}
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
					label={t('integrationsFinancial.fields.login', 'Login')}
					helperText={t('integrationsFinancial.helpers.loginProvidedByClearsale', 'Login fornecido pela ClearSale')}
				>
					<>
						<input type="text" className={inputClasses()} value={clearSale.login} onChange={(event) => onPatch('login', event.target.value)} disabled={saving || !canEdit} />
						<FieldUpdateMeta
							as="span"
							metadata={metadata.login}
							t={t}
							locale={locale}
							labelKey="integrationsFinancial.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="mt-1 block text-[11px] leading-4 text-slate-400"
						/>
					</>
				</FormField>
				<FormField
					label={t('integrationsFinancial.fields.password', 'Senha')}
					helperText={t('integrationsFinancial.helpers.passwordProvidedByClearsale', 'Senha fornecida pela ClearSale')}
					asLabel={false}
				>
					<EditableSecretInput
						value={clearSale.senha}
						initialValue={initialValue.senha}
						editable={senhaEditable}
						saving={saving}
						canEdit={canEdit}
						metadata={metadata.senha}
						onChange={(value) => onPatch('senha', value)}
						onEnable={() => {
							onSetSenhaEditable(true);
							onPatch('senha', '');
						}}
						onCancel={() => {
							onSetSenhaEditable(false);
							onPatch('senha', initialValue.senha);
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
				<FormField
					label={t('integrationsFinancial.fields.fingerprint', 'Fingerprint')}
					helperText={t('integrationsFinancial.helpers.fingerprintProvidedByClearsale', 'Fingerprint (seu_app) fornecido pela ClearSale')}
				>
					<>
						<input
							type="text"
							className={inputClasses()}
							value={clearSale.fingerprint}
							onChange={(event) => onPatch('fingerprint', event.target.value)}
							disabled={saving || !canEdit}
						/>
						<FieldUpdateMeta
							as="span"
							metadata={metadata.fingerprint}
							t={t}
							locale={locale}
							labelKey="integrationsFinancial.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="mt-1 block text-[11px] leading-4 text-slate-400"
						/>
					</>
				</FormField>
				<FormField
					label={t('integrationsFinancial.fields.operationMode', 'Modo de Operacao')}
					helperText={t('integrationsFinancial.helpers.operationModeBb2B2c', 'Se o contrato com a ClearSale foi para B2B ou B2C')}
				>
					<>
						<select
							className={inputClasses()}
							value={clearSale.modoBb2B2c}
							onChange={(event) => onPatch('modoBb2B2c', event.target.value as ClearSaleConfig['modoBb2B2c'])}
							disabled={saving || !canEdit}
						>
							<option value="">{t('common.select', 'Selecione')}</option>
							<option value="B2B">B2B</option>
							<option value="B2C">B2C</option>
						</select>
						<FieldUpdateMeta
							as="span"
							metadata={metadata.modoBb2B2c}
							t={t}
							locale={locale}
							labelKey="integrationsFinancial.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="mt-1 block text-[11px] leading-4 text-slate-400"
						/>
					</>
				</FormField>
				<FormField
					label={t('integrationsFinancial.fields.customSla', 'Custom SLA (minutos)')}
					helperText={t('integrationsFinancial.helpers.customSlaMinutes', 'Tempo de SLA em minutos contratado com a ClearSale')}
				>
					<>
						<input
							type="number"
							min="0"
							className={inputClasses()}
							value={clearSale.customSla}
							onChange={(event) => onPatch('customSla', event.target.value)}
							disabled={saving || !canEdit}
						/>
						<FieldUpdateMeta
							as="span"
							metadata={metadata.customSla}
							t={t}
							locale={locale}
							labelKey="integrationsFinancial.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="mt-1 block text-[11px] leading-4 text-slate-400"
						/>
					</>
				</FormField>
				<FormField
					label={t('integrationsFinancial.fields.sendPixOrders', 'Envia Pedidos em PIX')}
					helperText={t('integrationsFinancial.helpers.sendPixOrdersDescription', 'Se deve enviar pedidos realizados em PIX para registro de comportamento do cliente')}
				>
					<>
						<select
							className={inputClasses()}
							value={clearSale.enviaPix}
							onChange={(event) => onPatch('enviaPix', event.target.value as ClearSaleConfig['enviaPix'])}
							disabled={saving || !canEdit}
						>
							<option value="">{t('common.select', 'Selecione')}</option>
							<option value="S">{t('common.yes', 'Sim')}</option>
							<option value="N">{t('common.no', 'Nao')}</option>
						</select>
						<FieldUpdateMeta
							as="span"
							metadata={metadata.enviaPix}
							t={t}
							locale={locale}
							labelKey="integrationsFinancial.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="mt-1 block text-[11px] leading-4 text-slate-400"
						/>
					</>
				</FormField>
			</div>
		</SectionCard>
	);
}
