import { RelatorioMasterFormPage } from '@/src/features/relatorios-master/components/relatorio-master-form-page'

export default async function EditarRelatorioMasterRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RelatorioMasterFormPage id={id} />
}
