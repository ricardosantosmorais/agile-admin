'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { GRADES_CONFIG } from '@/src/features/grades/services/grades-config'
import { gradesClient } from '@/src/features/grades/services/grades-client'

export function GradesListPage() {
  return <CrudListPage config={GRADES_CONFIG} client={gradesClient} />
}
