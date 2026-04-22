import { EmpresaFormPage } from '@/src/features/empresas/components/empresa-form-page'

export default async function EditarEmpresaRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EmpresaFormPage id={id} />
}
