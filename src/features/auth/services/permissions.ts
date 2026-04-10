import type { AuthPermission, AuthSession } from '@/src/features/auth/types/auth'
import { normalizeSearchValue } from '@/src/lib/text-normalization'

export type FeatureKey =
  | 'pedidos'
  | 'editorSql'
  | 'httpClient'
  | 'dicionarioDados'
  | 'integracaoAplicativos'
  | 'integracoesAtendimento'
  | 'produtos'
  | 'produtosPrecificadores'
  | 'restricoesProdutos'
  | 'excecoesProdutos'
  | 'produtosFiliais'
  | 'tributos'
  | 'tributosPartilha'
  | 'produtosTabelasPreco'
  | 'formasPagamento'
  | 'condicoesPagamento'
  | 'tabelasPreco'
  | 'limitesCredito'
  | 'filiais'
  | 'canaisDistribuicao'
  | 'gruposFiliais'
  | 'formularios'
  | 'termosPesquisa'
  | 'renovarCache'
  | 'processamentoImagens'
  | 'importarPlanilha'
  | 'logsManutencao'
  | 'fases'
  | 'sequenciais'
  | 'dashboard'
  | 'formasEntrega'
  | 'transportadoras'
  | 'portos'
  | 'areasAtuacao'
  | 'pracas'
  | 'rotas'
  | 'clientes'
  | 'usuarios'
  | 'vendedores'
  | 'supervisores'
  | 'contatos'
  | 'gruposClientes'
  | 'redesClientes'
  | 'segmentosClientes'
  | 'regrasCadastro'
  | 'administradores'
  | 'perfis'
  | 'relatorios'
  | 'configuracoes'
  | 'configuracoesClientes'
  | 'configuracoesEntregas'
  | 'configuracoesGeral'
  | 'configuracoesInicio'
  | 'configuracoesLayout'
  | 'configuracoesAssistenteVirtual'
  | 'configuracoesAssistenteVendasIa'
  | 'configuracoesPedidos'
  | 'parametros'
  | 'configuracoesPrecos'
  | 'configuracoesProdutos'
  | 'configuracoesVendedores'
  | 'linhas'
  | 'cores'
  | 'banners'
  | 'combos'
  | 'gruposCombos'
  | 'leveEPague'
  | 'compreEGanhe'
  | 'descontoUnidade'
  | 'compreJunto'
  | 'cuponsDesconto'
  | 'notificacoesApp'
  | 'templatesEmails'
  | 'areasBanner'
  | 'emails'
  | 'paginas'
  | 'areasPagina'
  | 'colecoes'
  | 'listas'
  | 'marcas'
  | 'departamentos'
  | 'fornecedores'
  | 'grades'
  | 'produtosDepartamentos'
  | 'produtosAviseme'

export type FeatureAction =
  | 'listar'
  | 'criar'
  | 'editar'
  | 'visualizar'
  | 'deletar'
  | 'logs'
  | 'desbloquear_cliente'

type FeatureConfig = {
  label: string
  matchers: string[]
  allowOpenWithoutAction?: boolean
}

type FeatureAccess = {
  canOpen: boolean
  canList: boolean
  canCreate: boolean
  canEdit: boolean
  canView: boolean
  canDelete: boolean
  canLogs: boolean
  canUnblockClient: boolean
}

