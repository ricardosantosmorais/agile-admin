export type UploadAssetVisibility = 'public' | 'private'

export type UploadAssetStorage =
  | 'inline'
  | 'legacy-controller'
  | 's3-direct'

export type UploadAssetResult = {
  value: string
  previewValue?: string
  fileName?: string
  storageKey?: string
}

export type UploadAssetContext = {
  profileId?: string
}

export type UploadAssetHandler = (file: File, context?: UploadAssetContext) => Promise<UploadAssetResult | string>

export type MultipartUploadHandlerOptions = {
  endpoint: string
  fieldName?: string
  method?: 'POST' | 'PUT'
  query?: Record<string, string>
  extraFields?: Record<string, string>
  mapResponse?: (payload: unknown) => UploadAssetResult | string
}

export type ProfileUploadHandlerOptions = {
  profileId: import('@/src/lib/upload-targets').UploadProfileId
  tenantBucketUrl?: string | null
  folder?: string
}

export function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Nao foi possivel converter o arquivo.'))
    reader.readAsDataURL(file)
  })
}

export async function base64UploadHandler(file: File): Promise<UploadAssetResult> {
  const dataUrl = await fileToDataUrl(file)
  return {
    value: dataUrl,
    previewValue: dataUrl,
    fileName: file.name,
  }
}

export function normalizeUploadResult(result: UploadAssetResult | string): UploadAssetResult {
  if (typeof result === 'string') {
    return { value: result, previewValue: result }
  }

  return {
    value: result.value,
    previewValue: result.previewValue ?? result.value,
    fileName: result.fileName,
    storageKey: result.storageKey,
  }
}

export function createMultipartUploadHandler({
  endpoint,
  fieldName = 'file',
  method = 'POST',
  query,
  extraFields,
  mapResponse,
}: MultipartUploadHandlerOptions): UploadAssetHandler {
  return async (file) => {
    const formData = new FormData()
    formData.append(fieldName, file)

    for (const [key, value] of Object.entries(extraFields ?? {})) {
      formData.append(key, value)
    }

    const params = new URLSearchParams(query)
    const response = await fetch(params.size ? `${endpoint}?${params.toString()}` : endpoint, {
      method,
      body: formData,
      credentials: 'include',
    })

    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    if (!response.ok) {
      const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string'
        ? payload.error.message
        : typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : typeof payload === 'string' && payload.trim()
            ? payload
            : 'Nao foi possivel enviar o arquivo.'
      throw new Error(message)
    }

    if (mapResponse) {
      return mapResponse(payload)
    }

    if (typeof payload === 'string') {
      return {
        value: payload,
        previewValue: payload,
        fileName: file.name,
      }
    }

    if (typeof payload === 'object' && payload !== null) {
      const record = payload as Record<string, unknown>
      const value = typeof record.file_url === 'string'
        ? record.file_url
        : typeof record.url === 'string'
          ? record.url
          : typeof record.value === 'string'
            ? record.value
            : typeof record.s3_key === 'string'
              ? record.s3_key
              : ''

      if (value) {
        return {
          value,
          previewValue: typeof record.previewValue === 'string' ? record.previewValue : value,
          fileName: typeof record.file_name === 'string' ? record.file_name : file.name,
          storageKey: typeof record.s3_key === 'string' ? record.s3_key : undefined,
        }
      }
    }

    throw new Error('Resposta de upload invalida.')
  }
}

export function createProfileUploadHandler({
  profileId,
  tenantBucketUrl,
  folder,
}: ProfileUploadHandlerOptions): UploadAssetHandler {
  const extraFields: Record<string, string> = {
    profileId,
  }

  if (tenantBucketUrl?.trim()) {
    extraFields.tenantBucketUrl = tenantBucketUrl.trim()
  }

  if (folder?.trim()) {
    extraFields.folder = folder.trim()
  }

  return createMultipartUploadHandler({
    endpoint: '/api/uploads',
    extraFields,
  })
}

export function getDisplayFileName(value: string, fileName?: string | null) {
  if (fileName?.trim()) {
    return fileName.trim()
  }

  const normalized = value.trim()
  if (!normalized) {
    return ''
  }

  const cleanValue = normalized.split('?')[0]
  const segments = cleanValue.split('/').filter(Boolean)
  return decodeURIComponent(segments[segments.length - 1] || cleanValue)
}
