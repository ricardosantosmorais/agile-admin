import { FormularioFormPage } from '@/src/features/formularios/components/formulario-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FormularioFormPage id={id} />
}
