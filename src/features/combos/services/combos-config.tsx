'use client'

import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudListFilters, CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { normalizeComboRecord, toComboPayload } from '@/src/features/combos/services/combos-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

function GrupoPromocaoFilter({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (value: { id: string; label: string }) => void
}) {
  const { t } = useI18n()

  return (
    <FormField label={t('marketing.combos.fields.group', 'Grupo')}>
      <LookupSelect
        label={t('marketing.combos.fields.group', 'Grupo')}
        value={value ? { id: value, label: label || value } : null}
        onChange={(nextValue) => onChange({ id: nextValue?.id ?? '', label: nextValue?.label ?? '' })}
        loadOptions={async (query, page, perPage) =>
          (await loadCrudLookupOptions('grupos_promocao', query, page, perPage)).map((option) => ({
            id: option.value,
            label: option.label,
          }))}
      />
    </FormField>
  )
}

function ComboTypeText({ type }: { type: unknown }) {
  const { t } = useI18n()

  switch (String(type || '')) {
    case 'faixa_quantidade':
      return <>{t('marketing.combos.options.type.range', 'Faixa de quantidade')}</>
    case 'quantidade_minima':
      return <>{t('marketing.combos.options.type.minimum', 'Quantidade mínima')}</>
    default:
      return <>-</>
  }
}

export const COMBOS_CONFIG: CrudModuleConfig = {
  key: 'combos',
  resource: 'promocoes',
  routeBase: '/combos',
  featureKey: 'combos',
  listTitleKey: 'simpleCrud.modules.combos.title',
  listTitle: 'Combos',
  listDescriptionKey: 'simpleCrud.modules.combos.listDescription',
  listDescription: 'Listagem com código, grupo, nome e status ativo.',
  formTitleKey: 'simpleCrud.modules.combos.formTitle',
  formTitle: 'Combo',
  breadcrumbSectionKey: 'menuKeys.promocoes',
  breadcrumbSection: 'Promoções',
  breadcrumbModuleKey: 'menuKeys.combos',
  breadcrumbModule: 'Combos',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'id',
    sort: 'desc',
    id: '',
    codigo: '',
    id_grupo_promocao: '',
    id_grupo_promocao_label: '',
    'nome::like': '',
    ativo: '',
  },
  listEmbed: 'grupo,url',
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
      id: 'grupo',
      labelKey: 'marketing.combos.fields.group',
      label: 'Grupo',
      sortKey: 'grupo:nome',
      render: (record) => String((record.grupo as { nome?: string } | null)?.nome || '-'),
      filter: {
        kind: 'custom',
        labelKey: 'marketing.combos.fields.group',
        label: 'Grupo',
        render: ({ draft, patchDraft }) => (
          <GrupoPromocaoFilter
            value={String((draft as CrudListFilters).id_grupo_promocao || '')}
            label={String((draft as CrudListFilters & { id_grupo_promocao_label?: string }).id_grupo_promocao_label || '')}
            onChange={({ id, label }) => {
              patchDraft('id_grupo_promocao', id as CrudListFilters['id_grupo_promocao'])
              patchDraft('id_grupo_promocao_label' as keyof CrudListFilters, label as CrudListFilters[keyof CrudListFilters])
            }}
          />
        ),
      },
    },
    {
      id: 'nome',
      labelKey: 'simpleCrud.fields.name',
      label: 'Nome',
      sortKey: 'nome',
      render: (record, { tenantUrl }) => {
        const label = String(record.nome || '-')
        const slug = typeof (record.url as { slug?: string } | null)?.slug === 'string' ? (record.url as { slug?: string }).slug : ''
        if (tenantUrl && slug) {
          return <a href={`${tenantUrl}${slug}`} target="_blank" rel="noreferrer" className="font-semibold text-slate-950 underline-offset-2 hover:underline">{label}</a>
        }
        return <span className="font-semibold text-slate-950">{label}</span>
      },
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
          { value: '1', labelKey: 'common.yes', label: 'Yes' },
          { value: '0', labelKey: 'common.no', label: 'No' },
        ],
      },
    },
  ],
  mobileTitle: (record) => String(record.nome || record.codigo || '-'),
  mobileSubtitle: (record) => <ComboTypeText type={record.tipo} />,
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'marketing.combos.tabs.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'aceita_parcial', labelKey: 'marketing.combos.fields.partialPurchase', label: 'Aceita compra parcial', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text', layoutClassName: 'max-w-[320px]', maxLength: 32 },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, layoutClassName: 'max-w-[720px]', maxLength: 255 },
        {
          key: 'tipo',
          labelKey: 'marketing.combos.fields.type',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [
            { value: 'faixa_quantidade', labelKey: 'marketing.combos.options.type.range', label: 'Faixa de quantidade' },
            { value: 'quantidade_minima', labelKey: 'marketing.combos.options.type.minimum', label: 'Quantidade mínima' },
          ],
          layoutClassName: 'max-w-[320px]',
        },
        {
          key: 'origem_preco',
          labelKey: 'marketing.combos.fields.priceSource',
          label: 'Origem de preço',
          type: 'select',
          required: true,
          options: [
            { value: 'preco_base', labelKey: 'marketing.combos.options.priceSource.base', label: 'Preço base' },
            { value: 'preco_venda', labelKey: 'marketing.combos.options.priceSource.sale', label: 'Preço de venda' },
          ],
          layoutClassName: 'max-w-[320px]',
        },
        {
          key: 'id_grupo_promocao',
          labelKey: 'marketing.combos.fields.group',
          label: 'Grupo',
          type: 'lookup',
          optionsResource: 'grupos_promocao',
          lookupStateKey: 'id_grupo_promocao_lookup',
          layoutClassName: 'max-w-[520px]',
        },
        { key: 'data_inicio', labelKey: 'marketing.combos.fields.startDate', label: 'Data início', type: 'date', required: true, layoutClassName: 'max-w-[260px]' },
        { key: 'data_fim', labelKey: 'marketing.combos.fields.endDate', label: 'Data fim', type: 'date', required: true, layoutClassName: 'max-w-[260px]' },
        { key: 'itens_distintos', labelKey: 'marketing.combos.fields.distinctItems', label: 'Itens distintos', type: 'number', layoutClassName: 'max-w-[220px]', inputMode: 'numeric' },
        { key: 'imagem', labelKey: 'marketing.combos.fields.image', label: 'Imagem', type: 'image' },
        { key: 'imagem_mobile', labelKey: 'marketing.combos.fields.mobileImage', label: 'Imagem mobile', type: 'image' },
        { key: 'descricao', labelKey: 'marketing.combos.fields.description', label: 'Descrição', type: 'richtext' },
      ],
    },
  ],
  formEmbed: 'grupo',
  normalizeRecord: (record: CrudRecord) => normalizeComboRecord(record),
  beforeSave: (record: CrudRecord) => toComboPayload(record),
  getSaveRedirectPath: ({ isEditing, saved, form }) => {
    if (isEditing) {
      return '/combos'
    }

    const savedId = String(saved[0]?.id || form.id || '')
    return savedId ? `/combos/${savedId}/editar` : '/combos'
  },
}
