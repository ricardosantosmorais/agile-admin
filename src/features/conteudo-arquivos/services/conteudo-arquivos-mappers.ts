import { formatDateTime } from '@/src/lib/date-time'
import type { ConteudoArquivoRecord, ConteudoArquivosListResponse } from '@/src/features/conteudo-arquivos/services/conteudo-arquivos-types'

const PREVIEWABLE_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'])

function toStringValue(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value || '').trim()
}

function toNumberValue(value: unknown, fallback: number) {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

function parseUrlPath(value: string) {
	if (!value) {
		return ''
	}

	try {
		return decodeURIComponent(new URL(value).pathname || '')
	} catch {
		return decodeURIComponent(value.split('?')[0] || '')
	}
}

export function getConteudoArquivoNome(value: string) {
	const path = parseUrlPath(value)
	const segments = path.split('/').filter(Boolean)
	return segments[segments.length - 1] || value
}

export function getConteudoArquivoPasta(value: string) {
	const path = parseUrlPath(value)
	const normalized = path.replace(/^\/+/, '')
	const marker = 'arquivos/'
	const markerIndex = normalized.toLowerCase().indexOf(marker)
	if (markerIndex < 0) {
		return ''
	}

	const relative = normalized.slice(markerIndex + marker.length)
	const segments = relative.split('/').filter(Boolean)
	if (segments.length <= 1) {
		return ''
	}

	return segments.slice(0, -1).join('/')
}

export function isConteudoArquivoPreviewable(value: string) {
	const fileName = getConteudoArquivoNome(value)
	const extension = fileName.includes('.') ? fileName.split('.').pop() || '' : ''
	return PREVIEWABLE_EXTENSIONS.has(extension.toLowerCase())
}

export function normalizeConteudoArquivosResponse(
	payload: unknown,
	fallback: { page: number; perPage: number },
): ConteudoArquivosListResponse {
	const response = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {}
	const meta = typeof response.meta === 'object' && response.meta !== null ? response.meta as Record<string, unknown> : {}
	const items = Array.isArray(response.data) ? response.data : []

	return {
		data: items
			.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
			.map((item): ConteudoArquivoRecord => {
				const arquivoUrl = toStringValue(item.arquivo)
				const arquivoNome = getConteudoArquivoNome(arquivoUrl)
				const extensao = arquivoNome.includes('.') ? (arquivoNome.split('.').pop() || '').toLowerCase() : ''
				const dataEnvio = toStringValue(item.data_envio)

				return {
					id: toStringValue(item.id),
					arquivoUrl,
					arquivoNome,
					pasta: getConteudoArquivoPasta(arquivoUrl),
					extensao,
					isPreviewable: isConteudoArquivoPreviewable(arquivoUrl),
					dataEnvio,
					dataEnvioLabel: dataEnvio ? formatDateTime(dataEnvio) : '',
				}
			}),
		meta: {
			page: toNumberValue(meta.page, fallback.page),
			pages: toNumberValue(meta.pages, 1),
			perPage: toNumberValue(meta.perPage ?? meta.perpage, fallback.perPage),
			from: toNumberValue(meta.from, 0),
			to: toNumberValue(meta.to, 0),
			total: toNumberValue(meta.total, items.length),
		},
	}
}
