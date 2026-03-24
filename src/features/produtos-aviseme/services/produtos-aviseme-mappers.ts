type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export type AvisemeListItem = {
  id: string
  id_produto: string
  nome_produto: string
  id_filial: string
  nome_filial: string
  quantidade_solicitacoes: number
  ultima_data_solicitacao: string
}

export type AvisemeListResponse = {
  data: AvisemeListItem[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
  }
}

export type AvisemeDetailItem = {
  id: string
  produto: string
  embalagem: string
  filial: string
  cliente: string
  email: string
  data: string
}

export function mapAvisemeListPayload(payload: unknown): AvisemeListResponse {
  const source = asRecord(payload)
  const meta = asRecord(source.meta)

  return {
    data: asArray(source.data).map((item) => {
      const record = asRecord(item)
      return {
        id: asString(record.id) || `${asString(record.id_produto)}:${asString(record.id_filial)}`,
        id_produto: asString(record.id_produto),
        nome_produto: asString(record.nome_produto),
        id_filial: asString(record.id_filial),
        nome_filial: asString(record.nome_filial),
        quantidade_solicitacoes: asNumber(record.quantidade_solicitacoes),
        ultima_data_solicitacao: asString(record.ultima_data_solicitacao),
      }
    }),
    meta: {
      page: asNumber(meta.page || 1),
      pages: asNumber(meta.pages || 1),
      perPage: asNumber(meta.perpage || meta.perPage || 15),
      from: asNumber(meta.from),
      to: asNumber(meta.to),
      total: asNumber(meta.total),
    },
  }
}

export function mapAvisemeDetailsPayload(payload: unknown) {
  const source = asRecord(payload)
  const items = Array.isArray(payload) ? payload : asArray(source.data)

  return items.map((item) => {
    const record = asRecord(item)
    const produto = asRecord(record.produto)
    const filial = asRecord(record.filial)
    const cliente = asRecord(record.cliente)

    return {
      id: asString(record.id) || `${asString(record.id_produto)}:${asString(record.id_filial)}:${asString(record.email)}`,
      produto: [asString(produto.id), asString(produto.nome)].filter(Boolean).join(' - '),
      embalagem: asString(record.id_embalagem),
      filial: asString(filial.nome_fantasia || filial.nome),
      cliente: asString(cliente.nome_fantasia || cliente.nome || cliente.razao_social),
      email: asString(record.email),
      data: asString(record.data),
    } satisfies AvisemeDetailItem
  })
}
