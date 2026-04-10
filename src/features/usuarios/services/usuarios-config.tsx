import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { DEFAULT_USUARIOS_LIST_FILTERS } from '@/src/features/usuarios/services/usuarios-mappers'

export const USUARIOS_CONFIG: CrudModuleConfig = {
  key: 'usuarios',
  resource: 'usuarios',
  routeBase: '/usuarios',
  featureKey: 'usuarios',
  listTitleKey: 'usuarios.title',
  listTitle: 'Usuários',
  listDescriptionKey: 'usuarios.listDescription',
  listDescription: 'Listagem operacional de usuários.',
  formTitleKey: 'usuarios.title',
  formTitle: 'Usuários',
  breadcrumbSectionKey: 'routes.people',
  breadcrumbSection: 'Pessoas',
  breadcrumbModuleKey: 'usuarios.title',
  breadcrumbModule: 'Usuários',
  defaultFilters: DEFAULT_USUARIOS_LIST_FILTERS,
  columns: [
    {
      id: 'email',
      labelKey: 'usuarios.columns.email',
      label: 'E-mail',
      sortKey: 'email',
      tdClassName: 'font-semibold text-slate-950',
      filter: {
        kind: 'text',
        key: 'email::like',
        labelKey: 'usuarios.columns.email',
        label: 'E-mail',
      },
    },
    {
      id: 'perfil',
      labelKey: 'usuarios.columns.profile',
      label: 'Perfil',
      sortKey: 'perfil',
      visibility: 'lg',
      filter: {
        kind: 'text',
        key: 'perfil',
        labelKey: 'usuarios.columns.profile',
        label: 'Perfil',
      },
    },
    {
      id: 'codigo',
      labelKey: 'usuarios.columns.sellerCode',
      label: 'Código do vendedor',
      sortKey: 'codigo',
      visibility: 'lg',
      filter: {
        kind: 'text',
        key: 'codigo::like',
        labelKey: 'usuarios.columns.sellerCode',
        label: 'Código do vendedor',
      },
    },
    {
      id: 'ultimoAcesso',
      labelKey: 'usuarios.columns.lastAccess',
      label: 'Último acesso',
      sortKey: 'ultimo_acesso',
      visibility: 'xl',
      thClassName: 'w-[220px]',
      filter: {
        kind: 'date-range',
        fromKey: 'ultimo_acesso::ge',
        toKey: 'ultimo_acesso::le',
        labelKey: 'usuarios.columns.lastAccess',
        label: 'Último acesso',
      },
    },
    {
      id: 'ultimoPedido',
      labelKey: 'usuarios.columns.lastOrder',
      label: 'Último pedido',
      sortKey: 'ultimo_pedido',
      visibility: 'xl',
      filter: {
        kind: 'date-range',
        fromKey: 'ultimo_pedido::ge',
        toKey: 'ultimo_pedido::le',
        labelKey: 'usuarios.columns.lastOrder',
        label: 'Último pedido',
      },
    },
    {
      id: 'ativo',
      labelKey: 'usuarios.columns.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[120px]',
      valueKey: 'ativo',
      filter: {
        kind: 'select',
        key: 'ativo',
        labelKey: 'usuarios.columns.active',
        label: 'Ativo',
        options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }],
      },
    },
  ],
  mobileTitle: (record) => String(record.email || '-'),
  mobileSubtitle: (record) => String(record.perfilLabel || record.perfil || '-'),
  mobileMeta: (record) => String(record.codigoVendedor || ''),
  details: [
    {
      key: 'ultimoAcesso',
      labelKey: 'usuarios.columns.lastAccess',
      label: 'Último acesso',
      render: (record) => (
        <div className="space-y-1">
          <div>{String(record.ultimoAcesso || '-')}</div>
          {record.ipUltimoAcesso ? <div className="text-xs text-slate-500">IP: {String(record.ipUltimoAcesso)}</div> : null}
        </div>
      ),
    },
    {
      key: 'ultimoPedido',
      labelKey: 'usuarios.columns.lastOrder',
      label: 'Último pedido',
      render: (record) => String(record.ultimoPedido || '-'),
    },
  ],
  sections: [],
}
