'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { integracaoLoginSocialClient } from '@/src/features/login-social/services/integracao-login-social-client';
import {
	buildIntegracaoLoginSocialRedirectUrl,
	createEmptyIntegracaoLoginSocialRecord,
	type IntegracaoLoginSocialEncryptedKey,
	type IntegracaoLoginSocialRecord,
	type IntegracaoLoginSocialValues,
} from '@/src/features/login-social/services/integracao-login-social-mappers';
import { useI18n } from '@/src/i18n/use-i18n';

function buildInstructionSteps(sectionKey: string, t: ReturnType<typeof useI18n>['t']) {
	if (sectionKey === 'google') {
		return [
			t('integrationsLoginSocial.instructions.googleStep1', 'Crie um novo projeto ou selecione um existente.'),
			t('integrationsLoginSocial.instructions.googleStep2', 'Vá até Credenciais.'),
			t('integrationsLoginSocial.instructions.googleStep3', 'Clique em Criar credenciais e selecione ID do Cliente OAuth.'),
			t('integrationsLoginSocial.instructions.googleStep4', 'Selecione o tipo Aplicativo da Web.'),
			t('integrationsLoginSocial.instructions.googleStep5', 'Adicione a URI de redirecionamento autorizada abaixo.'),
			t('integrationsLoginSocial.instructions.googleStep6', 'Copie o Client ID e o Client Secret e adicione nos campos acima.'),
		];
	}

	return [
		t('integrationsLoginSocial.instructions.facebookStep1', 'Clique em Criar APP.'),
		t('integrationsLoginSocial.instructions.facebookStep2', 'Escolha o tipo Consumidor ou Outro.'),
		t('integrationsLoginSocial.instructions.facebookStep3', 'Dê um nome para o app e clique em Criar.'),
		t('integrationsLoginSocial.instructions.facebookStep4', 'Vá até Facebook Login e Configurações.'),
		t('integrationsLoginSocial.instructions.facebookStep5', 'Adicione a URL de redirecionamento abaixo.'),
		t('integrationsLoginSocial.instructions.facebookStep6', 'Vá para Configurações > Básico, copie o APP ID e o APP Secret e adicione nos campos acima.'),
	];
}

export function IntegracaoLoginSocialPage() {
	const { t } = useI18n();

	const fieldDefinitions = useMemo(
		() => [
			{ key: 'g_id_aplicacao' as const, section: 'google' as const, type: 'text' as const, label: t('integrationsLoginSocial.fields.applicationId', 'ID da Aplicação') },
			{
				key: 'g_senha_aplicacao' as const,
				section: 'google' as const,
				type: 'secret' as const,
				label: t('integrationsLoginSocial.fields.applicationSecret', 'Senha da Aplicação'),
			},
			{ key: 'fb_id_aplicacao' as const, section: 'facebook' as const, type: 'text' as const, label: t('integrationsLoginSocial.fields.applicationId', 'ID da Aplicação') },
			{
				key: 'fb_senha_aplicacao' as const,
				section: 'facebook' as const,
				type: 'secret' as const,
				label: t('integrationsLoginSocial.fields.applicationSecret', 'Senha da Aplicação'),
			},
		],
		[t],
	);

	const sectionOrder = useMemo(
		() => [
			{
				key: 'google',
				title: t('integrationsLoginSocial.sections.google.title', 'Google'),
				description: t('integrationsLoginSocial.sections.google.description', 'Configurações de login com o Google.'),
			},
			{
				key: 'facebook',
				title: t('integrationsLoginSocial.sections.facebook.title', 'Facebook'),
				description: t('integrationsLoginSocial.sections.facebook.description', 'Configurações de login com o Facebook.'),
			},
		],
		[t],
	);

	return (
		<ParameterFormPageBase<IntegracaoLoginSocialValues, Record<string, never>, undefined>
			featureKey="integracoesLoginSocial"
			moduleTitle={t('integrationsLoginSocial.title', 'Login Social')}
			modulePath="/integracoes/login-social"
			moduleSectionTitle={t('menuKeys.integracoes', 'Integrações')}
			moduleSectionPath="/integracoes"
			backHref="/dashboard"
			moduleDescription={t('integrationsLoginSocial.description', 'Configure credenciais de login social com Google e Facebook para a empresa ativa.')}
			contextTitle={t('integrationsLoginSocial.contextTitle', 'Escopo')}
			contextValue={t('integrationsLoginSocial.contextValue', 'Parâmetros globais de autenticação social')}
			contextDescription={t(
				'integrationsLoginSocial.contextDescription',
				'Essas credenciais permitem autenticação com Google e Facebook no tenant ativo, seguindo o callback configurado na URL pública da loja.',
			)}
			loadErrorMessage={t('integrationsLoginSocial.feedback.loadError', 'Não foi possível carregar as configurações de login social.')}
			saveErrorMessage={t('integrationsLoginSocial.feedback.saveError', 'Não foi possível salvar as configurações de login social.')}
			saveSuccessMessage={t('integrationsLoginSocial.feedback.saveSuccess', 'Configurações de login social salvas com sucesso.')}
			fieldDefinitions={fieldDefinitions}
			sectionOrder={sectionOrder}
			renderSectionContent={(section, values) => {
				const redirectUrl = buildIntegracaoLoginSocialRedirectUrl(values.url_site);
				const isGoogle = section.key === 'google';
				const accessUrl = isGoogle ? 'https://console.cloud.google.com/apis/credentials' : 'https://developers.facebook.com/apps';
				const steps = buildInstructionSteps(section.key, t);

				return (
					<div className="app-pane-muted mt-5 rounded-[1.1rem] p-5 text-sm leading-6 text-(--app-text-muted)">
						<p className="text-(--app-text) font-semibold">{t('integrationsLoginSocial.instructions.title', 'Instruções')}</p>
						<p className="mt-2">
							{t('integrationsLoginSocial.instructions.access', 'Acesse:')}{' '}
							<a
								href={accessUrl}
								target="_blank"
								rel="noreferrer"
								className="font-semibold text-sky-700 underline underline-offset-2 transition hover:text-sky-800 dark:text-sky-300"
							>
								{accessUrl}
							</a>
						</p>
						<ol className="mt-2 list-decimal space-y-1 pl-5">
							{steps.map((step) => (
								<li key={`${section.key}-${step}`}>{step}</li>
							))}
						</ol>
						<code className="text-(--app-text) mt-3 block break-all rounded-[0.9rem] border border-line bg-(--app-surface) px-3 py-2 text-xs">{redirectUrl}</code>
					</div>
				);
			}}
			createEmptyValues={() => createEmptyIntegracaoLoginSocialRecord().values}
			emptyLookups={{}}
			client={{
				get: () => integracaoLoginSocialClient.get() as Promise<IntegracaoLoginSocialRecord>,
				save: (initialValues, currentValues) => {
					const includeEncryptedKeys = (['g_senha_aplicacao', 'fb_senha_aplicacao'] as IntegracaoLoginSocialEncryptedKey[]).filter(
						(key) => currentValues[key] !== initialValues[key] || !initialValues[key].trim(),
					);
					return integracaoLoginSocialClient.save(currentValues, { includeEncryptedKeys });
				},
			}}
		/>
	);
}
