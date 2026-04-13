import { httpClient } from '@/src/services/http/http-client'
import {
  buildIntegracaoSegurancaSavePayload,
  normalizeIntegracaoSegurancaRecord,
  type SegurancaSaveOptions,
  type SegurancaValues,
  type IntegracaoSegurancaRecord,
} from './integracao-seguranca-mappers'

export const integracaoSegurancaClient = {
  async get(): Promise<IntegracaoSegurancaRecord> {
    const payload = await httpClient<unknown>('/api/integracoes/seguranca', {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeIntegracaoSegurancaRecord(payload)
  },

  async save(values: SegurancaValues, options?: SegurancaSaveOptions) {
    const parameters = buildIntegracaoSegurancaSavePayload(values, options ?? {
      includeV3Key: false,
      includeV2Key: false,
      includeV3Secret: false,
      includeV2Secret: false,
    })
    return httpClient('/api/integracoes/seguranca', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}