const featureConfigs: Record<FeatureKey, FeatureConfig> = {
  pedidos: {
    label: 'Pedidos',
    matchers: ['pedido', 'pedidos', 'pedidos-list', 'pedido-list'],
  },
  editorSql: {
    label: 'Editor SQL',
    matchers: ['editor sql', 'editor-sql', 'editor-sql-form', 'editor-sql-tabed-form', 'tools-editor-sql'],
  },
  httpClient: {
    label: 'HTTP Client',
    matchers: ['http client', 'http-client', 'http-client-form', 'tools-http-client'],
  },
  dicionarioDados: {
    label: 'Dicionário de Dados',
    matchers: ['dicionario de dados', 'dicionário de dados', 'dicionario-modulos-list', 'dicionario-list', 'tools-dictionary'],
  },
  integracaoAplicativos: {
    label: 'Aplicativos',
    matchers: ['integracao-usuarios-list', 'integracao usuarios', 'api de integracao aplicativos', 'aplicativos api'],
  },
  integracoesAtendimento: {
    label: 'Integrações > Atendimento',
    matchers: ['integracao-atendimento-form', 'integracoes atendimento', 'integrações atendimento', 'atendimento integracao', 'atendimento integração'],
  },
  produtos: {
    label: 'Produtos',
    matchers: ['produto', 'produtos', 'produtos-list', 'produtos-form'],
  },
  produtosPrecificadores: {
    label: 'Produtos x Precificadores',
    matchers: ['produtos x precificadores', 'produto x precificadores', 'produtos-precificadores', 'produtos_precificadores', 'precificadores produtos'],
  },
  restricoesProdutos: {
    label: 'Restrição x Produtos',
    matchers: ['restricao x produtos', 'restrição x produtos', 'restricoes-produtos', 'restricoes_produtos', 'restricao produtos', 'restrição produtos'],
  },
  excecoesProdutos: {
    label: 'Exceções x Produtos',
    matchers: ['excecao x produtos', 'exceção x produtos', 'excecoes-produtos', 'excecoes_produtos', 'excecao produtos', 'exceção produtos'],
  },
  produtosFiliais: {
    label: 'Produtos x Filiais',
    matchers: ['produto x filial', 'produtos x filiais', 'produtos-filial', 'produtos_filial', 'produtos-filiais', 'produtos_filiais'],
  },
  tributos: {
    label: 'Tributos',
    matchers: ['tributo', 'tributos'],
  },
  tributosPartilha: {
    label: 'Tributos x Partilha',
    matchers: ['tributos x partilha', 'tributo x partilha', 'tributos-partilha', 'tributos_partilha'],
  },
  produtosTabelasPreco: {
    label: 'Produtos x Tabelas de Preco',
    matchers: ['produtos x tabelas de preco', 'produto x tabelas de preco', 'produtos-tabelas-preco', 'produtos_tabelas_preco'],
  },
  formasPagamento: {
    label: 'Formas de Pagamento',
    matchers: ['forma de pagamento', 'formas de pagamento', 'formas-pagamento', 'formas_pagamento'],
  },
  condicoesPagamento: {
    label: 'Condicoes de Pagamento',
    matchers: ['condicao de pagamento', 'condicoes de pagamento', 'condicoes-pagamento', 'condicoes_pagamento'],
  },
  tabelasPreco: {
    label: 'Tabelas de Preco',
    matchers: ['tabela de preco', 'tabelas de preco', 'tabelas-preco', 'tabelas_preco'],
  },
  limitesCredito: {
    label: 'Limites de Credito',
    matchers: ['limite de credito', 'limites de credito', 'limites-credito', 'limites_credito'],
  },
  filiais: {
    label: 'Filiais',
    matchers: ['filial', 'filiais'],
  },
  canaisDistribuicao: {
    label: 'Canais de Distribuicao',
    matchers: ['canal de distribuicao', 'canais de distribuicao', 'canais-distribuicao', 'canais_distribuicao'],
  },
  gruposFiliais: {
    label: 'Grupos de Filiais',
    matchers: ['grupo de filiais', 'grupos de filiais', 'grupo filial', 'grupos filial', 'grupos-filiais', 'grupos_filiais'],
  },
  formularios: {
    label: 'Formularios',
    matchers: ['formularios-list', 'formularios-campos-list', 'formularios', 'formulario', 'campos de formularios', 'campos de formulários'],
  },
  termosPesquisa: {
    label: 'Termos de Pesquisa',
    matchers: ['termos de pesquisa', 'termo de pesquisa', 'termos-pesquisa', 'termos_pesquisa'],
  },
  renovarCache: {
    label: 'Renovar Cache',
    matchers: ['renew-cache', 'renovar cache'],
    allowOpenWithoutAction: true,
  },
  processamentoImagens: {
    label: 'Processamento de Imagens',
    matchers: ['processos-imagens-list', 'processamento de imagens', 'processos imagens'],
  },
  importarPlanilha: {
    label: 'Importar Planilha',
    matchers: ['processos-arquivos-list', 'importar planilha', 'processos arquivos', 'importacao planilha'],
  },
  logsManutencao: {
    label: 'Logs',
    matchers: ['logs-list', 'manutencao logs', 'manutenção logs'],
  },
  fases: {
    label: 'Fases',
    matchers: ['fase', 'fases', 'implantacao/fases', 'implantacao-fases'],
  },
  sequenciais: {
    label: 'Sequenciais',
    matchers: ['sequencial', 'sequenciais'],
  },
  dashboard: {
    label: 'Dashboard',
    matchers: ['dashboard', 'inicio'],
  },
  formasEntrega: {
    label: 'Formas de Entrega',
    matchers: ['forma de entrega', 'formas de entrega', 'formas-entrega', 'formas_entrega'],
  },
  transportadoras: {
    label: 'Transportadoras',
    matchers: ['transportadora', 'transportadoras'],
  },
  portos: {
    label: 'Portos',
    matchers: ['porto', 'portos'],
  },
  areasAtuacao: {
    label: 'Areas de Atuacao',
    matchers: ['area de atuacao', 'areas de atuacao', 'areas-atuacao', 'areas_atuacao'],
  },
  pracas: {
    label: 'Pracas',
    matchers: ['praca', 'pracas'],
  },
  rotas: {
    label: 'Rotas',
    matchers: ['rota', 'rotas'],
  },
  clientes: {
    label: 'Clientes',
    matchers: ['cliente', 'clientes'],
  },
  usuarios: {
    label: 'Usuarios',
    matchers: ['usuario', 'usuarios', 'users'],
  },
  vendedores: {
    label: 'Vendedores',
    matchers: ['vendedor', 'vendedores'],
  },
  supervisores: {
    label: 'Supervisores',
    matchers: ['supervisor', 'supervisores'],
  },
  contatos: {
    label: 'Contatos',
    matchers: ['contato', 'contatos'],
  },
  gruposClientes: {
    label: 'Grupos de Cliente',
    matchers: ['grupo de cliente', 'grupos de cliente', 'grupo cliente', 'grupos cliente', 'grupos'],
  },
  redesClientes: {
    label: 'Redes de Cliente',
    matchers: ['rede de cliente', 'redes de cliente', 'rede cliente', 'redes cliente', 'redes'],
  },
  segmentosClientes: {
    label: 'Segmentos de Cliente',
    matchers: ['segmento de cliente', 'segmentos de cliente', 'segmento cliente', 'segmentos cliente', 'segmentos'],
  },
  regrasCadastro: {
    label: 'Regras de Cadastro',
    matchers: ['regras de cadastro', 'regra de cadastro', 'regras-cadastro', 'regras_cadastro'],
  },
  administradores: {
    label: 'Administradores',
    matchers: ['administrador', 'administradores'],
  },
  perfis: {
    label: 'Perfis',
    matchers: ['perfil', 'perfis', 'perfis-list', 'perfis-form'],
  },
  relatorios: {
    label: 'Relatorios',
    matchers: ['relatorio', 'relatorios'],
  },
  configuracoes: {
    label: 'Configuracoes',
    matchers: ['configuracao', 'configuracoes', 'parametro', 'parametros', 'modulo', 'modulos'],
  },
  configuracoesClientes: {
    label: 'Configurações de Clientes',
    matchers: ['configuracoes-clientes-form', 'configuracoes clientes', 'clientes configuracoes'],
  },
  configuracoesEntregas: {
    label: 'Configurações de Entregas',
    matchers: ['configuracoes-entregas-form', 'configuracoes entregas', 'entregas configuracoes'],
  },
  configuracoesGeral: {
    label: 'Configurações Gerais',
    matchers: ['configuracoes-geral-form', 'configuracoes geral', 'geral configuracoes'],
  },
  configuracoesInicio: {
    label: 'Configurações de Início',
    matchers: ['configuracoes-inicio-form', 'configuracoes inicio', 'inicio configuracoes'],
  },
  configuracoesLayout: {
    label: 'Configurações de Layout',
    matchers: ['configuracoes-layout-form', 'configuracoes layout', 'layout configuracoes'],
  },
  configuracoesAssistenteVirtual: {
    label: 'Assistente Virtual',
    matchers: ['configuracoes-ia-form', 'assistente virtual', 'configuracoes assistente virtual', 'assistente-virtual'],
  },
  configuracoesAssistenteVendasIa: {
    label: 'Assistente de Vendas IA',
    matchers: ['chatbot-empresas-list', 'assistente de vendas ia', 'assistente vendas ia', 'assistente-vendas-ia'],
  },
  configuracoesPedidos: {
    label: 'Configurações de Pedidos',
    matchers: ['configuracoes-pedidos-form', 'configuracoes pedidos', 'pedidos configuracoes'],
  },
  parametros: {
    label: 'Parâmetros',
    matchers: ['cadastro-parametros-list', 'cadastro-parametros-form', 'parametros', 'parâmetros'],
  },
  configuracoesPrecos: {
    label: 'Configurações de Preços',
    matchers: ['configuracoes-precos-form', 'configuracoes precos', 'configuracoes preços', 'precos configuracoes', 'preços configuracoes'],
  },
  configuracoesProdutos: {
    label: 'Configurações de Produtos',
    matchers: ['configuracoes-produtos-form', 'configuracoes produtos', 'produtos configuracoes'],
  },
  configuracoesVendedores: {
    label: 'Configurações de Vendedores',
    matchers: ['configuracoes-vendedores-form', 'configuracoes vendedores', 'vendedores configuracoes'],
  },
  linhas: {
    label: 'Linhas',
    matchers: ['linha', 'linhas'],
  },
  cores: {
    label: 'Cores',
    matchers: ['cor', 'cores'],
  },
  banners: {
    label: 'Banners',
    matchers: ['banner', 'banners'],
  },
  combos: {
    label: 'Combos',
    matchers: ['combo', 'combos', 'promocoes-list', 'promocoes-form'],
  },
  gruposCombos: {
    label: 'Grupos de Combos',
    matchers: ['grupo promocao', 'grupos promocao', 'grupo-promocao', 'grupos-promocao', 'grupos_promocao'],
  },
  leveEPague: {
    label: 'Leve e Pague',
    matchers: ['leve e pague', 'campanhas-levepague', 'campanhas_levepague', 'levepague'],
  },
  compreEGanhe: {
    label: 'Compre e Ganhe',
    matchers: ['compre e ganhe', 'compre-ganhe', 'compre_ganhe'],
  },
  descontoUnidade: {
    label: 'Desconto na Unidade',
    matchers: ['desconto na unidade', 'campanhas-descontounidade', 'campanhas_descontounidade', 'descontounidade'],
  },
  compreJunto: {
    label: 'Compre Junto',
    matchers: ['compre junto', 'campanhas-compre-junto', 'campanhas_compre_junto', 'compre-junto', 'compre_junto'],
  },
  cuponsDesconto: {
    label: 'Cupons Desconto',
    matchers: ['cupom desconto', 'cupons desconto', 'cupons-desconto', 'cupom-desconto'],
  },
  notificacoesApp: {
    label: 'Notificacoes App',
    matchers: ['notificacoes app', 'notificacoes-app', 'notificacoes_list', 'notificacoes-list', 'notificacao app'],
  },
  templatesEmails: {
    label: 'Templates de E-mails',
    matchers: ['emails-templates-list', 'templates de e-mails', 'template de e-mail', 'email template'],
  },
  areasBanner: {
    label: 'Areas de Banner',
    matchers: ['area de banner', 'areas de banner', 'areas-banner', 'areas_banner'],
  },
  emails: {
    label: 'E-mails',
    matchers: ['emails', 'e-mails', 'newsletter', 'email'],
  },
  paginas: {
    label: 'Paginas',
    matchers: ['pagina', 'paginas'],
  },
  areasPagina: {
    label: 'Areas de Pagina',
    matchers: ['area de pagina', 'areas de pagina', 'areas-pagina', 'areas_pagina'],
  },
  colecoes: {
    label: 'Colecoes',
    matchers: ['colecao', 'colecoes'],
  },
  listas: {
    label: 'Listas',
    matchers: ['lista', 'listas'],
  },
  marcas: {
    label: 'Marcas',
    matchers: ['marca', 'marcas'],
  },
  departamentos: {
    label: 'Departamentos',
    matchers: ['departamento', 'departamentos'],
  },
  fornecedores: {
    label: 'Fornecedores',
    matchers: ['fornecedor', 'fornecedores'],
  },
  grades: {
    label: 'Grades',
    matchers: ['grade', 'grades'],
  },
  produtosDepartamentos: {
    label: 'Produtos x Departamentos',
    matchers: ['produtos x departamentos', 'produto x departamentos', 'produtos-departamentos', 'produtos_departamentos'],
  },
  produtosAviseme: {
    label: 'Avise-me',
    matchers: ['avise-me', 'aviseme', 'produtos-aviseme', 'produto aviseme', 'produtos aviseme'],
  },
}

