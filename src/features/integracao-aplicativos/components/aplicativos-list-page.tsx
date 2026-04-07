'use client'

import { Copy, KeyRound, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { PageToast } from '@/src/components/ui/page-toast'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { INTEGRACAO_APLICATIVOS_CONFIG } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-config'
import { integracaoAplicativosCrudClient } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-crud-client'
import { integracaoAplicativosClient } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-client'
import { copyTextToClipboard } from '@/src/lib/clipboard'
import { isTruthyFlag } from '@/src/lib/boolean-utils'
import { StatusBadge } from '@/src/components/ui/status-badge'

type ToastState = { tone: 'success' | 'error'; message: string } | null

export function AplicativosListPage() {
  const [toast, setToast] = useState<ToastState>(null)

  const config = useMemo<CrudModuleConfig>(() => ({
    ...INTEGRACAO_APLICATIVOS_CONFIG,
    renderMobileBadges: (record, { t }) => {
      const checked = isTruthyFlag(record.ativo)
      return (
        <StatusBadge tone={checked ? 'success' : 'warning'}>
          {checked ? t('common.yes', 'Sim') : t('common.no', 'Não')}
        </StatusBadge>
      )
    },
    buildListRowActions: ({ record, access, t, refreshList }) => [
      {
        id: 'permissions',
        label: t('integrationApps.actions.permissions', 'Permissões de acesso'),
        icon: ShieldCheck,
        href: `/api-de-integracao/aplicativos/${record.id}/permissoes`,
        visible: access.canEdit || access.canView,
      },
      {
        id: 'copy-client-id',
        label: t('integrationApps.actions.copyClientId', 'Copiar Client ID'),
        icon: Copy,
        onClick: () => {
          void copyTextToClipboard(String(record.login || ''))
            .then(() => {
              setToast({ tone: 'success', message: t('integrationApps.feedback.clientIdCopied', 'Client ID copiado.') })
            })
            .catch(() => {
              setToast({ tone: 'error', message: t('integrationApps.feedback.copyError', 'Não foi possível copiar o valor.') })
            })
        },
        visible: access.canView,
      },
      {
        id: 'copy-secret',
        label: t('integrationApps.actions.copySecret', 'Copiar Secret'),
        icon: KeyRound,
        onClick: () => {
          void copyTextToClipboard(String(record.senha || ''))
            .then(() => {
              setToast({ tone: 'success', message: t('integrationApps.feedback.secretCopied', 'Secret copiado.') })
            })
            .catch(() => {
              setToast({ tone: 'error', message: t('integrationApps.feedback.copyError', 'Não foi possível copiar o valor.') })
            })
        },
        visible: access.canView,
      },
      {
        id: 'refresh-secret',
        label: t('integrationApps.actions.refreshSecret', 'Gerar novo secret'),
        icon: RefreshCcw,
        onClick: () => {
          void integracaoAplicativosClient.refreshSecret(String(record.id || ''))
            .then(() => {
              refreshList()
              setToast({ tone: 'success', message: t('integrationApps.feedback.secretRefreshed', 'Secret renovado com sucesso.') })
            })
            .catch((error) => {
              setToast({
                tone: 'error',
                message: error instanceof Error
                  ? error.message
                  : t('integrationApps.feedback.secretRefreshError', 'Não foi possível renovar o secret.'),
              })
            })
        },
        visible: access.canEdit,
      },
    ],
    renderListBottom: () => (
      toast ? <PageToast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null
    ),
  }), [toast])

  return <CrudListPage config={config} client={integracaoAplicativosCrudClient} />
}
