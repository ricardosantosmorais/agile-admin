'use client'

import { useEffect, useMemo, useState } from 'react'
import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { appsClient } from '@/src/features/apps/services/apps-client'
import { APPS_CONFIG } from '@/src/features/apps/services/apps-config'
import { AppsBuildEmailModal, AppsDeployConfirm, type AppsBuildAction, type AppsDeployAction } from '@/src/features/apps/components/apps-action-dialogs'
import { AppsLogsModal } from '@/src/features/apps/components/apps-logs-modal'

type AppsLogsAction = {
  id: string
  chaveCliente?: string | null
} | null

function readEventDetail<T>(event: Event): T | null {
  return event instanceof CustomEvent ? event.detail as T : null
}

export function AppsListPage() {
  const [deployAction, setDeployAction] = useState<AppsDeployAction>(null)
  const [buildAction, setBuildAction] = useState<AppsBuildAction>(null)
  const [logsAction, setLogsAction] = useState<AppsLogsAction>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    function handleDeploy(event: Event) {
      const detail = readEventDetail<NonNullable<AppsDeployAction>>(event)
      if (detail?.id && (detail.platform === 'android' || detail.platform === 'ios')) setDeployAction(detail)
    }

    function handleBuild(event: Event) {
      const detail = readEventDetail<NonNullable<AppsBuildAction>>(event)
      if (detail?.id) setBuildAction(detail)
    }

    function handleLogs(event: Event) {
      const detail = readEventDetail<NonNullable<AppsLogsAction>>(event)
      if (detail?.id) setLogsAction(detail)
    }

    window.addEventListener('apps:deploy', handleDeploy)
    window.addEventListener('apps:build', handleBuild)
    window.addEventListener('apps:logs', handleLogs)
    return () => {
      window.removeEventListener('apps:deploy', handleDeploy)
      window.removeEventListener('apps:build', handleBuild)
      window.removeEventListener('apps:logs', handleLogs)
    }
  }, [])

  const client = useMemo(() => ({
    ...appsClient,
    list: (...args: Parameters<typeof appsClient.list>) => appsClient.list(...args),
  }), [refreshToken])

  function closeAction(refresh?: boolean) {
    setDeployAction(null)
    setBuildAction(null)
    if (refresh) setRefreshToken((current) => current + 1)
  }

  return (
    <>
      <CrudListPage key={refreshToken} config={APPS_CONFIG} client={client} />
      <AppsDeployConfirm action={deployAction} onClose={closeAction} />
      <AppsBuildEmailModal action={buildAction} onClose={closeAction} />
      <AppsLogsModal app={logsAction} onClose={() => setLogsAction(null)} />
    </>
  )
}
