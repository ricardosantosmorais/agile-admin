'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { useI18n } from '@/src/i18n/use-i18n';
import { integracaoSegurancaClient } from '../services/integracao-seguranca-client';
import { createEmptyIntegracaoSegurancaRecord, type SegurancaValues } from '../services/integracao-seguranca-mappers';

type SegurancaContext = {
	hasV3Secret: boolean;
	hasV2Secret: boolean;
};

export function IntegracaoSegurancaPage() {
	const { t } = useI18n();
	const fieldDefinitions = useMemo(
		(): Array<{
			key: keyof SegurancaValues;
			section: string;
			type: 'text' | 'secret';
			label: string;
			helper: string;
			layoutClassName: string;
		}> => [
			{
				key: 'recaptchaV3Key',
				section: 'recaptchaV3',
				type: 'text',
				label: t('integrationsSecurity.fields.siteKey', 'Chave de Site'),
				helper: t('integrationsSecurity.fields.siteKeyHelper', 'Chave de site que fica no código HTML que o site fornece aos usuários'),
				layoutClassName: 'md:col-span-2 xl:col-span-3',
			},
			{
				key: 'recaptchaV3Secret',
				section: 'recaptchaV3',
				type: 'secret',
				label: t('integrationsSecurity.fields.secretKey', 'Chave Secreta'),
				helper: t('integrationsSecurity.fields.secretKeyHelper', 'Chave secreta para comunicação entre o site e o reCAPTCHA'),
				layoutClassName: 'md:col-span-2 xl:col-span-3',
			},
			{
				key: 'recaptchaV2Key',
				section: 'recaptchaV2',
				type: 'text',
				label: t('integrationsSecurity.fields.siteKey', 'Chave de Site'),
				helper: t('integrationsSecurity.fields.siteKeyHelper', 'Chave de site que fica no código HTML que o site fornece aos usuários'),
				layoutClassName: 'md:col-span-2 xl:col-span-3',
			},
			{
				key: 'recaptchaV2Secret',
				section: 'recaptchaV2',
				type: 'secret',
				label: t('integrationsSecurity.fields.secretKey', 'Chave Secreta'),
				helper: t('integrationsSecurity.fields.secretKeyHelper', 'Chave secreta para comunicação entre o site e o reCAPTCHA'),
				layoutClassName: 'md:col-span-2 xl:col-span-3',
			},
		],
		[t],
	);

	const sectionOrder = useMemo(
		() => [
			{
				key: 'recaptchaV3',
				title: t('integrationsSecurity.sections.recaptchaV3.title', 'reCAPTCHA V3'),
				description: t('integrationsSecurity.sections.recaptchaV3.description', 'Configurações de integração com o Google reCAPTCHA V3'),
			},
			{
				key: 'recaptchaV2',
				title: t('integrationsSecurity.sections.recaptchaV2.title', 'reCAPTCHA V2'),
				description: t('integrationsSecurity.sections.recaptchaV2.description', 'Configurações de integração com o Google reCAPTCHA V2'),
			},
		],
		[t],
	);

	return (
		<ParameterFormPageBase<SegurancaValues, Record<string, never>, SegurancaContext>
			featureKey="integracoesSeguranca"
			moduleTitle={t('integrationsSecurity.title', 'Segurança')}
			modulePath="/integracoes/seguranca"
			moduleSectionTitle={t('menuKeys.integracoes', 'Integrações')}
			moduleSectionPath="/integracoes"
			backHref="/dashboard"
			moduleDescription={t('integrationsSecurity.description', 'Gerencie as integrações de segurança da empresa ativa.')}
			contextTitle={t('integrationsSecurity.contextTitle', 'Escopo')}
			contextValue={t('integrationsSecurity.contextValue', 'Parâmetros globais de proteção e validação')}
			contextDescription={t(
				'integrationsSecurity.contextDescription',
				'Essas credenciais são usadas pelo tenant ativo para validações anti-bot e proteção de formulários públicos.',
			)}
			loadErrorMessage={t('integrationsSecurity.feedback.loadError', 'Não foi possível carregar as configurações.')}
			saveErrorMessage={t('integrationsSecurity.feedback.saveError', 'Não foi possível salvar as configurações.')}
			saveSuccessMessage={t('integrationsSecurity.feedback.saveSuccess', 'Configurações salvas com sucesso.')}
			fieldDefinitions={fieldDefinitions}
			sectionOrder={sectionOrder}
			createEmptyValues={() => createEmptyIntegracaoSegurancaRecord().values}
			emptyLookups={{}}
			client={{
				get: async () => {
					const record = await integracaoSegurancaClient.get();
					return {
						values: record.values,
						metadata: record.metadata,
						context: {
							hasV3Secret: record.hasV3Secret,
							hasV2Secret: record.hasV2Secret,
						},
					};
				},
				save: (initialValues, currentValues, context) =>
					integracaoSegurancaClient.save(currentValues, {
						includeV3Key: currentValues.recaptchaV3Key !== initialValues.recaptchaV3Key,
						includeV2Key: currentValues.recaptchaV2Key !== initialValues.recaptchaV2Key,
						includeV3Secret: (currentValues.recaptchaV3Secret !== initialValues.recaptchaV3Secret || !context?.hasV3Secret) && currentValues.recaptchaV3Secret.trim().length > 0,
						includeV2Secret: (currentValues.recaptchaV2Secret !== initialValues.recaptchaV2Secret || !context?.hasV2Secret) && currentValues.recaptchaV2Secret.trim().length > 0,
					}),
			}}
		/>
	);
}
