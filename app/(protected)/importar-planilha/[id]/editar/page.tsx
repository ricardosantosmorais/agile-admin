import { ImportarPlanilhaMappingPage } from '@/src/features/importar-planilha/components/importar-planilha-mapping-page'

export default async function ImportarPlanilhaMappingRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ImportarPlanilhaMappingPage id={id} />
}
