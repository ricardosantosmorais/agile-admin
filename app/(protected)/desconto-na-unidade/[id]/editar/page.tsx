import { DescontoUnidadeFormPage } from '@/src/features/campanhas-promocionais/components/desconto-unidade-form-page'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DescontoUnidadeFormPage id={id} />
}
