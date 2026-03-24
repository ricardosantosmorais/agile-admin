import { CupomDescontoFormPage } from '@/src/features/cupons-desconto/components/cupom-desconto-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CupomDescontoFormPage id={id} />
}
