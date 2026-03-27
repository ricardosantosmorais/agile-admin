import { ProdutoFilialFormPage } from '@/src/features/produtos-filiais/components/produto-filial-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProdutoFilialFormPage id={decodeURIComponent(id)} />
}
