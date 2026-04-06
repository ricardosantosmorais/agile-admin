'use client'

import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyConfiguracoesPrecosPayload, normalizeConfiguracoesPrecosRecord } from '@/src/features/configuracoes-precos/services/configuracoes-precos-mappers'
import type { ConfiguracoesPrecosFormValues, ConfiguracoesPrecosRecord } from '@/src/features/configuracoes-precos/types/configuracoes-precos'

export const configuracoesPrecosClient = {
  async get(): Promise<ConfiguracoesPrecosRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/precos', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesPrecosRecord(payload)
  },
  async save(initialValues: ConfiguracoesPrecosFormValues, currentValues: ConfiguracoesPrecosFormValues) {
    const parameters = buildDirtyConfiguracoesPrecosPayload(initialValues, currentValues)
    if (!parameters.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/precos', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}


