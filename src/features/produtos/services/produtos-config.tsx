import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { loadCatalogLookupOptions } from '@/src/features/catalog/services/catalog-lookups'
import { ProdutoImagePreview } from '@/src/features/produtos/components/produto-image-preview'
import { buildProdutoPayload, normalizeProdutoRecord } from '@/src/features/produtos/services/produtos-mappers'

function productStatusLabel(value: unknown) {
  switch (String(value || '')) {
    case 'disponivel':
      return { labelKey: 'catalog.produtos.options.available', label: 'Disponível', tone: 'success' as const }
    case 'indisponivel':
      return { labelKey: 'catalog.produtos.options.unavailable', label: 'Indisponível', tone: 'danger' as const }
    case 'em_revisao':
      return { labelKey: 'catalog.produtos.options.inReview', label: 'Em revisão', tone: 'warning' as const }
    case 'fora_de_linha':
      return { labelKey: 'catalog.produtos.options.discontinued', label: 'Fora de linha', tone: 'info' as const }
    default:
      return { labelKey: '', label: String(value || '-'), tone: 'neutral' as const }
  }
}

export const PRODUTOS_CONFIG: CrudModuleConfig = {
  key: 'produtos',
  resource: 'produtos',
  routeBase: '/produtos',
  featureKey: 'produtos',
  listTitleKey: 'catalog.produtos.title',
  listTitle: 'Produtos',
  listDescriptionKey: 'catalog.produtos.description',
  listDescription: 'Listagem de produtos.',
  formTitleKey: 'catalog.produtos.formTitle',
  formTitle: 'Produto',
  breadcrumbSectionKey: 'simpleCrud.sections.catalog',
  breadcrumbSection: 'Catálogo',
  breadcrumbModuleKey: 'catalog.produtos.title',
  breadcrumbModule: 'Produtos',
  actionsColumnClassName: 'sticky right-0 z-10 w-[96px] whitespace-nowrap bg-white',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'nome',
    sort: 'asc',
    id: '',
    codigo: '',
    sku: '',
    ean: '',
    id_canal_distribuicao: '',
    id_canal_distribuicao_label: '',
    id_filial: '',
    id_filial_label: '',
    id_fornecedor: '',
    id_fornecedor_label: '',
    id_marca: '',
    id_marca_label: '',
    'nome::like': '',
    status: '',
    disponivel: '',
    ativo: '',
  },
  columns: [
    {
      id: 'imagem',
      labelKey: 'catalog.produtos.fields.image',
      label: 'Imagem',
      thClassName: 'w-[96px]',
      render: (record, context) => {
        const images = Array.isArray(record.imagens) ? (record.imagens as Array<Record<string, unknown>>) : []
        const first = images[0]
        return (
          <ProdutoImagePreview
            directUrl={typeof record.imagem_url === 'string' ? record.imagem_url : typeof first?.imagem_url === 'string' ? first.imagem_url : ''}
            imageName={typeof first?.imagem === 'string' ? first.imagem : ''}
            assetsBucketUrl={context.assetsBucketUrl}
            alt={String(record.nome || 'Produto')}
            className="relative h-14 w-14 overflow-hidden rounded-xl"
          />
        )
      },
    },
    {
      id: 'id',
      labelKey: 'simpleCrud.fields.id',
      label: 'ID',
      sortKey: 'id',
      visibility: 'xl',
      thClassName: 'w-[160px]',
      filter: { kind: 'text', key: 'id' },
    },
    {
      id: 'codigo',
      labelKey: 'simpleCrud.fields.code',
      label: 'Código',
      sortKey: 'codigo',
      thClassName: 'w-[120px]',
      filter: { kind: 'text', key: 'codigo' },
    },
    {
      id: 'sku',
      labelKey: 'catalog.produtos.fields.sku',
      label: 'SKU',
      sortKey: 'sku',
      visibility: '2xl',
      thClassName: 'w-[140px]',
      filter: { kind: 'text', key: 'sku' },
    },
    {
      id: 'ean',
      labelKey: 'catalog.produtos.fields.ean',
      label: 'EAN',
      sortKey: 'ean',
      visibility: '2xl',
      thClassName: 'w-[140px]',
      filter: { kind: 'text', key: 'ean' },
    },
    {
      id: 'nome',
      labelKey: 'simpleCrud.fields.name',
      label: 'Nome',
      sortKey: 'nome',
      thClassName: 'w-[320px]',
      tdClassName: 'max-w-[320px] font-semibold text-slate-950',
      valueKey: 'nome',
      filter: { kind: 'text', key: 'nome::like' },
    },
    {
      id: 'status',
      labelKey: 'catalog.produtos.fields.status',
      label: 'Status',
      sortKey: 'status',
      thClassName: 'w-[150px]',
      filter: {
        kind: 'select',
        key: 'status',
        options: [
          { value: 'disponivel', labelKey: 'catalog.produtos.options.available', label: 'Disponível' },
          { value: 'indisponivel', labelKey: 'catalog.produtos.options.unavailable', label: 'Indisponível' },
          { value: 'em_revisao', labelKey: 'catalog.produtos.options.inReview', label: 'Em revisão' },
          { value: 'fora_de_linha', labelKey: 'catalog.produtos.options.discontinued', label: 'Fora de linha' },
        ],
      },
      render: (record, context) => {
        const status = productStatusLabel(record.status)
        return <StatusBadge tone={status.tone}>{status.labelKey ? context.t(status.labelKey, status.label) : status.label}</StatusBadge>
      },
    },
    {
      id: 'disponivel',
      labelKey: 'catalog.produtos.fields.available',
      label: 'Disponível',
      sortKey: 'disponivel',
      thClassName: 'w-[110px]',
      valueKey: 'disponivel',
      filter: {
        kind: 'select',
        key: 'disponivel',
        options: [
          { value: '1', labelKey: 'common.yes', label: 'Sim' },
          { value: '0', labelKey: 'common.no', label: 'Não' },
        ],
      },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[100px]',
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
  extraFilters: [
    {
      kind: 'lookup',
      key: 'id_canal_distribuicao',
      labelKey: 'catalog.produtos.fields.channel',
      label: 'Canal de distribuição',
      loadOptions: (query, page, perPage) =>
        loadCatalogLookupOptions('canais_distribuicao', query, page, perPage),
    },
    {
      kind: 'lookup',
      key: 'id_filial',
      labelKey: 'catalog.produtos.fields.branch',
      label: 'Filial',
      loadOptions: (query, page, perPage) =>
        loadCatalogLookupOptions('filiais', query, page, perPage),
    },
    {
      kind: 'lookup',
      key: 'id_fornecedor',
      labelKey: 'catalog.produtos.fields.supplier',
      label: 'Fornecedor',
      loadOptions: (query, page, perPage) =>
        loadCatalogLookupOptions('fornecedores', query, page, perPage),
    },
    {
      kind: 'lookup',
      key: 'id_marca',
      labelKey: 'catalog.produtos.fields.brand',
      label: 'Marca',
      loadOptions: (query, page, perPage) =>
        loadCatalogLookupOptions('marcas', query, page, perPage),
    },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || record.sku || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'catalog.produtos.tabs.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', required: true },
        {
          key: 'feed',
          labelKey: 'catalog.produtos.fields.feed',
          label: 'Feed de dados',
          type: 'toggle',
          helperTextKey: 'catalog.produtos.helpers.feed',
          helperText: 'Indica se o produto será carregado nos feeds XML.',
        },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text', maxLength: 32 },
        {
          key: 'id_produto_pai',
          labelKey: 'catalog.produtos.fields.parentProduct',
          label: 'Produto pai',
          type: 'lookup',
          optionsResource: 'produtos',
          lookupStateKey: 'id_produto_pai_lookup',
        },
        {
          key: 'tipo',
          labelKey: 'catalog.produtos.fields.type',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [
            { value: 'venda', labelKey: 'catalog.produtos.options.typeSale', label: 'Venda' },
            { value: 'servico', labelKey: 'catalog.produtos.options.typeService', label: 'Serviço' },
            { value: 'comodato', labelKey: 'catalog.produtos.options.typeComodato', label: 'Comodato' },
            { value: 'kit', labelKey: 'catalog.produtos.options.typeKit', label: 'Kit' },
          ],
        },
        {
          key: 'status',
          labelKey: 'catalog.produtos.fields.status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { value: 'disponivel', labelKey: 'catalog.produtos.options.available', label: 'Disponível' },
            { value: 'indisponivel', labelKey: 'catalog.produtos.options.unavailable', label: 'Indisponível' },
            { value: 'em_revisao', labelKey: 'catalog.produtos.options.inReview', label: 'Em revisão' },
            { value: 'fora_de_linha', labelKey: 'catalog.produtos.options.discontinued', label: 'Fora de linha' },
          ],
        },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
        { key: 'sku', labelKey: 'catalog.produtos.fields.sku', label: 'SKU', type: 'text', maxLength: 50 },
        { key: 'ean', labelKey: 'catalog.produtos.fields.ean', label: 'EAN', type: 'text', maxLength: 20 },
        { key: 'ncm', labelKey: 'catalog.produtos.fields.ncm', label: 'NCM', type: 'text', maxLength: 20 },
        {
          key: 'ipi',
          labelKey: 'catalog.produtos.fields.ipi',
          label: 'IPI',
          type: 'text',
          mask: 'currency',
          suffixText: '%',
          inputMode: 'decimal',
        },
        { key: 'unidade', labelKey: 'catalog.produtos.fields.unit', label: 'Unidade', type: 'text', maxLength: 10 },
      ],
    },
    {
      id: 'classification',
      titleKey: 'catalog.produtos.tabs.classification',
      title: 'Classificação',
      layout: 'rows',
      fields: [
        {
          key: 'id_departamento',
          labelKey: 'catalog.produtos.fields.department',
          label: 'Departamento',
          type: 'lookup',
          optionsResource: 'departamentos',
          lookupStateKey: 'id_departamento_lookup',
        },
        {
          key: 'id_marca',
          labelKey: 'catalog.produtos.fields.brand',
          label: 'Marca',
          type: 'lookup',
          optionsResource: 'marcas',
          lookupStateKey: 'id_marca_lookup',
        },
        {
          key: 'id_canal_distribuicao',
          labelKey: 'catalog.produtos.fields.channel',
          label: 'Canal de distribuição',
          type: 'lookup',
          optionsResource: 'canais_distribuicao',
          lookupStateKey: 'id_canal_distribuicao_lookup',
        },
        {
          key: 'id_fornecedor',
          labelKey: 'catalog.produtos.fields.supplier',
          label: 'Fornecedor',
          type: 'lookup',
          optionsResource: 'fornecedores',
          lookupStateKey: 'id_fornecedor_lookup',
        },
        {
          key: 'descricao_curta',
          labelKey: 'catalog.produtos.fields.shortDescription',
          label: 'Descrição curta',
          type: 'textarea',
          rows: 4,
        },
      ],
    },
    {
      id: 'content',
      titleKey: 'catalog.produtos.tabs.content',
      title: 'Conteúdo',
      layout: 'rows',
      fields: [
        { key: 'descricao1', labelKey: 'catalog.produtos.fields.description1', label: 'Descrição 1', type: 'richtext' },
        { key: 'descricao2', labelKey: 'catalog.produtos.fields.description2', label: 'Descrição 2', type: 'richtext' },
        { key: 'descricao3', labelKey: 'catalog.produtos.fields.description3', label: 'Descrição 3', type: 'richtext' },
        { key: 'descricao4', labelKey: 'catalog.produtos.fields.description4', label: 'Descrição 4', type: 'richtext' },
        {
          key: 'video',
          labelKey: 'catalog.produtos.fields.video',
          label: 'Vídeo',
          type: 'text',
          maxLength: 255,
          prefixText: 'https://www.youtube.com/watch?v=',
        },
        { key: 'link_doc', labelKey: 'catalog.produtos.fields.documentLink', label: 'Link do documento', type: 'text', maxLength: 255 },
      ],
    },
    {
      id: 'logistics',
      titleKey: 'catalog.produtos.tabs.logistics',
      title: 'Estoque e logística',
      layout: 'rows',
      fields: [
        { key: 'vende_sem_estoque', labelKey: 'catalog.produtos.fields.sellWithoutStock', label: 'Vende sem estoque', type: 'toggle' },
        { key: 'controla_estoque', labelKey: 'catalog.produtos.fields.stockControl', label: 'Controla estoque', type: 'toggle' },
        { key: 'prazo_entrega', labelKey: 'catalog.produtos.fields.deliveryTime', label: 'Prazo de entrega', type: 'number', inputMode: 'numeric' },
        { key: 'peso', labelKey: 'catalog.produtos.fields.weight', label: 'Peso', type: 'text', mask: 'decimal', inputMode: 'decimal' },
        { key: 'altura', labelKey: 'catalog.produtos.fields.height', label: 'Altura', type: 'number', inputMode: 'numeric' },
        { key: 'largura', labelKey: 'catalog.produtos.fields.width', label: 'Largura', type: 'number', inputMode: 'numeric' },
        { key: 'comprimento', labelKey: 'catalog.produtos.fields.length', label: 'Comprimento', type: 'number', inputMode: 'numeric' },
        { key: 'quantidade_embalagem', labelKey: 'catalog.produtos.fields.packageQuantity', label: 'Quantidade da embalagem', type: 'text', mask: 'decimal', inputMode: 'decimal' },
        { key: 'paletizacao', labelKey: 'catalog.produtos.fields.palletization', label: 'Paletização', type: 'text', maxLength: 20 },
        { key: 'categoria_logistica', labelKey: 'catalog.produtos.fields.logisticCategory', label: 'Categoria logística', type: 'text', maxLength: 255 },
      ],
    },
    {
      id: 'seo',
      titleKey: 'catalog.produtos.tabs.seo',
      title: 'SEO',
      layout: 'rows',
      fields: [
        { key: 'titulo', labelKey: 'catalog.produtos.fields.title', label: 'Título', type: 'text', maxLength: 255 },
        { key: 'palavras_chave', labelKey: 'catalog.produtos.fields.keywords', label: 'Palavras-chave', type: 'text', maxLength: 255 },
        { key: 'meta_descricao', labelKey: 'catalog.produtos.fields.metaDescription', label: 'Meta descrição', type: 'text', maxLength: 255 },
        { key: 'busca', labelKey: 'catalog.produtos.fields.searchTerms', label: 'Termos de busca', type: 'text', maxLength: 500 },
        { key: 'codigo_google', labelKey: 'catalog.produtos.fields.googleDepartmentCode', label: 'Código de departamento no Google', type: 'text', maxLength: 32 },
      ],
    },
    {
      id: 'promotion',
      titleKey: 'catalog.produtos.tabs.promotion',
      title: 'Promoção',
      layout: 'rows',
      fields: [
        {
          key: 'horas_cronometro',
          labelKey: 'catalog.produtos.fields.timerHours',
          label: 'Horas cronômetro',
          type: 'number',
          inputMode: 'numeric',
          helperTextKey: 'catalog.produtos.helpers.timerHours',
          helperText: 'Tempo em horas para iniciar o cronômetro quando o produto estiver em promoção.',
        },
      ],
    },
    {
      id: 'grades-colors',
      titleKey: 'catalog.produtos.tabs.gradesColors',
      title: 'Grades e cores',
      layout: 'rows',
      fields: [
        { key: 'id_linha', labelKey: 'catalog.produtos.fields.line', label: 'Linha', type: 'select', optionsResource: 'linhas' },
        { key: 'id_cor', labelKey: 'catalog.produtos.fields.color', label: 'Cor', type: 'select', optionsResource: 'cores' },
      ],
    },
  ],
  listEmbed: 'imagens,url',
  formEmbed: 'canal_distribuicao,departamento,fornecedor,marca,produto_pai,url,filiais.filial,filiais.tabela_preco,filiais.canal_distribuicao,embalagens.filial,relacionados.produto_relacionado.imagens,imagens,produtos_grades_valores',
  normalizeRecord: normalizeProdutoRecord,
  beforeSave: buildProdutoPayload,
  details: [
    {
      key: 'tipo',
      labelKey: 'catalog.produtos.fields.type',
      label: 'Tipo',
      render: (record) => String(record.tipo || '-'),
    },
    {
      key: 'status',
      labelKey: 'catalog.produtos.fields.status',
      label: 'Status',
      render: (record) => productStatusLabel(record.status).label,
    },
  ],
}