function buildPermissionText(permission: AuthPermission) {
  return normalizeSearchValue([
    permission.id,
    permission.nome,
    permission.chave,
    permission.slug,
    permission.componente,
    permission.acao ?? '',
    permission.url ?? '',
    permission.clique ?? '',
    permission.icone ?? '',
  ].join(' '))
}

function isPermissionActive(permission: AuthPermission) {
  return permission.ativo !== false
}

function matchesFeature(permission: AuthPermission, feature: FeatureConfig) {
  const text = buildPermissionText(permission)
  return feature.matchers.some((matcher) => text.includes(normalizeSearchValue(matcher)))
}

function collectFeatureFamily(permissions: AuthPermission[], feature: FeatureConfig) {
  const activePermissions = permissions.filter(isPermissionActive)
  const permissionMap = new Map(activePermissions.map((permission) => [permission.id, permission]))
  const rootIds = new Set(
    activePermissions
      .filter((permission) => matchesFeature(permission, feature))
      .map((permission) => permission.id),
  )

  if (!rootIds.size) {
    return activePermissions.filter((permission) => matchesFeature(permission, feature))
  }

  const family = new Map<string, AuthPermission>()
  const queue = [...rootIds]

  for (const rootId of rootIds) {
    const rootPermission = permissionMap.get(rootId)
    if (rootPermission) {
      family.set(rootId, rootPermission)
    }
  }

  while (queue.length) {
    const currentId = queue.shift() ?? ''

    for (const permission of activePermissions) {
      if (permission.idFuncionalidadePai === currentId && !family.has(permission.id)) {
        family.set(permission.id, permission)
        queue.push(permission.id)
      }
    }
  }

  return [...family.values()]
}

