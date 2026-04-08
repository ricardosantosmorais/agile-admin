'use client'

import { httpClient } from '@/src/services/http/http-client'

type PayloadResponse = {
  payload: unknown
  raw?: unknown
}

type PreviewResponse = {
  html: string
}

type HistoryResponse = {
  data: Array<{
    id: string
    data?: string | null
    html?: string | null
    usuario?: {
      nome?: string | null
    } | null
  }>
}

export const emailsTemplatesEditorClient = {
  async getPayloadExample(tipo: string) {
    const normalized = String(tipo || '').trim()
    if (!normalized) {
      return null
    }

    const response = await httpClient<PayloadResponse>(`/api/emails-templates/payload?tipo=${encodeURIComponent(normalized)}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return response.payload ?? null
  },

  async preview(input: { template: string; payload: unknown }) {
    const response = await httpClient<PreviewResponse>('/api/emails-templates/preview', {
      method: 'POST',
      body: JSON.stringify({
        emailTemplate: input.template,
        payload: input.payload,
      }),
      cache: 'no-store',
    })

    return response.html
  },

  async getHistory(templateId: string) {
    const normalizedId = String(templateId || '').trim()
    if (!normalizedId) {
      return []
    }

    const response = await httpClient<HistoryResponse>(`/api/emails-templates/${encodeURIComponent(normalizedId)}/historico?page=1&perPage=50`, {
      method: 'GET',
      cache: 'no-store',
    })

    return Array.isArray(response.data) ? response.data : []
  },
}
