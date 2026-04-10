import { httpClient } from '@/src/services/http/http-client'
import {
  buildDirtyConfiguracoesGeralPayload,
  normalizeConfiguracoesGeralRecord,
} from '@/src/features/configuracoes-geral/services/configuracoes-geral-mappers'
import type {
  ConfiguracoesGeralFieldDefinition,
  ConfiguracoesGeralFormValues,
  ConfiguracoesGeralRecord,
} from '@/src/features/configuracoes-geral/types/configuracoes-geral'

export const configuracoesGeralClient = {
  async get(): Promise<ConfiguracoesGeralRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/geral', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesGeralRecord(payload)
  },
  async save(
    fields: ConfiguracoesGeralFieldDefinition[],
    initialValues: ConfiguracoesGeralFormValues,
    currentValues: ConfiguracoesGeralFormValues,
    companyId: string,
  ) {
    const payload = buildDirtyConfiguracoesGeralPayload(fields, initialValues, currentValues, companyId)
    if (!payload.parameters.length && !payload.company) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/geral', {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
}


