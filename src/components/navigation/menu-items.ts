import type { LucideIcon } from 'lucide-react';
import {
	BadgePercent,
	BookOpen,
	BookCopy,
	BriefcaseBusiness,
	Brush,
	Cable,
	Building2,
	ChartColumnBig,
	CircleHelp,
	ClipboardList,
	ContactRound,
	Database,
	FileBarChart2,
	FileCode2,
	FileImage,
	FileSearch,
	FolderTree,
	Globe,
	Gift,
	HandCoins,
	HandHelping,
	Headset,
	History,
	RefreshCcw,
	IdCard,
	Image,
	LayoutDashboard,
	List,
	Map,
	Network,
	PanelsTopLeft,
	Package,
	Play,
	Plug,
	Search,
	SearchCheck,
	SearchCode,
	Settings,
	ShieldCheck,
	ShoppingCart,
	Smartphone,
	Sparkles,
	Tags,
	TicketPercent,
	Truck,
	UserCog,
	UserLock,
	Users,
	Users2,
	Warehouse,
	Wrench,
	LogOut,
	Bell,
	ScrollText,
	AppWindow,
	ClipboardCheck,
	FileInput,
	Mail,
	MonitorCog,
	Palette,
	Ban,
	Waypoints,
} from 'lucide-react';
import type { AuthPermission, AuthSession, AuthTenant } from '@/src/features/auth/types/auth';
import { translateMenuFromCandidates, translateMenuLabel } from '@/src/i18n/menu';
import type { Locale } from '@/src/i18n/types';
import { normalizeSearchValue } from '@/src/lib/text-normalization';

export type MenuItem = {
	key: string;
	label: string;
	icon: LucideIcon;
	to?: string;
	external?: boolean;
	action?: 'logout';
	children?: MenuItem[];
};

type RouteTarget = {
	to?: string;
	external?: boolean;
	action?: 'logout';
};

type LegacyRootDefinition = {
	key: string;
	label: string;
	icon: LucideIcon;
	component?: string;
	children?: LegacyRootDefinition[];
};

