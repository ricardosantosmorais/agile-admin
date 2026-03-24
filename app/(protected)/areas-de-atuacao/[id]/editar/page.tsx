import { AreaAtuacaoFormPage } from '@/src/features/areas-atuacao/components/area-atuacao-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AreaAtuacaoFormPage id={id} />
}
