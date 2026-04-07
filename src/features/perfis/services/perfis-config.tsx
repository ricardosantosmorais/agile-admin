'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { DEFAULT_PERFIL_LIST_FILTERS } from '@/src/features/perfis/services/perfis-mappers'
import { isTruthyFlag } from '@/src/lib/boolean-utils'

export const PERFIS_CONFIG: CrudModuleConfig = {
  key: 'perfis',
  resource: 'perfis_administradores',
  routeBase: '/perfis',
  featureKey: 'perfis',
  listTitleKey: 'perfis.title',
  listTitle: 'Perfis',
  listDescriptionKey: 'perfis.listDescription',
  listDescription: 'Gerencie perfis administrativos e os acessos liberados para cada grupo.',
  formTitleKey: 'perfis.form.title',
  formTitle: 'Perfil',
  breadcrumbSectionKey: 'routes.administration',
  breadcrumbSection: 'Administração',
  breadcrumbModuleKey: 'routes.perfis',
  breadcrumbModule: 'Perfis',
  defaultFilters: DEFAULT_PERFIL_LIST_FILTERS,
  columns: [
    {
      id: 'id',
      labelKey: 'perfis.columns.id',
      label: 'ID',
      sortKey: 'id',
      thClassName: 'w-[100px]',
      filter: {
        kind: 'text',
        key: 'id',
        labelKey: 'perfis.columns.id',
        label: 'ID',
      },
    },
    {
      id: 'codigo',
      labelKey: 'perfis.columns.code',
      label: 'Código',
      sortKey: 'codigo',
      visibility: 'lg',
      filter: {
        kind: 'text',
        key: 'codigo',
        labelKey: 'perfis.columns.code',
        label: 'Código',
      },
    },
    {
      id: 'nome',
      labelKey: 'perfis.columns.name',
      label: 'Nome',
      sortKey: 'nome',
      tdClassName: 'font-semibold text-slate-950',
      filter: {
        kind: 'text',
        key: 'nome::like',
        labelKey: 'perfis.columns.name',
        label: 'Nome',
      },
    },
    {
      id: 'ativo',
      labelKey: 'perfis.columns.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[120px]',
      filter: {
        kind: 'select',
        key: 'ativo',
        labelKey: 'perfis.columns.active',
        label: 'Ativo',
        options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }],
      },
    },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => String(record.id || '-'),
  renderMobileBadges: (record, { t }) => {
    const checked = isTruthyFlag(record.ativo)
    return (
      <StatusBadge tone={checked ? 'success' : 'warning'}>
        {checked ? t('common.yes', 'Yes') : t('common.no', 'No')}
      </StatusBadge>
    )
  },
  sections: [],
}
