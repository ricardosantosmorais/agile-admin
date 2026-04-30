import { httpClient } from '@/src/services/http/http-client'
import { normalizeImportarPlanilhaResponse, normalizeProcessoArquivoDetail } from '@/src/features/importar-planilha/services/importar-planilha-mappers'
import { fetchWithTenantContext } from '@/src/services/http/tenant-context'
import type {
  ImportarPlanilhaFilters,
  ImportarPlanilhaResponse,
  ProcessoArquivoDetail,
} from '@/src/features/importar-planilha/services/importar-planilha-types'

const CHUNK_SIZE_BYTES = 10 * 1024 * 1024

function appendFilters(params: URLSearchParams, values: Record<string, unknown>, skipKeys: string[] = []) {
  for (const [key, value] of Object.entries(values)) {
    if (skipKeys.includes(key)) continue
    const normalized = String(value || '').trim()
    if (!normalized) continue
    params.set(key, normalized)
  }
}

async function parseUploadResponse(response: Response) {
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : 'Não foi possível enviar o arquivo da planilha.'
    throw new Error(message)
  }

  return payload as {
    success: boolean
    status?: 'chunk_uploaded' | 'completed'
    uploadId?: string
    progress?: number
    message?: string
  }
}

export const importarPlanilhaClient = {
  async list(filters: ImportarPlanilhaFilters): Promise<ImportarPlanilhaResponse> {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    appendFilters(params, filters, ['page', 'perPage', 'orderBy', 'sort'])

    const payload = await httpClient<unknown>(`/api/processos-arquivos?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeImportarPlanilhaResponse(payload, { page: filters.page, perPage: filters.perPage })
  },

  async getById(id: string): Promise<ProcessoArquivoDetail> {
    const payload = await httpClient<unknown>(`/api/processos-arquivos/${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return normalizeProcessoArquivoDetail(payload)
  },

  async cancelar(id: string) {
    return httpClient<{ success: boolean }>(`/api/processos-arquivos/${encodeURIComponent(id)}/cancelar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },

  async reprocessar(id: string) {
    return httpClient<{ success: boolean }>(`/api/processos-arquivos/${encodeURIComponent(id)}/reprocessar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },

  async iniciar(id: string) {
    return httpClient<{ success: boolean }>(`/api/processos-arquivos/${encodeURIComponent(id)}/iniciar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },

  async uploadSpreadsheet(file: File, onProgress?: (progress: number) => void) {
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_BYTES))
    const uploadId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9_-]/g, '')

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      const start = chunkIndex * CHUNK_SIZE_BYTES
      const end = Math.min(file.size, start + CHUNK_SIZE_BYTES)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append('file', chunk, file.name)
      formData.append('dzuuid', uploadId)
      formData.append('dzfilename', file.name)
      formData.append('dzchunkindex', String(chunkIndex))
      formData.append('dztotalchunkcount', String(totalChunks))
      formData.append('dztotalfilesize', String(file.size))

      const response = await fetchWithTenantContext('/api/processos-arquivos', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const payload = await parseUploadResponse(response)
      const progress = typeof payload.progress === 'number'
        ? payload.progress
        : Math.round(((chunkIndex + 1) / totalChunks) * 100)

      onProgress?.(Math.min(100, Math.max(0, progress)))
    }

    return {
      success: true,
      message: 'Upload concluído com sucesso. O processo foi criado para execução.',
    }
  },
}
