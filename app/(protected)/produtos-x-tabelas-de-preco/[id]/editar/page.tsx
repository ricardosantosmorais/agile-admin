import { ProdutoTabelaPrecoQuickPage } from '@/src/features/produtos-tabelas-preco/components/produto-tabela-preco-quick-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProdutoTabelaPrecoQuickPage id={id} />
}
