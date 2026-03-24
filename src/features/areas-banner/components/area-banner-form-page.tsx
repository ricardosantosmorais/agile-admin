'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { areasBannerClient } from '@/src/features/areas-banner/services/areas-banner-client'
import { AREAS_BANNER_CONFIG } from '@/src/features/areas-banner/services/areas-banner-config'

export function AreaBannerFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={AREAS_BANNER_CONFIG} client={areasBannerClient} id={id} />
}
