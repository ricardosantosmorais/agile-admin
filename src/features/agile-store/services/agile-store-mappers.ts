import type {
  AgileStoreAction,
  AgileStoreContractStatus,
  AgileStoreListResponse,
  AgileStoreModule,
  AgileStorePermissions,
  AgileStoreRawHistoryItem,
  AgileStoreRawListResponse,
  AgileStoreRawMedia,
  AgileStoreRawModule,
} from '@/src/features/agile-store/types/agile-store'

function text(value: unknown) {
  return String(value ?? '').trim()
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : []
}

function normalizeStatus(value: unknown): AgileStoreContractStatus {
  const status = text(value)
  if (['ativo', 'pendente_ativacao', 'pendente_desativacao', 'cancelado', 'falha_ativacao', 'falha_desativacao'].includes(status)) {
    return status as AgileStoreContractStatus
  }
  return ''
}

function normalizeMedia(media: AgileStoreRawMedia): AgileStoreModule['media'][number] | null {
  const url = text(media.url)
  if (!url) return null
  return {
    type: text(media.tipo) || 'screenshot',
    url,
    title: text(media.titulo),
    description: text(media.descricao),
  }
}

function normalizeHistory(item: AgileStoreRawHistoryItem): AgileStoreModule['history'][number] {
  return {
    id: text(item.id),
    action: text(item.acao),
    status: text(item.status),
    createdAt: text(item.created_at),
    message: text(item.message),
  }
}

export function normalizeAgileStoreDetail(module: AgileStoreRawModule): AgileStoreModule {
  return {
    id: text(module.id),
    name: text(module.nome),
    type: text(module.tipo),
    summary: text(module.resumo),
    description: text(module.descricao),
    price: number(module.preco),
    currency: text(module.moeda) || 'BRL',
    billingCycle: text(module.ciclo_cobranca),
    primaryColor: text(module.cor_primaria) || '#2f5bea',
    icon: text(module.icone) || 'far fa-cube',
    coverImageUrl: text(module.imagem_capa_url),
    benefits: stringArray(module.metadata?.beneficios),
    trial: {
      available: boolean(module.teste_gratis?.disponivel),
      days: number(module.teste_gratis?.dias),
    },
    contractStatus: normalizeStatus(module.contratacao?.status),
    actions: module.acoes ?? {},
    media: (module.midias ?? []).map(normalizeMedia).filter((item): item is AgileStoreModule['media'][number] => Boolean(item)),
    history: (module.historico ?? []).map(normalizeHistory),
  }
}

export function normalizeAgileStoreListResponse(response: AgileStoreRawListResponse): AgileStoreListResponse {
  const items = (response.data ?? []).map(normalizeAgileStoreDetail)
  const meta = response.meta ?? {}
  const summary = meta.summary ?? {}
  return {
    items,
    meta: {
      page: number(meta.page, 1),
      perPage: number(meta.perpage ?? meta.perPage, 12),
      total: number(meta.total, items.length),
      pages: number(meta.pages, 1),
    },
    summary: {
      totalModules: number(summary.total_modulos, items.length),
      activeContracts: number(summary.total_contratados),
    },
    filters: {
      types: stringArray(response.filters?.tipos),
    },
  }
}

export function getAgileStoreStatusInfo(status: AgileStoreContractStatus) {
  const map: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' }> = {
    ativo: { label: 'Contratado', tone: 'success' },
    pendente_ativacao: { label: 'Ativacao em andamento', tone: 'warning' },
    pendente_desativacao: { label: 'Cancelamento em andamento', tone: 'warning' },
    cancelado: { label: 'Disponivel', tone: 'muted' },
    falha_ativacao: { label: 'Falha na ativacao', tone: 'danger' },
    falha_desativacao: { label: 'Falha na desativacao', tone: 'danger' },
  }
  return map[status] ?? { label: 'Disponivel', tone: 'muted' }
}

function actionPolicyKey(action: AgileStoreAction) {
  return {
    contract: 'contratar',
    cancel: 'descontratar',
    retry: 'reprocessar',
  }[action]
}

export function getAgileStoreActionStatus(module: AgileStoreModule, action: AgileStoreAction, permissions: AgileStorePermissions) {
  const policy = module.actions[actionPolicyKey(action)]
  if (policy?.permitido === false) {
    return {
      enabled: false,
      message: text(policy.message) || 'Voce nao possui permissao para executar esta acao.',
    }
  }

  if (action === 'contract') {
    return { enabled: permissions.canContract, message: permissions.canContract ? '' : 'Voce nao possui permissao para contratar modulos.' }
  }
  if (action === 'cancel') {
    return { enabled: permissions.canCancel, message: permissions.canCancel ? '' : 'Voce nao possui permissao para descontratar modulos.' }
  }
  return {
    enabled: permissions.canContract && permissions.canCancel,
    message: permissions.canContract && permissions.canCancel ? '' : 'Voce nao possui permissao para reprocessar solicitacoes.',
  }
}

export function canRunAgileStoreAction(module: AgileStoreModule, action: AgileStoreAction, permissions: AgileStorePermissions) {
  return getAgileStoreActionStatus(module, action, permissions).enabled
}
