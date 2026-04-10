import { Package, Percent, ShoppingCart } from 'lucide-react'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { CampanhaProdutosIdsTab } from '@/src/features/campanhas-promocionais/components/campanha-produtos-ids-tab'
import { CompreJuntoProdutosTab } from '@/src/features/campanhas-promocionais/components/compre-junto-produtos-tab'
import { campanhasClient } from '@/src/features/campanhas-promocionais/services/campanhas-client'
import { type CampanhaTipo, normalizeCampanhaRecord, toCampanhaPayload } from '@/src/features/campanhas-promocionais/services/campanhas-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

type CampaignModuleDefinition = {
  key: string
  routeBase: string
  featureKey: CrudModuleConfig['featureKey']
  breadcrumbModuleKey: string
  breadcrumbModule: string
  listTitleKey: string
  listTitle: string
  listDescriptionKey: string
  listDescription: string
  formTitleKey: string
  formTitle: string
  tipo: CampanhaTipo
}

export const LEVE_E_PAGUE_DEFINITION: CampaignModuleDefinition = {
  key: 'leve-e-pague',
  routeBase: '/leve-e-pague',
  featureKey: 'leveEPague',
  breadcrumbModuleKey: 'menuKeys.leve-e-pague',
  breadcrumbModule: 'Leve e Pague',
  listTitleKey: 'marketing.buyXPayY.title',
  listTitle: 'Leve e Pague',
  listDescriptionKey: 'marketing.buyXPayY.listDescription',
  listDescription: 'Campanhas de leve e pague com código, nome e status.',
  formTitleKey: 'marketing.buyXPayY.formTitle',
  formTitle: 'Leve e Pague',
  tipo: 'leve_pague',
}

export const DESCONTO_UNIDADE_DEFINITION: CampaignModuleDefinition = {
  key: 'desconto-na-unidade',
  routeBase: '/desconto-na-unidade',
  featureKey: 'descontoUnidade',
  breadcrumbModuleKey: 'menuKeys.desconto-na-unidade',
  breadcrumbModule: 'Desconto na Unidade',
  listTitleKey: 'marketing.unitDiscount.title',
  listTitle: 'Desconto na Unidade',
  listDescriptionKey: 'marketing.unitDiscount.listDescription',
  listDescription: 'Campanhas por quantidade com desconto unitário.',
  formTitleKey: 'marketing.unitDiscount.formTitle',
  formTitle: 'Desconto na Unidade',
  tipo: 'desconto_unidade',
}

export const COMPRE_JUNTO_DEFINITION: CampaignModuleDefinition = {
  key: 'compre-junto',
  routeBase: '/compre-junto',
  featureKey: 'compreJunto',
  breadcrumbModuleKey: 'menuKeys.compre-junto',
  breadcrumbModule: 'Compre Junto',
  listTitleKey: 'marketing.buyTogether.title',
  listTitle: 'Compre Junto',
  listDescriptionKey: 'marketing.buyTogether.listDescription',
  listDescription: 'Campanhas de compre junto com produtos vinculados.',
  formTitleKey: 'marketing.buyTogether.formTitle',
  formTitle: 'Compre Junto',
  tipo: 'compre_junto',
}

