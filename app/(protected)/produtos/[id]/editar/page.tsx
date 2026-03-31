import { ProdutoFormPage } from '@/src/features/produtos/components/produto-form-page'

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProdutoFormPage id={id} />
}
