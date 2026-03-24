'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'

export const gruposClientesClient = createCrudClient('/api/grupos-clientes')

export type GrupoClienteRelationItem = {
  id_grupo: string
  id_cliente: string
  cliente?: {
    id: string
    codigo?: string | null
    nome_fantasia?: string | null
  } | null
}

export function addGrupoClientes(groupId: string, clientIds: string[]) {
  return httpClient(`/api/grupos-clientes/${groupId}/clientes`, {
    method: 'POST',
    body: JSON.stringify({ clientIds }),
    cache: 'no-store',
  })
}

export function deleteGrupoClientes(groupId: string, clientIds: string[]) {
  return httpClient(`/api/grupos-clientes/${groupId}/clientes`, {
    method: 'DELETE',
    body: JSON.stringify({ clientIds }),
    cache: 'no-store',
  })
}
