import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { isTruthyFlag } from '@/src/lib/boolean-utils'
import { agileAdministradoresClient } from '@/src/features/agile-administradores/services/agile-administradores-client'
import {
  DEFAULT_AGILE_ADMINISTRADORES_FILTERS,
} from '@/src/features/agile-administradores/services/agile-administradores-mappers'

export const AGILE_ADMINISTRADORES_CONFIG: CrudModuleConfig = {
  key: 'agile-administradores',
  resource: 'administradores_master',
  routeBase: '/agile/administradores',
  featureKey: 'administradores',
  listTitleKey: 'administradores.title',
  listTitle: 'Administradores',
  listDescriptionKey: 'administradores.listDescription',
  listDescription: 'Gerencie administradores, empresas e acessos do perfil Agile.',
  formTitleKey: 'administradores.form.title',
  formTitle: 'Administrador',
  hideBreadcrumbSection: true,
  breadcrumbSectionKey: 'routes.administration',
  breadcrumbSection: 'Administração',
  breadcrumbModuleKey: 'administradores.title',
  breadcrumbModule: 'Administradores',
  defaultFilters: DEFAULT_AGILE_ADMINISTRADORES_FILTERS,
  actionsColumnClassName: 'w-[168px] min-w-[168px]',
  columns: [
    {
      id: 'nome',
      labelKey: 'administradores.columns.name',
      label: 'Nome',
      sortKey: 'nome',
      tdClassName: 'min-w-[220px] font-semibold text-[color:var(--app-text)]',
      filter: {
        kind: 'text',
        key: 'nome::like',
        labelKey: 'administradores.columns.name',
        label: 'Nome',
      },
    },
    {
      id: 'email',
      labelKey: 'administradores.columns.email',
      label: 'E-mail',
      sortKey: 'email',
      visibility: 'lg',
      tdClassName: 'min-w-[240px] break-words',
      filter: {
        kind: 'text',
        key: 'email::like',
        labelKey: 'administradores.columns.email',
        label: 'E-mail',
      },
    },
    {
      id: 'empresaAtual',
      labelKey: 'administradores.columns.currentCompany',
      label: 'Empresa atual',
      sortKey: 'id_empresa',
      visibility: 'lg',
      tdClassName: 'min-w-[220px] break-words',
      filter: {
        kind: 'lookup',
        key: 'idEmpresa',
        labelKey: 'administradores.columns.currentCompany',
        label: 'Empresa atual',
        loadOptions: agileAdministradoresClient.loadEmpresaOptions,
        pageSize: 20,
      },
    },
    {
      id: 'ultimoAcesso',
      labelKey: 'administradores.columns.lastAccess',
      label: 'Último acesso',
      sortKey: 'ultimo_acesso',
      visibility: 'xl',
      tdClassName: 'min-w-[170px]',
      filter: {
        kind: 'date-range',
        fromKey: 'ultimo_acesso::ge',
        toKey: 'ultimo_acesso::le',
        labelKey: 'administradores.columns.lastAccess',
        label: 'Último acesso',
      },
    },
    {
      id: 'ativo',
      labelKey: 'administradores.columns.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[112px]',
      tdClassName: 'w-[112px]',
      filter: {
        kind: 'select',
        key: 'ativo',
        labelKey: 'administradores.columns.active',
        label: 'Ativo',
        options: [
          { value: '1', labelKey: 'common.yes', label: 'Sim' },
          { value: '0', labelKey: 'common.no', label: 'Não' },
        ],
      },
      render: (record, { t }) => {
        const active = isTruthyFlag(record.ativo)
        return (
          <StatusBadge tone={active ? 'success' : 'warning'}>
            {active ? t('common.yes', 'Sim') : t('common.no', 'Não')}
          </StatusBadge>
        )
      },
    },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.email || '-'),
  mobileMeta: (record) => String(record.empresaAtual || '-'),
  renderMobileBadges: (record, { t }) => {
    const active = isTruthyFlag(record.ativo)
    return (
      <StatusBadge tone={active ? 'success' : 'warning'}>
        {active ? t('common.yes', 'Sim') : t('common.no', 'Não')}
      </StatusBadge>
    )
  },
  buildListRowActions: ({ record, access, t }) => [
    {
      id: 'password',
      label: t('administradores.actions.password', 'Alterar senha'),
      icon: KeyRound,
      href: `/agile/administradores/${record.id}/senha`,
      visible: access.canEdit,
    },
  ],
  details: [
    {
      key: 'ultimoAcesso',
      labelKey: 'administradores.columns.lastAccess',
      label: 'Último acesso',
      render: (record) => (
        <div className="space-y-1">
          <div>{String(record.ultimoAcesso || '-')}</div>
          {record.ipUltimoAcesso ? <div className="text-xs text-[color:var(--app-muted)]">IP: {String(record.ipUltimoAcesso)}</div> : null}
        </div>
      ),
    },
  ],
  sections: [
    {
      id: 'general',
      titleKey: 'administradores.columns.mainData',
      title: 'Dados principais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
        { key: 'codigo', labelKey: 'administradores.columns.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'administradores.columns.name', label: 'Nome', type: 'text', required: true },
        { key: 'email', labelKey: 'administradores.columns.email', label: 'E-mail', type: 'email', required: true },
        { key: 'celular', labelKey: 'administradores.columns.mobile', label: 'Celular', type: 'text', mask: 'mobile' },
        {
          key: 'senha',
          labelKey: 'administradores.form.newPassword',
          label: 'Nova senha',
          type: 'password',
          hidden: ({ isEditing }) => isEditing,
          required: true,
        },
        {
          key: 'confirmacao',
          labelKey: 'administradores.form.confirmation',
          label: 'Confirmação',
          type: 'password',
          hidden: ({ isEditing }) => isEditing,
          required: true,
          validate: ({ value, form, isEditing }) => !isEditing && value !== form.senha ? 'administradores.form.validation.password' : null,
        },
      ],
    },
  ],
  normalizeRecord: (record) => record,
  getSaveRedirectPath: ({ isEditing, saved, form }) => {
    if (isEditing) {
      return '/agile/administradores'
    }

    const savedId = String(saved[0]?.id || form.id || '')
    return savedId ? `/agile/administradores/${savedId}/editar` : '/agile/administradores'
  },
  renderHeaderActions: ({ id, isEditing, readOnly }) => {
    if (!isEditing || !id || readOnly) return null
    return (
      <Link href={`/agile/administradores/${id}/senha`} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
        <KeyRound className="h-4 w-4" />
        Alterar senha
      </Link>
    )
  },
}
