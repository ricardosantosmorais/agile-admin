'use client'

import {
  buildDirtyConfiguracoesAssistenteVirtualPayload,
  normalizeConfiguracoesAssistenteVirtualRecord,
} from '@/src/features/configuracoes-assistente-virtual/services/configuracoes-assistente-virtual-mappers'
import type {
  ConfiguracoesAssistenteVirtualFormValues,
  ConfiguracoesAssistenteVirtualRecord,
} from '@/src/features/configuracoes-assistente-virtual/types/configuracoes-assistente-virtual'
import { httpClient } from '@/src/services/http/http-client'

export const configuracoesAssistenteVirtualClient = {
  async get(): Promise<ConfiguracoesAssistenteVirtualRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/assistente-virtual', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesAssistenteVirtualRecord(payload)
  },
  async save(
    initialValues: ConfiguracoesAssistenteVirtualFormValues,
    currentValues: ConfiguracoesAssistenteVirtualFormValues,
  ) {
    const parameters = buildDirtyConfiguracoesAssistenteVirtualPayload(initialValues, currentValues)
    if (!parameters.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/assistente-virtual', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}


