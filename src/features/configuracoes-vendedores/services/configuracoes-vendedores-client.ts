'use client'

import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyConfiguracoesVendedoresPayload, normalizeConfiguracoesVendedoresRecord } from '@/src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers'
import type { ConfiguracoesVendedoresFormValues, ConfiguracoesVendedoresRecord } from '@/src/features/configuracoes-vendedores/types/configuracoes-vendedores'

export const configuracoesVendedoresClient = {
  async get(): Promise<ConfiguracoesVendedoresRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/vendedores', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesVendedoresRecord(payload)
  },
  async save(initialValues: ConfiguracoesVendedoresFormValues, currentValues: ConfiguracoesVendedoresFormValues) {
    const parameters = buildDirtyConfiguracoesVendedoresPayload(initialValues, currentValues)
    if (!parameters.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/vendedores', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}


