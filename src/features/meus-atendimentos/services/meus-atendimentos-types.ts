export type MeusAtendimentosFilters = {
	page: number;
	perPage: number;
	protocolo: string;
	status: string;
	dataInicio: string;
	dataFim: string;
};

export type MeusAtendimentosRow = {
	id: string;
	protocolo: string;
	data_abertura: number;
	data_encerramento: number;
	status: string;
};

export type MeusAtendimentosListResponse = {
	data: MeusAtendimentosRow[];
	meta: {
		page: number;
		pages: number;
		perPage: number;
		from: number;
		to: number;
		total: number;
	};
	nextCursor: string | null;
};

export type AtendimentoTimelineEntry = {
	id: string;
	authorName: string;
	authorType: string;
	body: string;
	createdAt: number;
	partType: string;
};

export type AtendimentoDetail = {
	id: string;
	protocolo: string;
	status: string;
	assunto: string;
	dataAbertura: number;
	dataEncerramento: number;
	timeline: AtendimentoTimelineEntry[];
};

export type IntercomAccountOption = {
	id: string;
	displayName: string;
};

export type IntercomBindingRecord = {
	configId: string;
	bindingId: string;
	enabled: boolean;
	providerAccountId: string;
	externalUserId: string;
	consentState: string;
	status: string;
	bindingStatus: string;
	accounts: IntercomAccountOption[];
};
