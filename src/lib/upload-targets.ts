export type UploadProfileId =
  | 'tenant-public-images'
  | 'tenant-public-files'
  | 'public-cdn-components'
  | 'private-app-files'

export type ResolvedUploadTarget = {
  bucket: string
  baseUrl?: string
  keyPrefix: string
  acl: 'public-read' | 'private'
  isPublic: boolean
}

function normalizeUrlLike(value?: string | null) {
  return String(value || '').trim().replace(/\/+$/, '')
}

export function extractBucketName(value?: string | null) {
  const normalized = normalizeUrlLike(value)
  if (!normalized) {
    return ''
  }

  if (!normalized.includes('://')) {
    return normalized.replace(/^\/+/, '').replace(/\/.*$/, '')
  }

  try {
    return new URL(normalized).host
  } catch {
    return normalized.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  }
}

export function buildAssetUrl(baseUrl: string | undefined, key: string) {
  const normalizedBase = normalizeUrlLike(baseUrl)
  if (!normalizedBase) {
    return ''
  }

  return `${normalizedBase}/${key.replace(/^\/+/, '')}`
}

export function slugifyUploadName(fileName: string) {
  const normalized = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || 'arquivo'
}

export function buildUploadObjectKey(prefix: string, originalFileName: string, fixedFileName?: string) {
  const sourceName = (fixedFileName?.trim() || originalFileName).trim() || 'arquivo'
  const lastDot = sourceName.lastIndexOf('.')
  const rawName = lastDot >= 0 ? sourceName.slice(0, lastDot) : sourceName
  const extension = lastDot >= 0 ? sourceName.slice(lastDot + 1).toLowerCase() : ''
  const slug = slugifyUploadName(rawName)
  const baseName = fixedFileName?.trim()
    ? `${slug}${extension ? `.${extension}` : ''}`
    : `${slug}-${Date.now()}${extension ? `.${extension}` : ''}`

  return `${prefix.replace(/\/+$/, '')}/${baseName}`
}

export function resolveUploadTarget(input: {
  profileId: UploadProfileId
  tenantBucketUrl?: string | null
  folder?: string | null
  publicBucketFallback?: string | null
  publicBaseUrlFallback?: string | null
  privateBucket?: string | null
}) {
  const tenantBucketUrl = normalizeUrlLike(input.tenantBucketUrl)
  const publicBucketFallback = normalizeUrlLike(input.publicBucketFallback)
  const publicBaseUrlFallback = normalizeUrlLike(input.publicBaseUrlFallback)
  const privateBucket = normalizeUrlLike(input.privateBucket)

  switch (input.profileId) {
    case 'tenant-public-images': {
      const bucket = extractBucketName(tenantBucketUrl || publicBucketFallback)
      const folder = normalizeUrlLike(input.folder) || 'imgs'
      return {
        bucket,
        baseUrl: tenantBucketUrl || publicBaseUrlFallback || (bucket ? `https://${bucket}` : ''),
        keyPrefix: folder,
        acl: 'public-read',
        isPublic: true,
      } satisfies ResolvedUploadTarget
    }
    case 'tenant-public-files': {
      const bucket = extractBucketName(tenantBucketUrl || publicBucketFallback)
      const folder = normalizeUrlLike(input.folder)
      return {
        bucket,
        baseUrl: tenantBucketUrl || publicBaseUrlFallback || (bucket ? `https://${bucket}` : ''),
        keyPrefix: folder ? `arquivos/${folder}` : 'arquivos',
        acl: 'public-read',
        isPublic: true,
      } satisfies ResolvedUploadTarget
    }
    case 'public-cdn-components':
      return {
        bucket: 'assets.agilecdn.com.br',
        baseUrl: 'https://assets.agilecdn.com.br',
        keyPrefix: 'componentes',
        acl: 'public-read',
        isPublic: true,
      } satisfies ResolvedUploadTarget
    case 'private-app-files':
      return {
        bucket: privateBucket,
        keyPrefix: 'apps',
        acl: 'private',
        isPublic: false,
      } satisfies ResolvedUploadTarget
  }
}
