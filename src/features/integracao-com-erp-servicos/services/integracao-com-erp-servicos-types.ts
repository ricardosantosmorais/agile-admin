export type IntegracaoComErpServicosSortKey = 'id_servico' | 'servico.nome' | 'intervalo_execucao' | 'dthr_ultima_execucao' | 'dthr_proxima_execucao' | 'status';

export type IntegracaoComErpServicosFilters = {
	page: number;
	perPage: number;
	orderBy: IntegracaoComErpServicosSortKey;
	sort: 'asc' | 'desc';
	id: string;
	nome: string;
	intervalo: string;
	status: string;
};

export type IntegracaoComErpServicoMetadataEntry = {
	label: string;
	value: string;
};

export type IntegracaoComErpServicoCharacteristic = {
	key: string;
	label: string;
	inferred?: boolean;
};

export type IntegracaoComErpServicoRecord = {
	id: string;
	idServico: string;
	idServicoEmpresa?: string;
	idTemplate?: string;
	nome: string;
	intervaloExecucao: string;
	ultimaExecucao: string;
	proximaExecucao: string;
	status: string;
	statusLabel: string;
	statusTone: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
	ativo: boolean;
	customizado?: boolean;
	urlFiltro?: string;
	gatewayName?: string;
	endpointUrl?: string;
	hash?: string;
	querySql?: string;
	metadataEntries: IntegracaoComErpServicoMetadataEntry[];
	caracteristicas: {
		natureza: IntegracaoComErpServicoCharacteristic;
		motorExecucao: IntegracaoComErpServicoCharacteristic;
		tipoServico: IntegracaoComErpServicoCharacteristic;
		modoExecucao: IntegracaoComErpServicoCharacteristic;
		objeto: IntegracaoComErpServicoCharacteristic;
	};
};

export type IntegracaoComErpServicosResponse = {
	data: IntegracaoComErpServicoRecord[];
	meta: {
		total: number;
		from: number;
		to: number;
		page: number;
		pages: number;
		perPage: number;
	};
};

export type IntegracaoComErpServicosCommandResult = {
	success: boolean;
	message: string;
};

export type IntegracaoComErpServicoUpdatePayload = {
	ativo: boolean;
	intervaloExecucao: string;
	urlFiltro: string;
	motivo: string;
};

export type IntegracaoComErpServicoQuerySupportItem = {
	id: string;
	label: string;
	description: string;
	kind: 'field' | 'parameter';
	required?: boolean;
	primaryKey?: boolean;
	dataType?: string;
	defaultValue?: string;
};

export type IntegracaoComErpServicoQuerySupportResponse = {
	fields: IntegracaoComErpServicoQuerySupportItem[];
	parameters: IntegracaoComErpServicoQuerySupportItem[];
};

export type IntegracaoComErpServicoHistoryRecord = {
	id: string;
	usuario: string;
	dataHora: string;
	dataHoraCriacao: string;
	motivo: string;
};

export type IntegracaoComErpServicoHistoryResponse = {
	data: IntegracaoComErpServicoHistoryRecord[];
	meta: {
		total: number;
		from: number;
		to: number;
		page: number;
		pages: number;
		perPage: number;
	};
};

export type IntegracaoComErpServicoConfigHistoryRecord = {
	id: string;
	usuario: string;
	dataHora: string;
	motivo: string;
	diff: string;
};

export type IntegracaoComErpServicoConfigHistoryResponse = {
	data: IntegracaoComErpServicoConfigHistoryRecord[];
	meta: {
		total: number;
		from: number;
		to: number;
		page: number;
		pages: number;
		perPage: number;
	};
};

export type IntegracaoComErpServicoExecutionRecord = {
	id: string;
	dataHoraInicio: string;
	dataHoraFim: string;
	tempoExecucao: string;
	status: string;
	statusLabel: string;
	statusTone: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
	abortar: boolean;
	abortarLabel: string;
	abortarTone: 'success' | 'warning';
	statusLog: string;
	qtdRegistros: string;
	qtdIncluidos: string;
	qtdAlterados: string;
	qtdDeletados: string;
};

export type IntegracaoComErpServicoExecutionFilters = {
	page: number;
	perPage: number;
	id: string;
	status: string;
	abortar: string;
};

export type IntegracaoComErpServicoExecutionResponse = {
	data: IntegracaoComErpServicoExecutionRecord[];
	meta: {
		total: number;
		from: number;
		to: number;
		page: number;
		pages: number;
		perPage: number;
	};
};

export type IntegracaoComErpServicoExecutionFailure = {
	executionId: string;
	step: string;
	message: string;
};

export type IntegracaoComErpServicoExecutionDetailRecord = {
	id: string;
	tipoDetalhe: string;
	tipoDetalheLabel: string;
	detalhe: string;
	dataHoraInicio: string;
	dataHoraFim: string;
	tempoExecucao: string;
	status: string;
	statusLabel: string;
	statusTone: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
	tentativas: string;
	metadataPreview: string;
	hasDetailContent: boolean;
	hasMetadataContent: boolean;
};

export type IntegracaoComErpServicoExecutionDetailResponse = {
	data: IntegracaoComErpServicoExecutionDetailRecord[];
	meta: {
		total: number;
		from: number;
		to: number;
		page: number;
		pages: number;
		perPage: number;
	};
};

export type IntegracaoComErpServicoExecutionLogContent = {
	title: string;
	fileName?: string;
	content: string;
	kind: 'detail' | 'metadata';
};
