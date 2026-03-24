'use client'

import { Gift, Package, ShieldAlert } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { ComboExcecoesTab } from '@/src/features/combos/components/combo-excecoes-tab'
import { ComboProdutosTab } from '@/src/features/combos/components/combo-produtos-tab'
import { combosClient } from '@/src/features/combos/services/combos-client'
import { COMBOS_CONFIG } from '@/src/features/combos/services/combos-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function ComboFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={COMBOS_CONFIG}
      client={combosClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('marketing.combos.tabs.general', 'Dados gerais'),
          icon: <Gift className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'products',
          label: t('marketing.combos.tabs.products.title', 'Produtos'),
          icon: <Package className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: comboId, readOnly, onFeedback }) => comboId ? (
            <ComboProdutosTab comboId={comboId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'exceptions',
          label: t('marketing.combos.tabs.exceptions.title', 'Exceções'),
          icon: <ShieldAlert className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: comboId, readOnly, onFeedback }) => comboId ? (
            <ComboExcecoesTab comboId={comboId} readOnly={readOnly} onError={onFeedback} />
          ) : null,
        },
      ]}
    />
  )
}