export function createCampanhaConfig(definition: CampaignModuleDefinition): CrudModuleConfig {
  const baseFields = [
    { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' as const },
    { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' as const, layoutClassName: 'max-w-[320px]', maxLength: 32 },
    { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text' as const, required: true, layoutClassName: 'max-w-[720px]', maxLength: 255 },
  ]

  const specificFields = definition.tipo === 'leve_pague'
    ? [
        { key: 'quantidade_pedido', labelKey: 'marketing.buyXPayY.fields.takeQuantity', label: 'Leve', type: 'number' as const, required: true, layoutClassName: 'max-w-[220px]', inputMode: 'numeric' as const },
        { key: 'quantidade_pagamento', labelKey: 'marketing.buyXPayY.fields.payQuantity', label: 'Pague', type: 'number' as const, required: true, layoutClassName: 'max-w-[220px]', inputMode: 'numeric' as const },
        { key: 'quantidade_maxima', labelKey: 'marketing.buyXPayY.fields.maxQuantity', label: 'Quantidade máxima', type: 'number' as const, layoutClassName: 'max-w-[220px]', inputMode: 'numeric' as const },
      ]
    : definition.tipo === 'desconto_unidade'
      ? [
          { key: 'quantidade_pedido', labelKey: 'marketing.unitDiscount.fields.quantity', label: 'Quantidade', type: 'number' as const, required: true, layoutClassName: 'max-w-[220px]', inputMode: 'numeric' as const },
          { key: 'desconto', labelKey: 'marketing.unitDiscount.fields.discount', label: 'Desconto', type: 'text' as const, required: true, layoutClassName: 'max-w-[220px]' },
          { key: 'quantidade_maxima', labelKey: 'marketing.unitDiscount.fields.maxQuantity', label: 'Quantidade máxima', type: 'number' as const, layoutClassName: 'max-w-[220px]', inputMode: 'numeric' as const },
        ]
      : []

  return {
    key: definition.key,
    resource: 'campanhas',
    routeBase: definition.routeBase,
    featureKey: definition.featureKey,
    listTitleKey: definition.listTitleKey,
    listTitle: definition.listTitle,
    listDescriptionKey: definition.listDescriptionKey,
    listDescription: definition.listDescription,
    formTitleKey: definition.formTitleKey,
    formTitle: definition.formTitle,
    breadcrumbSectionKey: 'menuKeys.promocoes',
    breadcrumbSection: 'Promoções',
    breadcrumbModuleKey: definition.breadcrumbModuleKey,
    breadcrumbModule: definition.breadcrumbModule,
    defaultFilters: {
      page: 1,
      perPage: 15,
      orderBy: 'id',
      sort: 'desc',
      tipo: definition.tipo,
      id: '',
      codigo: '',
      'nome::like': '',
      ativo: '',
    },
    columns: [
      {
        id: 'id',
        labelKey: 'simpleCrud.fields.id',
        label: 'ID',
        sortKey: 'id',
        thClassName: 'w-[140px]',
        filter: { kind: 'text', key: 'id', inputMode: 'numeric' },
      },
      {
        id: 'codigo',
        labelKey: 'simpleCrud.fields.code',
        label: 'Código',
        sortKey: 'codigo',
        tdClassName: 'font-semibold text-slate-950',
        filter: { kind: 'text', key: 'codigo' },
      },
      {
        id: 'nome',
        labelKey: 'simpleCrud.fields.name',
        label: 'Nome',
        sortKey: 'nome',
        tdClassName: 'font-semibold text-slate-950',
        filter: { kind: 'text', key: 'nome::like' },
      },
      {
        id: 'ativo',
        labelKey: 'simpleCrud.fields.active',
        label: 'Ativo',
        sortKey: 'ativo',
        thClassName: 'w-[120px]',
        valueKey: 'ativo',
        filter: {
          kind: 'select',
          key: 'ativo',
          options: [
            { value: '1', labelKey: 'common.yes', label: 'Sim' },
            { value: '0', labelKey: 'common.no', label: 'Não' },
          ],
        },
      },
    ],
    mobileTitle: (record) => String(record.nome || record.codigo || '-'),
    mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
    sections: [
      {
        id: 'general',
        titleKey: 'marketing.campaigns.tabs.general',
        title: 'Dados gerais',
        layout: 'rows',
        fields: [
          ...baseFields,
          ...specificFields,
          { key: 'data_inicio', labelKey: 'marketing.campaigns.fields.startDate', label: 'Data início', type: 'date', layoutClassName: 'max-w-[260px]' },
          { key: 'data_fim', labelKey: 'marketing.campaigns.fields.endDate', label: 'Data fim', type: 'date', layoutClassName: 'max-w-[260px]' },
        ],
      },
    ],
    normalizeRecord: normalizeCampanhaRecord,
    beforeSave: (record: CrudRecord) => toCampanhaPayload(record, definition.tipo),
    getSaveRedirectPath: ({ isEditing, saved, form }) => {
      if (isEditing) {
        return definition.routeBase
      }

      const savedId = String(saved[0]?.id || form.id || '')
      return savedId ? `${definition.routeBase}/${savedId}/editar` : definition.routeBase
    },
  }
}

export const LEVE_E_PAGUE_CONFIG = createCampanhaConfig(LEVE_E_PAGUE_DEFINITION)
export const DESCONTO_UNIDADE_CONFIG = createCampanhaConfig(DESCONTO_UNIDADE_DEFINITION)
export const COMPRE_JUNTO_CONFIG = createCampanhaConfig(COMPRE_JUNTO_DEFINITION)

export function CampaignFormPage({
  id,
  definition,
}: {
  id?: string
  definition: CampaignModuleDefinition
}) {
  const { t } = useI18n()
  const config = definition.tipo === 'leve_pague'
    ? LEVE_E_PAGUE_CONFIG
    : definition.tipo === 'desconto_unidade'
      ? DESCONTO_UNIDADE_CONFIG
      : COMPRE_JUNTO_CONFIG

  return (
    <TabbedCatalogFormPage
      config={config}
      client={campanhasClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('marketing.campaigns.tabs.general', 'Dados gerais'),
          icon: definition.tipo === 'compre_junto' ? <ShoppingCart className="h-4 w-4" /> : <Percent className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'products',
          label: t('marketing.campaigns.tabs.products', 'Produtos'),
          icon: <Package className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: campaignId, readOnly, onFeedback }) => campaignId
            ? definition.tipo === 'compre_junto'
              ? <CompreJuntoProdutosTab campaignId={campaignId} readOnly={readOnly} onError={onFeedback} />
              : <CampanhaProdutosIdsTab campaignId={campaignId} readOnly={readOnly} onError={onFeedback} />
            : null,
        },
      ]}
    />
  )
}
