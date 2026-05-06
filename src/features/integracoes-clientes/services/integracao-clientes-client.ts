import { httpClient } from '@/src/services/http/http-client'
import {
  buildIntegracaoClientesSavePayload,
  normalizeIntegracaoClientesRecord,
  type ClientesBranchRow,
  type ClientesValues,
  type IntegracaoClientesRecord,
} from './integracao-clientes-mappers'

export const integracaoClientesClient = {
  async get(): Promise<IntegracaoClientesRecord> {
    const payload = await httpClient<unknown>('/api/integracoes/clientes', {
      method: 'GET',
      cache: 'no-store',
    })
    return normalizeIntegracaoClientesRecord(payload)
  },

  async save(
    values: ClientesValues,
    branches: ClientesBranchRow[],
    options?: {
      includeCnpjaToken?: boolean
      includeCroApiKey?: boolean
      unlockedBranchIds?: Set<string>
    },
  ) {
    const parameters = buildIntegracaoClientesSavePayload(values, branches, options)
    return httpClient('/api/integracoes/clientes', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}