const IMPLEMENTED_COMPONENT_ROUTES: Record<string, string> = {
	'editor-sql-form': '/ferramentas/editor-sql',
	'editor-sql-tabed-form': '/ferramentas/editor-sql',
	'http-client-form': '/ferramentas/http-client',
	'dicionario-modulos-list': '/ferramentas/dicionario-de-dados',
	'dicionario-list': '/ferramentas/dicionario-de-dados',
	'pedidos-list': '/pedidos',
	'produtos-list': '/produtos',
	'produtos-precificadores-list': '/produtos-x-precificadores',
	'restricoes-produtos-list': '/restricoes-produtos',
	'excecoes-produtos-list': '/excecoes-produtos',
	'produtos-filial-list': '/produtos-x-filiais',
	'tributos-list': '/tributos',
	'tributos-partilha-list': '/tributos-partilha',
	'produtos-tabelas-preco-list': '/produtos-x-tabelas-de-preco',
	dashboard: '/dashboard',
	'administradores-list': '/administradores',
	'administradores-master-list': '/administradores',
	'perfis-list': '/perfis',
	'linhas-list': '/linhas',
	'cores-list': '/cores',
	'banners-list': '/banners',
	'promocoes-list': '/combos',
	'grupos-promocao-list': '/grupos-de-combos',
	'campanhas-levepague-list': '/leve-e-pague',
	'compre-ganhe-list': '/compre-e-ganhe',
	'campanhas-descontounidade-list': '/desconto-na-unidade',
	'campanhas-compre-junto-list': '/compre-junto',
	'cupons-desconto-list': '/cupons-desconto',
	'notificacoes-list': '/notificacoes-app',
	'areas-banner-list': '/areas-banner',
	'emails-list': '/emails',
	'emails-templates-list': '/templates-de-emails',
	'paginas-list': '/paginas',
	'areas-pagina-list': '/areas-paginas',
	'colecoes-list': '/colecoes',
	'listas-list': '/listas',
	'marcas-list': '/marcas',
	'departamentos-list': '/departamentos',
	'fornecedores-list': '/fornecedores',
	'grades-list': '/grades',
	'produtos-departamentos-list': '/produtos-departamentos',
	'produtos-aviseme-list': '/avise-me',
	'transportadoras-list': '/transportadoras',
	'filiais-list': '/filiais',
	'canais-distribuicao-list': '/canais-de-distribuicao',
	'grupos-filiais-list': '/grupos-de-filiais',
	'termos-pesquisa-list': '/termos-de-pesquisa',
	'logs-list': '/logs',
	'formularios-list': '/formularios',
	'formularios-campos-list': '/formularios',
	'processos-imagens-list': '/processamento-de-imagens',
	'processos-arquivos-list': '/importar-planilha',
	'fases-list': '/fases',
	'sequenciais-list': '/sequenciais',
	'limites-credito-list': '/limites-de-credito',
	'formas-pagamento-list': '/formas-de-pagamento',
	'condicoes-pagamento-list': '/condicoes-de-pagamento',
	'tabelas-preco-list': '/tabelas-de-preco',
	'formas-entrega-list': '/formas-de-entrega',
	'portos-list': '/portos',
	'areas-atuacao-list': '/areas-de-atuacao',
	'pracas-list': '/pracas',
	'rotas-list': '/rotas',
	'supervisores-list': '/supervisores',
	'contatos-list': '/contatos',
	'usuarios-list': '/usuarios',
	'vendedores-list': '/vendedores',
	'grupos-list': '/grupos-clientes',
	'redes-list': '/redes-clientes',
	'segmentos-list': '/segmentos-clientes',
	'regras-cadastro-list': '/regras-de-cadastro',
	'clientes-list': '/clientes',
	'relatorios-master-list': '/relatorios',
	'relatorios-list': '/relatorios',
	'relatorios-v2-list': '/relatorios',
	'configuracoes-clientes-form': '/configuracoes/clientes',
	'configuracoes-entregas-form': '/configuracoes/entregas',
	'configuracoes-geral-form': '/configuracoes/geral',
	'configuracoes-inicio-form': '/configuracoes/inicio',
	'configuracoes-layout-form': '/configuracoes/layout',
	'configuracoes-ia-form': '/configuracoes/assistente-virtual',
	'chatbot-empresa-form': '/configuracoes/assistente-vendas-ia',
	'configuracoes-pedidos-form': '/configuracoes/pedidos',
	'configuracoes-precos-form': '/configuracoes/precos',
	'configuracoes-produtos-form': '/configuracoes/produtos',
	'configuracoes-vendedores-form': '/configuracoes/vendedores',
	'integracao-usuarios-list': '/api-de-integracao/aplicativos',
	'integracao-usuarios-form': '/api-de-integracao/aplicativos',
	'integracao-atendimento-form': '/integracoes/atendimento',
	'integracao-cliente-form': '/integracoes/clientes',
	'integracao-apps-form': '/integracoes/aplicativos',
	'integracao-notificacoes-form': '/integracoes/notificacoes',
	'integracao-seguranca-form': '/integracoes/seguranca',
	'integracao-scripts-form': '/integracoes/scripts',
	'integracao-marketing-form': '/integracoes/marketing',
	'integracao-login-form': '/integracoes/login-social',
	'integracao-promocoes-form': '/integracoes/promocoes',
	'integracao-logistica-form': '/integracoes/logistica',
	'integracao-financeiro-form': '/integracoes/financeiro',
	'gateways-pagamento-list': '/integracoes/gateways-pagamento',
	'gateways-pagamento-form': '/integracoes/gateways-pagamento/novo',
	'cadastro-parametros-list': '/configuracoes/parametros',
	'cadastro-parametros-form': '/configuracoes/parametros',
	'parametros-empresa-list': '/configuracoes/parametros',
	'chatbot-empresas-list': '/configuracoes/assistente-vendas-ia',
	'notificacoes-painel-list': '/legacy/notificacoes-painel-list',
};

const IMPLEMENTED_CLICK_ROUTES: Record<string, string> = {
	'renew-cache': '/renovar-cache',
};

