import { httpClient } from '@/src/services/http/http-client'
import { buildDirtyConfiguracoesPedidosPayload, normalizeConfiguracoesPedidosRecord } from '@/src/features/configuracoes-pedidos/services/configuracoes-pedidos-mappers'
import type { ConfiguracoesPedidosFormValues, ConfiguracoesPedidosRecord } from '@/src/features/configuracoes-pedidos/types/configuracoes-pedidos'

export const configuracoesPedidosClient = {
  async get(): Promise<ConfiguracoesPedidosRecord> {
    const payload = await httpClient<unknown>('/api/configuracoes/pedidos', {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeConfiguracoesPedidosRecord(payload)
  },
  async save(initialValues: ConfiguracoesPedidosFormValues, currentValues: ConfiguracoesPedidosFormValues) {
    const parameters = buildDirtyConfiguracoesPedidosPayload(initialValues, currentValues)
    if (!parameters.length) {
      return { success: true, skipped: true } as const
    }

    return httpClient('/api/configuracoes/pedidos', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
      cache: 'no-store',
    })
  },
}


