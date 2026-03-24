'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { bannersClient } from '@/src/features/banners/services/banners-client'
import { BANNERS_CONFIG } from '@/src/features/banners/services/banners-config'

export function BannersListPage() {
  return <CrudListPage config={BANNERS_CONFIG} client={bannersClient} />
}
