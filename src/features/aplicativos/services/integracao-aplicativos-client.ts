import { httpClient } from '@/src/services/http/http-client'
import {
  buildIntegracaoAplicativosSavePayload,
  normalizeIntegracaoAplicativosRecord,
  type AplicativosValues,
  type IntegracaoAplicativosRecord,
} from './integracao-aplicativos-mappers'

export const integracaoAplicativosClient = {
  async get(): Promise<IntegracaoAplicativosRecord> {
    const payload = await httpClient<unknown>('/api/integracoes/aplicativos', {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeIntegracaoAplicativosRecord(payload)
  },

  async save(values: AplicativosValues) {
    const parameters = buildIntegracaoAplicativosSavePayload(values)
    return httpClient('/api/integracoes/aplicativos', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}
