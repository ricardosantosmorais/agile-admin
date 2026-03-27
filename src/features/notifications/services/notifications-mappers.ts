import type { NotificationDetail, NotificationsListResponse, TopbarNotification } from '@/src/features/notifications/types/notifications'
import { asArray, asBoolean, asRecord, asString } from '@/src/lib/api-payload'

const notificationDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatNotificationDate(value: unknown) {
  const raw = asString(value)
  if (!raw) {
    return ''
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return notificationDateFormatter.format(date)
}

function mapNotificationItem(payload: unknown): TopbarNotification {
  const source = asRecord(payload)
  const nestedNotification = asRecord(source.notificacao)
  const id = String(source.id ?? '')
  const userId = String(source.id_usuario ?? '')

  return {
    id,
    userId: userId || undefined,
    titulo: asString(nestedNotification.titulo) || asString(source.titulo) || 'Notificacao',
    descricao: asString(source.mensagem) || asString(nestedNotification.titulo) || asString(nestedNotification.mensagem),
    data: formatNotificationDate(source.created_at),
    lida: Boolean(source.log),
    url: asString(source.url) || undefined,
    acao: asString(source.acao) || undefined,
    tipo: asString(source.tipo) || undefined,
    novidades: asBoolean(source.novidades),
  }
}

export function mapNotificationDetailPayload(payload: unknown): NotificationDetail | null {
  const source = asRecord(payload)
  const data = asArray(source.data)
  const itemSource = data.length === 1 ? data[0] : payload

  if (!itemSource || typeof itemSource !== 'object') {
    return null
  }

  const sourceItem = asRecord(itemSource)
  const nestedNotification = asRecord(sourceItem.notificacao)
  const baseItem = mapNotificationItem(sourceItem)

  if (!baseItem.id) {
    return null
  }

  return {
    ...baseItem,
    companyId: asString(sourceItem.id_empresa) || undefined,
    notificationId: asString(sourceItem.id_notificacao) || asString(nestedNotification.id) || undefined,
    icon: asString(sourceItem.icone) || undefined,
    channel: asString(nestedNotification.canal) || undefined,
    startDate: formatNotificationDate(nestedNotification.data_inicio),
    html: asString(nestedNotification.mensagem) || asString(sourceItem.mensagem) || undefined,
  }
}

export function mapNotificationsListPayload(payload: unknown, currentUserId = ''): NotificationsListResponse {
  const source = asRecord(payload)
  const itemsSource = Array.isArray(source.aaData) ? source.aaData : source.data
  const items = asArray(itemsSource).map(mapNotificationItem)
  const pendingIdSet = new Set(asArray<string>(source.ids_confirmar).map((value) => String(value)))
  const pendingReadReceipts = items
    .filter((item) => pendingIdSet.has(item.id))
    .map((item) => ({
      id: item.id,
      userId: item.userId || currentUserId,
    }))
    .filter((item) => item.userId)

  return {
    items,
    pendingReadReceipts,
  }
}

export function extractNotificationApiMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload) {
    return payload
  }

  const source = asRecord(payload)
  return asString(source.message) || fallback
}
