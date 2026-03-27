'use client'

import { CalendarCheck2, FileText, Gavel, LockKeyhole, ShieldBan } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { FormaEntregaAgendamentoTab } from '@/src/features/formas-entrega/components/forma-entrega-agendamento-tab'
import { FormaEntregaOcorrenciasTab } from '@/src/features/formas-entrega/components/forma-entrega-ocorrencias-tab'
import { FormaEntregaRegrasTab } from '@/src/features/formas-entrega/components/forma-entrega-regras-tab'
import { FORMAS_ENTREGA_CONFIG } from '@/src/features/formas-entrega/services/formas-entrega-config'
import { formasEntregaClient } from '@/src/features/formas-entrega/services/formas-entrega-client'
import { useI18n } from '@/src/i18n/use-i18n'

export function FormaEntregaFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={FORMAS_ENTREGA_CONFIG}
      client={formasEntregaClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('logistics.deliveryMethods.tabs.general', 'Dados gerais'),
          icon: <FileText className="h-4 w-4" />,
          sectionIds: ['flags', 'basic', 'delivery-days', 'branches', 'transport-restrictions', 'instructions'],
        },
        {
          key: 'rules',
          label: t('logistics.deliveryMethods.tabs.rules', 'Regras'),
          icon: <Gavel className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: formaEntregaId, readOnly, onFeedback }) => formaEntregaId ? (
            <FormaEntregaRegrasTab formaEntregaId={formaEntregaId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'scheduling',
          label: t('logistics.deliveryMethods.tabs.scheduling', 'Agendamento'),
          icon: <CalendarCheck2 className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: formaEntregaId, form, refreshRecord, readOnly, onFeedback }) => formaEntregaId ? (
            <FormaEntregaAgendamentoTab
              formaEntregaId={formaEntregaId}
              form={form}
              readOnly={readOnly}
              refreshRecord={refreshRecord}
              onError={onFeedback}
            />
          ) : null,
        },
        {
          key: 'restrictions',
          label: t('logistics.deliveryMethods.tabs.restrictions', 'Restricoes'),
          icon: <ShieldBan className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: formaEntregaId, readOnly, onFeedback }) => formaEntregaId ? (
            <FormaEntregaOcorrenciasTab mode="restricoes" formaEntregaId={formaEntregaId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'exceptions',
          label: t('logistics.deliveryMethods.tabs.exceptions', 'Excecoes'),
          icon: <LockKeyhole className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: formaEntregaId, readOnly, onFeedback }) => formaEntregaId ? (
            <FormaEntregaOcorrenciasTab mode="excecoes" formaEntregaId={formaEntregaId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
      ]}
    />
  )
}
