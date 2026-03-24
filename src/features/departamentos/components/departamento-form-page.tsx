'use client'

import { PencilLine, Search } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { DEPARTAMENTOS_CONFIG } from '@/src/features/departamentos/services/departamentos-config'
import { departamentosClient } from '@/src/features/departamentos/services/departamentos-client'

export function DepartamentoFormPage({ id }: { id?: string }) {
  return (
    <TabbedCatalogFormPage
      config={DEPARTAMENTOS_CONFIG}
      client={departamentosClient}
      id={id}
      formEmbed="departamento_pai"
      tabs={[
        {
          key: 'general',
          label: 'Dados gerais',
          icon: <PencilLine className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'seo',
          label: 'SEO',
          icon: <Search className="h-4 w-4" />,
          sectionIds: ['seo'],
        },
      ]}
    />
  )
}
