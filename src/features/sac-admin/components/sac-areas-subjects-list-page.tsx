'use client'

import { useMemo } from 'react'
import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { getSacAdminPermissions } from '@/src/features/sac-admin/services/sac-admin-mappers'
import { SAC_AREAS_SUBJECTS_CONFIG, sacAreasSubjectsCrudClient } from '@/src/features/sac-admin/services/sac-areas-subjects-crud'

export function SacAreasSubjectsListPage() {
  const { session } = useAuth()
  const accessOverride = useMemo(() => {
    const permissions = getSacAdminPermissions(session)
    return {
      canCreate: permissions.canConfigureAreas,
      canDelete: permissions.canConfigureAreas,
      canEdit: permissions.canConfigureAreas,
      canList: permissions.canConfigureAreas,
      canOpen: permissions.canConfigureAreas,
      canView: permissions.canConfigureAreas,
    }
  }, [session])

  return <CrudListPage config={SAC_AREAS_SUBJECTS_CONFIG} client={sacAreasSubjectsCrudClient} accessOverride={accessOverride} />
}
