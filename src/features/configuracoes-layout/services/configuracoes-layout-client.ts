import { getDirtyConfiguracoesLayoutKeys, normalizeConfiguracoesLayoutRecord } from '@/src/features/configuracoes-layout/services/configuracoes-layout-mappers'
import type { ConfiguracoesLayoutFormValues, ConfiguracoesLayoutRecord } from '@/src/features/configuracoes-layout/types/configuracoes-layout'
import { httpClient } from '@/src/services/http/http-client'

export const configuracoesLayoutClient = {
  async get(): Promise<ConfiguracoesLayoutRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/layout', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesLayoutRecord(payload)
  },
  async save(initialValues: ConfiguracoesLayoutFormValues, currentValues: ConfiguracoesLayoutFormValues) {
    const changedKeys = getDirtyConfiguracoesLayoutKeys(initialValues, currentValues)
    if (!changedKeys.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/layout', {
      method: 'POST',
      body: JSON.stringify({
        changedKeys,
        values: currentValues,
      }),
      cache: 'no-store',
    })
  },
}


