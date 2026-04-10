import { httpClient } from '@/src/services/http/http-client'
import {
  buildIntegracaoAtendimentoSavePayload,
  normalizeIntegracaoAtendimentoRecord,
  type IntegracaoAtendimentoBranchRow,
  type IntegracaoAtendimentoRecord,
  type IntegracaoAtendimentoValues,
} from '@/src/features/integracoes/atendimento/services/integracao-atendimento-mappers'

export const integracaoAtendimentoClient = {
  async get(): Promise<IntegracaoAtendimentoRecord> {
    const payload = await httpClient<unknown>('/api/integracoes/atendimento', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeIntegracaoAtendimentoRecord(payload)
  },
  async save(values: IntegracaoAtendimentoValues, branches: IntegracaoAtendimentoBranchRow[], options?: { includeWhatsappToken?: boolean }) {
    const parameters = buildIntegracaoAtendimentoSavePayload(values, branches, options)
    return httpClient('/api/integracoes/atendimento', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}

