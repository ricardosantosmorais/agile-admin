'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { useI18n } from '@/src/i18n/use-i18n';
import { integracaoAplicativosClient } from '../services/integracao-aplicativos-client';
import { createEmptyIntegracaoAplicativosRecord, type AplicativosValues, type IntegracaoAplicativosRecord } from '../services/integracao-aplicativos-mappers';

export function IntegracaoAplicativosPage() {
	const { t } = useI18n();
	const fieldDefinitions = useMemo(
		(): Array<{
			key: keyof AplicativosValues;
			section: string;
			type: 'text';
			label: string;
			helper: string;
			layoutClassName: string;
		}> => [
			{
				key: 'androidLink',
				section: 'android',
				type: 'text',
				label: t('integrationsApps.fields.androidLink', 'Link do aplicativo no Google Play Store'),
				helper: t('integrationsApps.fields.androidLinkHelper', 'Informe a URL pública do aplicativo Android no Google Play Store.'),
				layoutClassName: 'md:col-span-2 xl:col-span-3',
			},
			{
				key: 'iosLink',
				section: 'ios',
				type: 'text',
				label: t('integrationsApps.fields.iosLink', 'Link do aplicativo na Apple Store'),
				helper: t('integrationsApps.fields.iosLinkHelper', 'Informe a URL pública do aplicativo iOS na Apple App Store.'),
				layoutClassName: 'md:col-span-2 xl:col-span-3',
			},
		],
		[t],
	);

	const sectionOrder = useMemo(
		() => [
			{
				key: 'android',
				title: t('integrationsApps.sections.android.title', 'Android'),
				description: t('integrationsApps.sections.android.description', 'Configurações do aplicativo no Google Play Store.'),
			},
			{
				key: 'ios',
				title: t('integrationsApps.sections.ios.title', 'iOS'),
				description: t('integrationsApps.sections.ios.description', 'Configurações do aplicativo na Apple Store.'),
			},
		],
		[t],
	);

	return (
		<ParameterFormPageBase<AplicativosValues, Record<string, never>, undefined>
			featureKey="integracoesAplicativos"
			moduleTitle={t('integrationsApps.title', 'Aplicativos')}
			modulePath="/integracoes/aplicativos"
			moduleSectionTitle={t('menuKeys.integracoes', 'Integrações')}
			moduleSectionPath="/integracoes"
			backHref="/dashboard"
			moduleDescription={t('integrationsApps.description', 'Gerencie links dos aplicativos Android e iOS da empresa ativa.')}
			contextTitle={t('integrationsApps.contextTitle', 'Escopo')}
			contextValue={t('integrationsApps.contextValue', 'Parâmetros globais dos aplicativos')}
			contextDescription={t(
				'integrationsApps.contextDescription',
				'Esses links são usados pelo tenant ativo para divulgar os aplicativos móveis nas experiências web e institucionais.',
			)}
			loadErrorMessage={t('integrationsApps.feedback.loadError', 'Não foi possível carregar as configurações de aplicativos.')}
			saveErrorMessage={t('integrationsApps.feedback.saveError', 'Não foi possível salvar as configurações de aplicativos.')}
			saveSuccessMessage={t('integrationsApps.feedback.saveSuccess', 'Configurações de aplicativos salvas com sucesso.')}
			fieldDefinitions={fieldDefinitions}
			sectionOrder={sectionOrder}
			createEmptyValues={() => createEmptyIntegracaoAplicativosRecord().values}
			emptyLookups={{}}
			client={{
				get: () => integracaoAplicativosClient.get() as Promise<IntegracaoAplicativosRecord>,
				save: (_initialValues, currentValues) => integracaoAplicativosClient.save(currentValues),
			}}
		/>
	);
}
