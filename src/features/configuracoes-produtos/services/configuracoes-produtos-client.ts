'use client'

import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyConfiguracoesProdutosPayload, normalizeConfiguracoesProdutosRecord } from '@/src/features/configuracoes-produtos/services/configuracoes-produtos-mappers'
import type { ConfiguracoesProdutosFormValues, ConfiguracoesProdutosRecord } from '@/src/features/configuracoes-produtos/types/configuracoes-produtos'

export const configuracoesProdutosClient = {
  async get(): Promise<ConfiguracoesProdutosRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/produtos', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesProdutosRecord(payload)
  },
  async save(initialValues: ConfiguracoesProdutosFormValues, currentValues: ConfiguracoesProdutosFormValues) {
    const parameters = buildDirtyConfiguracoesProdutosPayload(initialValues, currentValues)
    if (!parameters.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/produtos', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}


