'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { useI18n } from '@/src/i18n/use-i18n';
import { mapIntegracaoComErpFieldsToBaseDefinitions, type IntegracaoComErpConfigFieldDefinition } from '@/src/lib/integracao-com-erp-parameter-form';
import { integracaoComErpParametrosClient } from '@/src/features/integracao-com-erp-parametros/services/integracao-com-erp-parametros-client';

type PageContext = {
	fields: IntegracaoComErpConfigFieldDefinition[];
	fieldDefinitions: ReturnType<typeof mapIntegracaoComErpFieldsToBaseDefinitions>;
};

export function IntegracaoComErpParametrosPage() {
	const { t } = useI18n();

	const client = useMemo(
		() => ({
			get: async () => {
				const result = await integracaoComErpParametrosClient.get();
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
					throw new Error(t('maintenance.erpIntegration.modules.parameters.feedback.loadError', 'Não foi possível carregar os parâmetros do ERP.'));
				}

				return integracaoComErpParametrosClient.save(context.fields, initialValues, currentValues);
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
			featureKey="erpParametros"
			moduleTitle={t('maintenance.erpIntegration.modules.parameters.title', 'Parâmetros ERP')}
			modulePath="/integracao-com-erp/parametros"
			moduleSectionTitle={t('menuKeys.integracao-erp', 'Integração com ERP')}
			moduleSectionPath="/integracao-com-erp/dashboard"
			backHref="/integracao-com-erp/dashboard"
			moduleDescription={t('maintenance.erpIntegration.modules.parameters.description', 'Gerencie os parâmetros editáveis que orientam a integração com ERP.')}
			contextTitle={t('maintenance.erpIntegration.contextTitle', 'Escopo')}
			contextValue={t('maintenance.erpIntegration.modules.parameters.contextValue', 'Parâmetros operacionais da integração ERP')}
			contextDescription={t(
				'maintenance.erpIntegration.modules.parameters.contextDescription',
				'Os campos desta tela vêm do cadastro legado de configurações da empresa e podem variar por template e tenant.',
			)}
			loadErrorMessage={t('maintenance.erpIntegration.modules.parameters.feedback.loadError', 'Não foi possível carregar os parâmetros do ERP.')}
			saveErrorMessage={t('maintenance.erpIntegration.modules.parameters.feedback.saveError', 'Não foi possível salvar os parâmetros do ERP.')}
			saveSuccessMessage={t('maintenance.erpIntegration.modules.parameters.feedback.saveSuccess', 'Parâmetros do ERP salvos com sucesso.')}
			fieldDefinitions={[]}
			resolveFieldDefinitions={(context) => context?.fieldDefinitions ?? []}
			sectionOrder={sectionOrder}
			createEmptyValues={() => ({})}
			emptyLookups={{}}
			client={client}
		/>
	);
}
