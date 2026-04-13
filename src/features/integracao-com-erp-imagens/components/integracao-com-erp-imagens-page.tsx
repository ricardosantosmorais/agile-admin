'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { useI18n } from '@/src/i18n/use-i18n';
import { mapIntegracaoComErpFieldsToBaseDefinitions, type IntegracaoComErpConfigFieldDefinition } from '@/src/lib/integracao-com-erp-parameter-form';
import { integracaoComErpImagensClient } from '@/src/features/integracao-com-erp-imagens/services/integracao-com-erp-imagens-client';

type PageContext = {
	fields: IntegracaoComErpConfigFieldDefinition[];
	fieldDefinitions: ReturnType<typeof mapIntegracaoComErpFieldsToBaseDefinitions>;
};

export function IntegracaoComErpImagensPage() {
	const { t } = useI18n();

	const client = useMemo(
		() => ({
			get: async () => {
				const result = await integracaoComErpImagensClient.get();
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
					throw new Error(t('maintenance.erpIntegration.modules.images.feedback.loadError', 'Não foi possível carregar os parâmetros de imagens do ERP.'));
				}

				return integracaoComErpImagensClient.save(context.fields, initialValues, currentValues);
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
			featureKey="erpImagens"
			moduleTitle={t('maintenance.erpIntegration.modules.images.title', 'Imagens ERP')}
			modulePath="/integracao-com-erp/imagens"
			moduleSectionTitle={t('menuKeys.integracao-erp', 'Integração com ERP')}
			moduleSectionPath="/integracao-com-erp/dashboard"
			backHref="/integracao-com-erp/dashboard"
			moduleDescription={t('maintenance.erpIntegration.modules.images.description', 'Centralize os parâmetros de imagens consumidos pelo integrador ERP.')}
			contextTitle={t('maintenance.erpIntegration.contextTitle', 'Escopo')}
			contextValue={t('maintenance.erpIntegration.modules.images.contextValue', 'Regras de imagens e mídia do integrador')}
			contextDescription={t(
				'maintenance.erpIntegration.modules.images.contextDescription',
				'Os campos podem mudar conforme o template da empresa e a configuração publicada no legado.',
			)}
			loadErrorMessage={t('maintenance.erpIntegration.modules.images.feedback.loadError', 'Não foi possível carregar os parâmetros de imagens do ERP.')}
			saveErrorMessage={t('maintenance.erpIntegration.modules.images.feedback.saveError', 'Não foi possível salvar os parâmetros de imagens do ERP.')}
			saveSuccessMessage={t('maintenance.erpIntegration.modules.images.feedback.saveSuccess', 'Parâmetros de imagens do ERP salvos com sucesso.')}
			fieldDefinitions={[]}
			resolveFieldDefinitions={(context) => context?.fieldDefinitions ?? []}
			sectionOrder={sectionOrder}
			createEmptyValues={() => ({})}
			emptyLookups={{}}
			client={client}
		/>
	);
}
