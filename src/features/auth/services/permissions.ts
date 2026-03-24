import type { AuthPermission, AuthSession } from '@/src/features/auth/types/auth'
import { normalizeSearchValue } from '@/src/lib/text-normalization'

export type FeatureKey =
  | 'dashboard'
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
  | 'relatorios'
  | 'configuracoes'
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
  dashboard: {
    label: 'Dashboard',
    matchers: ['dashboard', 'inicio'],
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
  relatorios: {
    label: 'Relatorios',
    matchers: ['relatorio', 'relatorios'],
  },
  configuracoes: {
    label: 'Configuracoes',
    matchers: ['configuracao', 'configuracoes', 'parametro', 'parametros', 'modulo', 'modulos'],
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
  const canOpen = family.length > 0 && (canList || canCreate || canEdit || canView)

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
