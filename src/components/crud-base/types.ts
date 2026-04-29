import type { InputHTMLAttributes } from 'react';
import type { AppDataTableFilterConfig } from '@/src/components/data-table/types';
import type { AppDataTableRowAction } from '@/src/components/data-table/types';
import type { FeatureKey } from '@/src/features/auth/services/permissions';
import type { LookupOption } from '@/src/components/ui/lookup-select';
import type { TranslationParams } from '@/src/i18n/types';

export type CrudResource =
	| 'funcionalidades'
	| 'componentes'
	| 'componentes_campos'
	| 'relatorios'
	| 'relatorios/grupos'
	| 'implantacao/categorias_tarefas'
	| 'implantacao/tarefas'
	| 'fases'
	| 'categorias_tarefas'
	| 'agilesync_empresas'
	| 'emails_payloads'
	| 'apps'
	| 'formularios'
	| 'formularios_campos'
	| 'produtos_precificadores'
	| 'tributos'
	| 'tributos_partilha'
	| 'produtos/filiais'
	| 'tabelas_preco'
	| 'formas_pagamento'
	| 'condicoes_pagamento'
	| 'limites_credito'
	| 'grupos_filiais'
	| 'termos_pesquisa'
	| 'sequenciais'
	| 'implantacao/fases'
	| 'formas_entrega'
	| 'transportadoras'
	| 'portos'
	| 'areas_atuacao'
	| 'rotas'
	| 'banners'
	| 'clientes'
	| 'empresas'
	| 'contatos'
	| 'campanhas'
	| 'cupons_desconto'
	| 'notificacoes'
	| 'notificacoes_painel'
	| 'linhas'
	| 'cores'
	| 'areas_banner'
	| 'emails'
	| 'emails_templates'
	| 'paginas'
	| 'areas_pagina'
	| 'usuarios'
	| 'supervisores'
	| 'vendedores'
	| 'grupos'
	| 'regras_cadastro'
	| 'colecoes'
	| 'listas'
	| 'marcas'
	| 'departamentos'
	| 'fornecedores'
	| 'grades'
	| 'grupos_promocao'
	| 'pracas'
	| 'redes'
	| 'segmentos'
	| 'filiais'
	| 'clusters'
	| 'templates_integracao'
	| 'administradores_master'
	| 'erps'
	| 'templates'
	| 'parametros_grupo'
	| 'parametros_cadastro'
	| 'querys'
	| 'scripts'
	| 'endpoints'
	| 'gateways'
	| 'gateways_endpoints'
	| 'interfaces_consulta'
	| 'acoes'
	| 'servicos_cadastros'
	| 'canais_distribuicao'
	| 'perfis_administradores'
	| 'changelog'
	| 'integracao-aplicativos'
	| 'gateways_pagamento'
	| 'produtos'
	| 'promocoes'
	| 'compre_ganhe'
	| 'brindes';

export type CrudRecord = {
	id?: string;
	ativo?: boolean | number | string;
	disponivel?: boolean | number | string;
	codigo?: string | null;
	nome?: string | null;
	titulo?: string | null;
	email?: string | null;
	posicao?: number | string | null;
	link_externo?: string | null;
	perfil?: string | null;
	texto?: string | null;
	id_area_pagina?: string | null;
	hexa1?: string | null;
	hexa2?: string | null;
	area?: {
		id?: string;
		nome?: string | null;
	} | null;
	url?: {
		slug?: string | null;
	} | null;
	[key: string]: unknown;
};

export type CrudListRecord = CrudRecord & { id: string };

export type CrudListFilters = {
	page: number;
	perPage: number;
	orderBy: string;
	sort: 'asc' | 'desc';
	[key: string]: string | number;
};

export type CrudListResponse = {
	data: CrudListRecord[];
	meta: {
		page: number;
		pages: number;
		perPage: number;
		from: number;
		to: number;
		total: number;
		order?: string;
		sort?: string;
	};
};