const ROOT_MENU: LegacyRootDefinition[] = [
	{ key: 'dashboard', label: 'Inicio', icon: LayoutDashboard, component: 'dashboard' },
	{ key: 'empresas-list', label: 'Empresas', icon: Warehouse, component: 'empresas-list' },
	{ key: 'implantacoes-list', label: 'Implantacoes', icon: Sparkles, component: 'implantacoes-list' },
	{ key: 'chatbot-empresas-list', label: 'Assistente de Vendas IA', icon: Sparkles, component: 'chatbot-empresas-list' },
	{ key: 'changelog-list', label: 'Atualizacoes Gerais', icon: History, component: 'changelog-list' },
	{
		key: 'infraestrutura',
		label: 'Infraestrutura',
		icon: Network,
		children: [{ key: 'infraestrutura-servidores-api-list', label: 'Servidores de API', icon: MonitorCog, component: 'infraestrutura-servidores-api-list' }],
	},
	{
		key: 'integracao-erp',
		label: 'Integracao com ERP',
		icon: Waypoints,
		children: [
			{ key: 'integracao-dashboard-form', label: 'Dashboard', icon: ChartColumnBig, component: 'integracao-dashboard-form' },
			{ key: 'servicos-integracao-falha-list', label: 'Servicos com Falha', icon: CircleHelp, component: 'servicos-integracao-falha-list' },
		],
	},
	{
		key: 'cadastros-root',
		label: 'Cadastros',
		icon: PanelsTopLeft,
		children: [
			{ key: 'funcionalidades-list', label: 'Funcionalidades', icon: PanelsTopLeft, component: 'funcionalidades-list' },
			{ key: 'componentes-list', label: 'Componentes', icon: AppWindow, component: 'componentes-list' },
			{ key: 'fases-list', label: 'Fases', icon: ClipboardCheck, component: 'fases-list' },
			{ key: 'relatorios-master-list', label: 'Relatorios', icon: FileBarChart2, component: 'relatorios-master-list' },
			{ key: 'emails-payloads-list', label: 'E-mails Payloads', icon: FileInput, component: 'emails-payloads-list' },
			{ key: 'apps-list', label: 'Apps', icon: AppWindow, component: 'apps-list' },
		],
	},
	{ key: 'notificacoes-painel-list', label: 'Notificacoes', icon: Bell, component: 'notificacoes-painel-list' },
	{
		key: 'ferramentas-root',
		label: 'Ferramentas',
		icon: Wrench,
		children: [
			{ key: 'editor-sql-form', label: 'Editor SQL', icon: FileCode2, component: 'editor-sql-form' },
			{ key: 'http-client-form', label: 'HTTP Client', icon: Globe, component: 'http-client-form' },
			{ key: 'dicionario-modulos-list', label: 'Dicionario de Dados', icon: Database, component: 'dicionario-modulos-list' },
		],
	},
	{ key: 'administradores-master-list', label: 'Administradores', icon: ShieldCheck, component: 'administradores-master-list' },
	{ key: 'ips-bloqueados-list', label: 'IPs Bloqueados', icon: Ban, component: 'ips-bloqueados-list' },
];

const LEGACY_EXTRA_COMPONENTS: Record<string, { label: string; icon: LucideIcon; component?: string; action?: 'logout'; tenantUrl?: boolean }> = {
	tools: { label: 'Ferramentas', icon: Wrench },
	toolsDictionary: { label: 'Dicionario de Dados', icon: Database, component: 'dicionario-list' },
	toolsEditorSql: { label: 'Editor SQL', icon: FileCode2, component: 'editor-sql-tabed-form' },
	toolsHttpClient: { label: 'HTTP Client', icon: Globe, component: 'http-client-form' },
	toolsImplantacao: { label: 'Assistente de Implantacao', icon: Sparkles, component: 'assistente-implantacao' },
	site: { label: 'Ir para o Site', icon: Globe, tenantUrl: true },
	atendimento: { label: 'Meus Atendimentos', icon: Headset, component: 'atendimentos-list' },
	artigos: { label: 'Base de Conhecimento', icon: BookOpen, component: 'artigos-list' },
	changelogPublico: { label: 'Atualizacoes Gerais', icon: History, component: 'changelog-publico-list' },
	logout: { label: 'Sair', icon: LogOut, action: 'logout' },
	implantacaoMonday: { label: 'Assistente de Implantacao', icon: Sparkles, component: 'monday-view-form' },
};

