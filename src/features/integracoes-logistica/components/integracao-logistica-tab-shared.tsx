'use client';

import { RefreshCcw, X } from 'lucide-react';
import { FieldUpdateMeta, formatFieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { BooleanChoice } from '@/src/components/ui/boolean-choice';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import type {
	IntegracaoLogisticaBranchMetadata,
	IntegracaoLogisticaBranchValues,
	IntegracaoLogisticaEncryptedKey,
	IntegracaoLogisticaFieldKey,
	IntegracaoLogisticaRecord,
	IntegracaoLogisticaValues,
} from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';
import { isIntegracaoLogisticaEncryptedKey } from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';
import { digitsOnly } from '@/src/lib/value-parsers';

export type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

export type TextFieldDefinition = {
	key: IntegracaoLogisticaFieldKey;
	labelKey: string;
	helperKey: string;
	fallback: string;
	placeholder?: string;
	mask?: 'cnpj';
};

export type SelectFieldDefinition = TextFieldDefinition & {
	options: Array<{ value: string; labelKey: string; fallback: string }>;
};

export type BooleanFieldDefinition = TextFieldDefinition & {
	trueValue?: string;
	falseValue?: string;
};

export const generalFields: TextFieldDefinition[] = [
	{
		key: 'link_rastreamento',
		labelKey: 'integrationsLogistics.fields.trackingLink',
		helperKey: 'integrationsLogistics.helpers.trackingLink',
		fallback: 'Link para Rastreamento',
		placeholder: 'https://www.linkpararastreamento.com',
	},
];

export const frenetFields: TextFieldDefinition[] = [
	{ key: 'frenet_token', labelKey: 'integrationsLogistics.fields.token', helperKey: 'integrationsLogistics.helpers.frenetToken', fallback: 'Token' },
	{
		key: 'frenet_token_parceiro',
		labelKey: 'integrationsLogistics.fields.partnerToken',
		helperKey: 'integrationsLogistics.helpers.frenetPartnerToken',
		fallback: 'Token Parceiro',
	},
];

export const frenetBooleans: BooleanFieldDefinition[] = [
	{
		key: 'frenet_nota_fiscal',
		labelKey: 'integrationsLogistics.fields.onlyInvoiceOrders',
		helperKey: 'integrationsLogistics.helpers.onlyInvoiceOrders',
		fallback: 'Enviar apenas pedidos com nota fiscal',
	},
];

export const frenetEnvironment: BooleanFieldDefinition = {
	key: 'frenet_ambiente',
	labelKey: 'integrationsLogistics.fields.environment',
	helperKey: 'integrationsLogistics.helpers.environment',
	fallback: 'Ambiente',
	trueValue: 'producao',
	falseValue: 'homologacao',
};

export const mandaeSelect: SelectFieldDefinition = {
	key: 'mandae_versao',
	labelKey: 'integrationsLogistics.fields.version',
	helperKey: 'integrationsLogistics.helpers.mandaeVersion',
	fallback: 'Versão',
	options: [
		{ value: '', labelKey: 'common.select', fallback: 'Selecione' },
		{ value: 'v3', labelKey: 'integrationsLogistics.options.v3', fallback: 'V3' },
		{ value: 'v4', labelKey: 'integrationsLogistics.options.v4', fallback: 'V4' },
	],
};

export const mandaeFields: TextFieldDefinition[] = [
	{ key: 'mandae_token', labelKey: 'integrationsLogistics.fields.token', helperKey: 'integrationsLogistics.helpers.mandaeToken', fallback: 'Token' },
];

export const freteRapidoFields: TextFieldDefinition[] = [
	{ key: 'freterapido_cnpj', labelKey: 'integrationsLogistics.fields.cnpj', helperKey: 'integrationsLogistics.helpers.freteRapidoCnpj', fallback: 'CNPJ', mask: 'cnpj' },
	{ key: 'freterapido_token', labelKey: 'integrationsLogistics.fields.token', helperKey: 'integrationsLogistics.helpers.freteRapidoToken', fallback: 'Token' },
	{ key: 'freterapido_plataforma', labelKey: 'integrationsLogistics.fields.platformCode', helperKey: 'integrationsLogistics.helpers.platformCode', fallback: 'Código Plataforma' },
	{ key: 'freterapido_canal', labelKey: 'integrationsLogistics.fields.channel', helperKey: 'integrationsLogistics.helpers.channel', fallback: 'Canal' },
];

export const freteRapidoBooleans: BooleanFieldDefinition[] = [
	{ key: 'freterapido_consolidar', labelKey: 'integrationsLogistics.fields.consolidate', helperKey: 'integrationsLogistics.helpers.consolidate', fallback: 'Consolidar' },
	{ key: 'freterapido_sobrepor', labelKey: 'integrationsLogistics.fields.overlay', helperKey: 'integrationsLogistics.helpers.overlay', fallback: 'Sobrepor' },
	{ key: 'freterapido_tombar', labelKey: 'integrationsLogistics.fields.tumble', helperKey: 'integrationsLogistics.helpers.tumble', fallback: 'Tombar' },
];

export const setCanhotoFields: TextFieldDefinition[] = [
	{ key: 'setcanhoto_token', labelKey: 'integrationsLogistics.fields.token', helperKey: 'integrationsLogistics.helpers.setCanhotoToken', fallback: 'Token' },
];

export const findCepFields: TextFieldDefinition[] = [
	{
		key: 'findcep_endpoint',
		labelKey: 'integrationsLogistics.fields.clientEndpoint',
		helperKey: 'integrationsLogistics.helpers.clientEndpoint',
		fallback: 'Client Endpoint',
		placeholder: 'agileecommerce.api.findcep.com',
	},
	{
		key: 'findcep_referer',
		labelKey: 'integrationsLogistics.fields.referer',
		helperKey: 'integrationsLogistics.helpers.referer',
		fallback: 'Referer',
		placeholder: '2JD84JNDT85JHT.agileecommerce.com.br',
	},
];

export const ibolttStatus: SelectFieldDefinition = {
	key: 'iboltt_status',
	labelKey: 'integrationsLogistics.fields.callStatus',
	helperKey: 'integrationsLogistics.helpers.callStatus',
	fallback: 'Status para Chamada',
	options: [
		{ value: 'faturado', labelKey: 'integrationsLogistics.options.invoicedOrder', fallback: 'Pedido Faturado' },
		{ value: 'pagamento_aprovado', labelKey: 'integrationsLogistics.options.paymentApproved', fallback: 'Pagamento Aprovado' },
		{ value: 'recebido', labelKey: 'integrationsLogistics.options.receivedOrder', fallback: 'Pedido Recebido' },
	],
};

function formatCnpj(value: string) {
	const digits = digitsOnly(value).slice(0, 14);
	return digits
		.replace(/^(\d{2})(\d)/, '$1.$2')
		.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
		.replace(/\.(\d{3})(\d)/, '.$1/$2')
		.replace(/(\d{4})(\d)/, '$1-$2');
}

function hasSecretValue(record: IntegracaoLogisticaRecord, key: IntegracaoLogisticaFieldKey) {
	return record.values[key].trim().length > 0;
}

export function branchTokenKey(branchId: string) {
	return `iboltt_token__${branchId}`;
}

type CommonProps = {
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

export function IntegracaoLogisticaTextFields({
	values,
	initialRecord,
	editableSecrets,
	saving,
	canSave,
	locale,
	t,
	onPatch,
	onSetSecretEditable,
	fields,
}: CommonProps & { fields: TextFieldDefinition[] }) {
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{fields.map((field) => {
				const encrypted = isIntegracaoLogisticaEncryptedKey(field.key);
				const hasSecret = encrypted && hasSecretValue(initialRecord, field.key);
				const secretEditable = Boolean(editableSecrets[field.key]) || !hasSecret;
				const value = field.mask === 'cnpj' ? formatCnpj(values[field.key]) : values[field.key];

				return (
					<FormField key={field.key} label={t(field.labelKey, field.fallback)} helperText={t(field.helperKey, '') || null}>
						<div className="space-y-2">
							<input
								type="text"
								className={inputClasses()}
								value={value}
								placeholder={field.placeholder}
								onChange={(event) => onPatch(field.key, field.mask === 'cnpj' ? formatCnpj(event.target.value) : event.target.value)}
								disabled={saving || !canSave || (encrypted && hasSecret && !secretEditable)}
							/>
							<FieldUpdateMeta
								as="span"
								metadata={initialRecord.metadata[field.key]}
								t={t}
								locale={locale}
								labelKey="integrationsLogistics.fields.lastUpdateValue"
								fallback="Última alteração: {{date}} por {{user}}"
								className="block text-xs text-slate-500"
							/>
							{canSave && encrypted && hasSecret ? (
								<div className="flex flex-wrap gap-2">
									{!secretEditable ? (
										<button
											type="button"
											className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
											onClick={() => onSetSecretEditable(field.key as IntegracaoLogisticaEncryptedKey, true)}
											disabled={saving}
										>
											<RefreshCcw className="h-3.5 w-3.5" />
											{t('integrationsLogistics.actions.changeSecret', 'Alterar')}
										</button>
									) : (
										<button
											type="button"
											className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
											onClick={() => onSetSecretEditable(field.key as IntegracaoLogisticaEncryptedKey, false)}
											disabled={saving}
										>
											<X className="h-3.5 w-3.5" />
											{t('integrationsLogistics.actions.cancelSecretChange', 'Cancelar alteração')}
										</button>
									)}
								</div>
							) : null}
						</div>
					</FormField>
				);
			})}
		</div>
	);
}

export function IntegracaoLogisticaSelectField({
	values,
	initialRecord,
	saving,
	canSave,
	locale,
	t,
	onPatch,
	field,
}: Omit<CommonProps, 'editableSecrets' | 'onSetSecretEditable'> & { field: SelectFieldDefinition }) {
	return (
		<FormField label={t(field.labelKey, field.fallback)} helperText={t(field.helperKey, '') || null}>
			<div className="space-y-2">
				<select className={inputClasses()} value={values[field.key]} onChange={(event) => onPatch(field.key, event.target.value)} disabled={saving || !canSave}>
					{field.options.map((option) => (
						<option key={option.value} value={option.value}>
							{t(option.labelKey, option.fallback)}
						</option>
					))}
				</select>
				<FieldUpdateMeta
					as="span"
					metadata={initialRecord.metadata[field.key]}
					t={t}
					locale={locale}
					labelKey="integrationsLogistics.fields.lastUpdateValue"
					fallback="Última alteração: {{date}} por {{user}}"
					className="block text-xs text-slate-500"
				/>
			</div>
		</FormField>
	);
}

export function IntegracaoLogisticaBooleanFields({
	values,
	initialRecord,
	saving,
	canSave,
	locale,
	t,
	onPatch,
	fields,
}: Omit<CommonProps, 'editableSecrets' | 'onSetSecretEditable'> & { fields: BooleanFieldDefinition[] }) {
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{fields.map((field) => {
				const trueValue = field.trueValue ?? '1';
				const falseValue = field.falseValue ?? '0';
				return (
					<FormField key={field.key} label={t(field.labelKey, field.fallback)} helperText={t(field.helperKey, '') || null}>
						<div className="space-y-2">
							<BooleanChoice
								value={values[field.key] === trueValue}
								onChange={(value) => onPatch(field.key, value ? trueValue : falseValue)}
								disabled={saving || !canSave}
								trueLabel={field.key === 'frenet_ambiente' ? t('integrationsLogistics.options.production', 'Produção') : t('common.yes', 'Sim')}
								falseLabel={field.key === 'frenet_ambiente' ? t('integrationsLogistics.options.sandbox', 'Homologação') : t('common.no', 'Não')}
							/>
							<FieldUpdateMeta
								as="span"
								metadata={initialRecord.metadata[field.key]}
								t={t}
								locale={locale}
								labelKey="integrationsLogistics.fields.lastUpdateValue"
								fallback="Última alteração: {{date}} por {{user}}"
								className="block text-xs text-slate-500"
							/>
						</div>
					</FormField>
				);
			})}
		</div>
	);
}

