import { TabelaPrecoFormPage } from '@/src/features/tabelas-preco/components/tabela-preco-form-page'

export default async function EditarTabelaPrecoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TabelaPrecoFormPage id={id} />
}
