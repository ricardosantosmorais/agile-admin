'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { useI18n } from '@/src/i18n/use-i18n';
import { mapIntegracaoComErpFieldsToBaseDefinitions, type IntegracaoComErpConfigFieldDefinition } from '@/src/lib/integracao-com-erp-parameter-form';
import { integracaoComErpApiClient } from '@/src/features/integracao-com-erp-api/services/integracao-com-erp-api-client';

type PageContext = {
	fields: IntegracaoComErpConfigFieldDefinition[];
	fieldDefinitions: ReturnType<typeof mapIntegracaoComErpFieldsToBaseDefinitions>;
};

export function IntegracaoComErpApiPage() {
	const { t } = useI18n();

	const client = useMemo(
		() => ({
			get: async () => {
				const result = await integracaoComErpApiClient.get();
				return {
					values: result.values,
					metadata: result.metadata,
					lookups: {},
					context: {
						fields: result.fields,
						fieldDefinitions: mapIntegracaoComErpFieldsToBaseDefinitions(result.fields),
					} satisfies PageContext,
				};
			},
			save: async (initialValues: Record<string, string>, currentValues: Record<string, string>, context: PageContext | undefined) => {
				if (!context?.fields?.length) {
					throw new Error(t('maintenance.erpIntegration.modules.api.feedback.loadError', 'Não foi possível carregar as configurações de API do ERP.'));
				}

				return integracaoComErpApiClient.save(context.fields, initialValues, currentValues);
			},
		}),
		[t],
	);

	const sectionOrder = useMemo(
		() => [
			{
				key: 'general',
				title: t('maintenance.erpIntegration.sections.dynamic.title', 'Parâmetros editáveis'),
				description: t('maintenance.erpIntegration.sections.dynamic.description', 'Os campos seguem a ordem e o tipo definidos pelo registro legado de configurações da empresa.'),
			},
		],
		[t],
	);

	return (
		<ParameterFormPageBase<Record<string, string>, Record<string, never[]>, PageContext>
			featureKey="erpApi"
			moduleTitle={t('maintenance.erpIntegration.modules.api.title', 'API ERP')}
			modulePath="/integracao-com-erp/api"
			moduleSectionTitle={t('menuKeys.integracao-erp', 'Integração com ERP')}
			moduleSectionPath="/integracao-com-erp/dashboard"
			backHref="/integracao-com-erp/dashboard"
			moduleDescription={t('maintenance.erpIntegration.modules.api.description', 'Gerencie credenciais e parâmetros de comunicação com APIs do ERP.')}
			contextTitle={t('maintenance.erpIntegration.contextTitle', 'Escopo')}
			contextValue={t('maintenance.erpIntegration.modules.api.contextValue', 'Credenciais e endpoints do integrador')}
			contextDescription={t(
				'maintenance.erpIntegration.modules.api.contextDescription',
				'Campos sigilosos permanecem mascarados até que uma nova alteração seja iniciada pelo usuário.',
			)}
			loadErrorMessage={t('maintenance.erpIntegration.modules.api.feedback.loadError', 'Não foi possível carregar as configurações de API do ERP.')}
			saveErrorMessage={t('maintenance.erpIntegration.modules.api.feedback.saveError', 'Não foi possível salvar as configurações de API do ERP.')}
			saveSuccessMessage={t('maintenance.erpIntegration.modules.api.feedback.saveSuccess', 'Configurações de API do ERP salvas com sucesso.')}
			fieldDefinitions={[]}
			resolveFieldDefinitions={(context) => context?.fieldDefinitions ?? []}
			sectionOrder={sectionOrder}
			createEmptyValues={() => ({})}
			emptyLookups={{}}
			client={client}
		/>
	);
}
