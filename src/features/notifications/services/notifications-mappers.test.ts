import { describe, expect, it } from 'vitest'
import {
  extractNotificationApiMessage,
  mapNotificationDetailPayload,
  mapNotificationsListPayload,
} from '@/src/features/notifications/services/notifications-mappers'

describe('notifications-mappers', () => {
  it('maps list payloads and pending read receipts from legacy structures', () => {
    const response = mapNotificationsListPayload({
      aaData: [
        {
          id: '9',
          id_usuario: '55',
          mensagem: 'Nova campanha publicada',
          created_at: '2026-04-25T12:34:56Z',
          log: 1,
          novidades: 1,
          notificacao: {
            titulo: 'Campanha',
          },
        },
      ],
      ids_confirmar: ['9'],
    }, 'fallback-user')

    expect(response.items[0]).toMatchObject({
      id: '9',
      userId: '55',
      titulo: 'Campanha',
      descricao: 'Nova campanha publicada',
      lida: true,
      novidades: true,
    })
    expect(response.pendingReadReceipts).toEqual([
      { id: '9', userId: '55' },
    ])
  })

  it('maps detail payloads and falls back to formatted nested fields', () => {
    expect(mapNotificationDetailPayload({
      data: [
        {
          id: '11',
          id_usuario: '77',
          id_empresa: '3',
          id_notificacao: '999',
          created_at: '2026-04-25T12:00:00Z',
          notificacao: {
            titulo: 'Aviso',
            mensagem: '<p>Mensagem</p>',
            canal: 'topbar',
            data_inicio: '2026-04-24T10:00:00Z',
          },
        },
      ],
    })).toMatchObject({
      id: '11',
      userId: '77',
      companyId: '3',
      notificationId: '999',
      titulo: 'Aviso',
      channel: 'topbar',
      html: '<p>Mensagem</p>',
    })
  })

  it('extracts api messages from strings or message payloads with fallback', () => {
    expect(extractNotificationApiMessage('Erro direto', 'fallback')).toBe('Erro direto')
    expect(extractNotificationApiMessage({ message: 'Erro da API' }, 'fallback')).toBe('Erro da API')
    expect(extractNotificationApiMessage({}, 'fallback')).toBe('fallback')
  })
})
