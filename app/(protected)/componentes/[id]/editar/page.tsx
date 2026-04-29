import { ComponenteFormPage } from '@/src/features/componentes/components/componente-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ComponenteFormPage id={id} />
}
