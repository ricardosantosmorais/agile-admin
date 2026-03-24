'use client'

import Link from 'next/link'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import {
  createEmptyAdminForm,
  DEFAULT_ADMIN_LIST_FILTERS,
  mapAdminDetail,
  toAdminPayload,
} from '@/src/features/administradores/services/administradores-mappers'

export const ADMINISTRADORES_CONFIG: CrudModuleConfig = {
  key: 'administradores',
  resource: 'perfis_administradores',
  routeBase: '/administradores',
  featureKey: 'administradores',
  listTitleKey: 'administradores.title',
  listTitle: 'Administradores',
  listDescriptionKey: 'administradores.listDescription',
  listDescription: 'Gerencie administradores, perfis e acesso ao painel.',
  formTitleKey: 'administradores.form.title',
  formTitle: 'Administrador',
  breadcrumbSectionKey: 'routes.administration',
  breadcrumbSection: 'Administração',
  breadcrumbModuleKey: 'administradores.title',
  breadcrumbModule: 'Administradores',
  defaultFilters: DEFAULT_ADMIN_LIST_FILTERS,
  columns: [
    {
      id: 'nome',
      labelKey: 'administradores.columns.name',
      label: 'Nome',
      sortKey: 'nome',
      tdClassName: 'font-semibold text-slate-950',
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
      filter: {
        kind: 'text',
        key: 'email::like',
        labelKey: 'administradores.columns.email',
        label: 'E-mail',
      },
    },
    {
      id: 'perfil',
      labelKey: 'administradores.columns.profile',
      label: 'Perfil',
      sortKey: 'perfil:nome',
      visibility: 'xl',
      filter: {
        kind: 'text',
        key: 'perfil:nome::like',
        labelKey: 'administradores.columns.profile',
        label: 'Perfil',
      },
    },
    {
      id: 'ultimoAcesso',
      labelKey: 'administradores.columns.lastAccess',
      label: 'Último acesso',
      sortKey: 'ultimo_acesso',
      visibility: 'xl',
      thClassName: 'w-[220px]',
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
      thClassName: 'w-[120px]',
      valueKey: 'ativo',
      filter: {
        kind: 'select',
        key: 'ativo',
        labelKey: 'administradores.columns.active',
        label: 'Ativo',
        options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }],
      },
    },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.email || '-'),
  mobileMeta: (record) => String(record.perfil || '-'),
  details: [
    {
      key: 'ultimoAcesso',
      labelKey: 'administradores.columns.lastAccess',
      label: 'Último acesso',
      render: (record) => (
        <div className="space-y-1">
          <div>{String(record.ultimoAcesso || '-')}</div>
          {record.ipUltimoAcesso ? <div className="text-xs text-slate-500">IP: {String(record.ipUltimoAcesso)}</div> : null}
        </div>
      ),
    },
  ],
  sections: [
    {
      id: 'general',
      titleKey: 'simpleCrud.sections.main',
      title: 'Dados principais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        {
          key: 'idPerfil',
          labelKey: 'administradores.columns.profile',
          label: 'Perfil',
          type: 'select',
          optionsResource: 'perfis_administradores',
          required: true,
        },
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
        },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => {
    const mapped = record.id ? mapAdminDetail(record) : createEmptyAdminForm()
    return {
      ...mapped,
      ativo: mapped.ativo,
      codigo: mapped.codigo,
      idPerfil: mapped.idPerfil,
      nome: mapped.nome,
      email: mapped.email,
      celular: mapped.celular,
      senha: '',
      confirmacao: '',
    }
  },
  beforeSave: (record: CrudRecord) => toAdminPayload({
    id: String(record.id || ''),
    ativo: record.ativo === true,
    codigo: String(record.codigo || ''),
    idPerfil: String(record.idPerfil || ''),
    nome: String(record.nome || ''),
    email: String(record.email || ''),
    celular: String(record.celular || ''),
    senha: String(record.senha || ''),
    confirmacao: String(record.confirmacao || ''),
  }),
  getSaveRedirectPath: ({ isEditing, saved, form }) => {
    if (isEditing) {
      return '/administradores'
    }

    const savedId = String(saved[0]?.id || form.id || '')
    return savedId ? `/administradores/${savedId}/editar` : '/administradores'
  },
  renderHeaderActions: ({ id, isEditing, readOnly }) => {
    if (!isEditing || !id || readOnly) {
      return null
    }

    return (
      <Link
        href={`/administradores/${id}/senha`}
        className="inline-flex items-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
      >
        Alterar senha
      </Link>
    )
  },
}
