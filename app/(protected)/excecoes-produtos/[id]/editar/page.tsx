import { ExcecaoProdutoWizardPage } from '@/src/features/excecoes-produtos/components/excecao-produto-wizard-page'

export default async function EditarExcecaoProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ExcecaoProdutoWizardPage id={id} />
}
