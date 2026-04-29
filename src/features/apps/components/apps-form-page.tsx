'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { appsClient } from '@/src/features/apps/services/apps-client'
import { APPS_CONFIG } from '@/src/features/apps/services/apps-config'

export function AppsFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={APPS_CONFIG} client={appsClient} id={id} />
}
