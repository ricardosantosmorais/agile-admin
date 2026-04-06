'use client'

import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyConfiguracoesInicioPayload, normalizeConfiguracoesInicioRecord } from '@/src/features/configuracoes-inicio/services/configuracoes-inicio-mappers'
import type { ConfiguracoesInicioFormValues, ConfiguracoesInicioRecord } from '@/src/features/configuracoes-inicio/types/configuracoes-inicio'

export const configuracoesInicioClient = {
  async get(): Promise<ConfiguracoesInicioRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/inicio', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesInicioRecord(payload)
  },
  async save(initialValues: ConfiguracoesInicioFormValues, currentValues: ConfiguracoesInicioFormValues) {
    const parameters = buildDirtyConfiguracoesInicioPayload(initialValues, currentValues)
    if (!parameters.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/inicio', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}


