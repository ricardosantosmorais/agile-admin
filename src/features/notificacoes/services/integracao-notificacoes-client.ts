import { httpClient } from '@/src/services/http/http-client'
import {
  buildIntegracaoNotificacoesSavePayload,
  normalizeIntegracaoNotificacoesRecord,
  type IntegracaoNotificacoesRecord,
  type NotificacoesValues,
} from './integracao-notificacoes-mappers'

export const integracaoNotificacoesClient = {
  async get(): Promise<IntegracaoNotificacoesRecord> {
    const payload = await httpClient<unknown>('/api/integracoes/notificacoes', {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeIntegracaoNotificacoesRecord(payload)
  },

  async save(values: NotificacoesValues) {
    const parameters = buildIntegracaoNotificacoesSavePayload(values)
    return httpClient('/api/integracoes/notificacoes', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}
