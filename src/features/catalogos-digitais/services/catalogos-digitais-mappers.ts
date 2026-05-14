import { asArray, asBoolean, asString } from '@/src/lib/api-payload'
import type {
  CatalogosDigitaisAppStoreSummary,
  CatalogosDigitaisCatalog,
  CatalogosDigitaisListResponse,
  CatalogosDigitaisRawAppStoreSummary,
  CatalogosDigitaisRawCatalog,
  CatalogosDigitaisRawResponse,
  CatalogoDigitalFormRecord,
} from '@/src/features/catalogos-digitais/types/catalogos-digitais'

const MODULE_ID = 'mod_catalogos_digitais'

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function parseMetadata(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      return asRecord(parsed)
    } catch {
      return {}
    }
  }

  return asRecord(value)
}

function normalizePublicationMode(value: unknown) {
  const raw = asString(value).trim()
  if (raw === 'publico') return 'publica'
  if (raw === 'restrito' || raw === 'restrita' || raw === 'todos') return 'restrita_todos'
  if (raw === 'cliente' || raw === 'restrito_cliente') return 'restrita_cliente'
  if (raw === 'vendedor' || raw === 'restrito_vendedor') return 'restrita_vendedor'
  if (raw === 'pdf' || raw === '') return 'nao_publicar'
  return ['nao_publicar', 'publica', 'restrita_cliente', 'restrita_vendedor', 'restrita_todos'].includes(raw) ? raw : 'nao_publicar'
}

function snapshotFrom(metadata: Record<string, unknown>) {
  return asRecord(metadata.snapshot)
}

