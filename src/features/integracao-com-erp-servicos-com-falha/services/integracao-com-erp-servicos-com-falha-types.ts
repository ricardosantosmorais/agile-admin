export type IntegracaoComErpServicosComFalhaSortKey = 'id_servico' | 'nome_servico' | 'nome_fantasia' | 'intervalo_execucao' | 'id_servico_execucao' | 'data_hora' | 'tentativas';

export type IntegracaoComErpServicosComFalhaFilters = {
	page: number;
	perPage: number;
	orderBy: IntegracaoComErpServicosComFalhaSortKey;
	sort: 'asc' | 'desc';
	id: string;
	nome: string;
	empresa: string;
	intervalo: string;
	idExecucao: string;
};

export type IntegracaoComErpServicoComFalhaMetadataEntry = {
	label: string;
	value: string;
};

export type IntegracaoComErpServicoComFalhaRecord = {
	id: string;
	companyId: string;
	serviceId: string;
	executionId: string;
	serviceName: string;
	companyName: string;
	intervaloExecucao: string;
	firstFailureAt: string;
	attempts: number;
	metadataEntries: IntegracaoComErpServicoComFalhaMetadataEntry[];
	metadataRaw: string;
};

export type IntegracaoComErpServicosComFalhaResponse = {
	data: IntegracaoComErpServicoComFalhaRecord[];
	meta: {
		total: number;
		from: number;
		to: number;
		page: number;
		pages: number;
		perPage: number;
	};
};

export type IntegracaoComErpServicosComFalhaCommandResult = {
	success: boolean;
	message: string;
};
