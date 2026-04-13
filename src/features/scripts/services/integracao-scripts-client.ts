import { httpClient } from '@/src/services/http/http-client'
import {
  buildIntegracaoScriptsSavePayload,
  normalizeIntegracaoScriptsRecord,
  type ScriptsValues,
  type IntegracaoScriptsRecord,
} from './integracao-scripts-mappers'

export const integracaoScriptsClient = {
  async get(): Promise<IntegracaoScriptsRecord> {
    const payload = await httpClient<unknown>('/api/integracoes/scripts', {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeIntegracaoScriptsRecord(payload)
  },

  async save(values: ScriptsValues) {
    const parameters = buildIntegracaoScriptsSavePayload(values)
    return httpClient('/api/integracoes/scripts', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}
