'use client';

import { RefreshCcw, X } from 'lucide-react';
import { FieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { BooleanChoice } from '@/src/components/ui/boolean-choice';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import {
	isIntegracaoMarketingEncryptedKey,
	type IntegracaoMarketingFieldKey,
	type IntegracaoMarketingRecord,
	type IntegracaoMarketingValues,
} from '@/src/features/marketing/services/integracao-marketing-mappers';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

export type MarketingTextFieldDefinition = {
	key: IntegracaoMarketingFieldKey;
	labelKey: string;
	helperKey: string;
	placeholder?: string;
	readOnly?: boolean;
	allowSecretEdit?: boolean;
};

export type MarketingBooleanFieldDefinition = {
	key: IntegracaoMarketingFieldKey;
	labelKey: string;
};

type SharedProps = {
	values: IntegracaoMarketingValues;
	initialRecord: IntegracaoMarketingRecord;
	editableSecrets: Record<string, boolean>;
	saving: boolean;
	canSave: boolean;
	locale: string;
	t: TranslationFn;
	patch: (key: IntegracaoMarketingFieldKey, value: string) => void;
	setSecretEditable: (key: IntegracaoMarketingFieldKey, editable: boolean) => void;
};

export const googleFields: MarketingTextFieldDefinition[] = [
	{ key: 'ga3', labelKey: 'integrationsMarketing.fields.ga3', helperKey: 'integrationsMarketing.helpers.ga3', placeholder: 'UA-XXXXXXX-X' },
	{ key: 'ga4', labelKey: 'integrationsMarketing.fields.ga4', helperKey: 'integrationsMarketing.helpers.ga4', placeholder: 'G-XXXXXXXXXX' },
	{ key: 'ga4_ios', labelKey: 'integrationsMarketing.fields.ga4Ios', helperKey: 'integrationsMarketing.helpers.ga4Mobile', placeholder: 'G-XXXXXXXXXX' },
	{ key: 'ga4_android', labelKey: 'integrationsMarketing.fields.ga4Android', helperKey: 'integrationsMarketing.helpers.ga4Mobile', placeholder: 'G-XXXXXXXXXX' },
	{ key: 'gtm', labelKey: 'integrationsMarketing.fields.gtm', helperKey: 'integrationsMarketing.helpers.gtm', placeholder: 'GTM-XXXXXXX' },
	{
		key: 'ga_conversion',
		labelKey: 'integrationsMarketing.fields.gaConversion',
		helperKey: 'integrationsMarketing.helpers.gaConversion',
		placeholder: 'AW-XXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXX',
	},
	{
		key: 'ga_conversion_cadastro',
		labelKey: 'integrationsMarketing.fields.gaConversionRegister',
		helperKey: 'integrationsMarketing.helpers.gaConversionRegister',
		placeholder: 'AW-XXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXX',
	},
	{ key: 'gverify', labelKey: 'integrationsMarketing.fields.gverify', helperKey: 'integrationsMarketing.helpers.gverify' },
];

export const facebookFields: MarketingTextFieldDefinition[] = [
	{ key: 'fb_pixel', labelKey: 'integrationsMarketing.fields.fbPixel', helperKey: 'integrationsMarketing.helpers.fbPixel' },
	{ key: 'fb_token', labelKey: 'integrationsMarketing.fields.fbToken', helperKey: 'integrationsMarketing.helpers.fbToken' },
	{ key: 'fb_verify', labelKey: 'integrationsMarketing.fields.fbVerify', helperKey: 'integrationsMarketing.helpers.fbVerify' },
];

export const rdEcomFields: MarketingTextFieldDefinition[] = [
	{ key: 'rd_ecom_client_id', labelKey: 'integrationsMarketing.fields.rdEcomClientId', helperKey: 'integrationsMarketing.helpers.rdEcomClientId' },
	{ key: 'rd_ecom_client_secret', labelKey: 'integrationsMarketing.fields.rdEcomClientSecret', helperKey: 'integrationsMarketing.helpers.rdEcomClientSecret' },
	{
		key: 'rd_ecom_refresh_token',
		labelKey: 'integrationsMarketing.fields.rdEcomRefreshToken',
		helperKey: 'integrationsMarketing.helpers.rdEcomRefreshToken',
		readOnly: true,
		allowSecretEdit: false,
	},
];

export const rdLegacyFields: MarketingTextFieldDefinition[] = [
	{
		key: 'rd_js',
		labelKey: 'integrationsMarketing.fields.rdJs',
		helperKey: 'integrationsMarketing.helpers.rdJs',
		placeholder: 'https://id.cloudfront.net/js/loader-scripts/id-loader.js',
	},
	{ key: 'rd_client_id', labelKey: 'integrationsMarketing.fields.rdClientId', helperKey: 'integrationsMarketing.helpers.rdClientId' },
	{ key: 'rd_client_secret', labelKey: 'integrationsMarketing.fields.rdClientSecret', helperKey: 'integrationsMarketing.helpers.rdClientSecret' },
	{ key: 'rd_code', labelKey: 'integrationsMarketing.fields.rdCode', helperKey: 'integrationsMarketing.helpers.rdCode' },
	{ key: 'rd_refresh_token', labelKey: 'integrationsMarketing.fields.rdRefreshToken', helperKey: 'integrationsMarketing.helpers.rdRefreshToken' },
];

export const egoiFields: MarketingTextFieldDefinition[] = [
	{
		key: 'egoi_js',
		labelKey: 'integrationsMarketing.fields.egoiJs',
		helperKey: 'integrationsMarketing.helpers.egoiJs',
		placeholder: 'https://egoi.site/1234567_seusite.com.br.js',
	},
	{ key: 'egoi_id', labelKey: 'integrationsMarketing.fields.egoiId', helperKey: 'integrationsMarketing.helpers.egoiId', placeholder: '1234567' },
	{ key: 'egoi_api_key', labelKey: 'integrationsMarketing.fields.egoiApiKey', helperKey: 'integrationsMarketing.helpers.egoiApiKey' },
	{ key: 'egoi_domain', labelKey: 'integrationsMarketing.fields.egoiDomain', helperKey: 'integrationsMarketing.helpers.egoiDomain' },
	{ key: 'egoi_lista_id', labelKey: 'integrationsMarketing.fields.egoiListId', helperKey: 'integrationsMarketing.helpers.egoiListId' },
];

export const rdEcomEvents: MarketingBooleanFieldDefinition[] = [
	{ key: 'rd_ecom_checkout_started', labelKey: 'integrationsMarketing.events.checkoutStarted' },
	{ key: 'rd_ecom_cart_abandoned', labelKey: 'integrationsMarketing.events.cartAbandoned' },
	{ key: 'rd_ecom_order_placed', labelKey: 'integrationsMarketing.events.orderPlaced' },
	{ key: 'rd_ecom_order_paid', labelKey: 'integrationsMarketing.events.orderPaid' },
	{ key: 'rd_ecom_order_canceled', labelKey: 'integrationsMarketing.events.orderCanceled' },
	{ key: 'rd_ecom_order_refunded', labelKey: 'integrationsMarketing.events.orderRefunded' },
	{ key: 'rd_ecom_order_fulfilled', labelKey: 'integrationsMarketing.events.orderFulfilled' },
	{ key: 'rd_ecom_shipment_delivered', labelKey: 'integrationsMarketing.events.shipmentDelivered' },
];

export const rdLegacyEvents: MarketingBooleanFieldDefinition[] = [
	{ key: 'rd_ativacao', labelKey: 'integrationsMarketing.events.customerActivation' },
	{ key: 'rd_cliente', labelKey: 'integrationsMarketing.events.customerRegister' },
	{ key: 'rd_contato', labelKey: 'integrationsMarketing.events.contactRegister' },
	{ key: 'rd_newsletter', labelKey: 'integrationsMarketing.events.newsletterRegister' },
	{ key: 'rd_carrinho', labelKey: 'integrationsMarketing.events.cartAbandoned' },
	{ key: 'rd_pedido', labelKey: 'integrationsMarketing.events.orderReceived' },
];

export const egoiEvents: MarketingBooleanFieldDefinition[] = [
	{ key: 'egoi_ativacao', labelKey: 'integrationsMarketing.events.customerActivation' },
	{ key: 'egoi_cliente', labelKey: 'integrationsMarketing.events.customerRegister' },
	{ key: 'egoi_contato', labelKey: 'integrationsMarketing.events.contactRegister' },
	{ key: 'egoi_newsletter', labelKey: 'integrationsMarketing.events.newsletterRegister' },
	{ key: 'egoi_carrinho', labelKey: 'integrationsMarketing.events.cartOrder' },
	{ key: 'egoi_pedido', labelKey: 'integrationsMarketing.events.orderReceived' },
];

function hasSecretValue(record: IntegracaoMarketingRecord, key: IntegracaoMarketingFieldKey) {
	return record.values[key].trim().length > 0;
}

export function MarketingTextFieldsGrid({
	fields,
	values,
	initialRecord,
	editableSecrets,
	saving,
	canSave,
	locale,
	t,
	patch,
	setSecretEditable,
}: SharedProps & { fields: MarketingTextFieldDefinition[] }) {
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{fields.map((field) => {
				const encrypted = isIntegracaoMarketingEncryptedKey(field.key);
				const hasSecret = encrypted && hasSecretValue(initialRecord, field.key);
				const secretEditable = Boolean(editableSecrets[field.key]) || !hasSecret;
				const canManuallyEditSecret = field.allowSecretEdit ?? true;
				const helperText = t(field.helperKey, '');

				return (
					<FormField key={field.key} label={t(field.labelKey, field.key)} helperText={null}>
						<div className="space-y-2">
							<input
								type="text"
								className={inputClasses()}
								value={values[field.key]}
								onChange={(event) => patch(field.key, event.target.value)}
								disabled={saving || !canSave || (encrypted && hasSecret && !secretEditable)}
								readOnly={field.readOnly}
								placeholder={field.placeholder}
							/>
							{helperText ? <span className="block whitespace-pre-line text-xs text-slate-500">{helperText}</span> : null}
							<FieldUpdateMeta
								as="span"
								metadata={initialRecord.metadata[field.key]}
								t={t}
								locale={locale}
								labelKey="integrationsMarketing.fields.lastUpdateValue"
								fallback="Última alteração: {{date}} por {{user}}"
								className="block text-xs text-slate-500"
							/>
							{canSave && encrypted && hasSecret && canManuallyEditSecret ? (
								<div className="flex flex-wrap gap-2">
									{!secretEditable ? (
										<button
											type="button"
											className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
											onClick={() => setSecretEditable(field.key, true)}
											disabled={saving}
										>
											<RefreshCcw className="h-3.5 w-3.5" />
											{t('integrationsMarketing.actions.changeSecret', 'Alterar')}
										</button>
									) : (
										<button
											type="button"
											className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
											onClick={() => setSecretEditable(field.key, false)}
											disabled={saving}
										>
											<X className="h-3.5 w-3.5" />
											{t('integrationsMarketing.actions.cancelSecretChange', 'Cancelar alteração')}
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

export function MarketingBooleanGrid({
	fields,
	values,
	initialRecord,
	saving,
	canSave,
	locale,
	t,
	patch,
}: Omit<SharedProps, 'editableSecrets' | 'setSecretEditable'> & { fields: MarketingBooleanFieldDefinition[] }) {
	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{fields.map((field) => (
				<div key={field.key} className="app-pane-muted rounded-2xl p-4">
					<p className="mb-3 text-sm font-semibold text-(--app-text)">{t(field.labelKey, field.key)}</p>
					<BooleanChoice
						value={values[field.key] === 'true'}
						onChange={(nextValue) => patch(field.key, nextValue ? 'true' : 'false')}
						disabled={saving || !canSave}
						trueLabel={t('common.yes', 'Sim')}
						falseLabel={t('common.no', 'Não')}
					/>
					<FieldUpdateMeta
						as="span"
						metadata={initialRecord.metadata[field.key]}
						t={t}
						locale={locale}
						labelKey="integrationsMarketing.fields.lastUpdateValue"
						fallback="Última alteração: {{date}} por {{user}}"
						className="mt-3 block text-xs text-slate-500"
					/>
				</div>
			))}
		</div>
	);
}
