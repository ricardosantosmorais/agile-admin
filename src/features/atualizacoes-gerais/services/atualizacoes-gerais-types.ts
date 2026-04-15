export type AtualizacoesGeraisFilters = {
	plataforma: string;
	tipo: string;
	mesInicio: string;
	mesFim: string;
	busca: string;
};

export type AtualizacaoGeralItem = {
	id: string;
	titulo: string;
	data: string;
	plataforma: string;
	tipo: string;
	apenasMaster: boolean;
	conteudo: string;
};

export type AtualizacaoGeralGroup = {
	key: string;
	title: string;
	items: AtualizacaoGeralItem[];
};

export type AtualizacoesGeraisResponse = {
	data: AtualizacaoGeralItem[];
	meta: {
		total: number;
	};
};