const FA_ICON_MAP: Array<{ matcher: RegExp; icon: LucideIcon }> = [
	{ matcher: /fa-shopping-cart/, icon: ShoppingCart },
	{ matcher: /fa-book(?!-open)/, icon: BookCopy },
	{ matcher: /fa-gift/, icon: Gift },
	{ matcher: /fa-tags?/, icon: Tags },
	{ matcher: /fa-folder-tree/, icon: FolderTree },
	{ matcher: /fa-industry/, icon: Building2 },
	{ matcher: /fa-bullhorn/, icon: Sparkles },
	{ matcher: /fa-image/, icon: Image },
	{ matcher: /fa-map-signs/, icon: Map },
	{ matcher: /fa-envelope/, icon: Mail },
	{ matcher: /fa-bell-on|fa-bell/, icon: Bell },
	{ matcher: /fa-percentage/, icon: BadgePercent },
	{ matcher: /fa-ticket-alt/, icon: TicketPercent },
	{ matcher: /fa-shopping-basket/, icon: Package },
	{ matcher: /fa-th(?!-)/, icon: PanelsTopLeft },
	{ matcher: /fa-search-plus/, icon: SearchCheck },
	{ matcher: /fa-scanner|fa-search/, icon: Search },
	{ matcher: /fa-users$/, icon: Users },
	{ matcher: /fa-user-lock/, icon: UserLock },
	{ matcher: /fa-user-chart/, icon: ChartColumnBig },
	{ matcher: /fa-address-book/, icon: ContactRound },
	{ matcher: /fa-user-friends/, icon: Users2 },
	{ matcher: /fa-chart-network/, icon: Network },
	{ matcher: /fa-truck-loading|fa-truck/, icon: Truck },
	{ matcher: /fa-hand-holding-box/, icon: HandHelping },
	{ matcher: /fa-sack-dollar|fa-money-check|fa-money-bill|fa-dollar-sign|fa-coins|fa-cash-register/, icon: HandCoins },
	{ matcher: /fa-random|fa-exchange-alt/, icon: Waypoints },
	{ matcher: /fa-table|fa-sitemap/, icon: PanelsTopLeft },
	{ matcher: /fa-warehouse-alt|fa-warehouse/, icon: Warehouse },
	{ matcher: /fa-toolbox|fa-tool/, icon: Wrench },
	{ matcher: /fa-solar-system|fa-smog/, icon: Cable },
	{ matcher: /fa-concierge-bell/, icon: CircleHelp },
	{ matcher: /fa-users-crown/, icon: ShieldCheck },
	{ matcher: /fa-user-cog/, icon: UserCog },
	{ matcher: /fa-id-card/, icon: IdCard },
	{ matcher: /fa-mobile/, icon: Smartphone },
	{ matcher: /fa-headset/, icon: Headset },
	{ matcher: /fa-fingerprint/, icon: ShieldCheck },
	{ matcher: /fa-code/, icon: SearchCode },
	{ matcher: /fa-file-image/, icon: FileImage },
	{ matcher: /fa-file-excel/, icon: FileBarChart2 },
	{ matcher: /fa-file-search/, icon: FileSearch },
	{ matcher: /fa-play/, icon: Play },
	{ matcher: /fa-brush/, icon: Brush },
	{ matcher: /fa-database|fa-tasks-alt|fa-tasks/, icon: Database },
	{ matcher: /fa-download/, icon: ClipboardCheck },
	{ matcher: /fa-palette/, icon: Palette },
	{ matcher: /fa-list/, icon: List },
	{ matcher: /fa-user$/, icon: Users2 },
	{ matcher: /fa-briefcase/, icon: BriefcaseBusiness },
	{ matcher: /fa-sync|fa-redo|fa-refresh/, icon: RefreshCcw },
];

