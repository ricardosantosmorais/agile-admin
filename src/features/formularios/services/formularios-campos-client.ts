'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { httpClient } from '@/src/services/http/http-client'

const baseClient = createCrudClient('/api/formularios-campos')

type FormularioCampoPositionPayload = {
  id: string
  posicao: number
}

export const formulariosCamposClient = {
  ...baseClient,
  updatePositions(payload: FormularioCampoPositionPayload[]) {
    return httpClient<CrudRecord[]>('/api/formularios-campos', {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  },
}
