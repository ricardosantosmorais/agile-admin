'use client'

import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyConfiguracoesEntregasPayload, normalizeConfiguracoesEntregasRecord } from '@/src/features/configuracoes-entregas/services/configuracoes-entregas-mappers'
import type { ConfiguracoesEntregasFormValues, ConfiguracoesEntregasRecord } from '@/src/features/configuracoes-entregas/types/configuracoes-entregas'

export const configuracoesEntregasClient = {
  async get(): Promise<ConfiguracoesEntregasRecord & { lookups: { deliveryMethods: ConfiguracoesEntregasRecord['deliveryMethods'] } }> {
    const payload = await httpClient<unknown>('/api/configuracoes/entregas', {
      method: 'GET',
      cache: 'no-store',
    })

    const record = normalizeConfiguracoesEntregasRecord(payload)

    return {
      ...record,
      lookups: {
        deliveryMethods: record.deliveryMethods,
      },
    }
  },
  async save(initialValues: ConfiguracoesEntregasFormValues, currentValues: ConfiguracoesEntregasFormValues) {
    const parameters = buildDirtyConfiguracoesEntregasPayload(initialValues, currentValues)
    if (!parameters.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/entregas', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}


