import { asArray } from '@/src/lib/api-payload'
import { formatLocalizedDecimal, parseLocalizedNumber } from '@/src/lib/value-parsers'

export function encodeProdutoTabelaPrecoId(idProduto: unknown, idTabelaPreco: unknown) {
  return `${String(idProduto || '').trim()}|${String(idTabelaPreco || '').trim()}`
}

export function mapQuickPricingRows(
  tabelas: unknown,
  produtosTabelas: unknown,
  idProduto: string,
) {
  const precosMap = new Map(asArray<Record<string, unknown>>(produtosTabelas).map((item) => [String(item.id_tabela_preco || ''), item]))

  return asArray<Record<string, unknown>>(tabelas).map((tabela) => {
    const current = precosMap.get(String(tabela.id || ''))
    return {
      id_tabela_preco: String(tabela.id || ''),
      nome_tabela: String(tabela.nome || tabela.descricao || tabela.id || ''),
      id_produto: idProduto,
      preco1: formatLocalizedDecimal(current?.preco1, 2),
      preco2: formatLocalizedDecimal(current?.preco2, 2),
      preco3: formatLocalizedDecimal(current?.preco3, 2),
      preco4: formatLocalizedDecimal(current?.preco4, 2),
      preco5: formatLocalizedDecimal(current?.preco5, 2),
      preco6: formatLocalizedDecimal(current?.preco6, 2),
      preco7: formatLocalizedDecimal(current?.preco7, 2),
      id_sync: current?.id_sync ? String(current.id_sync) : null,
    }
  })
}

export function serializeQuickPricingItems(items: unknown, idProduto: string, idEmpresa: string) {
  return asArray<Record<string, unknown>>(items).map((item) => ({
    id_empresa: idEmpresa,
    id_produto: idProduto,
    id_tabela_preco: String(item.id_tabela_preco || '').trim(),
    preco1: parseLocalizedNumber(item.preco1) ?? 0,
    preco2: parseLocalizedNumber(item.preco2) ?? 0,
    preco3: parseLocalizedNumber(item.preco3) ?? 0,
    preco4: parseLocalizedNumber(item.preco4) ?? 0,
    preco5: parseLocalizedNumber(item.preco5) ?? 0,
    preco6: parseLocalizedNumber(item.preco6) ?? 0,
    preco7: parseLocalizedNumber(item.preco7) ?? 0,
  }))
}
