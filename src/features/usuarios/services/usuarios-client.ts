import { httpClient } from '@/src/services/http/http-client'
import type {
  UsuarioAccessFilters,
  UsuarioAccessResponse,
  UsuarioLinkedClient,
  UsuarioLinkedSeller,
  UsuarioListFilters,
  UsuarioListResponse,
  UsuarioPasswordRecord,
} from '@/src/features/usuarios/types/usuarios'
import {
  mapUsuarioAccessResponse,
  mapUsuarioLinkedClients,
  mapUsuarioLinkedSeller,
  mapUsuarioPasswordDetail,
  mapUsuariosListResponse,
} from '@/src/features/usuarios/services/usuarios-mappers'

function buildParams(filters: Record<string, string | number>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'number') {
      params.set(key, String(value))
      continue
    }

    if (value.trim()) {
      params.set(key, value)
    }
  }

  return params
}

export const usuariosClient = {
  async list(filters: UsuarioListFilters): Promise<UsuarioListResponse> {
    const response = await httpClient<unknown>(`/api/usuarios?${buildParams(filters).toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapUsuariosListResponse(response)
  },

  async getPasswordById(id: string): Promise<UsuarioPasswordRecord | null> {
    const response = await httpClient<unknown>(`/api/usuarios/${id}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return response ? mapUsuarioPasswordDetail(response) : null
  },

  async changePassword(payload: UsuarioPasswordRecord): Promise<void> {
    await httpClient('/api/usuarios/password', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(payload),
    })
  },

  async delete(ids: string[]): Promise<void> {
    await httpClient('/api/usuarios', {
      method: 'DELETE',
      cache: 'no-store',
      body: JSON.stringify({ ids }),
    })
  },

  async listLinkedClients(userId: string): Promise<UsuarioLinkedClient[]> {
    const response = await httpClient<unknown>(`/api/usuarios/${userId}/clientes`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapUsuarioLinkedClients(response)
  },

  async removeLinkedClient(userId: string, clientId: string): Promise<void> {
    await httpClient(`/api/usuarios/${userId}/clientes`, {
      method: 'DELETE',
      cache: 'no-store',
      body: JSON.stringify({ clientId }),
    })
  },

  async getLinkedSeller(userId: string): Promise<UsuarioLinkedSeller | null> {
    const response = await httpClient<unknown>(`/api/usuarios/${userId}/vendedor`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapUsuarioLinkedSeller(response)
  },

  async removeLinkedSeller(userId: string): Promise<void> {
    await httpClient(`/api/usuarios/${userId}/vendedor`, {
      method: 'DELETE',
      cache: 'no-store',
    })
  },

  async listAccesses(userId: string, filters: UsuarioAccessFilters): Promise<UsuarioAccessResponse> {
    const response = await httpClient<unknown>(`/api/usuarios/${userId}/acessos?${buildParams(filters).toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return mapUsuarioAccessResponse(response)
  },
}