const ICON_MAP: Array<{ matcher: RegExp; icon: LucideIcon }> = [
	{ matcher: /(cores|color)/i, icon: Palette },
	{ matcher: /(emails|newsletter|e-mail|email)/i, icon: Mail },
	{ matcher: /(pagina|pages|content|conteudo|area de pagina|areas de pagina|area de banner|areas de banner|banner)/i, icon: FileCode2 },
	{ matcher: /(vendedores|seller)/i, icon: HandCoins },
	{ matcher: /(supervisor)/i, icon: ShieldCheck },
	{ matcher: /(grupo(s)? de cliente|customer group|rede(s)? de cliente|segmentos de cliente)/i, icon: ClipboardList },
	{ matcher: /(contato|contacts)/i, icon: BookOpen },
	{ matcher: /(usuarios|users)/i, icon: ShieldCheck },
	{ matcher: /(linhas|line(s)?$)/i, icon: PanelsTopLeft },
	{ matcher: /(filiais|branch(es)?|grupos de filiais|canais de distribuicao)/i, icon: Building2 },
	{ matcher: /(tachometer|dashboard|chart-pie|chart-line|chart-network|chart-column|chart-bar)/i, icon: ChartColumnBig },
	{ matcher: /(user-cog|shield|admin)/i, icon: ShieldCheck },
	{ matcher: /(users|clientes|cliente)/i, icon: Users2 },
	{ matcher: /(report|relatorio|file-invoice|file-alt)/i, icon: FileBarChart2 },
	{ matcher: /(config|settings|sliders)/i, icon: Settings },
	{ matcher: /(warehouse|building|company|empresa)/i, icon: Building2 },
	{ matcher: /(coins|cashback)/i, icon: HandCoins },
	{ matcher: /(globe|external-link)/i, icon: Globe },
	{ matcher: /(assistente virtual|virtual assistant)/i, icon: Headset },
	{ matcher: /(assistente de vendas ia|sales assistant|chatbot)/i, icon: Sparkles },
	{ matcher: /(headset|support|atendimento)/i, icon: Headset },
	{ matcher: /(history|changelog)/i, icon: History },
	{ matcher: /(book|knowledge|artigo)/i, icon: BookOpen },
	{ matcher: /(code|sql|script|query)/i, icon: FileCode2 },
	{ matcher: /(database|dicionario)/i, icon: Database },
	{ matcher: /(network|plug|endpoint|gateway|erp)/i, icon: Plug },
	{ matcher: /(shopping-cart|pedido|orders)/i, icon: ShoppingCart },
	{ matcher: /(bell|notification|notificacao)/i, icon: Bell },
	{ matcher: /(clipboard|fase|tarefas)/i, icon: ClipboardList },
	{ matcher: /(wand|implantacao|magic)/i, icon: Sparkles },
];

function sortPermissions(left: AuthPermission, right: AuthPermission) {
	const leftNivel = Number(left.nivel ?? 0);
	const rightNivel = Number(right.nivel ?? 0);
	if (leftNivel !== rightNivel) {
		return leftNivel - rightNivel;
	}

	const leftPosicao = Number(left.posicao ?? 0);
	const rightPosicao = Number(right.posicao ?? 0);
	if (leftPosicao !== rightPosicao) {
		return leftPosicao - rightPosicao;
	}

	return normalizeSearchValue(left.nome).localeCompare(normalizeSearchValue(right.nome));
}

function isMenuPermission(permission: AuthPermission) {
	return permission.menu === true && permission.ativo !== false;
}

function getComponentRoute(component: string, fallbackKey: string) {
	const normalizedComponent = normalizeSearchValue(component);
	if (IMPLEMENTED_COMPONENT_ROUTES[normalizedComponent]) {
		return { to: IMPLEMENTED_COMPONENT_ROUTES[normalizedComponent] };
	}

	return { to: `/legacy/${encodeURIComponent(normalizedComponent || fallbackKey)}` };
}

function resolvePermissionRoute(permission: AuthPermission): RouteTarget {
	if (permission.url && permission.url !== 'javascript:;') {
		return {
			to: permission.url,
			external: /^https?:\/\//i.test(permission.url),
		};
	}

	if (permission.clique === 'logout') {
		return { action: 'logout' };
	}

	const normalizedClick = normalizeSearchValue(permission.clique || '');
	if (normalizedClick && IMPLEMENTED_CLICK_ROUTES[normalizedClick]) {
		return { to: IMPLEMENTED_CLICK_ROUTES[normalizedClick] };
	}

	if (permission.componente) {
		return getComponentRoute(permission.componente, permission.id || permission.chave || permission.slug);
	}

	return {};
}

