import { ListaFormPage } from '@/src/features/listas/components/lista-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ListaFormPage id={id} />
}
