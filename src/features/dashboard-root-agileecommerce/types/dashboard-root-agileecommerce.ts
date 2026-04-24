export type DashboardRootPeriod = {
	data_inicio: string | null;
	data_fim: string | null;
	data_inicio_anterior: string | null;
	data_fim_anterior: string | null;
};

export type DashboardRootComparativo = {
	periodo_anterior: {
		data_inicio: string;
		data_fim: string;
	} | null;
	valores_anteriores: Record<string, number> | null;
	variacoes: Record<string, number> | null;
} | null;

export type DashboardRootResumo = {
	carteira: {
		empresas_total: number;
		empresas_ativas: number;
		empresas_producao: number;
		empresas_homologacao: number;
		empresas_bloqueadas: number;
		empresas_manutencao: number;
		empresas_com_app: number;
		apps_ativos: number;
		cobertura_apps_percentual: number;
	};
	periodo_atual: {
		pushes_enviados: number;
		push_interacoes: number;
		taxa_interacao_push: number;
		processos_total: number;
		processos_erro: number;
		taxa_erro_processos: number;
		execucoes_agente: number;
		auditorias_mcp: number;
		auditorias_mcp_erro: number;
		taxa_erro_mcp: number;
		builds_com_erro: number;
	};
	comparativo: DashboardRootComparativo;
};

export type DashboardRootSimpleRow = Record<string, string | number | null>;

export type DashboardRootAnalytics = {
	resumo: Record<string, number>;
	comparativo: DashboardRootComparativo;
	confianca: DashboardRootSimpleRow;
	vendas_series_diaria: DashboardRootSimpleRow[];
	vendas_series_diaria_anterior: DashboardRootSimpleRow[];
	vendas_series_mensal: DashboardRootSimpleRow[];
	ranking_faturamento: DashboardRootSimpleRow[];
	ranking_pedidos: DashboardRootSimpleRow[];
	ranking_usuarios_ativos: DashboardRootSimpleRow[];
	engajamento_empresas: DashboardRootSimpleRow[];
	empresas_base_saudavel: DashboardRootSimpleRow[];
	empresas_mais_produtos: DashboardRootSimpleRow[];
	pedidos_status: DashboardRootSimpleRow[];
	empresas_sinais_queda: DashboardRootSimpleRow[];
	frescor_analytics_por_empresa: DashboardRootSimpleRow[];
	sincronizacao_resumo: DashboardRootSimpleRow;
	sincronizacao_status: DashboardRootSimpleRow[];
	sincronizacao_execucoes_recentes: DashboardRootSimpleRow[];
	cobertura_dados: DashboardRootSimpleRow[];
};

export type DashboardRootSnapshot = {
	meta: {
		versao: string;
		schema: number;
		cache_ttl_minutos: number;
		cache_ignorado: boolean;
		cache_hit: boolean;
		tenant_id: string;
		blocos: string[];
		periodo: DashboardRootPeriod;
	};
	resumo?: DashboardRootResumo;
	empresas?: Partial<{
		status: DashboardRootSimpleRow[];
		clusters: DashboardRootSimpleRow[];
		erps: DashboardRootSimpleRow[];
		flags: DashboardRootSimpleRow;
		implantacao: DashboardRootSimpleRow;
		cards_atencao: Record<string, number>;
		top_empresas_sem_app: DashboardRootSimpleRow[];
		top_empresas_problemas_app: DashboardRootSimpleRow[];
	}>;
	apps?: Partial<{
		resumo: DashboardRootSimpleRow;
		criacao_serie: DashboardRootSimpleRow[];
		criacao_serie_mensal: DashboardRootSimpleRow[];
		logs_status: DashboardRootSimpleRow[];
		notificacoes_publicadas_serie_mensal: DashboardRootSimpleRow[];
		top_empresas_sem_app: DashboardRootSimpleRow[];
		top_empresas_problemas_publicacao_build: DashboardRootSimpleRow[];
	}>;
	push?: Partial<{
		resumo: Record<string, number>;
		comparativo: DashboardRootComparativo;
		tipos: DashboardRootSimpleRow[];
		serie_envios: DashboardRootSimpleRow[];
		serie_envios_mensal: DashboardRootSimpleRow[];
		serie_interacoes: DashboardRootSimpleRow[];
		serie_interacoes_mensal: DashboardRootSimpleRow[];
		mensagens_externas_status: DashboardRootSimpleRow[];
	}>;
	processos?: Partial<{
		resumo: Record<string, number>;
		comparativo: DashboardRootComparativo;
		status: DashboardRootSimpleRow[];
		tipos: DashboardRootSimpleRow[];
		serie: DashboardRootSimpleRow[];
		serie_mensal: DashboardRootSimpleRow[];
		logs_tipos: DashboardRootSimpleRow[];
		logs_resumo: DashboardRootSimpleRow;
		alertas_falha_recente: DashboardRootSimpleRow[];
	}>;
	agent?: Partial<{
		resumo: Record<string, number>;
		comparativo: DashboardRootComparativo;
		execucoes_status: DashboardRootSimpleRow[];
		execucoes_serie_diaria: DashboardRootSimpleRow[];
		mensagens_por_papel: DashboardRootSimpleRow[];
		eventos_tipos: DashboardRootSimpleRow[];
		canais_direcao: DashboardRootSimpleRow[];
		canais_status: DashboardRootSimpleRow[];
		webhook_event_types: DashboardRootSimpleRow[];
	}>;
	audit?: Partial<{
		resumo: Record<string, number>;
		comparativo: DashboardRootComparativo;
		status: DashboardRootSimpleRow[];
		top_tools: DashboardRootSimpleRow[];
		serie: DashboardRootSimpleRow[];
		alertas_tools: DashboardRootSimpleRow[];
	}>;
	leads?: Partial<{
		status: DashboardRootSimpleRow[];
		fontes: DashboardRootSimpleRow[];
		serie_mensal: DashboardRootSimpleRow[];
	}>;
	analytics?: Partial<DashboardRootAnalytics>;
};
