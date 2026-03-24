import { PaginaFormPage } from '@/src/features/paginas/components/pagina-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PaginaFormPage id={id} />
}
