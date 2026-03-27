import { CondicaoPagamentoFormPage } from '@/src/features/condicoes-pagamento/components/condicao-pagamento-form-page'

export default async function EditarCondicaoPagamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CondicaoPagamentoFormPage id={id} />
}
