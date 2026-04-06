'use client'

import { httpClient } from '@/src/services/http/http-client'
import {
  buildDirtyConfiguracoesClientesPayload,
  normalizeConfiguracoesClientesRecord,
} from '@/src/features/configuracoes-clientes/services/configuracoes-clientes-mappers'
import type {
  ConfiguracoesClientesFormValues,
  ConfiguracoesClientesRecord,
} from '@/src/features/configuracoes-clientes/types/configuracoes-clientes'

export const configuracoesClientesClient = {
  async get(): Promise<ConfiguracoesClientesRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/clientes', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesClientesRecord(payload)
  },
  async save(initialValues: ConfiguracoesClientesFormValues, currentValues: ConfiguracoesClientesFormValues) {
    const parameters = buildDirtyConfiguracoesClientesPayload(initialValues, currentValues)
    if (!parameters.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/clientes', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}


