import { DepartamentoFormPage } from '@/src/features/departamentos/components/departamento-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DepartamentoFormPage id={id} />
}
