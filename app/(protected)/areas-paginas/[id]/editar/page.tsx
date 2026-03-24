import { AreasPaginaFormPage } from '@/src/features/areas-paginas/components/area-pagina-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AreasPaginaFormPage id={id} />
}