function hasActionPermission(permissions: AuthPermission[], feature: FeatureConfig, action: FeatureAction) {
  const normalizedAction = normalizeSearchValue(action)

  return permissions.some((permission) => {
    if (!isPermissionActive(permission)) {
      return false
    }

    const actionText = normalizeSearchValue([
      permission.acao ?? '',
      permission.nome,
      permission.chave,
      permission.slug,
      permission.componente,
    ].join(' '))

    return actionText.includes(normalizedAction) || (matchesFeature(permission, feature) && actionText.includes(normalizedAction))
  })
}

export function getFeatureAccess(session: AuthSession | null, featureKey: FeatureKey): FeatureAccess {
  const feature = featureConfigs[featureKey]

  if (!session || session.user.master) {
    return {
      canOpen: true,
      canList: true,
      canCreate: true,
      canEdit: true,
      canView: true,
      canDelete: true,
      canLogs: true,
      canUnblockClient: true,
    }
  }

  const family = collectFeatureFamily(session.user.funcionalidades, feature)
  const canList = hasActionPermission(family, feature, 'listar')
  const canCreate = hasActionPermission(family, feature, 'criar')
  const canEdit = hasActionPermission(family, feature, 'editar')
  const canView = hasActionPermission(family, feature, 'visualizar')
  const canDelete = hasActionPermission(family, feature, 'deletar')
  const canLogs = hasActionPermission(family, feature, 'logs')
  const canUnblockClient = hasActionPermission(family, feature, 'desbloquear_cliente')
  const canOpen = family.length > 0 && (canList || canCreate || canEdit || canView || feature.allowOpenWithoutAction === true)

  return {
    canOpen,
    canList,
    canCreate,
    canEdit,
    canView,
    canDelete,
    canLogs,
    canUnblockClient,
  }
}

export function getFeatureLabel(featureKey: FeatureKey) {
  return featureConfigs[featureKey].label
}
