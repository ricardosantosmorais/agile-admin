import { FormaPagamentoFormPage } from '@/src/features/formas-pagamento/components/forma-pagamento-form-page'

export default async function EditarFormaPagamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FormaPagamentoFormPage id={id} />
}
