import { ProdutoPrecificadorWizardPage } from '@/src/features/produtos-precificadores/components/produto-precificador-wizard-page'

export default async function EditarProdutoPrecificadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProdutoPrecificadorWizardPage id={decodeURIComponent(id)} />
}

