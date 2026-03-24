import { ColecaoFormPage } from '@/src/features/colecoes/components/colecao-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ColecaoFormPage id={id} />
}
