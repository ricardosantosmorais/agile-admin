export type NotificationReadReceipt = {
  id: string
  userId?: string
}

export type TopbarNotification = {
  id: string
  userId?: string
  titulo: string
  descricao: string
  data: string
  lida: boolean
  url?: string
  acao?: string
  tipo?: string
  novidades?: boolean
}

export type NotificationsListResponse = {
  items: TopbarNotification[]
  pendingReadReceipts: NotificationReadReceipt[]
}

export type NotificationDetail = TopbarNotification & {
  companyId?: string
  notificationId?: string
  icon?: string
  channel?: string
  startDate?: string
  html?: string
}
