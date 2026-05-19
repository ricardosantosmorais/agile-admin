export type ProdutoFilialRow = {
  id_produto: string
  id_filial: string
  id_tabela_preco?: string | null
  id_canal_distribuicao_cliente?: string | null
}

export type ProdutoEmbalagemRow = {
  id?: string | null
  id_produto: string
  id_filial: string
}

export function encodeProdutoFilialRowId(row: ProdutoFilialRow) {
  return [
    row.id_produto,
    row.id_filial,
    row.id_tabela_preco || '',
    row.id_canal_distribuicao_cliente || '',
  ]
    .map((item) => encodeURIComponent(item))
    .join('|')
}

export function decodeProdutoFilialRowId(value: string): ProdutoFilialRow {
  const [id_produto = '', id_filial = '', id_tabela_preco = '', id_canal_distribuicao_cliente = ''] = value.split('|')
  return {
    id_produto: decodeURIComponent(id_produto),
    id_filial: decodeURIComponent(id_filial),
    id_tabela_preco: decodeURIComponent(id_tabela_preco) || null,
    id_canal_distribuicao_cliente: decodeURIComponent(id_canal_distribuicao_cliente) || null,
  }
}

export function encodeProdutoEmbalagemRowId(row: ProdutoEmbalagemRow) {
  return [
    row.id || '',
    row.id_produto,
    row.id_filial,
  ]
    .map((item) => encodeURIComponent(item))
    .join('|')
}

export function decodeProdutoEmbalagemRowId(value: string): ProdutoEmbalagemRow {
  const [id = '', id_produto = '', id_filial = ''] = value.split('|')
  return {
    id: decodeURIComponent(id) || null,
    id_produto: decodeURIComponent(id_produto),
    id_filial: decodeURIComponent(id_filial),
  }
}

export function getProdutoEmbalagemApiId(
  value: unknown,
  id_produto: unknown,
  id_filial: unknown,
) {
  const rawId = String(value ?? '').trim()
  if (!rawId) {
    return null
  }

  let apiId = rawId.includes('|')
    ? decodeProdutoEmbalagemRowId(rawId).id || ''
    : rawId

  const productId = String(id_produto ?? '').trim()
  const branchId = String(id_filial ?? '').trim()
  const legacySuffix = `${productId}${branchId}`

  if (legacySuffix && apiId.length > legacySuffix.length && apiId.endsWith(legacySuffix)) {
    apiId = apiId.slice(0, -legacySuffix.length)
  }

  return apiId || null
}