function resolveExtraRoute(definition: (typeof LEGACY_EXTRA_COMPONENTS)[keyof typeof LEGACY_EXTRA_COMPONENTS], tenant: AuthTenant): RouteTarget {
	if (definition.action) {
		return { action: definition.action };
	}

	if (definition.tenantUrl && tenant.url) {
		return { to: tenant.url, external: true };
	}

	if (definition.component) {
		return getComponentRoute(definition.component, definition.component);
	}

	return {};
}

function mapLegacyRootDefinition(item: LegacyRootDefinition, locale: Locale): MenuItem {
	if (item.children?.length) {
		return {
			key: item.key,
			label: translateMenuLabel(locale, item.key, item.label),
			icon: item.icon,
			children: item.children.map((child) => mapLegacyRootDefinition(child, locale)),
		};
	}

	const route = item.component ? getComponentRoute(item.component, item.key) : {};
	return {
		key: item.key,
		label: translateMenuLabel(locale, item.key, item.label),
		icon: item.icon,
		...route,
	};
}

function resolveIcon(permission: AuthPermission): LucideIcon {
	const normalizedIcon = normalizeSearchValue(permission.icone ?? '');
	const faMatched = FA_ICON_MAP.find((item) => item.matcher.test(normalizedIcon));
	if (faMatched) {
		return faMatched.icon;
	}

	const haystack = normalizeSearchValue([permission.icone ?? '', permission.nome, permission.componente, permission.slug, permission.chave].join(' '));
	const matched = ICON_MAP.find((item) => item.matcher.test(haystack));
	return matched?.icon ?? ScrollText;
}

function buildDynamicMenu(session: AuthSession, locale: Locale): MenuItem[] {
	const permissions = session.user.funcionalidades.filter(isMenuPermission).sort(sortPermissions);
	const levelOne = permissions.filter((permission) => Number(permission.nivel ?? 0) === 1);
	const levelTwo = permissions.filter((permission) => Number(permission.nivel ?? 0) === 2);

	const items: MenuItem[] = levelOne.map((parent) => {
		const children = levelTwo
			.filter((permission) => permission.idFuncionalidadePai === parent.id)
			.map((permission) => ({
				key: permission.id || permission.chave || permission.slug,
				label: translateMenuFromCandidates(locale, [permission.componente, permission.slug, permission.chave, permission.id], permission.nome),
				icon: resolveIcon(permission),
				...resolvePermissionRoute(permission),
			}))
			.filter((item) => item.to || item.action);

		if (children.length) {
			return {
				key: parent.id || parent.chave || parent.slug,
				label: translateMenuFromCandidates(locale, [parent.componente, parent.slug, parent.chave, parent.id], parent.nome),
				icon: resolveIcon(parent),
				children,
			} satisfies MenuItem;
		}

		const route = resolvePermissionRoute(parent);
		return {
			key: parent.id || parent.chave || parent.slug,
			label: translateMenuFromCandidates(locale, [parent.componente, parent.slug, parent.chave, parent.id], parent.nome),
			icon: resolveIcon(parent),
			...route,
		} satisfies MenuItem;
	});

	return items.filter((item) => Boolean(item.to || item.action || item.children?.length));
}

