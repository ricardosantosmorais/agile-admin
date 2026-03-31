'use client'

import { BookOpen, Boxes, FileImage, FileText, Gift, Layers3, Link2, SearchCheck, Store, Tags, Truck } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { ProdutoEmbalagensTab } from '@/src/features/produtos/components/produto-embalagens-tab'
import { ProdutoFiliaisTab } from '@/src/features/produtos/components/produto-filiais-tab'
import { ProdutoGradesTab } from '@/src/features/produtos/components/produto-grades-tab'
import { ProdutoImagensTab } from '@/src/features/produtos/components/produto-imagens-tab'
import { ProdutoRelacionadosTab } from '@/src/features/produtos/components/produto-relacionados-tab'
import { PRODUTOS_CONFIG } from '@/src/features/produtos/services/produtos-config'
import { produtosClient } from '@/src/features/produtos/services/produtos-client'
import { useI18n } from '@/src/i18n/use-i18n'

export function ProdutoFormPage({ id }: { id?: string }) {
  const { t } = useI18n()

  return (
    <TabbedCatalogFormPage
      config={PRODUTOS_CONFIG}
      client={produtosClient}
      id={id}
      tabs={[
        { key: 'general', label: t('catalog.produtos.tabs.general', 'Dados gerais'), icon: <FileText className="h-4 w-4" />, sectionIds: ['general'] },
        { key: 'classification', label: t('catalog.produtos.tabs.classification', 'Classificação'), icon: <Tags className="h-4 w-4" />, sectionIds: ['classification'] },
        { key: 'content', label: t('catalog.produtos.tabs.content', 'Conteúdo'), icon: <BookOpen className="h-4 w-4" />, sectionIds: ['content'] },
        { key: 'logistics', label: t('catalog.produtos.tabs.logistics', 'Estoque e logística'), icon: <Truck className="h-4 w-4" />, sectionIds: ['logistics'] },
        {
          key: 'branches',
          label: t('catalog.produtos.tabs.productBranches.title', 'Filiais'),
          icon: <Store className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <ProdutoFiliaisTab productId={recordId} items={Array.isArray(form.filiais) ? form.filiais as never[] : []} readOnly={readOnly} onRefresh={refreshRecord} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'packages',
          label: t('catalog.produtos.tabs.packages.title', 'Embalagens'),
          icon: <Boxes className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <ProdutoEmbalagensTab productId={recordId} items={Array.isArray(form.embalagens) ? form.embalagens as never[] : []} readOnly={readOnly} onRefresh={refreshRecord} onError={onFeedback} />
          ) : null,
        },
        { key: 'seo', label: t('catalog.produtos.tabs.seo', 'SEO'), icon: <SearchCheck className="h-4 w-4" />, sectionIds: ['seo'] },
        { key: 'promotion', label: t('catalog.produtos.tabs.promotion', 'Promoção'), icon: <Gift className="h-4 w-4" />, sectionIds: ['promotion'] },
        {
          key: 'grades-colors',
          label: t('catalog.produtos.tabs.gradesColors', 'Grades e cores'),
          icon: <Layers3 className="h-4 w-4" />,
          sectionIds: ['grades-colors'],
          render: ({ form, patch, readOnly }) => <ProdutoGradesTab form={form} patch={patch} readOnly={readOnly} />,
        },
        {
          key: 'related',
          label: t('catalog.produtos.tabs.related.title', 'Relacionados'),
          icon: <Link2 className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <ProdutoRelacionadosTab productId={recordId} items={Array.isArray(form.relacionados) ? form.relacionados as never[] : []} readOnly={readOnly} onRefresh={refreshRecord} onError={onFeedback} />
          ) : null,
        },
        {
          key: 'images',
          label: t('catalog.produtos.tabs.images.title', 'Imagens'),
          icon: <FileImage className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <ProdutoImagensTab productId={recordId} items={Array.isArray(form.imagens) ? form.imagens as never[] : []} readOnly={readOnly} onRefresh={refreshRecord} onError={onFeedback} />
          ) : null,
        },
      ]}
    />
  )
}
