type IntegracaoComErpSchemaModuleConfig = {
	parameterGroupId: number;
	exactTemplateForOmie?: boolean;
};

export const INTEGRACAO_COM_ERP_SCHEMA_MODULES: Record<string, IntegracaoComErpSchemaModuleConfig> = {
	parametros: { parameterGroupId: 2 },
	imagens: { parameterGroupId: 7 },
	api: { parameterGroupId: 8, exactTemplateForOmie: true },
} as const;

export const INTEGRACAO_COM_ERP_DATABASE_PARAMETER_KEYS = [
	'tipo_banco_dados',
	'ip_banco_dados',
	'porta_banco_dados',
	'instancia_banco_dados',
	'usuario_banco_dados',
	'senha_banco_dados',
	'proprietario_banco_dados',
	'string_banco_dados',
	'separador_decimal_banco_dados',
] as const;

export const INTEGRACAO_COM_ERP_INSTALLER_DOWNLOAD_URL = 'https://files.agileecommerce.com.br/AgileSyncSetup_1_2_5.exe';

export type IntegracaoComErpSchemaModuleId = keyof typeof INTEGRACAO_COM_ERP_SCHEMA_MODULES;
export type IntegracaoComErpFormModuleId = IntegracaoComErpSchemaModuleId | 'banco-de-dados';

export function isIntegracaoComErpSchemaModule(moduleId: string): moduleId is IntegracaoComErpSchemaModuleId {
	return moduleId in INTEGRACAO_COM_ERP_SCHEMA_MODULES;
}

export function isIntegracaoComErpFormModule(moduleId: string): moduleId is IntegracaoComErpFormModuleId {
	return isIntegracaoComErpSchemaModule(moduleId) || moduleId === 'banco-de-dados';
}

export function isIntegracaoComErpInstallationModule(moduleId: string): moduleId is 'instalacao-do-integrador' {
	return moduleId === 'instalacao-do-integrador';
}
