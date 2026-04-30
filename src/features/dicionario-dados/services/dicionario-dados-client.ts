import { httpClient } from '@/src/services/http/http-client'
import { fetchWithTenantContext } from '@/src/services/http/tenant-context'
import type {
  DicionarioComponenteCamposResponse,
  DicionarioTabelaDetalhe,
  DicionarioTabelaTreeNode,
} from '@/src/features/dicionario-dados/services/dicionario-dados-types'

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asArray<T = unknown>(value: unknown) {
  return Array.isArray(value) ? value as T[] : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

export const dicionarioDadosClient = {
  async listTabelas() {
    const response = await httpClient<unknown>('/api/dicionario-dados/tabelas', {
      method: 'GET',
      cache: 'no-store',
    })

    const rows = asArray(asRecord(response).data)
    return rows.map((row) => {
      const source = asRecord(row)
      const campos = asArray(asRecord(source).campos).map((campo) => {
        const field = asRecord(campo)
        return {
          id: asString(field.id),
          nome: asString(field.nome),
        }
      })
      const componentes = asArray(asRecord(source).componentes)

      return {
        id: asString(source.id),
        nome: asString(source.nome),
        hasComponents: componentes.length > 0,
        fields: campos,
      } satisfies DicionarioTabelaTreeNode
    })
  },

  async getTabela(id: string) {
    const response = await httpClient<unknown>(`/api/dicionario-dados/tabelas/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    const first = asRecord(asArray(asRecord(response).data)[0])
    const componentes = asArray(first.componentes).map((item) => {
      const source = asRecord(item)
      const componente = asRecord(source.componente)
      return {
        id: asString(componente.id),
        nome: asString(componente.nome),
        arquivo: asString(componente.arquivo),
        ativo: componente.ativo !== false,
      }
    })

    return {
      id: asString(first.id),
      nome: asString(first.nome),
      descricao: asString(first.descricao),
      regra: asString(first.regra),
      componentes,
    } satisfies DicionarioTabelaDetalhe
  },

  async saveTabela(id: string, input: { descricao?: string; regra?: string }) {
    return httpClient<unknown>(`/api/dicionario-dados/tabelas/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  async getComponenteCampos(idComponente: string, idTabela: string) {
    return httpClient<DicionarioComponenteCamposResponse>(`/api/dicionario-dados/componentes/${encodeURIComponent(idComponente)}/campos?idTabela=${encodeURIComponent(idTabela)}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },

  async ignoreCampo(input: {
    idComponente: string
    idTabela: string
    idDicionarioTabelaCampo: string
    idUsuario: string
    observacao: string
  }) {
    return httpClient<unknown>('/api/dicionario-dados/componentes/campos-ignorados', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  async removeCampoIgnorado(id: string, input: { idComponente: string; idDicionarioTabelaCampo: string }) {
    return httpClient<unknown>(`/api/dicionario-dados/componentes/campos-ignorados/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      body: JSON.stringify(input),
    })
  },

  async saveCampo(id: string, input: { descricao?: string; regra?: string }) {
    return httpClient<unknown>(`/api/dicionario-dados/campos/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  async exportHtml() {
    const response = await fetchWithTenantContext('/api/dicionario-dados/export', { method: 'GET', cache: 'no-store' })
    if (!response.ok) {
      throw new Error('Nao foi possivel exportar o dicionario.')
    }
    return response.blob()
  },
}
