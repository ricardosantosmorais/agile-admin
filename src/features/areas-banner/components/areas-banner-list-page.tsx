'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { areasBannerClient } from '@/src/features/areas-banner/services/areas-banner-client'
import { AREAS_BANNER_CONFIG } from '@/src/features/areas-banner/services/areas-banner-config'

export function AreasBannerListPage() {
  return <CrudListPage config={AREAS_BANNER_CONFIG} client={areasBannerClient} />
}
