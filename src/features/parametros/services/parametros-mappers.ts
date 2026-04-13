import { asArray, asNumber, asRecord, asString } from '@/src/lib/api-payload'
import type {
  ParametroFormRecord,
  ParametroFormValues,
  ParametroListRecord,
  ParametroListResponse,
  ParametroLookupOption,
  ParametroViewRecord,
} from '@/src/features/parametros/services/parametros-types'

type ChaveOption = {
  value: string
  label: string
}

export const parametroChaveOptions: ChaveOption[] = [
  'activate-customer-form-component',
  'activate-vendor-form-component',
  'bill-list-component',
  'bill-print-component',
  'bill-print-painelb2b-component',
  'body-component',
  'cart-component',
  'change-contacts-form-component',
  'change-email-form-component',
  'change-password-form-component',
  'checkout-component',
  'config',
  'confirmation-component',
  'customer-data-component',
  'customers-list-component',
  'footer-component',
  'forgot-password-form-component',
  'gift-component',
  'head-component',
  'header-component',
  'home-component',
  'import-component',
  'index-page',
  'invoice-list-component',
  'invoice-print-component',
  'list-component',
  'login-customer-form-component',
  'login-vendor-form-component',
  'logout-component',
  'maintenance-component',
  'mobile-header-component',
  'order-detail-component',
  'order-print-component',
  'orders-list-component',
  'page-component',
  'payment-component',
  'product-component',
  'products-component',
  'promotion-component',
  'promotion-list-component',
  'register-customer-form-component',
  'sale-detail-component',
  'sales-list-component',
  'topbar-component',
].map((value) => ({ value, label: value }))

function toFilialLabel(record: Record<string, unknown>) {
  const filial = asRecord(record.filial)
  const nomeFantasia = asString(filial.nome_fantasia)
  const id = asString(filial.id)

  if (!nomeFantasia) {
    return '-'
  }

  return id ? `${nomeFantasia} - ${id}` : nomeFantasia
}

function toPermissaoLabel(value: string) {
  switch (value) {
    case 'todos':
      return 'Todos'
    case 'publico':
      return 'Público'
    case 'restrito':
      return 'Restrito'
    default:
      return '-'
  }
}

function normalizeBoolean(value: unknown) {
  if (value === true || value === 1) {
    return true
  }

  if (value === false || value === 0) {
    return false
  }

  const normalized = asString(value).toLowerCase()
  return normalized === '1' || normalized === 'sim' || normalized === 'true'
}

function toStringValue(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function normalizeParametroKey(value: unknown) {
  return asString(value).trim().replace(/^[?\uFFFD\s]+/, '')
}

function mapFiliais(payload: unknown): ParametroLookupOption[] {
  return asArray(asRecord(payload).data)
    .map((item) => {
      const record = asRecord(item)
      const id = asString(record.id)
      const nome = asString(record.nome_fantasia)

      if (!id) {
        return null
      }

      return {
        value: id,
        label: nome ? `${nome} - ${id}` : id,
      }
    })
    .filter((item): item is ParametroLookupOption => item !== null)
}

export function createEmptyParametroFormValues(): ParametroFormValues {
  return {
    id: '',
    ativo: '1',
    chave: '',
    id_filial: '',
    descricao: '',
    parametros: '',
    posicao: '',
    permissao: '',
  }
}

export function normalizeParametrosListResponse(payload: unknown, filters: { page: number; perPage: number }): ParametroListResponse {
  const record = asRecord(payload)
  const meta = asRecord(record.meta)
  const data = asArray(record.data).map((item): ParametroListRecord => {
    const row = asRecord(item)
    const parametrosRaw = asString(row.parametros)

    return {
      id: asString(row.id),
      chave: asString(row.chave),
      filial: toFilialLabel(row),
      descricao: asString(row.descricao),
      parametrosPreview: parametrosRaw.length > 60 ? `${parametrosRaw.slice(0, 60)}...` : parametrosRaw,
      parametrosRaw,
      posicao: toStringValue(row.posicao),
      permissao: asString(row.permissao) as ParametroListRecord['permissao'],
      ativo: normalizeBoolean(row.ativo),
    }
  })

  const total = asNumber(meta.total, data.length)
  const page = asNumber(meta.page, filters.page)
  const perPage = asNumber(meta.perpage, filters.perPage)
  const from = data.length ? (page - 1) * perPage + 1 : 0
  const to = data.length ? from + data.length - 1 : 0

  return {
    data,
    meta: {
      total,
      from,
      to,
      page,
      pages: asNumber(meta.pages, Math.max(1, Math.ceil(total / Math.max(perPage, 1)))),
      perPage,
    },
  }
}

export function normalizeParametroFormRecord(payload: unknown): ParametroFormRecord {
  const record = asRecord(payload)
  const values = createEmptyParametroFormValues()

  values.id = asString(record.id)
  values.ativo = normalizeBoolean(record.ativo) ? '1' : '0'
  values.chave = asString(record.chave)
  values.id_filial = asString(record.id_filial)
  values.descricao = asString(record.descricao)
  values.parametros = asString(record.parametros)
  values.posicao = toStringValue(record.posicao)
  values.permissao = asString(record.permissao) as ParametroFormValues['permissao']

  return {
    values,
    filiais: mapFiliais(record.filiais),
  }
}

export function normalizeParametroViewRecord(payload: unknown): ParametroViewRecord {
  const record = asRecord(payload)

  return {
    id: asString(record.id),
    chave: asString(record.chave),
    filial: toFilialLabel(record),
    descricao: asString(record.descricao),
    parametros: asString(record.parametros),
    posicao: toStringValue(record.posicao),
    permissao: toPermissaoLabel(asString(record.permissao)),
    ativo: normalizeBoolean(record.ativo),
  }
}

export function buildParametroSavePayload(values: ParametroFormValues) {
  return {
    ...(values.id ? { id: values.id } : {}),
    ativo: values.ativo === '1',
    chave: normalizeParametroKey(values.chave),
    id_filial: values.id_filial || null,
    descricao: values.descricao.trim(),
    parametros: values.parametros,
    posicao: values.posicao.trim() ? values.posicao.trim() : null,
    permissao: values.permissao,
    componente: 1,
  }
}
