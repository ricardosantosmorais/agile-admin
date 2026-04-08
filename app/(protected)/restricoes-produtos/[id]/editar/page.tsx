import { RestricaoProdutoWizardPage } from '@/src/features/restricoes-produtos/components/restricao-produto-wizard-page'

export default async function EditarRestricaoProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RestricaoProdutoWizardPage id={decodeURIComponent(id)} />
}