export type CrudOption = {
	value: string;
	label: string;
};

export type CrudFieldOption = { value: string; labelKey: string; label: string } | { value: string; label: string };

export type CrudFieldConfig = {
	key: string;
	labelKey: string;
	label: string;
	type:
		| 'text'
		| 'email'
		| 'password'
		| 'number'
		| 'date'
		| 'time'
		| 'datetime-local'
		| 'textarea'
		| 'richtext'
		| 'select'
		| 'lookup'
		| 'toggle'
		| 'color'
		| 'image'
		| 'file'
		| 'icon'
		| 'custom';
	defaultValue?: string | number | boolean | null;
	hidden?: (context: { form: CrudRecord; isEditing: boolean }) => boolean;
	disabled?: boolean | ((context: { form: CrudRecord; isEditing: boolean }) => boolean);
	mask?: 'cpf' | 'cnpj' | 'phone' | 'mobile' | 'cep' | 'currency' | 'decimal';
	layoutClassName?: string;
	required?: boolean;
	placeholder?: string;
	prefixText?: string;
	suffixText?: string;
	maxLength?: number;
	rows?: number;
	inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
	options?: CrudFieldOption[];
	optionsResource?: CrudResource;
	lookupStateKey?: string;
	lookupDefaultOption?: LookupOption | null;
	lookupLoadOptions?: (context: {
		query: string;
		page: number;
		perPage: number;
		form: CrudRecord;
		isEditing: boolean;
		t: (key: string, fallback: string, params?: Record<string, string | number>) => string;
	}) => Promise<LookupOption[]>;
	mapLookupSelection?: (context: {
		option: LookupOption | null;
		form: CrudRecord;
		isEditing: boolean;
	}) => { value: unknown; lookup?: LookupOption | null };
	helperTextKey?: string;
	helperText?: string;
	accept?: Record<string, string[]>;
	uploadFormatsLabel?: string;
	maxSizeLabel?: string;
	uploadProfileId?: import('@/src/lib/upload-targets').UploadProfileId;
	uploadFolder?: string;
	validate?: (context: { value: unknown; form: CrudRecord; isEditing: boolean }) => string | null;
	render?: (context: {
		value: unknown;
		form: CrudRecord;
		isEditing: boolean;
		readOnly: boolean;
		disabled: boolean;
		patch: (key: string, value: unknown) => void;
		t: (key: string, fallback: string, params?: Record<string, string | number>) => string;
	}) => React.ReactNode;
};

export type CrudSectionConfig = {
	id: string;
	titleKey: string;
	title: string;
	layout?: 'grid' | 'stacked' | 'rows';
	fields: CrudFieldConfig[];
};

type CrudFilterMeta = {
	labelKey?: string;
	label?: string;
	visibility?: 'always' | 'lg' | 'xl' | '2xl';
	widthClassName?: string;
	summaryLabel?: string;
	getSummary?: AppDataTableFilterConfig<CrudListFilters>['getSummary'];
};