type IbolttProps = {
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

export function IntegracaoLogisticaIbolttTable({
	values,
	initialRecord,
	branchValues,
	editableSecrets,
	saving,
	canSave,
	locale,
	t,
	onPatch,
	onPatchBranch,
	onSetBranchTokenEditable,
}: IbolttProps) {
	return (
		<div className="space-y-5">
			<div className="app-table-shell overflow-x-auto rounded-[1.1rem]">
				<table className="min-w-full border-separate border-spacing-0 text-sm">
					<thead className="app-table-muted text-left text-xs font-semibold uppercase tracking-wide text-(--app-text-muted)">
						<tr className="bg-transparent">
							<th className="px-4 py-3">{t('integrationsLogistics.iboltt.branch', 'Filial')}</th>
							<th className="px-4 py-3">{t('integrationsLogistics.iboltt.companyId', 'ID da Empresa')}</th>
							<th className="px-4 py-3">{t('integrationsLogistics.iboltt.token', 'Token')}</th>
							<th className="px-4 py-3">{t('integrationsLogistics.iboltt.lastUpdate', 'Última alteração')}</th>
						</tr>
					</thead>
					<tbody className="bg-(--app-panel-solid)">
						{initialRecord.branches.length ? (
							initialRecord.branches.map((branch) => {
								const tokenKey = branchTokenKey(branch.id);
								const branchValue = branchValues[branch.id] ?? { companyId: '', token: '' };
								const branchMeta: IntegracaoLogisticaBranchMetadata[string] = initialRecord.branchMetadata[branch.id] ?? {
									companyId: { updatedAt: '', updatedBy: '' },
									token: { updatedAt: '', updatedBy: '' },
								};
								const hasToken = (initialRecord.branchValues[branch.id]?.token ?? '').trim().length > 0;
								const tokenEditable = Boolean(editableSecrets[tokenKey]) || !hasToken;

								return (
									<tr key={branch.id} className="app-table-row-hover align-top">
										<td className="border-t border-line bg-transparent px-4 py-3 font-medium text-(--app-text)">
											{branch.name} - {branch.id}
										</td>
										<td className="border-t border-line bg-transparent px-4 py-3">
											<input
												className={inputClasses()}
												value={branchValue.companyId}
												onChange={(event) => onPatchBranch(branch.id, 'companyId', event.target.value)}
												disabled={saving || !canSave}
											/>
										</td>
										<td className="border-t border-line bg-transparent px-4 py-3">
											<div className="space-y-2">
												<input
													className={inputClasses()}
													value={branchValue.token}
													onChange={(event) => onPatchBranch(branch.id, 'token', event.target.value)}
													disabled={saving || !canSave || (hasToken && !tokenEditable)}
												/>
												{canSave && hasToken ? (
													!tokenEditable ? (
														<button
															type="button"
															className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
															onClick={() => onSetBranchTokenEditable(branch.id, true)}
															disabled={saving}
														>
															<RefreshCcw className="h-3.5 w-3.5" />
															{t('integrationsLogistics.actions.changeSecret', 'Alterar')}
														</button>
													) : (
														<button
															type="button"
															className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
															onClick={() => onSetBranchTokenEditable(branch.id, false)}
															disabled={saving}
														>
															<X className="h-3.5 w-3.5" />
															{t('integrationsLogistics.actions.cancelSecretChange', 'Cancelar alteração')}
														</button>
													)
												) : null}
											</div>
										</td>
										<td className="border-t border-line bg-transparent px-4 py-3 text-xs text-(--app-text-muted)">
											{formatFieldUpdateMeta({
												metadata: branchMeta.companyId,
												t,
												locale,
												labelKey: 'integrationsLogistics.fields.lastUpdateValue',
												fallback: 'Última alteração: {{date}} por {{user}}',
											})}
										</td>
									</tr>
								);
							})
						) : (
							<tr className="bg-transparent">
								<td colSpan={4} className="border-t border-line bg-transparent px-4 py-6 text-center text-sm text-(--app-text-muted)">
									{t('integrationsLogistics.iboltt.empty', 'Nenhuma filial encontrada.')}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			<p className="text-xs text-(--app-text-muted)">{t('integrationsLogistics.helpers.ibolttBranchCredentials', 'ID da empresa e token de integração fornecidos pelo IBoltt.')}</p>
			<IntegracaoLogisticaSelectField
				values={values}
				initialRecord={initialRecord}
				saving={saving}
				canSave={canSave}
				locale={locale}
				t={t}
				onPatch={onPatch}
				field={ibolttStatus}
			/>
		</div>
	);
}
