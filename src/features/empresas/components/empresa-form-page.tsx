'use client'

import { Building2, Contact, MapPin, PencilLine, Wallet } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { empresasClient } from '@/src/features/empresas/services/empresas-client'
import { EMPRESAS_CONFIG } from '@/src/features/empresas/services/empresas-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function EmpresaFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={EMPRESAS_CONFIG}
      client={empresasClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('rootCompanies.sections.general', 'Dados gerais'),
          icon: <PencilLine className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'address',
          label: t('rootCompanies.sections.address', 'Endereço'),
          icon: <MapPin className="h-4 w-4" />,
          sectionIds: ['address'],
        },
        {
          key: 'contacts',
          label: t('rootCompanies.sections.contacts', 'Contatos'),
          icon: <Contact className="h-4 w-4" />,
          sectionIds: ['contacts'],
        },
        {
          key: 'implementation',
          label: t('rootCompanies.sections.implementation', 'Implantação'),
          icon: <Building2 className="h-4 w-4" />,
          sectionIds: ['implementation'],
        },
        {
          key: 'financial',
          label: t('rootCompanies.sections.financial', 'Financeiro'),
          icon: <Wallet className="h-4 w-4" />,
          sectionIds: ['financial'],
        },
      ]}
    />
  )
}
