export type IntegracaoComErpRotinasIntegradasSortKey = 'codigo' | 'modulo' | 'nome';

export type IntegracaoComErpRotinasIntegradasFilters = {
	page: number;
	perPage: number;
	orderBy: IntegracaoComErpRotinasIntegradasSortKey;
	sort: 'asc' | 'desc';
	codigo: string;
	modulo: string;
	nome: string;
};

export type IntegracaoComErpRotinaIntegradaRecord = {
	id: string;
	codigo: string;
	modulo: string;
	nome: string;
	integrado: boolean;
	ativo: boolean;
};

export type IntegracaoComErpRotinasIntegradasResponse = {
	data: IntegracaoComErpRotinaIntegradaRecord[];
	meta: {
		total: number;
		from: number;
		to: number;
		page: number;
		pages: number;
		perPage: number;
	};
};
