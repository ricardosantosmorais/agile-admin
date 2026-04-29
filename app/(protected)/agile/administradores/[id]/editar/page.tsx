import { AgileAdministradorFormPage } from '@/src/features/agile-administradores/components/agile-administrador-form-page'

export default async function EditarAgileAdministradorRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AgileAdministradorFormPage id={id} />
}
