'use client'

import type { CatalogUniverseRecord } from '@/src/features/catalog/types/catalog-relations'

export type BannerUniverseRecord = CatalogUniverseRecord

export type BannerUrlRecord = {
  url: string
  ativo?: boolean
}
