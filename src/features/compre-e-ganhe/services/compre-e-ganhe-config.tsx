'use client'

import { Gift, Package, ShieldAlert, ShieldBan, Shapes } from 'lucide-react'
import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { CompreEGanheProdutosTab } from '@/src/features/compre-e-ganhe/components/compre-e-ganhe-produtos-tab'
import { CompreEGanheRegrasTab } from '@/src/features/compre-e-ganhe/components/compre-e-ganhe-regras-tab'
import { CompreEGanheUniversoTab } from '@/src/features/compre-e-ganhe/components/compre-e-ganhe-universo-tab'
import { compreEGanheClient } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-client'
import { normalizeCompreEGanheRecord, toCompreEGanhePayload } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

export const COMPRE_E_GANHE_CONFIG: CrudModuleConfig = {
  key: 'compre-e-ganhe',
  resource: 'compre_ganhe',
  routeBase: '/compre-e-ganhe',
  featureKey: 'compreEGanhe',
  listTitleKey: 'marketing.buyAndGet.title',
  listTitle: 'Compre e Ganhe',
  listDescriptionKey: 'marketing.buyAndGet.listDescription',
  listDescription: 'Campanhas de brinde com regras, produtos, exceções e restrições.',
  formTitleKey: 'marketing.buyAndGet.formTitle',
  formTitle: 'Compre e Ganhe',
  breadcrumbSectionKey: 'menuKeys.promocoes',
  breadcrumbSection: 'Promoções',
  breadcrumbModuleKey: 'menuKeys.compre-e-ganhe',
  breadcrumbModule: 'Compre e Ganhe',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'id',
    sort: 'desc',
    id: '',
    codigo: '',
    'nome::like': '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'perfil', labelKey: 'marketing.buyAndGet.fields.profile', label: 'Perfil', sortKey: 'perfil' },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[120px]',
      valueKey: 'ativo',
      filter: { kind: 'select', key: 'ativo', options: [{ value: '1', labelKey: 'common.yes', label: 'Sim' }, { value: '0', labelKey: 'common.no', label: 'Não' }] },
    },
  ],
  mobileTitle: (record) => String(record.nome || record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'marketing.buyAndGet.tabs.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'gera_pedido', labelKey: 'marketing.buyAndGet.fields.generateOrder', label: 'Gera pedido', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text', layoutClassName: 'max-w-[320px]', maxLength: 32 },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, layoutClassName: 'max-w-[720px]', maxLength: 255 },
        { key: 'descricao', labelKey: 'marketing.buyAndGet.fields.description', label: 'Descrição', type: 'richtext' },
        { key: 'perfil', labelKey: 'marketing.buyAndGet.fields.profile', label: 'Perfil', type: 'select', required: true, options: [{ value: 'cliente', label: 'Cliente' }, { value: 'vendedor', label: 'Vendedor' }, { value: 'todos', label: 'Todos' }], layoutClassName: 'max-w-[320px]' },
        { key: 'id_grupo_promocao', labelKey: 'marketing.buyAndGet.fields.group', label: 'Grupo de promoções', type: 'lookup', optionsResource: 'grupos_promocao', lookupStateKey: 'id_grupo_promocao_lookup', layoutClassName: 'max-w-[520px]' },
        { key: 'maximo_brindes', labelKey: 'marketing.buyAndGet.fields.maxGifts', label: 'Máximo brindes', type: 'number', layoutClassName: 'max-w-[220px]' },
        { key: 'quantidade_maxima_cliente', labelKey: 'marketing.buyAndGet.fields.maxPerCustomer', label: 'Quantidade máxima clientes', type: 'number', layoutClassName: 'max-w-[220px]' },
        { key: 'data_inicio', labelKey: 'marketing.buyAndGet.fields.startDate', label: 'Data início', type: 'date', required: true, layoutClassName: 'max-w-[260px]' },
        { key: 'data_fim', labelKey: 'marketing.buyAndGet.fields.endDate', label: 'Data fim', type: 'date', required: true, layoutClassName: 'max-w-[260px]' },
        { key: 'imagem', labelKey: 'marketing.buyAndGet.fields.image', label: 'Imagem', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'compre-e-ganhe' },
        { key: 'imagem_mobile', labelKey: 'marketing.buyAndGet.fields.mobileImage', label: 'Imagem mobile', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'compre-e-ganhe' },
      ],
    },
  ],
  normalizeRecord: normalizeCompreEGanheRecord,
  beforeSave: toCompreEGanhePayload,
  getSaveRedirectPath: ({ isEditing, saved, form }) => {
    if (isEditing) return '/compre-e-ganhe'
    const savedId = String(saved[0]?.id || form.id || '')
    return savedId ? `/compre-e-ganhe/${savedId}/editar` : '/compre-e-ganhe'
  },
}

export function CompreEGanheListPage() {
  return <CrudListPage config={COMPRE_E_GANHE_CONFIG} client={compreEGanheClient} />
}

export function CompreEGanheFormPage({ id }: { id?: string }) {
  const { t } = useI18n()
  return (
    <TabbedCatalogFormPage
      config={COMPRE_E_GANHE_CONFIG}
      client={compreEGanheClient}
      id={id}
      tabs={[
        { key: 'general', label: t('marketing.buyAndGet.tabs.general', 'Dados gerais'), icon: <Gift className="h-4 w-4" />, sectionIds: ['general'] },
        { key: 'rules', label: t('marketing.buyAndGet.tabs.rules', 'Regras'), icon: <Shapes className="h-4 w-4" />, hidden: ({ isEditing }) => !isEditing, render: ({ id: currentId, readOnly, onFeedback }) => currentId ? <CompreEGanheRegrasTab brindeId={currentId} readOnly={readOnly} onError={onFeedback} /> : null },
        { key: 'products', label: t('marketing.buyAndGet.tabs.products', 'Produtos'), icon: <Package className="h-4 w-4" />, hidden: ({ isEditing }) => !isEditing, render: ({ id: currentId, readOnly, onFeedback }) => currentId ? <CompreEGanheProdutosTab brindeId={currentId} readOnly={readOnly} onError={onFeedback} /> : null },
        { key: 'exceptions', label: t('marketing.buyAndGet.tabs.exceptions', 'Exceções'), icon: <ShieldAlert className="h-4 w-4" />, hidden: ({ isEditing }) => !isEditing, render: ({ id: currentId, readOnly, onFeedback }) => currentId ? <CompreEGanheUniversoTab brindeId={currentId} readOnly={readOnly} onError={onFeedback} kind="excecoes" /> : null },
        { key: 'restrictions', label: t('marketing.buyAndGet.tabs.restrictions', 'Restrições'), icon: <ShieldBan className="h-4 w-4" />, hidden: ({ isEditing }) => !isEditing, render: ({ id: currentId, readOnly, onFeedback }) => currentId ? <CompreEGanheUniversoTab brindeId={currentId} readOnly={readOnly} onError={onFeedback} kind="restricoes" /> : null },
      ]}
    />
  )
}
