export type ProdutoFilialKey = {
  id_produto: string
  id_filial: string
  id_tabela_preco: string | null
  id_canal_distribuicao_cliente: string | null
}

export function encodeProdutoFilialId(key: ProdutoFilialKey) {
  return [
    key.id_produto.trim(),
    key.id_filial.trim(),
    (key.id_tabela_preco || '').trim(),
    (key.id_canal_distribuicao_cliente || '').trim(),
  ].join('|')
}

export function decodeProdutoFilialId(value: string): ProdutoFilialKey {
  const [id_produto = '', id_filial = '', id_tabela_preco = '', id_canal_distribuicao_cliente = ''] = value.split('|')
  return {
    id_produto: id_produto.trim(),
    id_filial: id_filial.trim(),
    id_tabela_preco: id_tabela_preco.trim() || null,
    id_canal_distribuicao_cliente: id_canal_distribuicao_cliente.trim() || null,
  }
}
