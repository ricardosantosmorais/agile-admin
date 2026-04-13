'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { integracaoPromocoesClient } from '@/src/features/promocoes/services/integracao-promocoes-client';
import {
	createEmptyIntegracaoPromocoesRecord,
	type IntegracaoPromocoesRecord,
	type IntegracaoPromocoesValues,
} from '@/src/features/promocoes/services/integracao-promocoes-mappers';
import { useI18n } from '@/src/i18n/use-i18n';

export function IntegracaoPromocoesPage() {
	const { t } = useI18n();
	const fieldDefinitions = useMemo(
		(): Array<{
			key: keyof IntegracaoPromocoesValues;
			section: string;
			type: 'text' | 'secret';
			label: string;
			helper: string;
		}> => [
			{
				key: 'idever_client_id',
				section: 'idever',
				type: 'text' as const,
				label: t('integrationsPromotions.fields.clientId', 'Client ID'),
				helper: t('integrationsPromotions.helpers.clientId', 'Client ID fornecido pelo IdEver.'),
			},
			{
				key: 'idever_client_secret',
				section: 'idever',
				type: 'secret' as const,
				label: t('integrationsPromotions.fields.clientSecret', 'Client Secret'),
				helper: t('integrationsPromotions.helpers.clientSecret', 'Client Secret fornecido pelo IdEver.'),
			},
			{
				key: 'idever_app_id',
				section: 'idever',
				type: 'text' as const,
				label: t('integrationsPromotions.fields.appId', 'APP ID'),
				helper: t('integrationsPromotions.helpers.appId', 'APP ID fornecido pelo IdEver.'),
			},
			{
				key: 'idever_app_secret',
				section: 'idever',
				type: 'secret' as const,
				label: t('integrationsPromotions.fields.appSecret', 'APP Secret'),
				helper: t('integrationsPromotions.helpers.appSecret', 'APP Secret fornecido pelo IdEver.'),
			},
			{
				key: 'idever_rule_id',
				section: 'idever',
				type: 'text' as const,
				label: t('integrationsPromotions.fields.ruleId', 'Accumulation Rule ID'),
				helper: t('integrationsPromotions.helpers.ruleId', 'ID da regra de acúmulo de crédito fornecido pelo IdEver.'),
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
				key: 'idever',
				title: t('integrationsPromotions.sections.idever.title', 'IdEver'),
				description: t('integrationsPromotions.sections.idever.description', 'Configurações de integração com o IdEver.'),
			},
		],
		[t],
	);

	return (
		<ParameterFormPageBase<IntegracaoPromocoesValues, Record<string, never>, undefined>
			featureKey="integracoesPromocoes"
			moduleTitle={t('integrationsPromotions.title', 'Promoções')}
			modulePath="/integracoes/promocoes"
			moduleSectionTitle={t('menuKeys.integracoes', 'Integrações')}
			moduleSectionPath="/integracoes"
			backHref="/dashboard"
			moduleDescription={t('integrationsPromotions.description', 'Configure credenciais de integração com o IdEver para a empresa ativa.')}
			contextTitle={t('integrationsPromotions.contextTitle', 'Escopo')}
			contextValue={t('integrationsPromotions.contextValue', 'Parâmetros globais de fidelização e promoções')}
			contextDescription={t('integrationsPromotions.contextDescription', 'Essas credenciais conectam o tenant ativo ao IdEver para campanhas de acúmulo e resgate de benefícios.')}
			loadErrorMessage={t('integrationsPromotions.feedback.loadError', 'Não foi possível carregar as configurações de promoções.')}
			saveErrorMessage={t('integrationsPromotions.feedback.saveError', 'Não foi possível salvar as configurações de promoções.')}
			saveSuccessMessage={t('integrationsPromotions.feedback.saveSuccess', 'Configurações de promoções salvas com sucesso.')}
			fieldDefinitions={fieldDefinitions}
			sectionOrder={sectionOrder}
			createEmptyValues={() => createEmptyIntegracaoPromocoesRecord().values}
			emptyLookups={{}}
			client={{
				get: () => integracaoPromocoesClient.get() as Promise<IntegracaoPromocoesRecord>,
				save: (initialValues, currentValues) => integracaoPromocoesClient.saveDiff(initialValues, currentValues),
			}}
		/>
	);
}