function firstCatalogFrom(response: unknown): CatalogosDigitaisRawCatalog {
  const record = asRecord(response)
  const data = record.data
  if (Array.isArray(data)) return asRecord(data[0])
  return asRecord(data || response)
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringValue(value: unknown, fallback = '') {
  const text = asString(value).trim()
  return text || fallback
}

export function normalizeCatalogoDigital(row: CatalogosDigitaisRawCatalog): CatalogosDigitaisCatalog {
  const metadata = parseMetadata(row.metadata)
  const snapshot = snapshotFrom(metadata)
  const outputs = asRecord(snapshot.saidas)
  const productCount = numberValue(metadata.produto_count || asArray(snapshot.produtos).length)
  const sectionCount = numberValue(metadata.secao_count || asArray(snapshot.secoes).length)

  return {
    id: asString(row.id).trim(),
    code: asString(row.codigo || row.id).trim(),
    name: asString(row.nome || 'Catálogo').trim(),
    description: asString(row.descricao).trim(),
    status: asString(row.status || 'rascunho').trim(),
    model: asString(metadata.modelo || snapshot.modelo || 'campanha_promocional').trim(),
    template: asString(metadata.template || snapshot.template || 'executivo').trim(),
    objective: asString(metadata.objetivo || snapshot.objetivo || 'promocional').trim(),
    publicationMode: normalizePublicationMode(metadata.modo_publicacao || outputs.modo_publicacao || 'nao_publicar'),
    publicUrl: asString(row.url_publica || metadata.url_publica || outputs.url_publica).trim(),
    validFrom: asString(metadata.vigencia_inicio || snapshot.vigencia_inicio || outputs.vigencia_inicio).trim(),
    validTo: asString(metadata.vigencia_fim || snapshot.vigencia_fim || outputs.vigencia_fim).trim(),
    productCount,
    sectionCount,
    showPrice: asBoolean(row.mostrar_preco || outputs.exibir_preco),
    published: asBoolean(row.publicado),
    active: row.ativo === undefined ? true : asBoolean(row.ativo),
    updatedAt: asString(row.updated_at).trim(),
    createdAt: asString(row.created_at).trim(),
  }
}

export function normalizeCatalogosDigitaisAppStoreSummary(raw: CatalogosDigitaisRawAppStoreSummary | undefined): CatalogosDigitaisAppStoreSummary {
  const contract = asRecord(raw?.contratacao)
  const error = raw?.error

  return {
    moduleId: asString(raw?.id || MODULE_ID).trim() || MODULE_ID,
    contracted: asBoolean(contract.contratado || raw?.contratado),
    status: asString(contract.status || raw?.status_contratacao).trim(),
    error: typeof error === 'string' ? error : asString(asRecord(error).message).trim(),
  }
}

export function normalizeCatalogosDigitaisListResponse(response: CatalogosDigitaisRawResponse): CatalogosDigitaisListResponse {
  const meta = asRecord(response.meta)

  return {
    items: asArray<CatalogosDigitaisRawCatalog>(response.data).map(normalizeCatalogoDigital),
    meta: {
      page: numberValue(meta.page || 1) || 1,
      perPage: numberValue(meta.perpage || meta.perPage || 15) || 15,
      total: numberValue(meta.total),
      pages: numberValue(meta.pages || 1) || 1,
    },
    appStore: normalizeCatalogosDigitaisAppStoreSummary(response.appStore),
  }
}

export function createEmptyCatalogoDigitalForm(): CatalogoDigitalFormRecord {
  return {
    id: '',
    code: '',
    name: '',
    coverCall: '',
    model: 'campanha_promocional',
    template: 'executivo',
    objective: 'promocional',
    publicationMode: 'nao_publicar',
    validFrom: '',
    validTo: '',
    showPrice: true,
    active: true,
    products: [],
    sections: [],
    snapshot: {},
  }
}

export function normalizeCatalogoDigitalDetail(response: unknown): CatalogoDigitalFormRecord {
  const row = firstCatalogFrom(response)
  const metadata = parseMetadata(row.metadata)
  const snapshot = snapshotFrom(metadata)
  const outputs = asRecord(snapshot.saidas)
  const form = createEmptyCatalogoDigitalForm()

  return {
    ...form,
    id: stringValue(row.id),
    code: stringValue(row.codigo || row.id),
    name: stringValue(snapshot.nome || row.nome),
    coverCall: stringValue(snapshot.chamada_capa || row.descricao),
    model: stringValue(snapshot.modelo || metadata.modelo, form.model),
    template: stringValue(snapshot.template || metadata.template, form.template),
    objective: stringValue(snapshot.objetivo || metadata.objetivo, form.objective),
    publicationMode: normalizePublicationMode(outputs.modo_publicacao || metadata.modo_publicacao),
    validFrom: stringValue(snapshot.vigencia_inicio || outputs.vigencia_inicio || metadata.vigencia_inicio),
    validTo: stringValue(snapshot.vigencia_fim || outputs.vigencia_fim || metadata.vigencia_fim),
    showPrice: outputs.exibir_preco === undefined ? asBoolean(row.mostrar_preco) : asBoolean(outputs.exibir_preco),
    active: row.ativo === undefined ? true : asBoolean(row.ativo),
    products: arrayValue(snapshot.produtos),
    sections: arrayValue(snapshot.secoes),
    snapshot,
  }
}

export function toCatalogoDigitalSavePayload(form: CatalogoDigitalFormRecord): Record<string, unknown> {
  const snapshotOutputs = asRecord(form.snapshot.saidas)
  const products = arrayValue(form.products.length ? form.products : form.snapshot.produtos)
  const sections = arrayValue(form.sections.length ? form.sections : form.snapshot.secoes)
  const publicationMode = normalizePublicationMode(form.publicationMode)
  const snapshot = {
    ...form.snapshot,
    nome: form.name.trim(),
    chamada_capa: form.coverCall.trim(),
    modelo: form.model,
    template: form.template,
    objetivo: form.objective,
    vigencia_inicio: form.validFrom,
    vigencia_fim: form.validTo,
    produtos: products,
    secoes: sections,
    saidas: {
      ...snapshotOutputs,
      modo_publicacao: publicationMode,
      exibir_preco: form.showPrice,
      vigencia_inicio: form.validFrom,
      vigencia_fim: form.validTo,
    },
  }
  const origemProdutos = stringValue(form.snapshot.origem_produtos, 'manual')
  const metadata = {
    snapshot,
    produto_count: products.length,
    secao_count: sections.length,
    modelo: form.model,
    template: form.template,
    objetivo: form.objective,
    modo_publicacao: publicationMode,
    vigencia_inicio: form.validFrom,
    vigencia_fim: form.validTo,
    precos_dinamicos: asBoolean(form.snapshot.precos_dinamicos),
    precificacao: asRecord(form.snapshot.precificacao),
  }

  return {
    ...(form.id ? { id: form.id } : {}),
    ...(form.code ? { codigo: form.code } : {}),
    nome: form.name.trim(),
    descricao: form.coverCall.trim(),
    status: products.length >= 1 ? 'pronto' : 'rascunho',
    origem_produtos: ['manual', 'colecao', 'filtros'].includes(origemProdutos) ? origemProdutos : 'manual',
    ativo: form.active,
    restrito: ['restrita_cliente', 'restrita_vendedor', 'restrita_todos'].includes(publicationMode),
    publicado: publicationMode !== 'nao_publicar',
    mostrar_preco: form.showPrice,
    metadata: JSON.stringify(metadata),
  }
}
