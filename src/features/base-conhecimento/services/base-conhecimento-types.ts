export type BaseConhecimentoFilters = {
	page: number;
	perPage: number;
	phrase: string;
};

export type BaseConhecimentoItem = {
	id: string;
	titulo: string;
	descricao: string;
	dataCriacao: number;
	html: string;
};

export type BaseConhecimentoResponse = {
	data: BaseConhecimentoItem[];
	meta: {
		page: number;
		pages: number;
		perPage: number;
		from: number;
		to: number;
		total: number;
	};
};