export type CrudColumnFilterConfig =
	| ({ kind: 'text'; key: keyof CrudListFilters; placeholder?: string; inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'] } & CrudFilterMeta)
	| ({ kind: 'select'; key: keyof CrudListFilters; options: Array<{ value: string; label: string; labelKey?: string }>; emptyLabel?: string } & CrudFilterMeta)
	| ({ kind: 'date-range'; fromKey: keyof CrudListFilters; toKey: keyof CrudListFilters } & CrudFilterMeta)
	| ({
			kind: 'number-range';
			fromKey: keyof CrudListFilters;
			toKey: keyof CrudListFilters;
			inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
			mask?: 'currency' | 'decimal';
			prefixText?: string;
			suffixText?: string;
	  } & CrudFilterMeta)
	| ({ kind: 'lookup'; key: keyof CrudListFilters; loadOptions: (query: string, page: number, perPage: number) => Promise<LookupOption[]>; pageSize?: number } & CrudFilterMeta)
	| ({ kind: 'custom'; render: Extract<AppDataTableFilterConfig<CrudListFilters>, { kind: 'custom' }>['render'] } & CrudFilterMeta);

export type CrudColumnConfig = {
	id: string;
	labelKey: string;
	label: string;
	sortKey?: string;
	visibility?: 'always' | 'lg' | 'xl' | '2xl';
	thClassName?: string;
	tdClassName?: string;
	filter?: CrudColumnFilterConfig;
	render?: (
		record: CrudRecord,
		context: {
			tenantUrl?: string | null;
			assetsBucketUrl?: string | null;
			t: (key: string, fallback: string, params?: Record<string, string | number>) => string;
		},
	) => React.ReactNode;
	valueKey?: string;
};

export type CrudDetailsItem = {
	key: string;
	labelKey: string;
	label: string;
	render: (record: CrudRecord) => React.ReactNode;
};

export type CrudModuleConfig = {
	key: string;
	resource: CrudResource;
	routeBase: string;
	featureKey: FeatureKey;
	listTitleKey: string;
	listTitle: string;
	listDescriptionKey: string;
	listDescription: string;
	formTitleKey: string;
	formTitle: string;
	breadcrumbParents?: Array<{
		labelKey: string;
		label: string;
		href?: string;
	}>;
	hideBreadcrumbSection?: boolean;
	breadcrumbSectionKey: string;
	breadcrumbSection: string;
	breadcrumbSectionHref?: string;
	breadcrumbModuleKey: string;
	breadcrumbModule: string;
	defaultFilters: CrudListFilters;
	columns: CrudColumnConfig[];
	mobileTitle: (record: CrudRecord) => React.ReactNode;
	mobileSubtitle?: (record: CrudRecord) => React.ReactNode;
	mobileMeta?: (record: CrudRecord) => React.ReactNode;
	details?: CrudDetailsItem[];
	selectable?: boolean;
	actionsColumnClassName?: string;
	extraFilters?: CrudColumnFilterConfig[];
	sections: CrudSectionConfig[];
	listEmbed?: string;
	formEmbed?: string;
	normalizeRecord?: (record: CrudRecord) => CrudRecord;
	beforeSave?: (record: CrudRecord) => CrudRecord;
	getSaveRedirectPath?: (context: { id?: string; isEditing: boolean; saved: CrudRecord[]; form: CrudRecord }) => string;
	stayOnSave?: boolean;
	renderHeaderActions?: (context: { id?: string; isEditing: boolean; readOnly: boolean }) => React.ReactNode;
	buildListRowActions?: (context: {
		record: CrudListRecord;
		access: { canView: boolean; canEdit: boolean; canDelete: boolean; canCreate: boolean; canList: boolean; canOpen: boolean };
		t: (key: string, fallback?: string, values?: TranslationParams) => string;
		refreshList: () => void;
		openDeleteConfirm: (ids: string[]) => void;
	}) => AppDataTableRowAction<CrudListRecord>[];
	canDeleteRow?: (record: CrudListRecord) => boolean;
	canSelectRow?: (record: CrudListRecord) => boolean;
	renderMobileBadges?: (
		record: CrudListRecord,
		context: {
			t: (key: string, fallback?: string, values?: TranslationParams) => string;
		},
	) => React.ReactNode;
	renderListBottom?: (context: { t: (key: string, fallback?: string, values?: TranslationParams) => string }) => React.ReactNode;
};

export type CrudDataClient = {
	list: (filters: CrudListFilters, embed?: string) => Promise<CrudListResponse>;
	getById: (id: string, embed?: string) => Promise<CrudRecord>;
	save: (payload: CrudRecord) => Promise<CrudRecord[]>;
	delete: (ids: string[]) => Promise<{ success: true }>;
	listOptions: (resource: CrudResource) => Promise<CrudOption[]>;
};
