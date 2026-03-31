import type { CrudRecord } from '@/src/components/crud-base/types'

function normalizeBucketUrl(assetsBucketUrl?: string | null) {
  return String(assetsBucketUrl || '').trim().replace(/\/+$/, '')
}

export function buildProdutoImageUrl(
  imageName: string | null | undefined,
  assetsBucketUrl?: string | null,
) {
  const fileName = String(imageName || '').trim().replace(/^\/+/, '')
  const bucketUrl = normalizeBucketUrl(assetsBucketUrl)

  if (!fileName || !bucketUrl) {
    return ''
  }

  return `${bucketUrl}/${fileName}`
}

export function buildProdutoImageCandidates(
  imageName: string | null | undefined,
  assetsBucketUrl?: string | null,
) {
  const fileName = String(imageName || '').trim().replace(/^\/+/, '')
  const bucketUrl = normalizeBucketUrl(assetsBucketUrl)

  if (!fileName || !bucketUrl) {
    return []
  }

  if (fileName.includes('/')) {
    return [`${bucketUrl}/${fileName}`]
  }

  return [
    `${bucketUrl}/${fileName}`,
    `${bucketUrl}/produtos/${fileName}`,
  ]
}

export function buildProdutoImageUrlFromRecord(
  record: CrudRecord,
  assetsBucketUrl?: string | null,
) {
  const direct = String(record.imagem_url || '').trim()
  if (direct) {
    return direct
  }

  const images = Array.isArray(record.imagens) ? (record.imagens as Array<Record<string, unknown>>) : []
  const first = images[0]
  const embeddedUrl = first && typeof first.imagem_url === 'string' ? first.imagem_url : ''
  if (embeddedUrl) {
    return embeddedUrl
  }

  const imageName = first && typeof first.imagem === 'string' ? first.imagem : ''
  return buildProdutoImageUrl(imageName, assetsBucketUrl)
}
