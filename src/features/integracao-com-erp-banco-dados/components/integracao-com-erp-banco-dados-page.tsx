'use client';

import { useMemo } from 'react';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { useI18n } from '@/src/i18n/use-i18n';
import { mapIntegracaoComErpFieldsToBaseDefinitions, type IntegracaoComErpConfigFieldDefinition } from '@/src/lib/integracao-com-erp-parameter-form';
import { integracaoComErpBancoDadosClient } from '@/src/features/integracao-com-erp-banco-dados/services/integracao-com-erp-banco-dados-client';

type PageContext = {
	fields: IntegracaoComErpConfigFieldDefinition[];
	fieldDefinitions: ReturnType<typeof mapIntegracaoComErpFieldsToBaseDefinitions>;
};

function createDatabaseFields(t: ReturnType<typeof useI18n>['t']): IntegracaoComErpConfigFieldDefinition[] {
	return [
		{
			key: 'tipo_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.type', 'Tipo'),
			description: t('maintenance.erpIntegration.database.helpers.type', 'Tipo de banco de dados.'),
			type: 'enum',
			options: [
				{ value: 'oracle', label: t('maintenance.erpIntegration.database.options.oracle', 'Oracle') },
				{ value: 'mssqlserver', label: t('maintenance.erpIntegration.database.options.mssqlserver', 'MSSQLServer') },
				{ value: 'firebird', label: t('maintenance.erpIntegration.database.options.firebird', 'Firebird') },
				{ value: 'postgresql', label: t('maintenance.erpIntegration.database.options.postgresql', 'PostgreSQL') },
				{ value: 'mysql', label: t('maintenance.erpIntegration.database.options.mysql', 'MySQL') },
				{ value: 'odbc', label: t('maintenance.erpIntegration.database.options.odbc', 'ODBC') },
			],
			order: 1,
		},
		{
			key: 'ip_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.host', 'IP'),
			description: t('maintenance.erpIntegration.database.helpers.host', 'IP de conexão com o banco de dados.'),
			type: 'text',
			options: [],
			order: 2,
		},
		{
			key: 'porta_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.port', 'Porta'),
			description: t('maintenance.erpIntegration.database.helpers.port', 'Porta de conexão com o banco de dados.'),
			type: 'text',
			options: [],
			order: 3,
			inputMode: 'numeric',
		},
		{
			key: 'instancia_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.instance', 'Instância'),
			description: t('maintenance.erpIntegration.database.helpers.instance', 'Nome da instância no banco de dados.'),
			type: 'text',
			options: [],
			order: 4,
		},
		{
			key: 'usuario_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.user', 'Usuário'),
			description: t('maintenance.erpIntegration.database.helpers.user', 'Usuário de conexão com o banco de dados.'),
			type: 'text',
			options: [],
			order: 5,
		},
		{
			key: 'senha_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.password', 'Senha'),
			description: t('maintenance.erpIntegration.database.helpers.password', 'Senha de conexão com o banco de dados.'),
			type: 'secret',
			options: [],
			order: 6,
		},
		{
			key: 'proprietario_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.owner', 'Proprietário'),
			description: t('maintenance.erpIntegration.database.helpers.owner', 'Nome do proprietário do banco de dados.'),
			type: 'text',
			options: [],
			order: 7,
		},
		{
			key: 'string_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.connectionString', 'String de Conexão'),
			description: t(
				'maintenance.erpIntegration.database.helpers.connectionString',
				'String específica para conexão. Se ficar vazia, o integrador usa os parâmetros padrão acima.',
			),
			type: 'text',
			options: [],
			order: 8,
			layoutClassName: 'md:col-span-2 xl:col-span-3',
		},
		{
			key: 'separador_decimal_banco_dados',
			label: t('maintenance.erpIntegration.database.fields.decimalSeparator', 'Separador Decimal'),
			description: t('maintenance.erpIntegration.database.helpers.decimalSeparator', 'Separador de casas decimais utilizado pelo banco de dados.'),
			type: 'enum',
			options: [
				{ value: '.', label: t('maintenance.erpIntegration.database.options.dot', 'Ponto') },
				{ value: ',', label: t('maintenance.erpIntegration.database.options.comma', 'Vírgula') },
			],
			order: 9,
		},
	];
}

export function IntegracaoComErpBancoDadosPage() {
	const { t } = useI18n();
	const staticFields = useMemo(() => createDatabaseFields(t), [t]);

	const client = useMemo(
		() => ({
			get: async () => {
				const result = await integracaoComErpBancoDadosClient.get(staticFields);
				return {
					values: result.values,
					metadata: result.metadata,
					lookups: {},
					context: {
						fields: result.fields,
						fieldDefinitions: mapIntegracaoComErpFieldsToBaseDefinitions(result.fields, 'connection'),
					} satisfies PageContext,
				};
			},
			save: async (initialValues: Record<string, string>, currentValues: Record<string, string>, context: PageContext | undefined) => {
				if (!context?.fields?.length) {
					throw new Error(t('maintenance.erpIntegration.modules.database.feedback.loadError', 'Não foi possível carregar a configuração de banco de dados do ERP.'));
				}

				return integracaoComErpBancoDadosClient.save(context.fields, initialValues, currentValues);
			},
		}),
		[staticFields, t],
	);

	const sectionOrder = useMemo(
		() => [
			{
				key: 'connection',
				title: t('maintenance.erpIntegration.database.sectionTitle', 'Conexão'),
				description: t('maintenance.erpIntegration.database.sectionDescription', 'Parâmetros usados pelo integrador para conectar no banco de dados do ERP.'),
			},
		],
		[t],
	);

	return (
		<ParameterFormPageBase<Record<string, string>, Record<string, never[]>, PageContext>
			featureKey="erpBancoDados"
			moduleTitle={t('maintenance.erpIntegration.modules.database.title', 'Banco de Dados ERP')}
			modulePath="/integracao-com-erp/banco-de-dados"
			moduleSectionTitle={t('menuKeys.integracao-erp', 'Integração com ERP')}
			moduleSectionPath="/integracao-com-erp/dashboard"
			backHref="/integracao-com-erp/dashboard"
			moduleDescription={t('maintenance.erpIntegration.modules.database.description', 'Configure a conexão que o integrador usa para acessar a base do ERP.')}
			contextTitle={t('maintenance.erpIntegration.contextTitle', 'Escopo')}
			contextValue={t('maintenance.erpIntegration.modules.database.contextValue', 'Conexão técnica com a base do ERP')}
			contextDescription={t(
				'maintenance.erpIntegration.modules.database.contextDescription',
				'Use esta tela para manter host, porta, credenciais e string de conexão do integrador.',
			)}
			loadErrorMessage={t('maintenance.erpIntegration.modules.database.feedback.loadError', 'Não foi possível carregar a configuração de banco de dados do ERP.')}
			saveErrorMessage={t('maintenance.erpIntegration.modules.database.feedback.saveError', 'Não foi possível salvar a configuração de banco de dados do ERP.')}
			saveSuccessMessage={t('maintenance.erpIntegration.modules.database.feedback.saveSuccess', 'Configuração de banco de dados do ERP salva com sucesso.')}
			fieldDefinitions={mapIntegracaoComErpFieldsToBaseDefinitions(staticFields, 'connection')}
			resolveFieldDefinitions={(context) => context?.fieldDefinitions ?? []}
			sectionOrder={sectionOrder}
			createEmptyValues={() => ({})}
			emptyLookups={{}}
			client={client}
		/>
	);
}
