'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { useI18n } from '@/src/i18n/use-i18n';
import { integracaoNotificacoesClient } from '../services/integracao-notificacoes-client';
import { createEmptyIntegracaoNotificacoesRecord, type IntegracaoNotificacoesRecord, type NotificacoesValues } from '../services/integracao-notificacoes-mappers';

export function IntegracaoNotificacoesPage() {
	const { t } = useI18n();

	const fieldDefinitions = useMemo(
		(): Array<{
			key: keyof NotificacoesValues;
			section: string;
			type: 'text';
			label: string;
			helper: string;
		}> => [
			{
				key: 'fcmPrivateKey',
				section: 'firebaseApps',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.privateKey', 'Chave Privada'),
				helper: t('integrationsNotifications.fields.privateKeyHelper', 'Chave privada do aplicativo no Firebase'),
			},
			{
				key: 'fcmCodigo',
				section: 'firebaseApps',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.projectCode', 'Código do Projeto'),
				helper: t('integrationsNotifications.fields.projectCodeHelper', 'Código do projeto no Firebase'),
			},
			{
				key: 'fcmSenderId',
				section: 'firebaseApps',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.senderId', 'ID do Remetente'),
				helper: t('integrationsNotifications.fields.senderIdHelper', 'ID do remetente no Firebase'),
			},
			{
				key: 'fcmWebPrivateKey',
				section: 'firebaseWeb',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.webPrivateKey', 'Chave Privada'),
				helper: t('integrationsNotifications.fields.webPrivateKeyHelper', 'Chave privada do aplicativo no Firebase'),
			},
			{
				key: 'fcmWebApiKey',
				section: 'firebaseWeb',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.apiKey', 'Chave de API'),
				helper: t('integrationsNotifications.fields.apiKeyHelper', 'Chave de API do projeto no Firebase'),
			},
			{
				key: 'fcmWebCodigo',
				section: 'firebaseWeb',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.projectCode', 'Código do Projeto'),
				helper: t('integrationsNotifications.fields.projectCodeHelper', 'Código do projeto no Firebase'),
			},
			{
				key: 'fcmWebAppId',
				section: 'firebaseWeb',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.appId', 'ID do App'),
				helper: t('integrationsNotifications.fields.appIdHelper', 'ID do aplicativo web no Firebase'),
			},
			{
				key: 'fcmWebSenderId',
				section: 'firebaseWeb',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.senderId', 'ID do Remetente'),
				helper: t('integrationsNotifications.fields.senderIdHelper', 'ID do remetente no Firebase'),
			},
			{
				key: 'fcmWebVapidKey',
				section: 'firebaseWeb',
				type: 'text' as const,
				label: t('integrationsNotifications.fields.vapidKey', 'Chave VAPID'),
				helper: t('integrationsNotifications.fields.vapidKeyHelper', 'Chave VAPID do Firebase Web Push'),
			},
		],
		[t],
	);

	const sectionOrder = useMemo(
		(): Array<{
			key: string;
			title: string;
			description: string;
		}> => [
			{
				key: 'firebaseApps',
				title: t('integrationsNotifications.sections.firebaseApps.title', 'Firebase (Aplicativos)'),
				description: t('integrationsNotifications.sections.firebaseApps.description', 'Configurações do Firebase para envio de notificações para os aplicativos.'),
			},
			{
				key: 'firebaseWeb',
				title: t('integrationsNotifications.sections.firebaseWeb.title', 'Firebase (Web)'),
				description: t('integrationsNotifications.sections.firebaseWeb.description', 'Configurações do Firebase para envio de notificações web.'),
			},
		],
		[t],
	);

	return (
		<ParameterFormPageBase<NotificacoesValues, Record<string, never>, undefined>
			featureKey="integracoesNotificacoes"
			moduleTitle={t('integrationsNotifications.title', 'Notificações')}
			modulePath="/integracoes/notificacoes"
			moduleSectionTitle={t('menuKeys.integracoes', 'Integrações')}
			moduleSectionPath="/integracoes"
			backHref="/dashboard"
			moduleDescription={t('integrationsNotifications.description', 'Gerencie configurações do Firebase para envio de notificações push e web da empresa ativa.')}
			contextTitle={t('integrationsNotifications.contextTitle', 'Escopo')}
			contextValue={t('integrationsNotifications.contextValue', 'Parâmetros globais de notificações')}
			contextDescription={t('integrationsNotifications.contextDescription', 'Essas credenciais são usadas no tenant ativo para push em aplicativos e notificações web.')}
			loadErrorMessage={t('integrationsNotifications.feedback.loadError', 'Não foi possível carregar as configurações.')}
			saveErrorMessage={t('integrationsNotifications.feedback.saveError', 'Erro ao salvar.')}
			saveSuccessMessage={t('integrationsNotifications.feedback.saveSuccess', 'Configurações salvas com sucesso.')}
			fieldDefinitions={fieldDefinitions}
			sectionOrder={sectionOrder}
			createEmptyValues={() => createEmptyIntegracaoNotificacoesRecord().values}
			emptyLookups={{}}
			client={{
				get: () => integracaoNotificacoesClient.get() as Promise<IntegracaoNotificacoesRecord>,
				save: (_initialValues, currentValues) => integracaoNotificacoesClient.save(currentValues),
			}}
		/>
	);
}
