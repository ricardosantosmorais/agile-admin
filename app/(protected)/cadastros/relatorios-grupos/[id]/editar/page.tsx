import { RelatorioGrupoFormPage } from '@/src/features/relatorios-grupos/components/relatorio-grupo-form-page'

export default async function EditarRelatorioGrupoRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RelatorioGrupoFormPage id={id} />
}