function buildStandardExtras(session: AuthSession, locale: Locale): MenuItem[] {
	const items: MenuItem[] = [];
	const tenant = session.currentTenant;

	if (normalizeSearchValue(tenant.status) === 'homologacao') {
		const implantacao = tenant.mondayUrl ? LEGACY_EXTRA_COMPONENTS.implantacaoMonday : LEGACY_EXTRA_COMPONENTS.toolsImplantacao;
		items.push({
			key: 'assistente-implantacao',
			label: translateMenuLabel(locale, 'assistente-implantacao', tenant.mondayUrl ? 'Assistente de Implantacao (Monday)' : 'Assistente de Implantacao'),
			icon: implantacao.icon,
			...resolveExtraRoute(implantacao, tenant),
		});
	}

	if (session.user.master) {
		items.push({
			key: 'ferramentas',
			label: translateMenuLabel(locale, 'ferramentas', LEGACY_EXTRA_COMPONENTS.tools.label),
			icon: LEGACY_EXTRA_COMPONENTS.tools.icon,
			children: [
				{
					key: 'tools-dictionary',
					label: translateMenuLabel(locale, 'tools-dictionary', LEGACY_EXTRA_COMPONENTS.toolsDictionary.label),
					icon: LEGACY_EXTRA_COMPONENTS.toolsDictionary.icon,
					...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.toolsDictionary, tenant),
				},
				{
					key: 'tools-editor-sql',
					label: translateMenuLabel(locale, 'tools-editor-sql', LEGACY_EXTRA_COMPONENTS.toolsEditorSql.label),
					icon: LEGACY_EXTRA_COMPONENTS.toolsEditorSql.icon,
					...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.toolsEditorSql, tenant),
				},
				{
					key: 'tools-http-client',
					label: translateMenuLabel(locale, 'tools-http-client', LEGACY_EXTRA_COMPONENTS.toolsHttpClient.label),
					icon: LEGACY_EXTRA_COMPONENTS.toolsHttpClient.icon,
					...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.toolsHttpClient, tenant),
				},
				{
					key: 'tools-implantacao',
					label: translateMenuLabel(locale, 'tools-implantacao', LEGACY_EXTRA_COMPONENTS.toolsImplantacao.label),
					icon: LEGACY_EXTRA_COMPONENTS.toolsImplantacao.icon,
					...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.toolsImplantacao, tenant),
				},
			],
		});
	}

	items.push(
		{
			key: 'site',
			label: translateMenuLabel(locale, 'site', LEGACY_EXTRA_COMPONENTS.site.label),
			icon: LEGACY_EXTRA_COMPONENTS.site.icon,
			...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.site, tenant),
		},
		{
			key: 'atendimento',
			label: translateMenuLabel(locale, 'atendimento', LEGACY_EXTRA_COMPONENTS.atendimento.label),
			icon: LEGACY_EXTRA_COMPONENTS.atendimento.icon,
			...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.atendimento, tenant),
		},
		{
			key: 'artigos',
			label: translateMenuLabel(locale, 'artigos', LEGACY_EXTRA_COMPONENTS.artigos.label),
			icon: LEGACY_EXTRA_COMPONENTS.artigos.icon,
			...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.artigos, tenant),
		},
	);

	if (normalizeSearchValue(tenant.id) !== 'agileecommerce') {
		items.push({
			key: 'changelog-publico',
			label: translateMenuLabel(locale, 'changelog-publico', LEGACY_EXTRA_COMPONENTS.changelogPublico.label),
			icon: LEGACY_EXTRA_COMPONENTS.changelogPublico.icon,
			...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.changelogPublico, tenant),
		});
	}

	items.push({
		key: 'logout',
		label: translateMenuLabel(locale, 'logout', LEGACY_EXTRA_COMPONENTS.logout.label),
		icon: LEGACY_EXTRA_COMPONENTS.logout.icon,
		...resolveExtraRoute(LEGACY_EXTRA_COMPONENTS.logout, tenant),
	});

	return items.filter((item) => item.to || item.action || item.children?.length);
}

export function getMenuItems(session: AuthSession | null, locale: Locale): MenuItem[] {
	if (!session) {
		return [];
	}

	const isRootTenant = normalizeSearchValue(session.currentTenant.id) === 'agileecommerce';
	if (isRootTenant && session.user.master) {
		return ROOT_MENU.map((item) => mapLegacyRootDefinition(item, locale));
	}

	return [...buildDynamicMenu(session, locale), ...buildStandardExtras(session, locale)];
}

export function flattenMenuItems(menuItems: MenuItem[]) {
	return menuItems.flatMap((item) => {
		if (!item.children?.length) {
			return item.to || item.action ? [{ ...item, groupLabel: '' }] : [];
		}

		return item.children.map((child) => ({
			...child,
			groupLabel: item.label,
		}));
	});
}
