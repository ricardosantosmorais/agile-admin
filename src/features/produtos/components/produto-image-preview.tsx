'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { buildProdutoImageCandidates } from '@/src/features/produtos/services/produto-image-url'

type ProdutoImagePreviewProps = {
  imageName?: string | null
  directUrl?: string | null
  assetsBucketUrl?: string | null
  alt: string
  className?: string
  imageClassName?: string
  emptyLabel?: string
}

export function ProdutoImagePreview({
  imageName,
  directUrl,
  assetsBucketUrl,
  alt,
  className = 'relative h-16 w-16 overflow-hidden rounded-xl border border-line bg-white',
  imageClassName = 'object-cover',
  emptyLabel = 'IMG',
}: ProdutoImagePreviewProps) {
  const candidates = useMemo(() => {
    const direct = String(directUrl || '').trim()
    return direct ? [direct] : buildProdutoImageCandidates(imageName, assetsBucketUrl)
  }, [assetsBucketUrl, directUrl, imageName])
  const [candidateIndex, setCandidateIndex] = useState(0)

  const src = candidates[candidateIndex] || ''

  if (!src) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-[#ded6c6] bg-[#fcfaf5] text-xs text-slate-400">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        fill
        className={imageClassName}
        unoptimized
        onError={() => {
          setCandidateIndex((current) => {
            const next = current + 1
            return next < candidates.length ? next : current
          })
        }}
      />
    </div>
  )
}
